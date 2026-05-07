import json
import re
import asyncio
import hashlib
import os
import redis.asyncio as aioredis
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq

# --- Redis client (lazy-initialized, module-level singleton) ---
_redis_client: aioredis.Redis | None = None

async def _get_redis() -> aioredis.Redis | None:
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        return None
    try:
        _redis_client = aioredis.from_url(redis_url, decode_responses=True)
        await _redis_client.ping()  # type: ignore[misc]
        print("INFO: Redis connected (ExamGenerator)")
    except Exception as e:
        print(f"WARN: Redis unavailable — skipping blueprint cache. ({e})")
        _redis_client = None
    return _redis_client

BLUEPRINT_TTL = 60 * 60 * 24 * 30  # 30 days — blueprints are stable


class ExamGeneratorService:
    def __init__(self, llm=None, api_key: str | None = None, model_name: str | None = None):
        if llm:
            self.llm = llm
        else:
            provider = os.getenv("AI_PROVIDER", "openai").lower()
            if provider == "groq":
                self.llm = ChatGroq(
                    model=model_name or os.getenv("GROQ_MODEL_NAME") or "llama-3.3-70b-versatile",
                    groq_api_key=api_key or os.getenv("GROQ_API_KEY"),
                    temperature=0.1,
                    timeout=150
                )
            else:
                self.llm = ChatOpenAI(
                    model=model_name or os.getenv("OPENAI_MODEL_NAME") or "gpt-4o-mini",
                    openai_api_key=api_key or os.getenv("OPENAI_API_KEY"),
                    temperature=0.1,
                    timeout=150,
                    max_tokens=16384
                )

    def _clean_json(self, raw_output):
        """Robustly extract a JSON array from LLM output using bracket matching."""
        start = raw_output.find('[')
        end = raw_output.rfind(']')
        if start != -1 and end != -1 and end > start:
            return raw_output[start:end + 1]
        if "```json" in raw_output:
            raw_output = raw_output.split("```json", 1)[1]
        if "```" in raw_output:
            raw_output = raw_output.split("```", 1)[0]
        return raw_output.strip()

    async def _generate_parallel_challenge(self, blueprint: list):
        """Generate a parallel challenge version of the blueprint with different values/logic."""
        blueprint_text = json.dumps(blueprint, indent=1)
        prompt = f"""You are a university exam paper generator. Create a PARALLEL CHALLENGE version of the provided exam blueprint.
        
CORE OBJECTIVE:
- Generate a NEW exam paper that follows the EXACT SAME STRUCTURE as the input.
- Change all specific details (numerical values, variable names, logic conditions, scenarios, names).

CRITICAL FORMATTING RULES (MANDATORY):
1. CODE DETECTION: Any text containing keywords like 'var', 'let', 'const', 'public', 'static', 'void', 'int', 'float', 'bool', 'class', 'def', 'import', 'from', 'include', '<html', '<div', 'script', '{{}}', '[]', '()', '=>' or any programming/markup syntax MUST be wrapped in triple backticks with the language ID (e.g., ```javascript, ```python, ```html, ```cpp).
2. TABLES: Any tabular data MUST be returned as a standard Markdown table (e.g., | Header | Header |). This is NON-NEGOTIABLE.
3. STRUCTURE: Return EXACTLY the same number of questions and sub-questions.

JSON FORMATTING:
- Return ONLY a valid JSON list.
- All newlines inside strings MUST be \\n
- All quotes inside strings MUST be \\"

INPUT ({len(blueprint)} questions):
{blueprint_text}"""
        
        print(f"DEBUG: Generating parallel challenge...")
        response = await self.llm.ainvoke(prompt)
        return json.loads(self._clean_json(response.content))

    def _get_extraction_prompt(self, raw_content: str) -> str:
        return f"""You are an elite academic parser. Convert this university past paper into a structured JSON list.

CRITICAL OBJECTIVE: 
- DO NOT FRAGMENT QUESTIONS. A question with many sub-parts (i, ii, iii) or (a, b, c) MUST be a single top-level object with a 'sub_questions' array.
- SCAN THE ENTIRE DOCUMENT. If there are 10 questions, extract all 10.
- ALWAYS include the full context, code, and tables.

FORMATTING RULES:
- CODE: Wrap any code/markup in triple backticks (```javascript, ```html, etc.).
- TABLES: Reconstruct all tables as Markdown tables.
- SUB-QUESTIONS: Every sub-part MUST contain its COMPLETE text.

JSON SCHEMA:
[
  {{
    "section_title": "string | null",
    "text": "The main question text. Wrap any code in backticks.",
    "type": "multiple-choice | short-answer | coding | essay",
    "options": ["Option A", "Option B", ...],
    "sub_questions": [
      {{
        "text": "Sub-question text with code wrapped in backticks.",
        "type": "...",
        "options": [...]
      }}
    ]
  }}
]

Past Paper Text:
{raw_content[:120000]}"""

    async def extract_blueprint(self, raw_content: str, force_refresh: bool = False) -> list:
        """Extracts the structural blueprint from raw past paper text."""
        cache_key = "alphalo:blueprint:v3:" + hashlib.sha256(raw_content.encode()).hexdigest()
        redis = await _get_redis()

        if redis and not force_refresh:
            cached = await redis.get(cache_key)
            if cached:
                print(f"DEBUG: Blueprint cache HIT (v3).")
                return json.loads(cached)

        print(f"DEBUG: Extracting blueprint (v3)...")
        extract_prompt = self._get_extraction_prompt(raw_content)
        response = await self.llm.ainvoke(extract_prompt)
        blueprint = json.loads(self._clean_json(response.content))

        if redis:
            await redis.set(cache_key, json.dumps(blueprint), ex=BLUEPRINT_TTL)
        return blueprint

    async def generate_from_blueprint(self, blueprint: list) -> list:
        """Generates a parallel practice paper given a structural blueprint."""
        data = await self._generate_parallel_challenge(blueprint)
        for q in data:
            if 'type' not in q or not q['type']:
                q['type'] = 'multiple-choice' if (q.get('options') and len(q['options']) > 0) else 'short-answer'
            if 'options' not in q: q['options'] = []
            if 'sub_questions' in q:
                for sq in q['sub_questions']:
                    if 'type' not in sq or not sq['type']:
                        sq['type'] = 'multiple-choice' if (sq.get('options') and len(sq['options']) > 0) else 'short-answer'
                    if 'options' not in sq: sq['options'] = []
        return data

    async def generate(self, raw_content: str, generation_count: int = 0, force_refresh: bool = False):
        """Main entry point for generating a practice paper."""
        blueprint = await self.extract_blueprint(raw_content, force_refresh=force_refresh)
        return await self.generate_from_blueprint(blueprint)

import json
import re
import asyncio
import hashlib
import os
import redis.asyncio as aioredis

# ── Redis client (lazy-initialised, shared across requests) ───────────────────
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
        print(f"WARN: Redis unavailable — skipping cache. ({e})")
        _redis_client = None
    return _redis_client

# Blueprint (Step 1) lives for 30 days — it is deterministic for a given paper.
BLUEPRINT_TTL   = 60 * 60 * 24 * 30
# Full generated exam cached 24 h per generation_count slot.
EXAM_RESULT_TTL = 60 * 60 * 24


class ExamGeneratorService:
    def __init__(self, llm=None, api_key: str | None = None, model_name: str | None = None):
        if llm:
            self.llm = llm
        else:
            provider = os.getenv("AI_PROVIDER", "openai").lower()
            if provider == "groq":
                from langchain_groq import ChatGroq
                self.llm = ChatGroq(
                    model=model_name or os.getenv("GROQ_MODEL_NAME") or "llama-3.3-70b-versatile",
                    groq_api_key=api_key or os.getenv("GROQ_API_KEY"),
                    temperature=0.1,
                    timeout=150
                )
            else:
                from langchain_openai import ChatOpenAI
                self.llm = ChatOpenAI(
                    model=model_name or os.getenv("OPENAI_MODEL_NAME") or "gpt-4o-mini",
                    openai_api_key=api_key or os.getenv("OPENAI_API_KEY"),
                    temperature=0.1,
                    timeout=150,
                    max_tokens=8192   # Reduced from 16384 — cuts tail-latency on large papers
                )

    # ── Cache key helpers ─────────────────────────────────────────────────────

    def _blueprint_key(self, raw_content: str) -> str:
        """Stable key for the Step-1 blueprint — based only on paper content."""
        return "alphalo:exam:bp:" + hashlib.sha256(raw_content.encode()).hexdigest()

    def _result_key(self, raw_content: str, generation_count: int) -> str:
        """Per-generation-slot key so each 'refresh' slot gets its own cached exam."""
        digest = hashlib.sha256(raw_content.encode()).hexdigest()
        return f"alphalo:exam:result:{digest}:{generation_count}"

    # ── JSON helper ───────────────────────────────────────────────────────────

    def _clean_json(self, raw_output: str) -> str:
        """Robustly extract a JSON array from LLM output."""
        raw_output = re.sub(r'```json\s*', '', raw_output)
        raw_output = re.sub(r'```\s*', '', raw_output)
        start = raw_output.find('[')
        end   = raw_output.rfind(']')
        if start != -1 and end != -1 and end > start:
            return raw_output[start:end + 1].strip()
        return raw_output.strip()

    # ── Step 1: Extract blueprint (Redis-cached) ──────────────────────────────

    async def _extract_blueprint(self, raw_content: str, redis: aioredis.Redis | None) -> list:
        """Parse the raw paper into a structured blueprint.
        Cached in Redis — deterministic for a given paper, so safe to store long-term.
        """
        cache_key = self._blueprint_key(raw_content)

        if redis:
            cached = await redis.get(cache_key)
            if cached:
                print("DEBUG: Blueprint cache HIT — skipping LLM Step 1.")
                return json.loads(cached)

        print("DEBUG: Blueprint cache MISS — calling LLM Step 1...")
        prompt = f"""You are a Precise Academic Parser. Extract the past paper below into a JSON list.

        REQUIRED SCHEMA:
        [
          {{
            "section_title": "string | null",
            "text": "The FULL text of the question.",
            "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
            "sub_questions": [{{ "text": "sub-question text", "options": [] }}]
          }}
        ]

        MANDATORY FORMATTING RULES — ZERO TOLERANCE:
        1. DO NOT alter any values, names, or numbers.
        2. TABLES: Reproduce as a complete Markdown table.
           - First row = header with | col1 | col2 | col3 |
           - Second row = separator with | --- | --- | --- |
           - Then data rows. Include ALL rows. Never truncate.
        3. CODE: Wrap ALL code in triple backticks with the LANGUAGE TAG.
           - Java:   ```java ... ```
           - Python: ```python ... ```
           - C/C++:  ```c ... ``` or ```cpp ... ```
           - SQL:    ```sql ... ```
           - HTML:   ```html ... ```
           - Generic: ```text ... ``` (never bare ```)
        4. MCQs: Each option goes as a plain string in the "options" array (no (a)/(b) prefix needed).
        5. Keep the COMPLETE question context together. Never split a table into rows.

        Content:
        {raw_content[:100000]}
        """
        response = await self.llm.ainvoke(prompt)
        blueprint = json.loads(self._clean_json(response.content))

        if redis:
            await redis.set(cache_key, json.dumps(blueprint), ex=BLUEPRINT_TTL)
            print("DEBUG: Blueprint cached in Redis (30 days).")

        return blueprint

    # ── Step 2: Mutate to a parallel challenge ────────────────────────────────

    async def _mutate_to_challenge(self, blueprint: list) -> list:
        """Transform the blueprint into a fresh parallel exam. Always called live."""
        blueprint_text = json.dumps(blueprint, indent=1)
        prompt = f"""You are a Master Academic Transformer. 
        Your task is to transform this blueprint into a "Parallel Mastery Challenge". 
        The objective is to test the EXACT same academic concept but with a COMPLETELY DIFFERENT semantic structure to ensure 100% privacy and copyright protection of the source paper.

        DEEP SEMANTIC MUTATION RULES:
        - CONCEPT-LED DESIGN: Identify the core academic concept (e.g., 'Polymorphism', 'SQL JOINs', 'Memory management'). Build a COMPLETELY NEW question from scratch around this concept.
        - SCENARIO RE-ENGINEERING: If the original is a theory question, make the new one a practical case study. If it's already a case study, create a totally different industry/domain scenario.
        - LOGIC INVERSION: Do not just change numbers. If the original asks to 'Find the error', the new one might ask to 'Predict the output' or 'Identify the most efficient fix' for a different code snippet that tests the SAME concept.
        - ZERO WORD OVERLAP: Avoid using the same sentence structure, phrasing, or narrative flow as the blueprint.
        - APPROXIMATE EQUIVALENCE: Ensure a student who can solve the original can solve this, but would not recognize it as the same question.

        REQUIRED SCHEMA (identical structure to blueprint):
        [
          {{
            "section_title": "string | null",
            "text": "DEEPLY MUTATED, ORIGINAL question text.",
            "options": ["ORIGINAL Option A", "ORIGINAL Option B", "ORIGINAL Option C", "ORIGINAL Option D"],
            "sub_questions": [{{ "text": "ORIGINAL mutated sub-question text", "options": [] }}]
          }}
        ]

        MANDATORY FORMATTING RULES — ZERO TOLERANCE:
        1. Keep the EXACT same structure, section titles, and question count as the blueprint.
        2. TABLES: Output as a complete Markdown table WITH header and | --- | --- | separator row.
           - Match the same number of columns and rows as the original. Never truncate.
        3. CODE: ALWAYS wrap in triple backticks WITH language tag:
           - Java:   ```java ... ```
           - Python: ```python ... ```
           - C/C++:  ```c ... ``` or ```cpp ... ```
           - SQL:    ```sql ... ```
           - HTML:   ```html ... ```
           - Generic: ```text ... ```
        4. MCQ options: plain strings in "options" array, no letter prefix.
        5. Never leave "text" empty — every question must have meaningful content.

        Blueprint:
        {blueprint_text}
        """
        
        # Use a higher temperature for the mutation step to ensure originality and avoid verbatim copying.
        if hasattr(self.llm, "bind"):
            creative_llm = self.llm.bind(temperature=0.7)
            response = await creative_llm.ainvoke(prompt)
        else:
            response = await self.llm.ainvoke(prompt)
            
        return json.loads(self._clean_json(response.content))

    # ── Post-processing ───────────────────────────────────────────────────────

    # Ordered list of (regex-pattern, language-tag) pairs.
    # First match wins, so more specific patterns come first.
    _CODE_SIGNALS = [
        (re.compile(r'<!DOCTYPE|<html[\s>]|<body[\s>]|<head[\s>]', re.I),          'html'),
        (re.compile(r'<(?:script|style|div|span|form|input|button|a\b|table|ul|li|p|h[1-6])[\s>]', re.I), 'html'),
        (re.compile(r'\bpublic\s+(?:static\s+)?(?:void|class|int|String|boolean|double)\b'), 'java'),
        (re.compile(r'\bSystem\.out\.(?:print|println)\s*\('),                      'java'),
        (re.compile(r'\bdef\s+\w+\s*\(.*\)\s*:'),                                   'python'),
        (re.compile(r'\bprint\s*\(["\']'),                                           'python'),
        (re.compile(r'#[\w-]+\s*\{|\.[\w-]+\s*\{|\bflex(?:box)?\b.*\{', re.I),      'css'),
        (re.compile(r'\b(?:let|const|var)\s+\w+\s*=(?!=)'),                         'javascript'),
        (re.compile(r'\bconsole\.(?:log|error|warn|info)\s*\('),                    'javascript'),
        (re.compile(r'document\.(?:getElementById|querySelector|addEventListener)'), 'javascript'),
        (re.compile(r'\.(?:filter|map|reduce|forEach|find|some|every)\s*\('),       'javascript'),
        (re.compile(r'\bfunction\s+\w+\s*\(|=>\s*[\{\[]'),                          'javascript'),
        (re.compile(r'\bSELECT\b.+\bFROM\b', re.I | re.S),                         'sql'),
    ]

    def _auto_wrap_code(self, text: str) -> str:
        """Safety net: if text contains code-like content without backtick fences,
        detect the language and wrap the code portion automatically."""
        if not text or '```' in text:
            return text

        # Find the earliest code signal in the text
        detected_lang: str | None = None
        earliest_pos = len(text)
        for pattern, lang in self._CODE_SIGNALS:
            m = pattern.search(text)
            if m and m.start() < earliest_pos:
                earliest_pos = m.start()
                detected_lang = lang

        if not detected_lang:
            return text   # No code detected — leave as-is

        # Split narrative from code:
        # Walk backwards from earliest_pos to find the last clean break point
        # (newline, '. ', or ': ') so the narrative stays above the fence.
        before = text[:earliest_pos]
        split_pos = 0
        for sep in (before.rfind('\n'), before.rfind('. '), before.rfind(': ')):
            if sep > split_pos:
                split_pos = sep + 1  # +1 to skip the separator character itself

        narrative = text[:split_pos].strip()
        code_body  = text[split_pos:].strip()

        if not code_body:
            return text

        if narrative:
            return f"{narrative}\n\n```{detected_lang}\n{code_body}\n```"
        else:
            return f"```{detected_lang}\n{code_body}\n```"

    def _normalise(self, data: list) -> list:
        """Fill missing fields and auto-fence any embedded code blocks."""
        for q in data:
            if not q.get('text'):    q['text']    = "Question text missing."
            q['text'] = self._auto_wrap_code(q['text'])
            if not q.get('options'): q['options'] = []
            if 'type' not in q or not q['type']:
                q['type'] = 'multiple-choice' if q.get('options') else 'short-answer'
            for sq in q.get('sub_questions', []):
                if not sq.get('text'):    sq['text']    = "Sub-question text missing."
                sq['text'] = self._auto_wrap_code(sq['text'])
                if not sq.get('options'): sq['options'] = []
                if 'type' not in sq or not sq['type']:
                    sq['type'] = 'multiple-choice' if sq.get('options') else 'short-answer'
        return data

    # ── Public entry point ────────────────────────────────────────────────────

    async def generate(
        self,
        raw_content: str,
        generation_count: int = 0,
        force_refresh: bool = False,
        attempt: int = 1,
    ) -> list:
        """
        Two-step generation with two layers of Redis caching:

          Layer 1 — Blueprint cache (30 days, deterministic):
            The extraction of the raw paper into a structured blueprint never changes
            for the same paper. Cache hit skips the first LLM call entirely.

          Layer 2 — Full exam result cache (24 h, per generation_count slot):
            Stores the final parallel exam. Cache hit returns instantly.
            force_refresh=True bypasses this layer while still benefiting from
            the fast blueprint cache, so a new parallel exam is generated quickly.
        """
        print(f"DEBUG: ExamGenerator.generate() attempt={attempt}, force_refresh={force_refresh}")
        redis = await _get_redis()

        # ── Layer 2: full exam result cache ──────────────────────────────────
        result_key = self._result_key(raw_content, generation_count)
        if not force_refresh and redis:
            cached_result = await redis.get(result_key)
            if cached_result:
                print("DEBUG: Full exam cache HIT — returning instantly.")
                return json.loads(cached_result)

        try:
            # ── Step 1: extract blueprint (Layer 1 cached) ────────────────────
            blueprint = await self._extract_blueprint(raw_content, redis)

            # ── Step 2: mutate to parallel challenge (always live) ─────────────
            data = await self._mutate_to_challenge(blueprint)
            data = self._normalise(data)

            # ── Save to Layer 2 cache ─────────────────────────────────────────
            if redis:
                await redis.set(result_key, json.dumps(data), ex=EXAM_RESULT_TTL)

            return data

        except Exception as e:
            if attempt < 2:
                print(f"WARN: Generation failed, retrying... ({e})")
                return await self.generate(raw_content, generation_count, force_refresh, attempt + 1)
            raise e

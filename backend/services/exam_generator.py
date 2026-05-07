import json
import re
import asyncio
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
import os

class ExamGeneratorService:
    def __init__(self, llm=None, api_key: str | None = None, model_name: str | None = None):
        if llm:
            self.llm = llm
        else:
            # Fallback for backward compatibility if llm is not provided
            provider = os.getenv("AI_PROVIDER", "openai").lower()
            if provider == "groq":
                self.llm = ChatGroq(
                    model=model_name or os.getenv("GROQ_MODEL_NAME") or "llama-3.3-70b-versatile",
                    groq_api_key=api_key or os.getenv("GROQ_API_KEY"),
                    temperature=0.3,
                    timeout=120
                )
            else:
                self.llm = ChatOpenAI(
                    model=model_name or os.getenv("OPENAI_MODEL_NAME") or "gpt-4o-mini",
                    openai_api_key=api_key or os.getenv("OPENAI_API_KEY"),
                    temperature=0.3,
                    timeout=120,
                    max_tokens=16384
                )

    def _clean_json(self, raw_output):
        """Robustly extract a JSON array from LLM output using bracket matching."""
        # Find the first '[' and the last ']' to extract the JSON array
        start = raw_output.find('[')
        end = raw_output.rfind(']')
        if start != -1 and end != -1 and end > start:
            return raw_output[start:end + 1]
        # Fallback: try stripping markdown fences
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
- The goal is practice: a student should be able to solve this new version using the same core concepts as the original.

CRITICAL FORMATTING RULES (FAILURE IS UNACCEPTABLE):
1. CODE BLOCKS: Any code (Java, Python, C++, etc.) MUST be wrapped in triple backticks with the language ID.
   Example: ```java\\npublic class Main {{ ... }}\\n```
2. NO PLAIN TEXT CODE: Never include code as regular text. It must always be in a block.
3. TABLES: Any tabular data or list-based comparisons MUST be returned as a standard Markdown table (e.g., | Header | Header |). This is NON-NEGOTIABLE.
4. NEW LINES: Use double newlines (\n\n) between any introductory text and a code block or table.
5. MATH NOTATION: Use clear formatting for mathematical expressions.
6. CODE DETECTION: Any text containing keywords like 'class', 'public', 'static', 'void', 'int', 'float', 'bool', 'char', 'string', 'if', 'else', 'for', 'while', 'function', 'const', 'let', 'var', 'def', 'import', 'from', 'include', 'iostream', 'std', '<html', '<div', '<style', '<script', '{{}}', '[]', '()', '=>' or any programming/markup syntax MUST be wrapped in triple backticks with the language ID.

STRUCTURE RULES:
- You will receive a JSON list of N question objects. Return EXACTLY N objects.
- DO NOT change the parent "text" field (the general instruction) — keep it IDENTICAL.
- DO NOT add or remove sub_questions. Keep the EXACT same count.
- If a question or sub-question has "options", keep the SAME NUMBER of options but modify their values.
- PRESERVE the "type" and "section_title" fields exactly as they are in the input.

MUTATION RULES (IMPORTANT):
- For TABLES: Mutate ALL numerical values and categories in the table while keeping the structure.
- For PROBABILITY/MATH: Change the specific numbers and scenarios.
- For CODING: Change variable names and logic.
- For MCQs: Ensure that the "options" are mutated but remain as valid alternatives to the question.

JSON FORMATTING:
- Return ONLY a valid JSON list. No markdown fences.
- All newlines inside strings MUST be \\n
- All quotes inside strings MUST be \\"
INPUT ({len(blueprint)} questions):
{blueprint_text}"""
        
        print(f"DEBUG: Generating parallel challenge for {len(blueprint)} questions...")
        response = await self.llm.ainvoke(prompt)
        return json.loads(self._clean_json(response.content))

    def _get_extraction_prompt(self, raw_content: str) -> str:
        return f"""Parse this university past paper into a structured JSON list. 

STRUCTURE RULES:
- MAIN QUESTIONS: Every distinct problem block MUST be a top-level object.
- SUB-QUESTIONS: Every sub-part (e.g., (i), (ii), (iii), 2.1, 2.2) MUST be in the "sub_questions" array.
- SUB-QUESTION CONTENT: Each sub-question object MUST contain the COMPLETE text and all CODE snippets associated with that sub-part. NEVER return just the numbering (e.g., "2.1").
- MCQ OPTIONS vs SUB-QUESTIONS: Do NOT confuse MCQ options (a, b, c, d) with sub-questions. 
  * CORRECT: One question object with {{"text": "Which is true?", "options": ["Option A", "Option B"]}}.
  * INCORRECT: Two separate question objects for each option.
- TRUE/FALSE: Treat True/False statements as MCQs with "options": ["True", "False"]. NEVER split a single T/F statement into two objects.
- TYPE DETECTION: For each question and sub-question, identify its "type": "multiple-choice", "short-answer", "coding", or "essay".
- OPTIONS: If a question is multiple-choice, you MUST extract the options into the "options" array. DO NOT leave options inside the "text" field.
- SECTION TITLES: If the paper has sections (e.g., "SECTION A: MCQs", "PART B"), include a "section_title" field for the FIRST question of that section. Leave it null for others.

CRITICAL RULES:
- NO FRAGMENTATION: If a question has parts a, b, c that are options, they MUST be in the "options" array of a SINGLE object.
- CODE DETECTION: Any text containing keywords like 'class', 'public', 'static', 'void', 'int', 'float', 'bool', 'char', 'string', 'if', 'else', 'for', 'while', 'function', 'const', 'let', 'var', 'def', 'import', 'from', 'include', 'iostream', 'std', '<html', '<div', '<style', '<script', '{{}}', '[]', '()', '=>' or any programming/markup syntax MUST be wrapped in triple backticks with the language ID (e.g., ```java, ```html, ```python, ```cpp).
- PRETTY PRINT CODE: If the source code is on a single line or poorly formatted, reformat it with proper indentation and newlines for readability.
- DO NOT REPEAT: Do not repeat the main question text for every option.
- DO NOT SKIP: Scan the ENTIRE document.
- KEEP TABLES: Reconstruct ALL tables as Markdown. If you see text like "S.Nr. Feature GET POST...", convert it to a proper table.

JSON FORMATTING:
- Return ONLY a valid JSON list.
- Use double newlines (\\n\\n) for readability.
- All newlines inside strings MUST be \\n

EXAMPLE OUTPUT STRUCTURE:
[
  {{
    "section_title": "SECTION A: MULTIPLE CHOICE QUESTIONS",
    "text": "1. What is the complexity of binary search?",
    "type": "multiple-choice",
    "options": ["O(n)", "O(log n)", "O(1)", "O(n log n)"],
    "sub_questions": []
  }},
  {{
    "text": "2. State whether True or False:",
    "type": "multiple-choice",
    "options": [],
    "sub_questions": [
      {{"text": "Java is platform independent.", "type": "multiple-choice", "options": ["True", "False"]}}
    ]
  }},
  {{
    "section_title": "SECTION B: DESCRIPTIVE",
    "text": "3. Explain Polymorphism with a code example.",
    "type": "coding",
    "options": [],
    "sub_questions": []
  }}
]

Past Paper Text:
{raw_content[:100000]}"""

    async def extract_blueprint(self, raw_content: str) -> list:
        """Extracts the structural blueprint from raw past paper text."""
        print(f"DEBUG: Extracting structural blueprint from {len(raw_content)} chars...")
        extract_prompt = self._get_extraction_prompt(raw_content)
        response = await self.llm.ainvoke(extract_prompt)
        blueprint = json.loads(self._clean_json(response.content))
        return blueprint

    async def generate_from_blueprint(self, blueprint: list) -> list:
        """Generates a parallel practice paper given a structural blueprint."""
        print(f"DEBUG: Mutating blueprint of {len(blueprint)} questions into parallel practice paper...")
        data = await self._generate_parallel_challenge(blueprint)

        # Post-processing to ensure field consistency
        for q in data:
            # Fallback type detection if LLM missed it
            if 'type' not in q or not q['type']:
                q['type'] = 'multiple-choice' if (q.get('options') and len(q['options']) > 0) else 'short-answer'
            
            if 'options' not in q: q['options'] = []
            if 'sub_questions' in q:
                for sq in q['sub_questions']:
                    if 'type' not in sq or not sq['type']:
                        sq['type'] = 'multiple-choice' if (sq.get('options') and len(sq['options']) > 0) else 'short-answer'
                    if 'options' not in sq: sq['options'] = []
                    
        return data

    async def generate(self, raw_content: str, generation_count: int = 0, cache_key: str = ""):
        """
        Main entry point for generating a practice paper.
        If raw_content is provided, it performs both extraction and mutation.
        """
        blueprint = await self.extract_blueprint(raw_content)
        return await self.generate_from_blueprint(blueprint)


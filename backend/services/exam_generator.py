import json
import re
import asyncio
from langchain_openai import ChatOpenAI

class ExamGeneratorService:
    def __init__(self, api_key: str, model_name: str):
        # We use a lower temperature for structural extraction to be more precise
        self.llm = ChatOpenAI(
            model=model_name,
            openai_api_key=api_key,
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
3. TABLES: Any tabular data MUST be returned as a standard Markdown table (e.g., | Header | Header |).
4. NEW LINES: Use double newlines (\\n\\n) between any introductory text and a code block or table.
5. MATH NOTATION: Use clear formatting for mathematical expressions.

STRUCTURE RULES:
- You will receive a JSON list of N question objects. Return EXACTLY N objects.
- DO NOT change the parent "text" field (the general instruction) — keep it IDENTICAL.
- DO NOT add or remove sub_questions. Keep the EXACT same count.
- If a question or sub-question has "options", keep the SAME NUMBER of options but modify their values.

MUTATION RULES (IMPORTANT):
- For TABLES: Mutate ALL numerical values and categories in the table while keeping the structure.
- For PROBABILITY/MATH: Change the specific numbers and scenarios.
- For CODING: Change variable names and logic.

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
- MAIN QUESTIONS: Every distinct problem block MUST be a top-level object. If a question is clearly labeled (e.g., Q1, Q2, Question 3), use that as the boundary.
- SUB-QUESTIONS: Every sub-part (e.g., (i), (ii), (iii), a, b, c) MUST be a separate object in the "sub_questions" array. 
- NO MERGING: Do not merge multiple sub-parts into one text field. Each part is a distinct task for the student.
- TRUE/FALSE: Every T/F statement MUST be its own sub_question.
- PARENT CONTEXT: If multiple sub-questions share a table or scenario, put that table/scenario in the parent "text" field so it's visible for all parts.

CRITICAL RULES:
- DO NOT SKIP ANY PART: If the paper has 5 sub-parts (i to v), the "sub_questions" array MUST have length 5.
- DETECT ALL QUESTIONS: Scan the ENTIRE document from start to finish. Some questions might not be explicitly labeled "Question X" but are clearly new problems. If you see a major new topic or a large gap, treat it as a new main question.
- CAPTURE THE END: Pay special attention to the end of the document. Do not truncate your analysis before the very last line of text.
- KEEP TABLES & CODE: Reconstruct tables as Markdown and code as markdown blocks.
- OMIT ONLY: Page numbers, "Total Marks", and university headers.

JSON FORMATTING:
- Return ONLY a valid JSON list.
- Use double newlines (\\n\\n) for readability.
- All newlines inside strings MUST be \\n

EXAMPLE OUTPUT STRUCTURE:
[
  {{
    "text": "Predict the output of the following code snippets. Consider all edge cases.",
    "options": [],
    "sub_questions": [
      {{"text": "2.1\\n\\n```java\\npublic class Main {{ ... }}\\n```", "options": []}}
    ]
  }},
  {{
    "text": "State whether the following are True or False:",
    "options": [],
    "sub_questions": [
      {{"text": "Probability of an impossible event is 1.", "options": ["True", "False"]}},
      {{"text": "The sum of probabilities is always 1.", "options": ["True", "False"]}}
    ]
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
            q['type'] = 'multiple-choice' if (q.get('options') and len(q['options']) > 0) or q.get('sub_questions') else 'short-answer'
            if 'options' not in q: q['options'] = []
            if 'sub_questions' in q:
                for sq in q['sub_questions']:
                    if 'options' not in sq: sq['options'] = []
                    
        return data

    async def generate(self, raw_content: str, generation_count: int = 0, cache_key: str = ""):
        """
        Main entry point for generating a practice paper.
        If raw_content is provided, it performs both extraction and mutation.
        """
        blueprint = await self.extract_blueprint(raw_content)
        return await self.generate_from_blueprint(blueprint)


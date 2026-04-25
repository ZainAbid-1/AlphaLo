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

    async def _harden_all_questions(self, blueprint: list):
        """Generate 'slightly harder' versions for ALL questions in a SINGLE call."""
        blueprint_text = json.dumps(blueprint, indent=1)
        prompt = f"""You are a university exam paper generator. Create SLIGHTLY HARDER variants.

STRUCTURE RULES (MOST IMPORTANT):
- You will receive a JSON list of N question objects. Return EXACTLY N objects.
- Each object has a "text" (the parent instruction), optionally "options", and optionally "sub_questions".
- DO NOT change the parent "text" field — keep it IDENTICAL.
- DO NOT add or remove sub_questions. Keep the EXACT same count.
- If a question or sub-question has "options", keep the SAME NUMBER of options but modify them to match the new harder code/problem.
- Only modify the CODE or problem details inside each sub_question's "text".

CODE RULES:
- If a sub_question contains code, generate NEW MODIFIED code (change variable names, values, add edge cases).
- The new code MUST be complete, compilable, and realistic.
- NEVER replace code with summaries like "Analyze the logic" or "Snippet 1".

TABLE RULES:
- If a question contains a table, keep the structure but modify the numerical values or categories to make the problem harder.
- Always use standard Markdown table format (e.g., | Header 1 | Header 2 |).

JSON FORMATTING:
- Return ONLY a valid JSON list. No markdown fences, no extra text.
- All newlines inside strings MUST be \\n
- All quotes inside strings MUST be \\"

INPUT ({len(blueprint)} questions):
{blueprint_text}"""
        
        print(f"DEBUG: Hardening {len(blueprint)} questions in a single LLM call...")
        response = await self.llm.ainvoke(prompt)
        print("DEBUG: Hardening complete.")
        return json.loads(self._clean_json(response.content))

    def _get_extraction_prompt(self, raw_content: str) -> str:
        return f"""Parse this university past paper into a structured JSON list.

STRUCTURE RULES (MOST IMPORTANT):
- The paper has MAIN QUESTIONS (e.g., Question 1, Question 2, Question 3, etc.).
- Each main question has a PARENT INSTRUCTION (e.g., "Predict the output of the following code snippets, in case of error explain the reason.").
- Under each main question there are SUB-PARTS (e.g., 2.1, 2.2, 2.3, 3.1, 3.2, etc.).
- The parent instruction goes in the top-level "text" field.
- Each sub-part goes as a separate object inside "sub_questions".
- DO NOT flatten sub-parts into top-level questions. A paper with 5 main questions should produce EXACTLY 5 objects.

CODE RULES:
- If a sub-part contains a code snippet, include the COMPLETE EXACT code VERBATIM in that sub_question's "text".
- NEVER summarize code. NEVER write "Snippet 1 - Analyze the logic". Include the ACTUAL code.

TABLE RULES:
- If the raw text contains data that looks like a table (e.g., rows/columns of numbers, frequency distributions), reconstruct it into a standard Markdown table in the "text" field.
- If headers are missing, infer logical headers (e.g., "Class Interval", "Frequency").

JSON FORMATTING:
- Return ONLY a valid JSON list. No markdown fences, no extra text.
- All newlines inside strings MUST be \\n
- All quotes inside strings MUST be \\"

EXAMPLE: If the paper says:
  "Question 2: Predict the output of the following code snippets...\\n 2.1 [code1] \\n 2.2 [code2]"
The output MUST be:
[{{
  "text": "Predict the output of the following code snippets, in case of error explain the reason.",
  "options": [],
  "sub_questions": [
    {{"text": "public class Main {{\\n    int x = 10;\\n}}", "options": []}},
    {{"text": "class Parent {{\\n    int num;\\n}}", "options": []}}
  ]
}}]

Omit administrative text (marks, CLO numbers, page numbers).

Past Paper Text:
{raw_content[:12000]}"""

    async def generate(self, raw_content: str, generation_count: int, cache_key: str = ""):
        if generation_count == 0:
            print("DEBUG: Generating Original Blueprint (Count 0)...")
            prompt = self._get_extraction_prompt(raw_content)
            response = await self.llm.ainvoke(prompt)
            print("DEBUG: Original Blueprint generation complete.")
            data = json.loads(self._clean_json(response.content))
        else:
            print(f"DEBUG: Generating Modded Challenge (Count {generation_count})...")
            # Always extract blueprint fresh
            print(f"DEBUG: Extracting blueprint from {len(raw_content)} chars...")
            extract_prompt = self._get_extraction_prompt(raw_content)
            response = await self.llm.ainvoke(extract_prompt)
            blueprint = json.loads(self._clean_json(response.content))
            
            # Then harden it
            data = await self._harden_all_questions(blueprint)


        # Post-processing
        for q in data:
            q['type'] = 'multiple-choice' if (q.get('options') and len(q['options']) > 0) or q.get('sub_questions') else 'short-answer'
            if 'options' not in q: q['options'] = []
            if 'sub_questions' in q:
                for sq in q['sub_questions']:
                    if 'options' not in sq: sq['options'] = []
                    
        return data

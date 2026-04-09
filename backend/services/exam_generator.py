import json
from langchain_openai import ChatOpenAI

class ExamGeneratorService:
    def __init__(self, api_key: str, model_name: str):
        self.llm = ChatOpenAI(
            model=model_name,
            openai_api_key=api_key,
            openai_api_base="https://openrouter.ai/api/v1",
            temperature=0.7
        )

    def generate(self, raw_content: str, generation_count: int):
        if generation_count == 0:
            prompt = f"""
            I am providing the raw text extracted from a university past paper:
            ---
            {raw_content}
            ---

            TASK:
            1. Parse the text and identify every individual question or sub-question.
            2. DO NOT change the core meaning or the scenario of the questions. Simply format them beautifully.
            3. Remove "Administrative Noise" (Total Marks, Question 1, Time: 3 Hours, page numbers, etc).
            4. Formatting: Return the results ONLY as a valid JSON list of objects.
            
            Each object should have:
            - "text": "The question text"
            - "options": ["Option A", "Option B"] (Only if it provides multiple options, otherwise leave empty list [])
            - "difficulty": "medium" (Estimate it)
            
            Return ONLY valid JSON.
            """
        else:
            prompt = f"""
            I am providing the raw text extracted from a university past paper:
            ---
            {raw_content}
            ---

            TASK:
            1. This is a reference past paper. Your task is to generate ENTIRELY NEW questions of the same or slightly higher difficulty.
            2. Use the past paper as a stylistic and topical blueprint, but invent new scenarios and code examples.
            3. Formatting: Return the results ONLY as a valid JSON list of objects.
            
            Each object should have:
            - "text": "The newly generated question text"
            - "options": ["Option A", "Option B"] (Optional, provide if generating a multiple choice question)
            - "difficulty": "hard" (Estimate it)
            
            Return ONLY valid JSON with no markdown block wrappers.
            """
            
        try:
            response = self.llm.invoke(prompt)
            clean_json = response.content.replace("```json", "").replace("```", "").strip()
        except Exception as api_err:
            raise RuntimeError(f"OpenRouter API error: {api_err}")
        
        try:
            data = json.loads(clean_json)
        except json.JSONDecodeError as parse_err:
            raise RuntimeError(f"Failed to parse OpenRouter JSON output: {parse_err}\n\nRaw output:\n{clean_json[:500]}")
        
        # Ensure we return a default 'type' or uniform format
        for q in data:
            q['type'] = 'multiple-choice' if len(q.get('options', [])) > 0 else 'short-answer'
            
        return data

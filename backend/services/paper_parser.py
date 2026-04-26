import json
import pdfplumber
from langchain_openai import ChatOpenAI
import logging

class QuestionExtractor:
    def __init__(self, api_key: str, model_name: str):
        self.llm = ChatOpenAI(
            model=model_name,
            openai_api_key=api_key,
            temperature=0.1
        )

    def exam_parser(self, file_path):
        """Extracts text from PDF while attempting to preserve table layouts."""
        all_text = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                # layout=True helps preserve horizontal spacing (columns/tables)
                text = page.extract_text(layout=True)
                if text:
                    all_text.append(text)
        
        exam_text = "\n\n--- Page Break ---\n\n".join(all_text)
        return exam_text

    def get_questions(self, exam_text: str, topic_name: str):
        prompt = f"""
        You are a senior academic analyst. 
        Focus Topic: "{topic_name}"
        Raw Exam Text:
        ---
        {exam_text}
        ---

        TASK:
        1. Scan the exam text for questions that specifically target "{topic_name}" or its core sub-concepts.
        2. If a question is generic or belongs to a different module, EXCLUDE it.
        3. MANDATORY: Reproduce the relevant questions FULLY. Include all multiple-choice options (A, B, C, D), marks allocated (e.g., [5]), and any scenarios. 
        4. CRITICAL: If a question contains a code snippet, wrap it in triple backticks (e.g., ```java ... ```). 
        5. If the question has sub-parts (i, ii, iii), include those too.
        6. Rewrite ONLY to improve clarity if the PDF extraction is messy, but DO NOT remove content.
        7. Return the result ONLY as a valid JSON list of strings: ["Full Question 1...", "Full Question 2..."].
        8. If no matches exist, return: [].
        """

        response = self.llm.invoke(prompt)
        clean_json = response.content.replace("```json", "").replace("```", "").strip()
        
        # MLOps Logic: If the exam has nothing, we fallback to searching the topic itself
        extracted = json.loads(clean_json)
        return extracted if len(extracted) > 0 else [topic_name]
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

    def get_questions(self,exam_text):
        prompt = f"""
        I am providing the raw text extracted from a university past paper:
        ---
        {exam_text}
        ---

        TASK:
        1. Parse the text and identify every individual question or sub-question.
        2. For each question, create a "Self-Contained String." This means if a question refers to 
        a previous context (e.g., "Discuss the code snippet above"), rewrite it to include that 
        context (e.g., "Discuss the implementation of [Topic] in a code snippet").
        3. Combine sub-parts (like 1a, 1b) into a single string if they relate to the same concept.
        4. Remove all "Administrative Noise":
        - Ignore "Total Marks," "Question 1," "Section A," or "Time: 3 Hours."
        - Ignore page numbers and university headers.
        5. Formatting: Return the results ONLY as a valid JSON list of strings.

        Example Output:
        [
        "Explain the difference between Method Overloading and Overriding with a Java code example.",
        "Describe the concept of Encapsulation and how private access modifiers enforce it.",
        "Write a recursive function to calculate the Fibonacci sequence and analyze its space complexity."
        ]

        """

        response = self.llm.invoke(prompt)

        # AI often wraps JSON in ```json blocks, strip those blocks
        clean_json = response.content.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)

import json
from langchain_community.document_loaders import PyPDFLoader # pyright: ignore[reportMissingImports]
from google import genai
import logging

logging.getLogger("pypdf").setLevel(logging.ERROR)
class QuestionExctractor:
    def __init__(self, api_key: str):
        self.llm = genai.Client(api_key=api_key)
        self.model_name = "gemini-2.5-flash"

    def exam_parser(self, file_path):
        docs = PyPDFLoader(file_path).load()
        # Extract and join the text from all pages
        exam_text = " ".join([doc.page_content for doc in docs])
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

        response = self.llm.models.generate_content(
            model=self.model_name,
            contents=prompt
        )

        # AI often wraps JSON in ```json blocks, strip those blocks
        clean_json = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)
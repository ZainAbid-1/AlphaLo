import json
from langchain_community.document_loaders import PyPDFLoader # pyright: ignore[reportMissingImports]
from langchain_openai import ChatOpenAI
import logging

logging.getLogger("pypdf").setLevel(logging.ERROR)
class QuestionExctractor:
    def __init__(self, api_key: str, model_name: str):
        self.llm = ChatOpenAI(
            model=model_name,
            openai_api_key=api_key,
            temperature=0.1
        )

    def exam_parser(self, file_path):
        docs = PyPDFLoader(file_path).load()
        # Extract and join the text from all pages
        exam_text = " ".join([doc.page_content for doc in docs])
        return exam_text

    def get_questions(self, exam_text:str, topic_name:str):
        prompt = f"""
        You are a strict academic filter. 
        Topic: "{topic_name}"
        Raw Exam Text:
        ---
        {exam_text}
        ---

        TASK:
        1. Scan the exam text for questions that ONLY relate to "{topic_name}".
        2. If a question is about a different topic (e.g. Arrays or Basics), IGNORE it.
        3. Rewrite the relevant questions to be self-contained.
        4. If ZERO questions in the exam relate to "{topic_name}", return an empty list: [].
        5. Formatting: Return the result ONLY as a valid JSON list of strings.
        """

        response = self.llm.invoke(prompt)
        clean_json = response.content.replace("```json", "").replace("```", "").strip()
        
        # MLOps Logic: If the exam has nothing, we fallback to searching the topic itself
        extracted = json.loads(clean_json)
        return extracted if len(extracted) > 0 else [topic_name]

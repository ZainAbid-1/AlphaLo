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

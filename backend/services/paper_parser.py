import json
import pdfplumber
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
import os
import logging

class QuestionExtractor:
    def __init__(self, llm=None, api_key: str | None = None, model_name: str | None = None):
        if llm:
            self.llm = llm
        else:
            provider = os.getenv("AI_PROVIDER", "openai").lower()
            if provider == "groq":
                self.llm = ChatGroq(
                    model=model_name or os.getenv("GROQ_MODEL_NAME") or "llama-3.3-70b-versatile",
                    groq_api_key=api_key or os.getenv("GROQ_API_KEY"),
                    temperature=0.1
                )
            else:
                self.llm = ChatOpenAI(
                    model=model_name or os.getenv("OPENAI_MODEL_NAME") or "gpt-4o-mini",
                    openai_api_key=api_key or os.getenv("OPENAI_API_KEY"),
                    temperature=0.1
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

    async def get_questions(self, exam_text: str, topic_name: str):
        prompt = f"""
        You are a senior academic analyst. 
        Focus Topic: "{topic_name}"
        Raw Exam Text:
        ---
        {exam_text}
        ---

        TASK:
        1. Scan the exam text for questions that specifically target "{topic_name}" or its core sub-concepts.
        2. SEPARATION RULE: Every distinct TOP-LEVEL question MUST be a single item in the list.
           - A top-level question is identified by its main question number (e.g., Q1, Q2, 1., 2., etc.).
           - Sub-parts of the SAME question (a, b, c, i, ii, iii) that share the same question stem/context are NOT separate questions.
        3. TABLE & COMPARISON QUESTIONS — CRITICAL RULE:
           - If a question asks to compare, fill a table, or describe features across multiple items (rows), 
             the ENTIRE question — including ALL rows of the table — MUST be ONE single object.
           - NEVER split table rows into separate question objects. The table IS the question.
           - Example: "Compare GET and POST for: Bookmarking, Data caching, Data visibility" → ONE object 
             with the full table reconstructed in Markdown inside the "text" field.
        4. MCQ GROUPING: For Multiple Choice Questions, extract all options into the "options" array. 
           * CRITICAL: Do NOT create separate objects for each option.
           * CRITICAL: Do NOT include options like "a. True" inside the "text" field.
        5. TRUE/FALSE GROUPING: Treat each True/False statement as a single question with ["True", "False"] in the "options" array.
        6. CODE DETECTION: Any text containing keywords like 'class', 'public', 'static', 'void', 'int', 'float', 'bool', 'char', 'string', 'if', 'else', 'for', 'while', 'function', 'const', 'let', 'var', 'def', 'import', 'from', 'include', 'iostream', 'std', '<html', '<div', '<style', '<script', '{{}}', '[]', '()', '=>' or any programming/markup syntax MUST be wrapped in triple backticks with the language ID (e.g., ```java, ```html, ```python, ```cpp).
        7. PRETTY PRINT CODE: If the source code is on a single line or poorly formatted, reformat it with proper indentation and newlines for readability.
        8. TABLES: If you encounter tabular data or lists that look like they should be in a table (e.g., multiple columns with headers), YOU MUST RECONSTRUCT THEM AS MARKDOWN TABLES. 
           - Example: | Header 1 | Header 2 | \n |---|---| \n | Row 1 | Row 1 |
        9. REPRODUCTION: Reproduce the question text ACCURATELY, including marks allocation if shown.
        10. PARENT CONTEXT: For each extracted question, also include the FULL PARENT QUESTION TEXT 
            (e.g., "2. Short Questions (28 marks) — A. Compare GET and POST methods...") as "parent_context".
            If the question IS the top-level question, set "parent_context" to null.
        
        EXAMPLE OUTPUT:
        [
          {{
            "text": "1.1 Inheritance allows a subclass to inherit features from a superclass.", 
            "options": ["True", "False"],
            "parent_context": "Q1. State True or False (5 marks)"
          }},
          {{
            "text": "A. Compare GET and POST methods for the following features:\\n\\n| S.Nr. | Feature | GET | POST |\\n|---|---|---|---|\\n| 1 | Bookmarking | | |\\n| 2 | Data caching | | |\\n| 3 | Data visibility (in the URL) | | |\\n| 4 | Restrictions on data type | | |\\n| 5 | File upload support | | |", 
            "options": [],
            "parent_context": "2. Short Questions (28 marks)"
          }}
        ]

        Return ONLY the valid JSON list of objects. No intro text.
        If no matches exist, return: [].
        """

        response = await self.llm.ainvoke(prompt)
        clean_json = self._clean_json(response.content)
        
        try:
            # strict=False allows control characters like literal newlines
            extracted = json.loads(clean_json, strict=False)
            
            # Ensure each item is a dict with 'text', 'options', and 'parent_context'
            sanitized = []
            for item in extracted:
                if isinstance(item, str):
                    sanitized.append({"text": item, "options": [], "parent_context": None})
                elif isinstance(item, dict):
                    sanitized.append({
                        "text": item.get("text", item.get("question", "")),
                        "options": item.get("options", []),
                        "parent_context": item.get("parent_context", None)
                    })
            
            return sanitized if len(sanitized) > 0 else [{"text": topic_name, "options": [], "parent_context": None}]
        except Exception as e:
            print(f"ERROR: Failed to parse questions JSON for {topic_name}: {e}")
            return [{"text": topic_name, "options": [], "parent_context": None}]
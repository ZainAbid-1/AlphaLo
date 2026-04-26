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
        2. SEPARATION RULE: Every single question MUST be a separate item in the list.
        3. TRUE/FALSE RULE: Each T/F statement MUST be its own separate object.
        4. CODE RULE: If a question contains ANY code (even single lines like 'class Parent {{ ... }}'), you MUST wrap it in triple backticks. This is required for our UI to render it in a special Mac terminal box.
        5. OPTIONS: List multiple choice options in the "options" array.
        6. REPRODUCTION: Reproduce the question FULLY and ACCURATELY.
        
        EXAMPLE OUTPUT:
        [
          {{
            "text": "Predict the output of the following code:\\n\\n```java\\nclass A {{ ... }}\\n```", 
            "options": []
          }},
          {{
            "text": "1.1 Inheritance allows a subclass to inherit features from a superclass.", 
            "options": ["True", "False"]
          }}
        ]

        7. Return ONLY the valid JSON list of objects. No intro text.
        8. If no matches exist, return: [].
        """

        response = self.llm.invoke(prompt)
        clean_json = self._clean_json(response.content)
        
        try:
            # strict=False allows control characters like literal newlines
            extracted = json.loads(clean_json, strict=False)
            
            # Ensure each item is a dict with 'text' and 'options'
            sanitized = []
            for item in extracted:
                if isinstance(item, str):
                    sanitized.append({"text": item, "options": []})
                elif isinstance(item, dict):
                    sanitized.append({
                        "text": item.get("text", item.get("question", "")),
                        "options": item.get("options", [])
                    })
            
            return sanitized if len(sanitized) > 0 else [{"text": topic_name, "options": []}]
        except Exception as e:
            print(f"ERROR: Failed to parse questions JSON for {topic_name}: {e}")
            return [{"text": topic_name, "options": []}]
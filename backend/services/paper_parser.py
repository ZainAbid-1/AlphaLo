import json
import asyncio
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

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _clean_json(self, raw_output):
        """Robustly extract a JSON array from LLM output using bracket matching."""
        start = raw_output.find('[')
        end = raw_output.rfind(']')
        if start != -1 and end != -1 and end > start:
            return raw_output[start:end + 1]
        if "```json" in raw_output:
            raw_output = raw_output.split("```json", 1)[1]
        if "```" in raw_output:
            raw_output = raw_output.split("```", 1)[0]
        return raw_output.strip()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def exam_parser(self, file_path):
        """Extracts text from PDF while attempting to preserve table layouts."""
        all_text = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text(layout=True)
                if text:
                    all_text.append(text)
        
        return "\n\n--- Page Break ---\n\n".join(all_text)

    async def expand_topic_concepts(self, topic_name: str) -> list[str]:
        """
        Decomposes a topic into 4-6 academic sub-concepts for enriched
        Pinecone searches. Runs in parallel with question extraction.

        Example: "Inheritance" →
            ["polymorphism method overriding", "superclass subclass IS-A",
             "abstract class interface", "constructor chaining",
             "multiple inheritance", "method hiding override"]
        """
        prompt = f"""You are a university-level academic expert.

Topic: "{topic_name}"

List the 4 to 6 most important academic sub-concepts, terms, or related ideas that a student
must understand to master this topic. These will be used as search queries in a textbook.

Rules:
- Output ONLY a JSON array of strings (no explanation, no markdown).
- Each string should be a short search phrase (2-6 words).
- Include both theoretical and practical aspects.
- Include common textbook terminology for this topic.

Example for "Inheritance":
["polymorphism method overriding", "superclass subclass IS-A", "abstract class interface", "constructor chaining", "multiple inheritance", "method hiding override"]

Return ONLY the JSON array:"""

        try:
            response = await self.llm.ainvoke(prompt)
            cleaned = self._clean_json(response.content)
            concepts = json.loads(cleaned, strict=False)
            if isinstance(concepts, list):
                return [str(c) for c in concepts if isinstance(c, str) and c.strip()]
        except Exception as e:
            print(f"WARN: expand_topic_concepts failed for '{topic_name}': {e}")
        return [topic_name]

    async def get_questions(self, exam_text: str, topic_name: str) -> dict:
        """
        Extracts past-paper questions related to topic_name AND generates
        expanded sub-concepts for richer textbook searches. Both tasks run
        in parallel via asyncio.gather().

        Returns:
            {
                "questions": [ { text, options, parent_context }, ... ],
                "concepts":  [ "sub-concept phrase 1", ... ]
            }
        """
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
        4. MCQ GROUPING: For Multiple Choice Questions, extract all options into the "options" array.
           * CRITICAL: Do NOT create separate objects for each option.
        5. TRUE/FALSE GROUPING: Treat each True/False statement as a single question with ["True", "False"] in options.
        6. CODE DETECTION: Wrap any code in triple backticks with the appropriate language ID.
        7. PRETTY PRINT CODE: Reformat single-line or poorly indented code for readability.
        8. TABLES: Reconstruct tabular data as Markdown tables.
        9. REPRODUCTION: Reproduce the question text ACCURATELY, including marks allocation if shown.
        10. PARENT CONTEXT: Include the full parent question text as "parent_context" (null if top-level).

        EXAMPLE OUTPUT:
        [
          {{
            "text": "1.1 Inheritance allows a subclass to inherit features from a superclass.", 
            "options": ["True", "False"],
            "parent_context": "Q1. State True or False (5 marks)"
          }}
        ]

        Return ONLY the valid JSON list of objects. No intro text.
        If no matches exist, return: [].
        """

        # Run extraction + concept expansion in parallel (saves one round-trip)
        q_response, concepts = await asyncio.gather(
            self.llm.ainvoke(prompt),
            self.expand_topic_concepts(topic_name)
        )

        clean_json = self._clean_json(q_response.content)

        try:
            extracted = json.loads(clean_json, strict=False)
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
            questions = sanitized
        except Exception as e:
            print(f"ERROR: Failed to parse questions JSON for {topic_name}: {e}")
            questions = []

        return {"questions": questions, "concepts": concepts}
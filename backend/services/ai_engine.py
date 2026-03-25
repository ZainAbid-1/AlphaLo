from google import genai

class AIEngine:
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.model_id = 'gemini-2.5-flash' # Using the newest fast model

    def extract_relevant_questions(self, pattern: str, book_text: str):
        prompt = f"""
        You are an academic assistant. 
        I am giving you a 'Past Paper Pattern' and a 'Textbook Section'.
        
        PAST PAPER PATTERN: "{pattern}"
        TEXTBOOK SECTION: 
        {book_text}
        
        TASK:
        1. Identify any specific Practice Questions, Review Exercises, or Problems in the 
           Textbook Section that test the same concepts found in the Past Paper Pattern.
        2. Return ONLY the question identifier (e.g., 'Exercise 4.2') and a 10-word summary.
        3. Do NOT make up new questions. Only extract what is written in the textbook section.
        """
        
        response = self.client.models.generate_content(
            model=self.model_id, 
            contents=prompt
        )
        return response.text
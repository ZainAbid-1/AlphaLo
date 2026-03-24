import google.generativeai as genai

class AIEngine:
    def __init__(self, gemini_api_key: str):
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

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
        2. Return ONLY the question identifier (e.g., 'Exercise 4.2') and the actual question with it.
        3. Do NOT make up new questions. Only extract what is written in the textbook section.
        """
        
        response = self.model.generate_content(prompt)
        return response.text
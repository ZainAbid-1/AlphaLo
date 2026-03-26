import os
from dotenv import load_dotenv
from services.paper_parser import QuestionExctractor
from services.textbook_parser import TextbookIngestor
from services.question_recommender import QuestionRecommender

load_dotenv()
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

# Initialize the new services once
extractor = QuestionExctractor(api_key=GEMINI_KEY)
parser = TextbookIngestor() 
recommender = QuestionRecommender(gemini_api_key=GEMINI_KEY)

# Functions to provide these services to your routes
def get_question_extractor(): return extractor
def get_textbook_parser(): return parser
def get_question_recommender(): return recommender
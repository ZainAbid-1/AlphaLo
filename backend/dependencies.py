import os
from dotenv import load_dotenv
from services.vector_service import VectorService
from services.ai_engine import AIEngine
from services.book_service import BookService

load_dotenv()
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
PINECONE_KEY = os.getenv("PINECONE_API_KEY")

# Initialize services as singletons
v_service = VectorService(gemini_api_key=GEMINI_KEY, pinecone_api_key=PINECONE_KEY)
ai_engine = AIEngine(api_key=GEMINI_KEY)
book_service = BookService(vector_service=v_service, ai_engine=ai_engine)

def get_book_service(): return book_service
def get_ai_engine(): return ai_engine
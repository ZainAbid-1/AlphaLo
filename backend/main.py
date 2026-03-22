import os
from dotenv import load_dotenv
from fastapi import FastAPI
from services.vector_service import VectorService
from services.ai_engine import AIEngine
from services.book_service import BookService

# Read the .env file
load_dotenv()

app = FastAPI()

# Grab the keys from the env
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
PINECONE_KEY = os.getenv("PINECONE_API_KEY")

# Distribute the keys
v_service = VectorService(gemini_api_key=GEMINI_KEY, pinecone_api_key=PINECONE_KEY)
ai_engine = AIEngine(api_key=GEMINI_KEY)

# BookService takes the initialized services
book_service = BookService(vector_service=v_service, ai_engine=ai_engine)

# the fastapi route to call book_service.py etc functions will go below from here later
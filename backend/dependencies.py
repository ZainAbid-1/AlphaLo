import os
import threading
from dotenv import load_dotenv
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends, HTTPException, Security
import jwt
from jwt import PyJWKClient


load_dotenv()


# AI Provider Selection
AI_PROVIDER = os.getenv("AI_PROVIDER", "openai").lower()

def create_llm(temperature=0.3):
    if AI_PROVIDER == "groq":
        from langchain_groq import ChatGroq
        return ChatGroq(
            model=os.getenv("GROQ_MODEL_NAME", "llama-3.3-70b-versatile"),
            groq_api_key=os.getenv("GROQ_API_KEY"),
            temperature=temperature
        )
    else:
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=os.getenv("OPENAI_MODEL_NAME", "gpt-4o-mini"),
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            temperature=temperature
        )

# Base LLM instances (will be initialized in setup_services)
llm_default = None
llm_precise = None

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://tngqrxlglenllgufrzuc.supabase.co")

# Lazy-loaded JWKS client
_jwks_client = None

def get_jwks_client():
    global _jwks_client
    if _jwks_client is None:
        print("DEBUG: Initializing JWKS client...")
        jwks_url = f"{SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url)
    return _jwks_client

# SANITIZE SECRET: Clear quotes/spaces (Still needed for HS256/Service Role tokens)
SUPABASE_JWT_SECRET = (os.getenv("SUPABASE_JWT_SECRET") or "").strip("'\" ")
ALLOWED_ADMIN_EMAILS = [e.strip().lower() for e in os.getenv("ALLOWED_ADMIN_EMAILS", "").split(",") if e.strip()]

security = HTTPBearer()

def get_admin_user(auth: HTTPAuthorizationCredentials = Security(security)):
    """Verifies the Supabase JWT (HS256 or ES256) and checks if the email is in the admin whitelist."""
    token = auth.credentials
    try:
        # DEBUG: See what's actually in the header
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")
        
        if alg == "ES256":
            # Fetch the public key from the Supabase JWKS endpoint
            client = get_jwks_client()
            signing_key = client.get_signing_key_from_jwt(token)
            key = signing_key.key
        else:
            # Fallback to symmetric secret for HS256
            key = SUPABASE_JWT_SECRET

        payload = jwt.decode(
            token, 
            key, 
            algorithms=["HS256", "ES256"], 
            options={"verify_aud": False}
        )
        email = payload.get("email", "").strip().lower()
        if not email or email not in ALLOWED_ADMIN_EMAILS:
            print(f"ADMIN AUTH FAIL: '{email}' not in whitelist: {ALLOWED_ADMIN_EMAILS}")
            raise HTTPException(
                status_code=403, 
                detail=f"Access denied. {email} is not an authorized admin."
            )
        return payload
    except Exception as e:
        print(f"JWT VALIDATION ERROR: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from services.paper_parser import QuestionExtractor
    from services.textbook_parser import TextbookIngestor
    from services.question_recommender import QuestionRecommender
    from services.exam_generator import ExamGeneratorService

# Global service instances (lazy-loaded)
extractor = None
parser = None
recommender = None
exam_generator = None

# Thread lock for safe initialization
_init_lock = threading.Lock()

def setup_services():
    """Initializes services only when called, avoiding import-time hangs."""
    global extractor, parser, recommender, exam_generator, llm_default, llm_precise
    
    with _init_lock:
        # Initialize LLMs if not already done
        if llm_default is None:
            llm_default = create_llm(temperature=0.3)
        if llm_precise is None:
            llm_precise = create_llm(temperature=0.1)
            
        # 1. QuestionExtractor
        if extractor is None:
            try:
                from services.paper_parser import QuestionExtractor
                extractor = QuestionExtractor(llm=llm_precise)
                print("DEBUG: QuestionExtractor ready.")
            except Exception as e:
                print(f"CRITICAL ERROR: Failed to init QuestionExtractor: {e}")

        # 2. TextbookIngestor
        if parser is None:
            try:
                from services.textbook_parser import TextbookIngestor
                parser = TextbookIngestor() 
                print("DEBUG: TextbookIngestor ready.")
            except Exception as e:
                print(f"CRITICAL ERROR: Failed to init TextbookIngestor: {e}")

        # 3. QuestionRecommender
        if recommender is None:
            try:
                from services.question_recommender import QuestionRecommender
                recommender = QuestionRecommender(llm=llm_default)
                print("DEBUG: QuestionRecommender ready.")
            except Exception as e:
                print(f"CRITICAL ERROR: Failed to init QuestionRecommender: {e}")

        # 4. ExamGenerator
        if exam_generator is None:
            try:
                from services.exam_generator import ExamGeneratorService
                exam_generator = ExamGeneratorService(llm=llm_default)
                print("DEBUG: ExamGenerator ready.")
            except Exception as e:
                print(f"CRITICAL ERROR: Failed to init ExamGenerator: {e}")

# Functions to provide these services to your routes
def get_question_extractor() -> "QuestionExtractor": 
    if extractor is None:
        setup_services()
    return extractor # type: ignore

def get_textbook_parser() -> "TextbookIngestor": 
    if parser is None:
        setup_services()
    return parser # type: ignore

def get_question_recommender() -> "QuestionRecommender": 
    if recommender is None:
        setup_services()
    return recommender # type: ignore

def get_exam_generator() -> "ExamGeneratorService": 
    if exam_generator is None:
        setup_services()
    if exam_generator is None:
        print("ERROR: get_exam_generator returning None!")
    return exam_generator # type: ignore
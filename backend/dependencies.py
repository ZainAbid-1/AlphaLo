import os
from dotenv import load_dotenv
from services.paper_parser import QuestionExctractor
from services.textbook_parser import TextbookIngestor
from services.question_recommender import QuestionRecommender
from services.exam_generator import ExamGeneratorService
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWKClient  # Added for ES256 support
from fastapi import Depends, HTTPException, Security

load_dotenv()
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL_NAME = os.getenv("OPENROUTER_MODEL_NAME")
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://tngqrxlglenllgufrzuc.supabase.co")

# JWKS Client for fetching Supabase public keys (required for ES256)
JWKS_URL = f"{SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
jwks_client = PyJWKClient(JWKS_URL)

# SANITIZE SECRET: Clear quotes/spaces (Still needed for HS256/Service Role tokens)
SUPABASE_JWT_SECRET = (os.getenv("SUPABASE_JWT_SECRET") or "").strip("'\" ")
ALLOWED_ADMIN_EMAILS = os.getenv("ALLOWED_ADMIN_EMAILS", "").split(",")

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
            signing_key = jwks_client.get_signing_key_from_jwt(token)
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
        email = payload.get("email")
        if not email or email not in ALLOWED_ADMIN_EMAILS:
            print(f"ADMIN AUTH FAIL: {email} not in {ALLOWED_ADMIN_EMAILS}")
            raise HTTPException(
                status_code=403, 
                detail=f"Access denied. {email} is not an authorized admin."
            )
        return payload
    except Exception as e:
        print(f"JWT VALIDATION ERROR: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")

# Initialize the new services once
extractor = QuestionExctractor(api_key=OPENROUTER_KEY, model_name=MODEL_NAME)
parser = TextbookIngestor() 
recommender = QuestionRecommender(api_key=OPENROUTER_KEY, model_name=MODEL_NAME)
exam_generator = ExamGeneratorService(api_key=OPENROUTER_KEY, model_name=MODEL_NAME)

# Functions to provide these services to your routes
def get_question_extractor(): return extractor
def get_textbook_parser(): return parser
def get_question_recommender(): return recommender
def get_exam_generator(): return exam_generator
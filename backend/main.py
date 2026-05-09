import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routes import admin, student
from dependencies import setup_services

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensure the server binds to the port immediately, then warms up services in background."""
    print("INFO: FastAPI booting up. Port binding in progress...")
    # Trigger heavy AI setup in a background thread
    import threading
    threading.Thread(target=setup_services, daemon=True).start()
    yield
    print("INFO: FastAPI shutting down.")

app = FastAPI(title="AlphaLo Python API", lifespan=lifespan)

# Read allowed origins from environment variable (comma-separated list)
# Example: "https://your-app.vercel.app,http://localhost:5173"
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
allowed_origins = [o.strip() for o in raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "service": "AlphaLo Python API"}

app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(student.router, prefix="/api/student", tags=["Student"])
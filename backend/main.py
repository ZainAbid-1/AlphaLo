import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import admin, student

app = FastAPI(title="AlphaLo Python API")

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
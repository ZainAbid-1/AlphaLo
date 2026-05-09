import os
import sys
import time

# FORCE LOGS TO APPEAR IMMEDIATELY
def log(msg):
    print(msg, flush=True)

log("DEBUG: main.py is starting...")

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from contextlib import asynccontextmanager
    log("DEBUG: FastAPI imports successful")
except Exception as e:
    log(f"CRITICAL ERROR: Failed to import FastAPI: {e}")
    sys.exit(1)

try:
    log("DEBUG: Importing local modules...")
    from dependencies import setup_services
    from routes import admin, student
    log("DEBUG: Local module imports successful")
except Exception as e:
    log(f"CRITICAL ERROR: Failed to import local modules: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

@asynccontextmanager
async def lifespan(app: FastAPI):
    log("INFO: FastAPI booting up. Port binding in progress...")
    # Services are now lazy-loaded on demand in dependencies.py
    yield
    log("INFO: FastAPI shutting down.")

app = FastAPI(title="AlphaLo Python API", lifespan=lifespan)

# CORS Configuration
raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
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
    return {"status": "ok", "service": "AlphaLo Python API", "time": time.time()}

# Include Routers
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(student.router, prefix="/api/student", tags=["Student"])

log("DEBUG: main.py initialization complete. Starting Uvicorn...")
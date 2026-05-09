import os
import sys

# DEBUG: Catch errors early
print("DEBUG: main.py is starting...")
try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from contextlib import asynccontextmanager
    print("DEBUG: FastAPI imports successful")
except Exception as e:
    print(f"CRITICAL ERROR: Failed to import FastAPI: {e}")
    sys.exit(1)

try:
    from dependencies import setup_services
    from routes import admin, student
    print("DEBUG: Local module imports successful")
except Exception as e:
    print(f"CRITICAL ERROR: Failed to import local modules: {e}")
    # This will print the EXACT error (missing library, syntax error, etc.) in Render logs
    import traceback
    traceback.print_exc()
    sys.exit(1)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensure the server binds to the port immediately, then warms up services in background."""
    print("INFO: FastAPI booting up. Port binding in progress...")
    # Trigger heavy AI setup in a background thread
    try:
        import threading
        threading.Thread(target=setup_services, daemon=True).start()
    except Exception as e:
        print(f"ERROR: Background setup failed: {e}")
    yield
    print("INFO: FastAPI shutting down.")

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
    return {"status": "ok", "service": "AlphaLo Python API"}

# Include Routers
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(student.router, prefix="/api/student", tags=["Student"])

print("DEBUG: main.py initialization complete. Starting Uvicorn...")
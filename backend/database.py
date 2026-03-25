from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. 'sqlite:///./alphalo.db' tells Python to create a file named alphalo.db
SQLALCHEMY_DATABASE_URL = "sqlite:///./alphalo.db"

# 2. create_engine handles the connection. 
# check_same_thread=False is required for SQLite and FastAPI to work together.
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

# 3. SessionLocal is a factory for database sessions. 
# Each request to your API will use a 'session' to talk to the DB.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Base is the class that all your data models will inherit from.
Base = declarative_base()

# 5. This dependency is used in your routes to provide a DB connection.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
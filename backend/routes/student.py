from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import SyllabusTopic
from dependencies import get_book_service

router = APIRouter()

@router.get("/roadmap/{course_id}")
def get_roadmap(course_id: str, db: Session = Depends(get_db)):
    return db.query(SyllabusTopic).filter_by(course_id=course_id).all()
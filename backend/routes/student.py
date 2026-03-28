# backend/routes/student.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import SyllabusTopic, Performance, Question, ExamPattern, University, Course, Instructor

router = APIRouter()

@router.get("/universities")
def get_universities(db: Session = Depends(get_db)):
    universities = db.query(University).all()
    return [{"id": u.id, "name": u.name, "logo": u.name[0] if u.name else "U"} for u in universities]

@router.get("/courses/{university_id}")
def get_courses(university_id: str, db: Session = Depends(get_db)):
    courses = db.query(Course).filter_by(university_id=university_id).all()
    return [{"id": c.id, "universityId": c.university_id, "code": c.id.split("-")[1].upper() if "-" in c.id else "CS", "name": c.name} for c in courses]

@router.get("/instructors/{course_id}")
def get_instructors(course_id: str, db: Session = Depends(get_db)):
    instructors = db.query(Instructor).filter_by(course_id=course_id).all()
    return [{"id": i.id, "courseId": i.course_id, "name": i.name, "title": i.title, "avatar": i.avatar} for i in instructors]

@router.get("/roadmap/{course_id}")
def get_roadmap(course_id: str, db: Session = Depends(get_db)):
    # Fetch topics associated with the course_id
    topics = db.query(SyllabusTopic).filter_by(course_id=course_id).all()
    
    # Convert SQLAlchemy objects to a serializable dictionary format
    return [topic.__dict__ for topic in topics]

@router.get("/performance/{user_id}")
def get_performance(user_id: int, db: Session = Depends(get_db)):
    performance_records = db.query(Performance).filter_by(user_id=user_id).all()
    # Format to match frontend mockData structure: { "topic_id": { score, attempts } }
    result = {}
    for p in performance_records:
        result[p.topic_id] = {"score": p.score, "attempts": p.attempts}
    return result

@router.get("/correlation/{topic_id}")
def get_correlation(topic_id: str, db: Session = Depends(get_db)):
    patterns = db.query(ExamPattern).filter_by(topic_id=topic_id).all()
    return [p.__dict__ for p in patterns]

@router.post("/mockexam/start")
def start_mock_exam(db: Session = Depends(get_db)):
    # Return questions from DB to simulate exam generation
    questions = db.query(Question).limit(10).all()
    return [q.__dict__ for q in questions]

@router.post("/mockexam/submit")
def submit_mock_exam(db: Session = Depends(get_db)):
    # Placeholder for grading logic
    return {"status": "success", "message": "Exam submitted"}


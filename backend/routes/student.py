# backend/routes/student.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SyllabusTopic, Performance, Question, ExamPattern, University, Course, Instructor, PastPaper, DisplayExamRequest
from dependencies import get_exam_generator

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

@router.post("/displayexam")
def display_exam(request: DisplayExamRequest, db: Session = Depends(get_db)):
    past_paper = db.query(PastPaper).filter_by(course_id=request.course_id, instructor_id=request.instructor_id).first()
    if not past_paper:
        raise HTTPException(status_code=404, detail="Past paper not found for this course and instructor.")
    
    exam_generator = get_exam_generator()
    try:
        data = exam_generator.generate(past_paper.raw_content, request.generation_count)
        return data
    except Exception as e:
        print("Failed to generate/parse JSON:", e)
        raise HTTPException(status_code=500, detail="AI generation failed to produce valid JSON.")

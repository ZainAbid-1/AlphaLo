from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Course, Textbook, PastPaper, SyllabusTopic, University

# Import our new PDF processor and the Vector Service singleton
from services.pdf_processor import extract_text_from_pdf, extract_full_text
from dependencies import v_service 

router = APIRouter()

# --- 1. CURRICULUM SETUP ---
@router.post("/university")
def add_university(id: str, name: str, db: Session = Depends(get_db)):
    db.add(University(id=id, name=name))
    db.commit()
    return {"status": "University added"}

@router.post("/course")
def add_course(id: str, university_id: str, name: str, db: Session = Depends(get_db)):
    db.add(Course(id=id, university_id=university_id, name=name))
    db.commit()
    return {"status": "Course added"}

@router.post("/topic")
def add_topic(course_id: str, id: str, week: int, topic: str, db: Session = Depends(get_db)):
    db.add(SyllabusTopic(id=id, course_id=course_id, week_number=week, topic=topic))
    db.commit()
    return {"status": "Topic added"}

# --- 2. KNOWLEDGE BASE UPLOADS ---
@router.post("/upload-textbook/{course_id}")
async def upload_textbook(course_id: str, title: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDFs are supported right now.")

    file_bytes = await file.read()
    
    # 1. Extract text page by page
    pages_data = extract_text_from_pdf(file_bytes)
    if not pages_data:
        raise HTTPException(status_code=400, detail="Could not extract text. Is this a scanned image?")

    # 2. Save reference to SQLite DB
    db.add(Textbook(course_id=course_id, title=title, file_path=file.filename))
    db.commit()
    
    # 3. VECTORIZE AND SEND TO PINECONE CLOUD via Gemini
    # Note: Ensure your .env has GEMINI_API_KEY and PINECONE_API_KEY set
    try:
        chunks_indexed = v_service.index_textbook(book_title=title, pages=pages_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Vectorization failed: {str(e)}")
    
    return {"status": "Textbook uploaded & vectorized!", "pages_processed": chunks_indexed}

@router.post("/upload-past-paper/{course_id}")
async def upload_past_paper(course_id: str, title: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDFs are supported right now.")

    file_bytes = await file.read()
    
    # 1. Extract as one massive string blueprint
    full_text = extract_full_text(file_bytes)
    
    # 2. Save to DB as the AI's "Blueprint" for this course
    db.add(PastPaper(course_id=course_id, paper_title=title, raw_content=full_text))
    db.commit()
    
    return {"status": "Past Paper extracted and saved as AI Blueprint"}
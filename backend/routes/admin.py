# backend/routes/admin.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Course, Textbook, PastPaper, SyllabusTopic, University, Instructor
import os

# *** CORRECTED IMPORTS based on your file structure ***
from dependencies import get_textbook_parser, get_question_extractor # Import the new service providers
from services.textbook_parser import TextbookIngestor # Import the class itself for type hinting if needed

# Assuming you might use the extractor for past papers, and the parser for textbooks
# Note: We are NOT using v_service/vector_service anymore.

router = APIRouter()

# --- 1. CURRICULUM SETUP (These remain the same) ---
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

@router.post("/instructor")
def add_instructor(id: str, course_id: str, name: str, title: str, avatar: str, db: Session = Depends(get_db)):
    db.add(Instructor(id=id, course_id=course_id, name=name, title=title, avatar=avatar))
    db.commit()
    return {"status": "Instructor added"}

@router.post("/upload-textbook/{course_id}")
# *** FIX: Inject the parser directly into the function signature ***
async def upload_textbook(course_id: str, title: str, file: UploadFile = File(...), 
                          db: Session = Depends(get_db), 
                          parser: TextbookIngestor = Depends(get_textbook_parser)): # <-- MOVED DEPENDENCY HERE

    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDFs are supported right now.")

    file_bytes = await file.read()
    
    # Removed the line: parser: TextbookIngestor = Depends(get_textbook_parser()) 
    
    # 1. Save file temporarily so LangChain can read the path
    temp_file_path = f"backend/temp_uploads/{file.filename}"
    if not os.path.exists("backend/temp_uploads"):
        os.makedirs("backend/temp_uploads") 
        
    with open(temp_file_path, "wb") as buffer: 
        buffer.write(file_bytes)

    try:
        # 2. Use LangChain PDF Parser to load document
        data = parser.pdf_parser(temp_file_path)
        # 3. Chunk the data
        chunks = parser.data_chunking(data)
        # 4. Vectorize and upload to Pinecone
        vectors = parser.vectorization(chunks)
        
        db.add(Textbook(course_id=course_id, title=title, file_path=temp_file_path))
        db.commit()
        
        return {"status": "Textbook uploaded & vectorized!", "pages_processed": len(chunks)}
    except Exception as e:
        # Return a clearer error message from the exception
        raise HTTPException(status_code=500, detail=f"AI Vectorization failed: {str(e)}")
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


@router.post("/upload-past-paper/{course_id}")
# *** FIX: Inject the extractor directly into the function signature ***
async def upload_past_paper(course_id: str, title: str, file: UploadFile = File(...), 
                            db: Session = Depends(get_db),
                            extractor=Depends(get_question_extractor)): # Use a name like 'extractor'
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDFs are supported right now.")

    file_bytes = await file.read()
    
    temp_file_path = f"backend/temp_uploads/{file.filename}"
    if not os.path.exists("backend/temp_uploads"):
        os.makedirs("backend/temp_uploads")
        
    with open(temp_file_path, "wb") as buffer: 
        buffer.write(file_bytes)
        
    try:
        # Use the injected extractor service
        exam_text = extractor.exam_parser(temp_file_path)
        
        db.add(PastPaper(course_id=course_id, paper_title=title, raw_content=exam_text))
        db.commit()
        
        return {"status": "Past Paper extracted and saved as AI Blueprint"}
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
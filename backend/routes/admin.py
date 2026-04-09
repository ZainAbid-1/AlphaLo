# backend/routes/admin.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
import os

from dependencies import get_textbook_parser, get_question_extractor, get_admin_user
from services.textbook_parser import TextbookIngestor
from services.supabase_client import supabase  # <-- Supabase client

router = APIRouter(dependencies=[Depends(get_admin_user)])

@router.post("/university")
def add_university(id: str, name: str):
    supabase.table("universities").insert({"id": id, "name": name}).execute()
    return {"status": "University added"}

@router.post("/course")
def add_course(id: str, university_id: str, name: str):
    supabase.table("courses").insert({"id": id, "university_id": university_id, "name": name}).execute()
    return {"status": "Course added"}

@router.post("/topic")
def add_topic(course_id: str, id: str, week: int, topic: str):
    # Matches 'syllabus_topics' table
    supabase.table("syllabus_topics").insert({
        "id": id, 
        "course_id": course_id, 
        "week_number": week, 
        "topic": topic
    }).execute()
    return {"status": "Topic added"}

@router.post("/instructor")
def add_instructor(id: str, course_id: str, name: str, title: str, avatar: str):
    supabase.table("instructors").insert({
        "id": id, 
        "course_id": course_id, 
        "name": name, 
        "title": title, 
        "avatar": avatar
    }).execute()
    return {"status": "Instructor added"}

@router.post("/upload-textbook/{course_id}")
async def upload_textbook(course_id: str, title: str, instructor_id: str, file: UploadFile = File(...), 
                          parser: TextbookIngestor = Depends(get_textbook_parser)):

    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDFs are supported right now.")

    file_bytes = await file.read()
    temp_file_path = f"backend/temp_uploads/{file.filename}"
    os.makedirs("backend/temp_uploads", exist_ok=True) 
        
    with open(temp_file_path, "wb") as buffer: 
        buffer.write(file_bytes)

    try:
        data = parser.pdf_parser(temp_file_path)
        chunks = parser.data_chunking(data)
        vectors = parser.vectorization(chunks) # Pushes to Pinecone
        
        # Save reference to Supabase 'textbooks'
        supabase.table("textbooks").insert({
            "course_id": course_id, 
            "instructor_id": instructor_id, 
            "title": title, 
            "file_path": temp_file_path
        }).execute()
        
        return {"status": "Textbook uploaded & vectorized!", "pages_processed": len(chunks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Vectorization failed: {str(e)}")
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@router.post("/upload-past-paper/{course_id}")
async def upload_past_paper(course_id: str, title: str, instructor_id: str, file: UploadFile = File(...), 
                            extractor=Depends(get_question_extractor)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDFs are supported right now.")

    file_bytes = await file.read()
    temp_file_path = f"backend/temp_uploads/{file.filename}"
    os.makedirs("backend/temp_uploads", exist_ok=True)
        
    with open(temp_file_path, "wb") as buffer: 
        buffer.write(file_bytes)
        
    try:
        exam_text = extractor.exam_parser(temp_file_path)
        
        # Save raw paper to Supabase 'past_papers'
        supabase.table("past_papers").insert({
            "course_id": course_id, 
            "instructor_id": instructor_id, 
            "paper_title": title, 
            "raw_content": exam_text
        }).execute()
        
        return {"status": "Past Paper extracted and saved as AI Blueprint"}
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
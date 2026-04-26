# backend/routes/admin.py
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
import os

from dependencies import get_textbook_parser, get_question_extractor, get_admin_user, get_exam_generator
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

# --- BACKGROUND TASK FUNCTIONS ---

def process_textbook_task(temp_file_path: str, course_id: str, title: str, instructor_id: str, parser: TextbookIngestor):
    """Heavy AI lifting: Parses, chunks, and vectorizes textbook in background."""
    try:
        data = parser.pdf_parser(temp_file_path)
        chunks = parser.data_chunking(data)
        parser.vectorization(chunks) # Pushes to Pinecone
        
        # Save reference to Supabase 'textbooks'
        supabase.table("textbooks").insert({
            "course_id": course_id, 
            "instructor_id": instructor_id, 
            "title": title, 
            "file_path": temp_file_path # You might want to upload to S3/Supabase Storage later
        }).execute()
        print(f"✅ BACKGROUND SUCCESS: Textbook '{title}' processed and saved.")
    except Exception as e:
        print(f"❌ BACKGROUND ERROR: Failed to process textbook '{title}': {str(e)}")
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

async def process_past_paper_task(temp_file_path: str, course_id: str, title: str, instructor_id: str, extractor, paper_type: str, exam_generator):
    """Heavy AI lifting: Parses past paper and extracts blueprint in background."""
    try:
        exam_text = extractor.exam_parser(temp_file_path)
        
        # New: Extract blueprint on admin side to save time for students
        blueprint = await exam_generator.extract_blueprint(exam_text)
        
        # Save raw paper and structural blueprint to Supabase 'past_papers'
        supabase.table("past_papers").insert({
            "course_id": course_id, 
            "instructor_id": instructor_id, 
            "paper_title": title, 
            "raw_content": exam_text,
            "blueprint": blueprint, # JSON structure
            "paper_type": paper_type
        }).execute()
        print(f"✅ BACKGROUND SUCCESS: Past Paper '{title}' ({paper_type}) processed with blueprint.")
    except Exception as e:
        print(f"❌ BACKGROUND ERROR: Failed to process past paper '{title}': {str(e)}")
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@router.post("/upload-textbook/{course_id}")
async def upload_textbook(course_id: str, title: str, instructor_id: str, 
                          background_tasks: BackgroundTasks,
                          file: UploadFile = File(...), 
                          parser: TextbookIngestor = Depends(get_textbook_parser)):

    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDFs are supported right now.")

    file_bytes = await file.read()
    temp_file_path = f"backend/temp_uploads/{file.filename}"
    os.makedirs("backend/temp_uploads", exist_ok=True) 
        
    with open(temp_file_path, "wb") as buffer: 
        buffer.write(file_bytes)

    # Offload processing to background
    background_tasks.add_task(process_textbook_task, temp_file_path, course_id, title, instructor_id, parser)
    
    return {
        "status": "Accepted", 
        "message": f"Textbook '{title}' upload received. Processing in the background. Check logs for completion."
    }

@router.post("/upload-past-paper/{course_id}")
async def upload_past_paper(course_id: str, title: str, instructor_id: str, 
                            paper_type: str,
                            background_tasks: BackgroundTasks,
                            file: UploadFile = File(...), 
                            extractor=Depends(get_question_extractor),
                            exam_generator=Depends(get_exam_generator)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDFs are supported right now.")

    file_bytes = await file.read()
    temp_file_path = f"backend/temp_uploads/{file.filename}"
    os.makedirs("backend/temp_uploads", exist_ok=True)
        
    with open(temp_file_path, "wb") as buffer: 
        buffer.write(file_bytes)
        
    # Offload processing to background
    background_tasks.add_task(process_past_paper_task, temp_file_path, course_id, title, instructor_id, extractor, paper_type, exam_generator)

    return {
        "status": "Accepted", 
        "message": f"Past paper '{title}' ({paper_type}) upload received. Extracting blueprint in the background."
    }
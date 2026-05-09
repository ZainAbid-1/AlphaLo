from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
import os
from datetime import datetime, timezone
from services.mongo_client import db
from services.textbook_parser import TextbookIngestor
from dependencies import get_textbook_parser, get_question_extractor, get_admin_user, get_exam_generator

router = APIRouter(dependencies=[Depends(get_admin_user)])

# --- BACKGROUND TASK FUNCTIONS (The heavy lifting) ---

async def process_textbook_task(temp_file_path: str, course_id: str, title: str, instructor_id: str, parser: TextbookIngestor):
    """Parses, chunks, and vectorizes textbook, then saves metadata to MongoDB."""
    try:
        # 1. AI Logic: PDF -> Text -> Chunks -> Pinecone
        data = parser.pdf_parser(temp_file_path)
        chunks = parser.data_chunking(data)
        parser.vectorization(chunks) 
        
        # 2. Database Logic: Save record to MongoDB
        await db.textbooks.insert_one({
            "course_id": course_id,
            "instructor_id": instructor_id,
            "title": title,
            "source": temp_file_path,   # Pinecone metadata key — needed for cleanup
            "chunks_count": len(chunks),
            "processed_at": datetime.now(timezone.utc)
        })
        print(f"SUCCESS: Textbook '{title}' indexed in Pinecone and recorded in MongoDB.")
    except Exception as e:
        print(f"ERROR: Failed to process textbook '{title}': {str(e)}")
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

async def process_past_paper_task(temp_file_path: str, course_id: str, title: str, instructor_id: str, paper_type: str, extractor, generator):
    """Parses past paper into a string blueprint and saves to MongoDB."""
    try:
        # 1. AI Logic: Extract full text from PDF
        exam_text = extractor.exam_parser(temp_file_path)
        
        # 2. AI Logic: Structure the text into a blueprint (Questions, Options, Sub-questions)
        print(f"DEBUG: Extracting structured blueprint for '{title}'...")
        blueprint = await generator.extract_blueprint(exam_text)

        # 3. Database Logic: Save the blueprint and raw content to MongoDB
        await db.past_papers.insert_one({
            "course_id": course_id,
            "instructor_id": instructor_id,
            "paper_title": title,
            "raw_content": exam_text,
            "blueprint": blueprint,
            "paper_type": paper_type,
            "created_at": datetime.now(timezone.utc)
        })
        print(f"SUCCESS: Past Paper '{title}' saved with structured AI Blueprint in MongoDB.")
    except Exception as e:
        print(f"ERROR: Failed to process past paper '{title}': {str(e)}")
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)


# --- API ENDPOINTS ---

@router.post("/upload-textbook/{course_id}")
async def upload_textbook(
    course_id: str, 
    title: str, 
    instructor_id: str, 
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    parser: TextbookIngestor = Depends(get_textbook_parser)
):
    filename = file.filename or ""
    if not filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Save the file temporarily for the parser to read
    os.makedirs("temp_uploads", exist_ok=True)
    temp_file_path = f"temp_uploads/{file.filename}"
    
    with open(temp_file_path, "wb") as buffer:
        buffer.write(await file.read())

    # Hand off the heavy work to a background thread
    background_tasks.add_task(process_textbook_task, temp_file_path, course_id, title, instructor_id, parser)
    
    return {
        "status": "Accepted", 
        "message": f"Textbook '{title}' upload received. AI processing started in the background."
    }

@router.post("/upload-past-paper/{course_id}")
async def upload_past_paper(
    course_id: str, 
    title: str, 
    instructor_id: str, 
    paper_type: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    extractor = Depends(get_question_extractor),
    generator = Depends(get_exam_generator)
):
    filename = file.filename or ""
    if not filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Save the file temporarily
    os.makedirs("temp_uploads", exist_ok=True)
    temp_file_path = f"temp_uploads/{file.filename}"
    
    with open(temp_file_path, "wb") as buffer:
        buffer.write(await file.read())

    # Hand off the heavy work to a background thread
    background_tasks.add_task(process_past_paper_task, temp_file_path, course_id, title, instructor_id, paper_type, extractor, generator)

    return {
        "status": "Accepted", 
        "message": f"Past paper '{title}' upload received. Extraction started in the background."
    }
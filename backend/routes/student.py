# backend/routes/student.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from dependencies import get_exam_generator
from services.supabase_client import supabase  # <-- Supabase client
from dependencies import get_question_recommender, get_question_extractor

router = APIRouter()

class DisplayExamRequest(BaseModel):
    course_id: str
    instructor_id: str
    generation_count: int
    paper_type: str

@router.post("/displayexam")
async def display_exam(request: DisplayExamRequest):
    res = supabase.table("past_papers").select("*") \
        .eq("course_id", request.course_id) \
        .eq("instructor_id", request.instructor_id) \
        .eq("paper_type", request.paper_type).execute()
        
    if not res.data:
        raise HTTPException(status_code=404, detail="Past paper not found for this course and instructor.")
    
    past_paper = res.data[0] 
    exam_generator = get_exam_generator()
    
    # Build a unique cache key so the blueprint is reused across generations
    cache_key = f"{request.course_id}:{request.instructor_id}:{request.paper_type}"
    
    try:
        # Optimization: Use pre-stored blueprint if available
        if past_paper.get("blueprint"):
            print(f"DEBUG: Using pre-stored blueprint for {request.course_id}")
            data = await exam_generator.generate_from_blueprint(past_paper["blueprint"])
        else:
            # Fallback for legacy papers without a blueprint column/value
            print(f"DEBUG: Fallback to full extraction for {request.course_id}")
            data = await exam_generator.generate(past_paper["raw_content"], request.generation_count, cache_key)
        return data
    except Exception as e:
        print("Failed to generate/parse JSON:", e)
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")
    
@router.get("/book-patterns/{course_id}/{topic_name}")
async def get_book_patterns(
    course_id: str, 
    topic_name: str, 
    extractor = Depends(get_question_extractor),
    recommender = Depends(get_question_recommender)
):
    # 1. FETCH the Instructor's Past Paper text from Supabase
    res = supabase.table("past_papers").select("raw_content") \
        .eq("course_id", course_id).execute()
    
    if not res.data:
        # FALLBACK: If no paper is uploaded, just search the topic name
        patterns_to_search = [topic_name]
    else:
        # 2. AI EXTRACTION: Find instructor-specific questions about this topic
        full_paper_text = res.data[0]["raw_content"]
        
        # We use Gemini to pull only the 'Introduction' questions from the messy paper
        patterns_to_search = extractor.get_questions(full_paper_text, topic_name)

    # 3. SEARCH THE BOOK: Use those specific instructor questions to find book matches
    recommendations = recommender.get_book_recommendations(patterns_to_search)
    
    return recommendations
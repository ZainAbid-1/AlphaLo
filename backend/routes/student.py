# backend/routes/student.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from dependencies import get_exam_generator
from services.supabase_client import supabase  # <-- Supabase client
from dependencies import get_question_recommender

router = APIRouter()

class DisplayExamRequest(BaseModel):
    course_id: str
    instructor_id: str
    generation_count: int
    paper_type: str

@router.get("/universities")
def get_universities():
    res = supabase.table("universities").select("*").execute()
    return [{"id": u["id"], "name": u["name"], "logo": u["name"][0] if u["name"] else "U"} for u in res.data]

@router.get("/courses/{university_id}")
def get_courses(university_id: str):
    res = supabase.table("courses").select("*").eq("university_id", university_id).execute()
    return [{"id": c["id"], "universityId": c["university_id"], "code": c["id"].split("-")[1].upper() if "-" in c["id"] else "CS", "name": c["name"]} for c in res.data]

@router.get("/instructors/{course_id}")
def get_instructors(course_id: str):
    res = supabase.table("instructors").select("*").eq("course_id", course_id).execute()
    return [{"id": i["id"], "courseId": i["course_id"], "name": i["name"], "title": i["title"], "avatar": i["avatar"]} for i in res.data]

@router.get("/roadmap/{course_id}")
def get_roadmap(course_id: str):
    res = supabase.table("syllabus_topics").select("*").eq("course_id", course_id).execute()
    
    # Map database columns back to what the React frontend expects
    return [{
        "id": t["id"],
        "course_id": t["course_id"],
        "week_number": t["week_number"],
        "phase": f"Week {t['week_number']}",       # Frontend uses 'phase'
        "topic": t["topic"],
        "aiPattern": t["ai_pattern_summary"],      # Frontend expects 'aiPattern' 
        "ai_pattern_summary": t["ai_pattern_summary"],
        "complexity": t["complexity"]
    } for t in res.data]


@router.get("/correlation/{topic_id}")
def get_correlation(topic_id: str):
    res = supabase.table("exam_patterns").select("*").eq("topic_id", topic_id).execute()
    return res.data

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
    
@router.get("/book-patterns/{topic}")
async def get_book_patterns(
    topic: str, 
    recommender = Depends(get_question_recommender)
):
    """
    Triggers the AI to search the textbook for questions matching the topic.
    """
    try:
        # We wrap the topic in a list because your QuestionRecommender expects a list
        results = recommender.get_book_recommendations([topic])
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
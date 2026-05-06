from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from dependencies import get_exam_generator
from dependencies import get_question_recommender, get_question_extractor
from services.mongo_client import db

router = APIRouter()

class DisplayExamRequest(BaseModel):
    course_id: str
    instructor_id: str
    generation_count: int
    paper_type: str

@router.post("/displayexam")
async def display_exam(request: DisplayExamRequest):
    # 1. Fetch blueprint from MongoDB
    past_paper = await db.past_papers.find_one({
        "course_id": request.course_id,
        "instructor_id": request.instructor_id,
        "paper_type": request.paper_type
    })
        
    if not past_paper:
        raise HTTPException(status_code=404, detail="Paper not found in MongoDB.")
    
    # 2. Trigger AI Generation
    exam_generator = get_exam_generator()
    cache_key = f"{request.course_id}:{request.instructor_id}:{request.paper_type}"
    data = await exam_generator.generate(past_paper["raw_content"], request.generation_count, cache_key)
    return data

@router.get("/book-patterns/{course_id}/{topic_name}")
async def get_book_patterns(course_id: str, topic_name: str, extractor = Depends(get_question_extractor), recommender = Depends(get_question_recommender)):
    # 1. Fetch blueprint from MongoDB
    paper = await db.past_papers.find_one({"course_id": course_id})
    
    if not paper:
        search_queries = [topic_name]
    else:
        # 2. Extract specific topic questions
        search_queries = extractor.get_specific_topic_questions(paper["raw_content"], topic_name)

    # 3. Match to Pinecone
    recommendations = recommender.get_book_recommendations(search_queries)
    return recommendations
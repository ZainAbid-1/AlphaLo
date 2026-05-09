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
    force_refresh: bool = False

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
    
    # 2. Trigger AI Generation (blueprint is Redis-cached unless force_refresh=True)
    exam_generator = get_exam_generator()
    data = await exam_generator.generate(
        past_paper["raw_content"], 
        request.generation_count, 
        force_refresh=request.force_refresh
    )
    return data

@router.get("/book-patterns/{course_id}/{topic_name}")
async def get_book_patterns(
    course_id: str,
    topic_name: str,
    extractor = Depends(get_question_extractor),
    recommender = Depends(get_question_recommender),
):
    # 1. Fetch past paper from MongoDB (may not exist)
    paper = await db.past_papers.find_one({"course_id": course_id})

    if not paper:
        # No past paper — still provide concept-driven recommendations
        # by expanding the topic into sub-concepts and using them as seeds.
        print(f"INFO: No past paper for course {course_id}. Using concept expansion only.")
        concepts = await extractor.expand_topic_concepts(topic_name)
        questions = []   # recommender will synthesise seeds from concepts
    else:
        # 2. Extract topic-specific questions + expand concepts (parallel inside)
        result = await extractor.get_questions(paper["raw_content"], topic_name)
        questions = result.get("questions", [])
        concepts  = result.get("concepts", [])
        print(f"INFO: Extracted {len(questions)} question(s), {len(concepts)} concept(s) for '{topic_name}'")

    # 3. Match to Pinecone + LLM in parallel, now with richer multi-query search
    recommendations = await recommender.get_book_recommendations(
        questions,
        topic_concepts=concepts,
    )
    return recommendations

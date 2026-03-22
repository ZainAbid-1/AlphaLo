from .vector_service import VectorService
from .ai_engine import AIEngine

class BookService:
    def __init__(self, vector_service: VectorService, ai_engine: AIEngine):
        self.vector_service = vector_service
        self.ai_engine = ai_engine

    def correlate_paper_to_book(self, exam_pattern: str):
        # Call Pinecone via the Vector Service
        search_results = self.vector_service.query_textbook(exam_pattern)
        
        # Extract data from Pinecone's specific format
        # matches[x].metadata contains the text and page numbers we saved
        context_parts = []
        pages = []
        
        for match in search_results['matches']:
            context_parts.append(match['metadata']['text'])
            pages.append(match['metadata']['page_no'])
            
        full_context = " ".join(context_parts)
        
        # Use AI to find the exercises on those pages
        extracted_questions = self.ai_engine.extract_relevant_questions(
            pattern=exam_pattern, 
            book_text=full_context
        )
        
        return {
            "exam_topic": exam_pattern,
            "textbook_pages": sorted(list(set(pages))),
            "suggested_exercises": extracted_questions
        }
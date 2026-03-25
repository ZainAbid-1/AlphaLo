from google import genai
from google.genai import types
from pinecone import Pinecone
import uuid
from typing import List, Dict, Any

class VectorService:
    def __init__(self, gemini_api_key: str, pinecone_api_key: str):
        # Setup New Google GenAI Client
        self.ai_client = genai.Client(api_key=gemini_api_key)
        self.embedding_model = "text-embedding-004"
        
        # Setup New Pinecone Client
        self.pc = Pinecone(api_key=pinecone_api_key)
        self.index_name = "txtbook-index"
        self.index = self.pc.Index(self.index_name)

    def index_textbook(self, book_title: str, pages: List[Dict[str, Any]]):
        to_upsert =[]
        
        for p in pages:
            # Generate the vector using the NEW Gemini syntax
            resp = self.ai_client.models.embed_content(
                model=self.embedding_model,
                contents=p['content'],
                config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
            )
            vector = resp.embeddings[0].values
            
            to_upsert.append({
                "id": str(uuid.uuid4()),
                "values": vector,
                "metadata": {
                    "page_no": p['page_no'],
                    "book": book_title,
                    "text": p['content'] 
                }
            })

        self.index.upsert(vectors=to_upsert)
        return len(to_upsert)

    def query_textbook(self, paper_pattern: str):
        """
        Search the Pinecone Cloud for similar patterns.
        """
        # Convert search pattern to vector
        pattern = genai.embed_content(
            model=self.embedding_model,
            contents=paper_pattern,
            config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY")
        )
        pattern_vector = pattern['embedding']

        results = self.index.query(
            vector=pattern_vector,
            top_k=5,
            include_metadata=True
        )
        return results
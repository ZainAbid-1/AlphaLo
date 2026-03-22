import google.generativeai as genai
from pinecone import Pinecone, ServerlessSpec
import uuid
from typing import List, Dict, Any

class VectorService:
    def __init__(self, gemini_api_key: str, pinecone_api_key: str):
        # Setup Gemini
        genai.configure(api_key=gemini_api_key)
        self.embedding_model = "models/text-embedding-004"
        
        # Setup Pinecone
        self.pc = Pinecone(api_key=pinecone_api_key)
        self.index_name = "txtbook-index"
        self.index = self.pc.Index(self.index_name)

    def index_textbook(self, book_title: str, pages: List[Dict[str, Any]]):
        """
        Takes textbook pages and Upserts them to Pinecone.
        'Upsert' = Update if exists, Insert if new.
        """
        to_upsert = []
        
        # We process pages to get embeddings
        for p in pages:
            # Generate the vector using Gemini
            resp = genai.embed_content(
                model=self.embedding_model,
                content=p['content'],
                task_type="RETRIEVAL_DOCUMENT"
            )
            vector = resp['embedding']
            
            # Prepare the Pinecone packet
            # Pinecone requires (ID, Vector, Metadata)
            to_upsert.append({
                "id": str(uuid.uuid4()),
                "values": vector,
                "metadata": {
                    "page_no": p['page_no'],
                    "book": book_title,
                    "text": p['content'] # We store the text in metadata so we can read it later
                }
            })

        # Push to the cloud in batches
        self.index.upsert(vectors=to_upsert)
        return len(to_upsert)

    def query_textbook(self, paper_pattern: str):
        """
        Search the Pinecone Cloud for similar patterns.
        """
        # Convert search pattern to vector
        query = genai.embed_content(
            model=self.embedding_model,
            content=paper_pattern,
            task_type="RETRIEVAL_QUERY"
        )
        query_vector = query['embedding']

        # include_metadata=True so we can get the text and page numbers back
        results = self.index.query(
            vector=query_vector,
            top_k=3,
            include_metadata=True
        )
        return results
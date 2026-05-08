# from langchain_google_genai import GoogleGenerativeAIEmbeddings # pyright: ignore[reportMissingImports]
from langchain_pinecone import PineconeVectorStore # pyright: ignore[reportMissingImports]
from langchain_community.document_loaders import PyMuPDFLoader # pyright: ignore[reportMissingImports]
from langchain_text_splitters import RecursiveCharacterTextSplitter # pyright: ignore[reportMissingImports]
from langchain_huggingface import HuggingFaceEmbeddings
import logging

logging.getLogger("pypdf").setLevel(logging.ERROR)
class TextbookIngestor:
    def __init__(self):
        # initialize the models
       self.embedding_model = HuggingFaceEmbeddings(
            model_name="sentence-transformers/multi-qa-distilbert-cos-v1"
        )


    def pdf_parser(self, file_path):
        import fitz
        import re
        from langchain_core.documents import Document

        print(f"Loading PDF... (This may take a minute for large files)")
        doc = fitz.open(file_path)
        documents = []
        
        for i in range(len(doc)):
            page = doc[i]
            # 1. Extract full text for content
            full_text_raw = page.get_text()
            full_text = full_text_raw if isinstance(full_text_raw, str) else ""
            
            # 2. Extract header text for real page number
            # Use top 10% of page for header
            header_rect = fitz.Rect(0, 0, page.rect.width, page.rect.height * 0.1)
            header_text_raw = page.get_text("text", clip=header_rect)
            header_text = header_text_raw.strip() if isinstance(header_text_raw, str) else ""
            
            # Look for a numeric page number in the header
            # Ignore numbers preceded by 'Chapter' or 'Section' to avoid false positives
            clean_header = re.sub(r'(?i)(Chapter|Section|Unit)\s+\d+', '', header_text)
            page_match = re.search(r'\b(\d+)\b', clean_header)
            real_page = page_match.group(1) if page_match else str(i + 1)
            
            documents.append(Document(
                page_content=full_text,
                metadata={
                    "source": file_path,
                    "page": i,
                    "page_label": real_page
                }
            ))
            
        print(f"Loaded {len(documents)} pages from PDF with extracted page labels.")
        return documents

    def data_chunking(self, data):
        print("Chunking text...")
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(data)
        print(f"Created {len(chunks)} chunks.")
        return chunks

    def vectorization(self, chunks):
        print(f"Starting embedding & Pinecone upload for {len(chunks)} chunks...")
        
        batch_size = 200
        total_batches = (len(chunks) + batch_size - 1) // batch_size
        vectors = None
        
        for i, start_idx in enumerate(range(0, len(chunks), batch_size)):
            batch = chunks[start_idx:start_idx + batch_size]
            print(f"Uploading batch {i + 1}/{total_batches}...")
            
            if vectors is None:
                # ADDED: text_key="text"
                vectors = PineconeVectorStore.from_documents(
                    batch,
                    self.embedding_model,
                    index_name="alphalo-index",
                    text_key="text" 
                )
            else:
                # This also uses the text_key defined above
                vectors.add_documents(batch)
                
        print("Vectorization complete!")
        return vectors

    def delete_book(self, filename: str):
        """Deletes all chunks belonging to a specific file from Pinecone."""
        print(f"Deleting all records for source: {filename}...")
        vector_store = PineconeVectorStore(
            index_name="alphalo-index",
            embedding=self.embedding_model,
            text_key="text"
        )
        # Pinecone allows deleting by metadata filter
        vector_store.delete(filter={"source": {"$eq": filename}})
        print("Deletion complete!")
    

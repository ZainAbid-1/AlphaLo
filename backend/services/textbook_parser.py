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
        print(f"Loading PDF... (This may take a minute for large files)")
        data = PyMuPDFLoader(file_path).load()
        print(f"Loaded {len(data)} pages from PDF.")
        return data

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
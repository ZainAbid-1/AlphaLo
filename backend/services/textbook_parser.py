from langchain_google_genai import GoogleGenerativeAIEmbeddings # pyright: ignore[reportMissingImports]
from langchain_pinecone import PineconeVectorStore # pyright: ignore[reportMissingImports]
from langchain_community.document_loaders import PyPDFLoader # pyright: ignore[reportMissingImports]
from langchain_text_splitters import RecursiveCharacterTextSplitter # pyright: ignore[reportMissingImports]

class TextbookIngestor:
    def __init__(self):
        # initialize the models
        self.embedding_model = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")

    def pdf_parser(self, file_path):
        # textbook pdf converted to string
        data = PyPDFLoader(file_path).load()
        return data

    def data_chunking(self, data):
        # Chunking: Split the large string into chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(data)
        return chunks

    def vectorization(self, chunks):
        # This one line handles: Embedding + ID generation + Metadata + Upload
        vectors = PineconeVectorStore.from_documents(
            chunks,
            self.embedding_model,
            index_name="txtbook-index"
        )
        return vectors
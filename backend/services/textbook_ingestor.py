from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI # pyright: ignore[reportMissingImports]
from langchain_pinecone import PineconeVectorStore # pyright: ignore[reportMissingImports]
from langchain_community.document_loaders import PyPDFLoader # pyright: ignore[reportMissingImports]
from langchain_text_splitters import RecursiveCharacterTextSplitter # pyright: ignore[reportMissingImports]

# initialize the models
embedding_model = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")

def textbook_parser(file_path):
    # textbook pdf converted to string
    data = PyPDFLoader(file_path).load()
    return data

def data_chunking(data):
    # Chunking: Split the large string into chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_documents(data)
    return chunks

def vectorization(chunks):
    # This one line handles: Embedding + ID generation + Metadata + Upload
    vectors = PineconeVectorStore.from_documents(
        chunks,
        embedding_model,
        index_name="txtbook-index"
    )
    return vectors
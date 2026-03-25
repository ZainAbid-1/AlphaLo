from langchain.chains import RetrievalQA # pyright: ignore[reportMissingImports]
from langchain_pinecone import PineconeVectorStore # pyright: ignore[reportMissingImports]
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI # pyright: ignore[reportMissingImports]

# Setup the models
embedding_model = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")

def get_book_recommendations(exam_pattern):
    
    # Connect to the existing Pinecone index
    textbook_searcher = PineconeVectorStore(index_name="txtbook-index", embedding=embedding_model)

    # Setup the Chain
    qa_chain = RetrievalQA.from_chain_type(
        llm = llm, # the LLM we will be using
        stuff = "Stuff", # 'Stuff' acts as .join, it stuffs all the Top k similar chunks together
        retriever = textbook_searcher.as_retriever() # sets pinecone as the platform to retrieve
    )

    # This single line converts 'exam_pattern' to vector, searches 'k' most similar vectors from pinecone,
    # automatically create a prompt and send it to Gemini 2.5 Flash.
    response = qa_chain.invoke(f"Based on the textbook, find exercises related to: {exam_pattern}.")

    # returns result dictionary from response object
    return response['result']
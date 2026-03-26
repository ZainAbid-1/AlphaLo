from langchain.chains import RetrievalQA # pyright: ignore[reportMissingImports]
from langchain_pinecone import PineconeVectorStore # pyright: ignore[reportMissingImports]
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI # pyright: ignore[reportMissingImports]

class QuestionRecommender:
    def __init__(self, api_key: str):   
        # Setup the models
        self.embedding_model = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", api_key=api_key)

    def get_book_recommendations(self, exam_questions):
        
        # Connect to the existing Pinecone index
        # alling PineconeVectorStore automatically goes into the code's .env file and looks for API key
        # with a name exactly as "PINECONE_API_KEY" and then look for index name provided.
        textbook_searcher = PineconeVectorStore(index_name="txtbook-index", embedding=self.embedding_model)

        # Setup the Chain
        qa_chain = RetrievalQA.from_chain_type(
            llm = self.llm, # the LLM we will be using
            chain_type = "stuff", # 'stuff' acts as .join, it stuffs all the Top k similar chunks together
            retriever = textbook_searcher.as_retriever() # sets pinecone as the platform to retrieve
        )
        
        all_recommendations = []

        # This single line converts 'exam_question' to vector, searches 'k' most similar vectors from pinecone,
        # automatically create a prompt and send it to Gemini 2.5 Flash.
        for question in exam_questions:
            response = qa_chain.invoke(f"Based on the textbook, find exercises related to: {question}.")
            all_recommendations.append({
                "original_question": question,
                "recommendation": response['result']
            })

        # returns the original past paper question along with the recommended questions from textbook.
        return all_recommendations
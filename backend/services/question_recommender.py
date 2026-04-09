from langchain_classic.chains import RetrievalQA
from langchain_pinecone import PineconeVectorStore
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI

class QuestionRecommender:
    def __init__(self, api_key: str, model_name: str):   
        # Setup the models
        self.embedding_model = HuggingFaceEmbeddings(
            model_name="sentence-transformers/multi-qa-distilbert-cos-v1"
        )
        self.llm = ChatOpenAI(
            model=model_name,
            openai_api_key=api_key,
            openai_api_base="https://openrouter.ai/api/v1"
        )

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
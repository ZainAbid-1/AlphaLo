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
        )

    def get_book_recommendations(self, exam_questions):
        
        # Connect to the existing Pinecone index
        # alling PineconeVectorStore automatically goes into the code's .env file and looks for API key
        # with a name exactly as "PINECONE_API_KEY" and then look for index name provided.
        textbook_searcher = PineconeVectorStore(index_name="alphalo-index", embedding=self.embedding_model, text_key='text')

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
            # We make the prompt much more specific here:
            prompt = f"""
            Topic from Exam: {question}
            
            Task: 
            1. Look at the textbook chunks provided. 
            2. Identify the most relevant 'Practice Exercise', 'Review Question', or 'Problem'.
            3. Provide the ACTUAL TEXT of the question so the student can solve it here.
            4. Mention the Page Number if it is available in the context.
            
            If no specific exercise is found, summarize the most important concept from these pages.
            """
            
            response = qa_chain.invoke(prompt)
            all_recommendations.append({
                "original_question": question,
                "recommendation": response['result']
            })
        # returns the original past paper question along with the recommended questions from textbook.
        return all_recommendations
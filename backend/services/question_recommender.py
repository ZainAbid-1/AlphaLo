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
        # Connect to index
        textbook_searcher = PineconeVectorStore(
            index_name="alphalo-index", 
            embedding=self.embedding_model,
            text_key="text" # Ensures AI reads the actual sentences
        )

        # Setup the Chain
        qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff", 
            retriever=textbook_searcher.as_retriever(search_kwargs={"k": 15}) # Increased k for better recall
        )
        
        all_recommendations = []

        for question in exam_questions:
            instruction = f"""
            The instructor's exam question is: "{question}"
            
            TASK:
            You are an Exercise Scavenger. Your ONLY goal is to find the most similar 
            ACTUAL textbook question from the provided context.

            1. Scan the text for specific markers like "Exercise X.X", "Check Point X.X", 
               "Programming Exercise", or "Review Question".
            2. If you find a matching question, provide the Heading and the ACTUAL TEXT of the question.
            3. If you see multiple, pick the one that matches the DIFFICULTY of the exam pattern.
            4. If no literal question is found in these 15 chunks, take the most important 
               theoretical "Self-Test" point from the text and phrase it as a question.
            5. Always include the Page Number.

            OUTPUT FORMAT:
            📖 BOOK EXERCISE: [Exercise ID]
            📝 QUESTION TEXT: [The full text]
            📍 LOCATION: Page [Number]
            """
            
            response = qa_chain.invoke(instruction)
            all_recommendations.append({
                "original_question": question,
                "recommendation": response['result']
            })

        return all_recommendations
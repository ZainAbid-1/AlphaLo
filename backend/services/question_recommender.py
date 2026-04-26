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
            retriever=textbook_searcher.as_retriever(search_kwargs={"k": 7}) # Increased k for better recall
        )
        
        all_recommendations = []

        for question in exam_questions:
            # We change the instruction to be more flexible and helpful
            instruction = f"""
            The instructor's exam pattern is: "{question}"
            
            Task based on the retrieved textbook context:
            1. Look for a specific 'Practice Problem', 'Check Point', or 'Exercise' that matches this pattern.
            2. If found, provide the Exercise ID and the full text of the question.
            3. If NO specific exercise is found, do NOT say 'I don't know'. Instead, use the 
               textbook theory to explain the core concept and suggest a 'Self-Study Task' 
               for the student to master this topic.
            4. Always include the Page Number if it is mentioned in the text.
            """
            
            response = qa_chain.invoke(instruction)
            all_recommendations.append({
                "original_question": question,
                "recommendation": response['result']
            })

        return all_recommendations
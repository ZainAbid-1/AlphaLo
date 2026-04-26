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
            instruction = f"""
            Exam Topic: "{question}"
            
            Task:
            1. Search the textbook context for a matching 'Check Point', 'Exercise', or 'Problem'.
            2. If found, provide it under the heading: "📖 MATCHING EXERCISE".
            3. If no literal exercise is found, create a specific practice task based on the theory under the heading: "🛠️ MASTERY CHALLENGE".
            4. Provide a 2-sentence summary of the core concept under: "💡 KEY CONCEPT".
            5. State the Page Number if visible.

            CRITICAL RULES:
            - DO NOT start with "I don't see an exercise" or "The context doesn't contain". 
            - Use CLEAR HEADINGS.
            - Be concise. No fluff.
            """
            
            response = qa_chain.invoke(instruction)
            all_recommendations.append({
                "original_question": question,
                "recommendation": response['result']
            })

        return all_recommendations
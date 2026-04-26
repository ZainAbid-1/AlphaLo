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
            retriever=textbook_searcher.as_retriever(search_kwargs={"k": 12}) # Higher k for better recall
        )
        
        all_recommendations = []

        for question in exam_questions:
            instruction = f"""
            Exam Context: "{question}"
            
            Task:
            1. Scour the textbook context for a matching 'Check Point', 'Exercise', 'Review Question', or 'Programming Problem' that aligns with the exam context.
            2. If you find a direct or highly similar exercise, reproduce it exactly under: "**📖 MATCHING EXERCISE**".
            3. CRITICAL: State the Page Number. If not explicitly found, state "Page: [Refer to topic section]".
            4. If no literal exercise exists, design a tailored practice task under: "**🛠️ MASTERY CHALLENGE**".
            5. Summarize the core theoretical takeaway under: "**💡 KEY CONCEPT**".
            
            FORMATTING RULES:
            - Use professional Markdown.
            - Use **single backticks** (`like this`) for keywords, class names, or single-line constants.
            - Use **triple backticks** (```java ... ```) ONLY for multi-line code blocks or complete programs.
            - DO NOT box single words in triple backticks.
            - Ensure headings are bold.
            - Be concise but thorough.
            """
            
            response = qa_chain.invoke(instruction)
            all_recommendations.append({
                "original_question": question,
                "recommendation": response['result']
            })

        return all_recommendations
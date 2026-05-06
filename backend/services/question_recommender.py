from langchain_classic.chains import RetrievalQA
from langchain_pinecone import PineconeVectorStore
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
import os

class QuestionRecommender:
    def __init__(self, llm=None, api_key: str = None, model_name: str = None):   
        # Setup the models
        self.embedding_model = HuggingFaceEmbeddings(
            model_name="sentence-transformers/multi-qa-distilbert-cos-v1"
        )
        if llm:
            self.llm = llm
        else:
            provider = os.getenv("AI_PROVIDER", "openai").lower()
            if provider == "groq":
                self.llm = ChatGroq(
                    model=model_name or os.getenv("GROQ_MODEL_NAME"),
                    groq_api_key=api_key or os.getenv("GROQ_API_KEY"),
                )
            else:
                self.llm = ChatOpenAI(
                    model=model_name or os.getenv("OPENAI_MODEL_NAME"),
                    openai_api_key=api_key or os.getenv("OPENAI_API_KEY"),
                )

    def get_book_recommendations(self, exam_questions):
        # Connect to index
        vector_store = PineconeVectorStore(
            index_name="alphalo-index", 
            embedding=self.embedding_model,
            text_key="text" 
        )

        all_recommendations = []

        for q_item in exam_questions:
            # Handle both old string format and new dict format
            if isinstance(q_item, dict):
                q_text = q_item.get('text', '')
                q_options = " ".join(q_item.get('options', []))
                full_q_context = f"{q_text} {q_options}"
            else:
                full_q_context = q_item
                q_item = {"text": q_item, "options": []}

            # UNIVERSAL ACT: Create a subject-agnostic, exercise-biased search query
            search_query = f"{full_q_context} worked example practice problem exercise review question self-test chapter end"
            
            # Retrieve the top 17 most relevant chunks
            docs = vector_store.similarity_search(search_query, k=17)
            context = "\n\n".join([d.page_content for d in docs])

            instruction = f"""
            You are a Universal Academic Specialist. 
            Exam Context (The Student's Target): "{full_q_context}"
            
            Textbook Context (Available Resources):
            ---
            {context}
            ---

            TASK:
            1. Scour the Textbook Context for a matching 'Worked Example', 'Practice Problem', 'Check Point', or 'Chapter-End Exercise' that aligns with the logic, difficulty, and theme of the Exam Context.
            2. If you find a direct or highly similar match, reproduce it FULLY under: "**📖 MATCHING EXERCISE**".
            3. MANDATORY: State the Page Number or Section. If not explicitly found, estimate based on the context or state "Page: [See Chapter Reference]".
            4. If no literal exercise exists, design a high-quality "Mastery Challenge" that perfectly bridges the theory in the context to the student's exam target under: "**🛠️ MASTERY CHALLENGE**".
            5. Provide a 2-sentence strategic summary of the core academic principle under: "**💡 KEY CONCEPT**".
            
            FORMATTING RULES:
            - Use professional Markdown.
            - Use **single backticks** (`like this`) for technical terms, variables, or short formulas.
            - Use **triple backticks** (``` ... ```) for technical blocks (Code, LaTeX formulas, Truth Tables, or long Equations).
            - Ensure headers are bold.
            - Be concise, formal, and academically precise.
            """
            
            response = self.llm.invoke(instruction)
            all_recommendations.append({
                "original_question": q_item,
                "recommendation": response.content
            })

        return all_recommendations
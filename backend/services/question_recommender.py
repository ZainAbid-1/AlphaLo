import asyncio
import hashlib
import json
import os
import redis.asyncio as aioredis
from langchain_pinecone import PineconeVectorStore
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq

# --- Redis client (lazy-initialized, shared across requests) ---
_redis_client: aioredis.Redis | None = None

async def _get_redis() -> aioredis.Redis | None:
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        return None
    try:
        _redis_client = aioredis.from_url(redis_url, decode_responses=True)
        await _redis_client.ping()  # type: ignore[misc]  — redis.asyncio stubs incorrectly type ping() as bool
        print("INFO: Redis connected (QuestionRecommender)")
    except Exception as e:
        print(f"WARN: Redis unavailable — skipping cache. ({e})")
        _redis_client = None
    return _redis_client

RECOMMENDATION_TTL = 60 * 60 * 24 * 7  # 7 days


class QuestionRecommender:
    def __init__(self, llm=None, api_key: str | None = None, model_name: str | None = None):
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
                    model=model_name or os.getenv("GROQ_MODEL_NAME") or "llama-3.3-70b-versatile",
                    groq_api_key=api_key or os.getenv("GROQ_API_KEY"),
                )
            else:
                self.llm = ChatOpenAI(
                    model=model_name or os.getenv("OPENAI_MODEL_NAME") or "gpt-4o-mini",
                    openai_api_key=api_key or os.getenv("OPENAI_API_KEY"),
                )

    def _cache_key(self, q_text: str) -> str:
        """Stable SHA-256 cache key for a question string."""
        return "alphalo:rec:v3:" + hashlib.sha256(q_text.encode()).hexdigest()

    async def _process_single_question(
        self,
        q_item,
        vector_store: PineconeVectorStore,
        redis: aioredis.Redis | None,
    ) -> dict:
        """Run Pinecone lookup + LLM for one question (fully async, cached)."""
        # Normalise input
        if isinstance(q_item, dict):
            q_text = q_item.get("text", "")
            q_options = " ".join(q_item.get("options", []))
            parent_context = q_item.get("parent_context", None)
            # Build full context: prepend the parent question if available so
            # the LLM always sees the COMPLETE question (e.g. the table header +
            # all its rows), not just an isolated row or sub-item.
            if parent_context:
                full_q_context = f"{parent_context}\n\n{q_text} {q_options}".strip()
            else:
                full_q_context = f"{q_text} {q_options}".strip()
        else:
            full_q_context = q_item
            parent_context = None
            q_item = {"text": q_item, "options": [], "parent_context": None}

        cache_key = self._cache_key(full_q_context)

        # --- Cache hit? ---
        if redis:
            cached = await redis.get(cache_key)
            if cached:
                print(f"DEBUG: Cache HIT for recommendation ({cache_key[:20]}...)")
                return {"original_question": q_item, "recommendation": cached}

        # --- Pinecone similarity search (run in thread pool — sync SDK) ---
        search_query = (
            f"{full_q_context} worked example practice problem "
            "exercise review question self-test chapter end"
        )
        loop = asyncio.get_event_loop()
        docs = await loop.run_in_executor(
            None, lambda: vector_store.similarity_search(search_query, k=17)
        )
        # Build context grouped by page number to prevent confusion
        page_groups = {}
        for d in docs:
            p_num = d.metadata.get("page_label")
            if p_num is None:
                page_idx = d.metadata.get("page")
                p_num = page_idx + 1 if (page_idx is not None and isinstance(page_idx, int)) else "Unknown"
            if p_num not in page_groups:
                page_groups[p_num] = []
            page_groups[p_num].append(d.page_content)
        
        context_parts = []
        for p_num, contents in page_groups.items():
            combined_content = "\n\n".join(contents)
            context_parts.append(f"<<<< TEXTBOOK SOURCE: PAGE {p_num} >>>>\n{combined_content}")
            
        context = "\n\n".join(context_parts)

        instruction = f"""
            You are a Universal Academic Specialist.
            
            FULL EXAM QUESTION (complete context — including all parts, rows, and sub-questions):
            \"\"\"
            {full_q_context}
            \"\"\"
            
            Textbook Context (Available Resources):
            ---
            {context}
            ---

            TASK:
            1. Understand the COMPLETE question above in its entirety before generating a response.
               - If the question contains a table (e.g., compare features across multiple rows), treat ALL rows as part of one unified question.
               - Do NOT focus on individual rows or sub-items in isolation; the whole question is the target.
            2. Scour the Textbook Context for ACTUAL 'Worked Examples', 'Practice Problems', 'Check Points', or 'Chapter-End Exercises' that align with the academic concept and difficulty of the exam question.
            3. MATCHING RULE: If you find a question in the textbook that is semantically similar (i.e., tests the same logic, even if phrased differently), reproduce it under "**📖 MATCHING EXERCISE**".
               - CRITICAL: Only use text that is explicitly presented as an exercise, example, or problem in the book.
               - If no actual exercises/questions exist in the context, skip this section.
            4. MANDATORY: State the page number as "Page: X" (e.g., "Page: 28").
               - Use ONLY the numbers found in the "<<<< TEXTBOOK SOURCE: PAGE X >>>>" markers.
               - DO NOT combine page numbers with dashes (e.g., no "37-17"). If content spans multiple pages, use a comma (e.g., "Page: 37, 38").
               - DO NOT include the "TEXTBOOK SOURCE" or bracket labels in your final response; just the number.
            5. If no literal exercise exists, design a high-quality "Mastery Challenge" that addresses the FULL scope of the question (all rows/parts) under: "**🛠️ MASTERY CHALLENGE**".
            6. Provide a 2-sentence strategic summary of the core academic principle under: "**💡 KEY CONCEPT**".
            
            FORMATTING RULES:
            - Use professional Markdown.
            - Use **single backticks** (`like this`) for technical terms, variables, or short formulas.
            - Use **triple backticks** (``` ... ```) for technical blocks (Code, LaTeX formulas, Truth Tables, or long Equations).
            - Ensure headers are bold.
            - Be concise, formal, and academically precise.
            """

        # --- Async LLM call ---
        response = await self.llm.ainvoke(instruction)
        result = response.content

        # --- Store in cache ---
        if redis:
            await redis.set(cache_key, result, ex=RECOMMENDATION_TTL)

        return {"original_question": q_item, "recommendation": result}

    async def get_book_recommendations(self, exam_questions: list) -> list:
        """Fetch recommendations for all questions in PARALLEL (huge latency win)."""
        redis = await _get_redis()

        # Shared Pinecone vector store (one connection, reused for all questions)
        vector_store = PineconeVectorStore(
            index_name="alphalo-index",
            embedding=self.embedding_model,
            text_key="text",
        )

        print(f"DEBUG: Fetching {len(exam_questions)} recommendations in parallel...")
        tasks = [
            self._process_single_question(q, vector_store, redis)
            for q in exam_questions
        ]
        results = await asyncio.gather(*tasks)
        return list(results)
import asyncio
import hashlib
import json
import os
import redis.asyncio as aioredis
from langchain_pinecone import PineconeVectorStore
# from langchain_community.embeddings import HuggingFaceEmbeddings
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
        await _redis_client.ping()  # type: ignore[misc]
        print("INFO: Redis connected (QuestionRecommender)")
    except Exception as e:
        print(f"WARN: Redis unavailable — skipping cache. ({e})")
        _redis_client = None
    return _redis_client


RECOMMENDATION_TTL = 60 * 60 * 24 * 7  # 7 days


class QuestionRecommender:
    def __init__(self, llm=None, api_key: str | None = None, model_name: str | None = None):
        # Initialize as None to support lazy loading
        self._embedding_model = None
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

    @property
    def embedding_model(self):
        """Lazy loader for the embedding model to speed up server startup."""
        if self._embedding_model is None:
            from langchain_community.embeddings import HuggingFaceEmbeddings
            print("DEBUG: Initializing embedding model for QuestionRecommender...")
            self._embedding_model = HuggingFaceEmbeddings(
                model_name="sentence-transformers/multi-qa-distilbert-cos-v1"
            )
        return self._embedding_model

    # ------------------------------------------------------------------
    # Cache helpers
    # ------------------------------------------------------------------

    def _cache_key(self, text: str) -> str:
        """Stable SHA-256 cache key. v4 = new prompt format."""
        return "alphalo:rec:v4:" + hashlib.sha256(text.encode()).hexdigest()

    # ------------------------------------------------------------------
    # Pinecone multi-query search
    # ------------------------------------------------------------------

    async def _multi_search(
        self,
        vector_store: PineconeVectorStore,
        queries: list[str],
        k_per_query: int = 8,
    ) -> list:
        """
        Fire multiple Pinecone similarity searches in parallel and return
        a deduplicated list of documents ordered by first occurrence.
        """
        loop = asyncio.get_event_loop()

        async def _single(q: str):
            return await loop.run_in_executor(
                None, lambda: vector_store.similarity_search(q, k=k_per_query)
            )

        results_per_query = await asyncio.gather(*[_single(q) for q in queries])

        # Deduplicate by page_content (first k=24 unique chunks)
        seen: set[str] = set()
        unique_docs = []
        for docs in results_per_query:
            for doc in docs:
                key = doc.page_content[:120]   # first 120 chars as fingerprint
                if key not in seen:
                    seen.add(key)
                    unique_docs.append(doc)
                    if len(unique_docs) >= 24:
                        break
            if len(unique_docs) >= 24:
                break

        return unique_docs

    # ------------------------------------------------------------------
    # Context builder
    # ------------------------------------------------------------------

    @staticmethod
    def _build_context(docs: list) -> str:
        """
        Groups retrieved chunks by page number and formats them with
        page + section metadata so the LLM can cite accurately.
        """
        page_groups: dict[str, dict] = {}   # page_label -> {section, contents[]}

        for doc in docs:
            meta = doc.metadata

            # --- Page label (prefer stored page_label, fallback to page+1) ---
            page_label = meta.get("page_label")
            if not page_label:
                page_idx = meta.get("page")
                page_label = str(page_idx + 1) if isinstance(page_idx, int) else "?"

            # --- Section (may not exist in old chunks) ---
            section = meta.get("section", "")

            if page_label not in page_groups:
                page_groups[page_label] = {"section": section, "contents": []}
            page_groups[page_label]["contents"].append(doc.page_content)

        parts = []
        for page_label, info in page_groups.items():
            section_tag = f" — {info['section']}" if info["section"] else ""
            header = f"<<<< TEXTBOOK SOURCE: PAGE {page_label}{section_tag} >>>>"
            body = "\n\n".join(info["contents"])
            parts.append(f"{header}\n{body}")

        return "\n\n".join(parts)

    # ------------------------------------------------------------------
    # Core processing — one question
    # ------------------------------------------------------------------

    async def _process_single_question(
        self,
        q_item,
        topic_concepts: list[str],
        vector_store: PineconeVectorStore,
        redis: aioredis.Redis | None,
    ) -> dict:
        """
        For one exam question:
          1. Build 3 search queries (question text, concept phrases, end-chapter harvest)
          2. Fire them all in parallel against Pinecone
          3. Build rich page+section context
          4. Call LLM with a professional, flexible academic study-guide prompt
          5. Cache and return result
        """
        # --- Normalise input ---
        if isinstance(q_item, dict):
            q_text = q_item.get("text", "")
            q_options = " ".join(q_item.get("options", []))
            parent_context = q_item.get("parent_context", None)
            full_q_context = (
                f"{parent_context}\n\n{q_text} {q_options}".strip()
                if parent_context
                else f"{q_text} {q_options}".strip()
            )
        else:
            full_q_context = str(q_item)
            q_text = full_q_context   # ← always defined now
            parent_context = None
            q_item = {"text": full_q_context, "options": [], "parent_context": None}

        cache_key = self._cache_key(full_q_context + "|" + "|".join(topic_concepts))

        # --- Cache hit? ---
        if redis:
            cached = await redis.get(cache_key)
            if cached:
                print(f"DEBUG: Cache HIT for recommendation ({cache_key[:20]}...)")
                return {"original_question": q_item, "recommendation": cached}

        # --- Build 3 parallel Pinecone queries ---
        #   Query 1: The actual exam question (direct semantic match)
        q1 = full_q_context

        #   Query 2: Topic concept phrases (broader conceptual coverage)
        q2 = " ".join(topic_concepts) if topic_concepts else full_q_context

        #   Query 3: Dedicated end-of-chapter harvest query
        topic_hint = topic_concepts[0] if topic_concepts else q_text[:60]
        q3 = (
            f"chapter end exercises review problems practice questions "
            f"self-test worked examples {topic_hint}"
        )

        print(f"DEBUG: Firing 3-query Pinecone search for: {q_text[:60]}...")
        docs = await self._multi_search(vector_store, [q1, q2, q3], k_per_query=8)
        context = self._build_context(docs)

        # --- LLM Prompt — professional academic study guide ---
        concepts_block = "\n".join(f"  • {c}" for c in topic_concepts) if topic_concepts else "  • (no concepts provided)"

        instruction = f"""You are a senior academic study advisor preparing a personalised textbook study guide.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXAM QUESTION (full context):
{full_q_context}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACADEMIC CONCEPTS TO COVER:
{concepts_block}

TEXTBOOK CONTENT (retrieved from the student's textbook):
---
{context}
---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR TASK — Generate a structured study guide entry with the following sections:

**📌 TOPIC OVERVIEW**
Write 2–3 sentences explaining the core concept(s) being tested. Be precise and academic.

**📖 FROM THE TEXTBOOK**
Find and list 2–4 items from the textbook context above. These can be:
  - End-of-chapter exercises
  - Worked examples
  - Practice problems
  - Self-test or checkpoint questions
  - Definition boxes or theoretical summaries worth studying

For EACH item you find, format it exactly like this:
> **Source:** Page [X] — [Section name if available, else omit]
> **Type:** [Worked Example | Chapter Exercise | Practice Problem | Theoretical | Definition]
> **Content:** [Reproduce the exercise/example from the book. If theoretical, quote the key passage.]

IMPORTANT PAGE RULES:
  - Page numbers come ONLY from the `<<<< TEXTBOOK SOURCE: PAGE X >>>>` markers in the context above.
  - Use the exact number shown in those markers. Do NOT invent, guess, or combine page numbers.
  - If a section name is shown after "PAGE X —", include it. Otherwise omit the section.
  - If no relevant exercise or example is found in the context, write: "No direct exercise found in the retrieved pages — see Study Recommendations below."

**🧠 STUDY RECOMMENDATIONS**
Provide 2–3 targeted practice questions that will help the student master this topic.
These do NOT need to be literal copies from the book. They should:
  - Test the SAME concept(s) as the exam question
  - Range from theoretical ("Explain the difference between...") to applied ("Write a function that...")
  - Be clearly labelled as: [Theoretical] / [Applied] / [Analytical]

**🖥️ CODING WITH AI**
Write 1–2 complete, runnable code examples that directly demonstrate the concept(s) being tested.

Rules for this section:
  - Each code block MUST be wrapped in triple backticks with the correct language ID (e.g., ```python, ```java, ```css, ```html, ```cpp, ```js).
  - Every meaningful line MUST have an inline comment explaining what it does and WHY — write as if teaching a student who has never seen this code before.
  - If the topic is purely theoretical (e.g., history, definitions), instead write a pseudo-code or diagram-style block that illustrates the concept.
  - After each code block, add one sentence in plain text explaining the key takeaway from that example.
  - Label each block clearly, e.g.: **Example 1 — Basic Usage** / **Example 2 — Edge Case**

**💡 KEY PRINCIPLE**
One concise sentence capturing the single most important idea the student must remember.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATTING RULES:
- Use professional Markdown throughout.
- Use single backticks for inline terms/variables (`like_this`).
- Use triple backticks with language ID for ALL code — this is critical for rendering.
- Every code block must have comments on each meaningful line.
- Keep all section headers bold.
- Be concise, formal, and academically precise.
- Do NOT include the raw `<<<< TEXTBOOK SOURCE >>>>` markers in your output.
"""

        # --- Async LLM call ---
        response = await self.llm.ainvoke(instruction)
        result = response.content

        # --- Store in cache ---
        if redis:
            await redis.set(cache_key, result, ex=RECOMMENDATION_TTL)

        return {"original_question": q_item, "recommendation": result}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def get_book_recommendations(
        self,
        exam_questions: list,
        topic_concepts: list[str] | None = None,
    ) -> list:
        """
        Fetch recommendations for all questions in PARALLEL.

        Args:
            exam_questions: list of question dicts (text, options, parent_context)
            topic_concepts: expanded concept phrases from QuestionExtractor.expand_topic_concepts()
        """
        redis = await _get_redis()
        concepts = topic_concepts or []

        # Shared Pinecone vector store (one connection, reused for all questions)
        vector_store = PineconeVectorStore(
            index_name="alphalo-index",
            embedding=self.embedding_model,
            text_key="text",
        )

        # If no questions were extracted from the past paper,
        # create a synthetic question from the first concept so we still
        # get at least one useful recommendation.
        if not exam_questions and concepts:
            print("DEBUG: No past-paper questions found — using concept phrases as seeds.")
            exam_questions = [
                {"text": c, "options": [], "parent_context": None}
                for c in concepts[:3]   # limit to 3 concept seeds
            ]
        elif not exam_questions:
            print("WARN: No questions and no concepts — nothing to recommend.")
            return []

        print(f"DEBUG: Fetching {len(exam_questions)} recommendations in parallel (3-query search each)...")
        tasks = [
            self._process_single_question(q, concepts, vector_store, redis)
            for q in exam_questions
        ]
        results = await asyncio.gather(*tasks)
        return list(results)
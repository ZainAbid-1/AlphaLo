# HEAVY IMPORTS REMOVED FROM TOP LEVEL TO SAVE RAM
import logging
import re

logging.getLogger("pypdf").setLevel(logging.ERROR)


# Regex patterns compiled once for performance
_PAGE_NUM_RE = re.compile(r'\b(\d{1,4})\b')
_CHAPTER_PREFIX_RE = re.compile(r'(?i)^(Chapter|Section|Unit|Part)\s+\d+[\s\.:–-]*')
# Headings: lines that start with a number+dot or are ALL CAPS / Title Case short lines
_HEADING_RE = re.compile(
    r'^(?:\d+[\.\d]*\s+[A-Z].{3,60}|[A-Z][A-Z\s]{3,50})$'
)


class TextbookIngestor:
    def __init__(self):
        # Initialize as None to support lazy loading
        self._embedding_model = None

    @property
    def embedding_model(self):
        """Lazy loader for the embedding model to speed up server startup."""
        if self._embedding_model is None:
            from langchain_openai import OpenAIEmbeddings
            print("INFO: Initializing OpenAI embedding model...")
            self._embedding_model = OpenAIEmbeddings(
                model="text-embedding-3-small"
            )
        return self._embedding_model

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_page_number(page, page_index: int) -> str:
        """
        Try footer first (bottom 8% of page), then header (top 8%).
        Most textbooks put the real page number in the footer; headers
        often contain chapter titles that confuse number extraction.
        Returns the detected page number string, or str(page_index + 1).
        """
        import fitz

        height = page.rect.height
        width = page.rect.width

        def _pick_number_from_zone(rect) -> str | None:
            raw = page.get_text("text", clip=rect)
            text = raw.strip() if isinstance(raw, str) else ""
            if not text:
                return None
            # Remove chapter/section labels that carry their own numbers
            cleaned = _CHAPTER_PREFIX_RE.sub("", text).strip()
            m = _PAGE_NUM_RE.search(cleaned)
            if m:
                num = int(m.group(1))
                # Sanity check: real book pages are rarely > 2000
                if 1 <= num <= 2000:
                    return m.group(1)
            return None

        # 1. Footer zone (most reliable for textbooks)
        footer_rect = fitz.Rect(0, height * 0.92, width, height)
        result = _pick_number_from_zone(footer_rect)
        if result:
            return result

        # 2. Header zone (fallback)
        header_rect = fitz.Rect(0, 0, width, height * 0.08)
        result = _pick_number_from_zone(header_rect)
        if result:
            return result

        # 3. Last resort: 1-based PDF index
        return str(page_index + 1)

    @staticmethod
    def _extract_section(full_text: str) -> str:
        """
        Find the first plausible heading in the page text.
        Returns a clean section string like '3.2 Polymorphism', or empty string.
        """
        for line in full_text.splitlines():
            line = line.strip()
            if not line or len(line) < 4 or len(line) > 80:
                continue
            if _HEADING_RE.match(line):
                return line
        return ""

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def pdf_parser(self, file_path):
        import fitz
        from langchain_core.documents import Document

        print(f"Loading PDF... (This may take a minute for large files)")
        doc = fitz.open(file_path)
        documents = []

        for i in range(len(doc)):
            page = doc[i]

            # 1. Full page text (content)
            full_text_raw = page.get_text()
            full_text = full_text_raw if isinstance(full_text_raw, str) else ""

            # 2. Real page label — footer preferred over header
            real_page = self._extract_page_number(page, i)

            # 3. Section heading on this page (best-effort)
            section = self._extract_section(full_text)

            documents.append(Document(
                page_content=full_text,
                metadata={
                    "source": file_path,
                    "page": i,           # 0-indexed PDF position (internal use)
                    "page_label": real_page,  # Human-visible page number
                    "section": section,       # e.g. "3.2 Polymorphism"
                }
            ))

        print(f"Loaded {len(documents)} pages from PDF with page labels + section metadata.")
        return documents

    def data_chunking(self, data):
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        print("Chunking text...")
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(data)
        print(f"Created {len(chunks)} chunks.")
        return chunks

    def vectorization(self, chunks):
        from langchain_pinecone import PineconeVectorStore
        print(f"Starting embedding & Pinecone upload for {len(chunks)} chunks...")
        
        batch_size = 200
        total_batches = (len(chunks) + batch_size - 1) // batch_size
        vectors = None
        
        for i, start_idx in enumerate(range(0, len(chunks), batch_size)):
            batch = chunks[start_idx:start_idx + batch_size]
            print(f"Uploading batch {i + 1}/{total_batches}...")
            
            if vectors is None:
                # ADDED: text_key="text"
                vectors = PineconeVectorStore.from_documents(
                    batch,
                    self.embedding_model,
                    index_name="alphalo-index",
                    text_key="text" 
                )
            else:
                # This also uses the text_key defined above
                vectors.add_documents(batch)
                
        print("Vectorization complete!")
        return vectors

    def delete_book(self, filename: str):
        """Deletes all chunks belonging to a specific file from Pinecone."""
        from langchain_pinecone import PineconeVectorStore
        print(f"Deleting all records for source: {filename}...")
        vector_store = PineconeVectorStore(
            index_name="alphalo-index",
            embedding=self.embedding_model,
            text_key="text"
        )
        # Pinecone allows deleting by metadata filter
        vector_store.delete(filter={"source": {"$eq": filename}})
        print("Deletion complete!")
    

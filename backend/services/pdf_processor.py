import fitz  # PyMuPDF
import io

def extract_text_from_pdf(file_bytes: bytes):
    """
    Reads PDF bytes and extracts text page by page.
    Returns a list of dictionaries, perfect for Pinecone metadata.
    """
    pages_data =[]
    
    # Open the PDF directly from memory (no need to save to disk first)
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    
    for i, page in enumerate(doc):
        text = page.get_text("text")
        
        # Clean up the text (remove excessive newlines/spaces)
        clean_text = " ".join(text.split())
        
        # Only add pages that actually have text (skips blank pages)
        if clean_text:
            pages_data.append({
                "page_no": i + 1,
                "content": clean_text
            })
            
    doc.close()
    return pages_data

def extract_full_text(file_bytes: bytes) -> str:
    """
    For past papers, we just want one giant string of text to use as an AI blueprint.
    """
    pages = extract_text_from_pdf(file_bytes)
    return " ".join([p["content"] for p in pages])
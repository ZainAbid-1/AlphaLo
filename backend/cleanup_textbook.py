"""
cleanup_textbook.py
====================
Interactive script to delete a textbook from BOTH Pinecone and MongoDB.

Usage (from the /backend directory):
    python cleanup_textbook.py

The script will:
  1. List all textbooks stored in MongoDB
  2. Let you pick one (or all) to delete
  3. Delete its vector chunks from Pinecone (by source path filter)
  4. Delete its record from MongoDB

Requirements:
  - Run from the /backend directory so .env is found
  - Your virtual environment must be activated
"""

import asyncio
import os
import sys
from dotenv import load_dotenv

# ── Load .env from the root directory ─────────────────────────────────────────
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

# ── Late imports (after env is loaded) ────────────────────────────────────────
from motor.motor_asyncio import AsyncIOMotorClient
from langchain_pinecone import PineconeVectorStore
from langchain_huggingface import HuggingFaceEmbeddings

# ── Config ────────────────────────────────────────────────────────────────────
MONGO_URI      = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGO_DB_NAME  = os.getenv("MONGO_DB_NAME", "alphalo_db")
PINECONE_INDEX = "alphalo-index"
EMBED_MODEL    = "sentence-transformers/multi-qa-distilbert-cos-v1"

# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_vector_store(embedding_model) -> PineconeVectorStore:
    return PineconeVectorStore(
        index_name=PINECONE_INDEX,
        embedding=embedding_model,
        text_key="text",
    )


def _delete_from_pinecone(vs: PineconeVectorStore, source: str) -> None:
    """Delete all Pinecone vectors whose metadata.source matches the stored path."""
    print(f"  → Pinecone: deleting vectors with source='{source}'...")
    try:
        vs.delete(filter={"source": {"$eq": source}})
        print("  ✓ Pinecone deletion complete.")
    except Exception as e:
        print(f"  ✗ Pinecone deletion failed: {e}")


async def _list_textbooks(db) -> list[dict]:
    """Fetch all textbook records from MongoDB."""
    cursor = db.textbooks.find({}, {"_id": 1, "title": 1, "course_id": 1,
                                     "instructor_id": 1, "source": 1,
                                     "processed_at": 1, "chunks_count": 1})
    return await cursor.to_list(length=200)


async def _delete_from_mongo(db, doc_id) -> None:
    """Delete a single textbook record from MongoDB by its _id."""
    from bson import ObjectId
    result = await db.textbooks.delete_one({"_id": ObjectId(str(doc_id))})
    if result.deleted_count:
        print("  ✓ MongoDB record deleted.")
    else:
        print("  ✗ MongoDB record NOT found (already deleted?).")


# ── Main ──────────────────────────────────────────────────────────────────────

async def main():
    print("\n" + "═" * 60)
    print("  AlphaLo — Textbook Cleanup Utility")
    print("═" * 60)

    # 1. Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URI)
    db     = client[MONGO_DB_NAME]

    # 2. Fetch textbook list
    textbooks = await _list_textbooks(db)

    if not textbooks:
        print("\n⚠  No textbooks found in MongoDB. Nothing to delete.")
        client.close()
        return

    # 3. Display table
    print(f"\n{'#':<4} {'Title':<35} {'Course ID':<20} {'Chunks':<8} {'Processed At'}")
    print("-" * 90)
    for i, tb in enumerate(textbooks, start=1):
        processed = str(tb.get("processed_at", "N/A"))[:19]
        print(f"{i:<4} {tb.get('title','?'):<35} {tb.get('course_id','?'):<20} "
              f"{tb.get('chunks_count','?'):<8} {processed}")

    print("\n" + "-" * 90)
    print("Enter the number(s) to delete (comma-separated), or 'all' to delete everything.")
    print("Press Enter without input to cancel.\n")

    raw = input("Your choice: ").strip()
    if not raw:
        print("Cancelled.")
        client.close()
        return

    # 4. Resolve selection
    if raw.lower() == "all":
        selected = textbooks
    else:
        indices = []
        for part in raw.split(","):
            part = part.strip()
            if part.isdigit():
                idx = int(part) - 1
                if 0 <= idx < len(textbooks):
                    indices.append(idx)
                else:
                    print(f"  Skipping invalid index: {part}")
        selected = [textbooks[i] for i in indices]

    if not selected:
        print("No valid textbooks selected. Cancelled.")
        client.close()
        return

    # 5. Confirm
    print(f"\nAbout to delete {len(selected)} textbook(s):")
    for tb in selected:
        print(f"  • {tb.get('title')} (course: {tb.get('course_id')})")
    confirm = input("\nType 'yes' to confirm: ").strip().lower()
    if confirm != "yes":
        print("Cancelled.")
        client.close()
        return

    # 6. Load embedding model once (for Pinecone)
    print("\nLoading embedding model (this may take ~20s on first run)...")
    embedding_model = HuggingFaceEmbeddings(model_name=EMBED_MODEL)
    vs = _get_vector_store(embedding_model)

    # 7. Delete each selected textbook
    for tb in selected:
        title  = tb.get("title", "?")
        doc_id = tb["_id"]

        # 'source' is the exact temp_file_path saved at upload time (e.g. temp_uploads/book.pdf).
        # Textbooks uploaded BEFORE the admin.py fix won't have this field.
        source = tb.get("source")
        if not source:
            print(f"\n[{title}]")
            print("  ⚠  No 'source' path found for this textbook (uploaded before the fix).")
            print("  Enter the original PDF filename as it was uploaded (e.g. 'MyBook.pdf').")
            print("  This will be resolved to 'temp_uploads/<filename>'.")
            print("  Press Enter to SKIP Pinecone deletion and only remove the MongoDB record.")
            raw_fn = input("  Filename: ").strip()
            if raw_fn:
                source = f"temp_uploads/{raw_fn}"
            else:
                print("  Skipping Pinecone deletion for this entry.")
                await _delete_from_mongo(db, doc_id)
                continue

        print(f"\n[{title}]")
        _delete_from_pinecone(vs, source)
        await _delete_from_mongo(db, doc_id)

    print("\n" + "═" * 60)
    print(f"  Done. {len(selected)} textbook(s) cleaned from Pinecone + MongoDB.")
    print("═" * 60 + "\n")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())

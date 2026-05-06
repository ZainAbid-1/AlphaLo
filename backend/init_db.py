import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

async def initialize_full_atlas():
    url = os.getenv("MONGODB_URL")
    client = AsyncIOMotorClient(url)
    db = client.alphalo_db 

    # List of all your previous Supabase tables
    collections = [
        "universities", "courses", "instructors", "syllabus_topics",
        "past_papers", "textbooks", "questions", "performance",
        "exam_patterns", "app_users"
    ]

    print("🚀 Initializing all Collections in MongoDB Atlas...")

    try:
        for collection_name in collections:
            # We insert a dummy document to force the collection to appear in the UI
            await db[collection_name].insert_one({"status": "initial_setup"})
            print(f"✅ Created Collection: {collection_name}")

        print("\n✨ ALL DONE. Refresh your MongoDB Atlas website now.")
        
    except Exception as e:
        print(f"❌ Error during initialization: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(initialize_full_atlas())
import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

async def seed_resources():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client.alphalo_db 

    # Example resources for Web Technologies
    helping_material = [
        {
            "course_id": "cs-webtch",
            "instructor_id": "inst-naima", 
            "title": "Mastering CSS Grid",
            "url": "https://www.youtube.com/embed/jV8B24wq5zs", # Must be /embed/ link
            "topic": "CSS Layouts"
        },
        {
            "course_id": "cs-webtech",
            "instructor_id": "inst-naima", 
            "title": "React Hooks Explained",
            "url": "https://www.youtube.com/embed/TNhaISOUy6Q",
            "topic": "Frontend Frameworks"
        }
    ]

    try:
        # Create 'resources' collection and insert data
        await db.resources.insert_many(helping_material)
        print("✅ Helping Resources added to MongoDB Atlas!")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(seed_resources())
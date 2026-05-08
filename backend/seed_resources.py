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
            "course_id": "cs-webtech",
            "instructor_id": "inst-naima", 
            "title": "HTML + CSS One Shot",
            "url": "https://www.youtube.com/embed/HGTJBPNC-Gw?si=Hy_accwq3r75cA9M",
            "topic": "HTML + CSS One Shot"
        },
        {
            "course_id": "cs-webtch",
            "instructor_id": "inst-naima", 
            "title": "Functions & Methods",
            "url": "https://www.youtube.com/embed/P0XMXqDGttU?si=XkjLD1qj1wdCo8Vr", 
            "topic": "Functions and Methods"
        },
        {
            "course_id": "cs-webtech",
            "instructor_id": "inst-naima", 
            "title": "DOM",
            "url": "https://www.youtube.com/embed/7zcXPCt8Ck0?si=CZ3qVsxZDr4vFKGq",
            "topic": "DOM Manipulation"
        },
        {
            "course_id": "cs-webtech",
            "instructor_id": "inst-naima", 
            "title": "DOM",
            "url": "https://www.youtube.com/embed/fXAGTOZ25H8?si=OrI0dWNZe-B3NflC",
            "topic": "DOM Manipulation"
        },
        {
            "course_id": "cs-webtech",
            "instructor_id": "inst-naima", 
            "title": "Event Handling",
            "url": "https://www.youtube.com/embed/_i-uLJAh79U?si=mUaZHeqkxhoU1Jax",
            "topic": "Event Handling"
        },
        {
            "course_id": "cs-webtech",
            "instructor_id": "inst-naima", 
            "title": "Classes & Objects in JavaScript",
            "url": "https://www.youtube.com/embed/N-O4w6PynGY?si=iMShvkdSljHfuwq4",
            "topic": "Classes and Objects in JavaScript"
        },
        {
            "course_id": "cs-webtech",
            "instructor_id": "inst-naima", 
            "title": "Callbacks, Promises & Async-Await",
            "url": "https://www.youtube.com/embed/d3jXofmQm44?si=xbkPWI0JP56u_rWR",
            "topic": "Callbacks, Promises & Async-Await"
        },
        {
            "course_id": "cs-webtech",
            "instructor_id": "inst-naima", 
            "title": "Fetch API in JavaScript",
            "url": "https://www.youtube.com/embed/d3jXofmQm44?si=xbkPWI0JP56u_rWR",
            "topic": "Fetch API in JavaScript"
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
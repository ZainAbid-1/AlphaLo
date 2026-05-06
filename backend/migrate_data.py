import asyncio
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

# Config
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
MONGO_URL = os.getenv("MONGODB_URL")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client.alphalo_db

async def migrate_table(table_name: str, collection_name: str = None):
    if not collection_name:
        collection_name = table_name
        
    print(f"Migrating {table_name} -> {collection_name}...")
    
    try:
        # Fetch from Supabase
        response = supabase.table(table_name).select("*").execute()
        data = response.data
        
        if not data:
            print(f"No data found in {table_name}")
            return

        print(f"Fetched {len(data)} records from Supabase")
        
        # Prepare for MongoDB
        # Note: We keep the Supabase 'id' if possible, or let Mongo generate _id
        for item in data:
            if 'id' in item:
                # If it's a UUID, we store it as a string
                item['supabase_id'] = item['id']

        # Clear existing collection
        await db[collection_name].delete_many({})
        
        # Insert into MongoDB
        await db[collection_name].insert_many(data)
        print(f"Successfully migrated {len(data)} records to MongoDB")
        
    except Exception as e:
        print(f"Error migrating {table_name}: {e}")

async def main():
    tables = [
        "universities",
        "courses",
        "instructors",
        "syllabus_topics",
        "exam_patterns",
        # "past_papers"  # If you have large files, this might need special handling
    ]
    
    # Special handling for past_papers if needed (check if they exist)
    try:
        response = supabase.table("past_papers").select("*").execute()
        if response.data:
            tables.append("past_papers")
    except:
        pass

    for table in tables:
        await migrate_table(table)
        
    print("\nMigration Complete!")
    mongo_client.close()

if __name__ == "__main__":
    asyncio.run(main())

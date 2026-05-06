const { MongoClient } = require('mongodb');
require('dotenv').config();

const url = process.env.MONGODB_URL;
const client = new MongoClient(url);

const dbName = 'alphalo_db';

async function connectToMongo() {
    await client.connect();
    console.log('✅ Connected successfully to MongoDB Atlas');
    return client.db(dbName);
}

const dbPromise = connectToMongo();

module.exports = {
    getDb: () => dbPromise,
    client
};

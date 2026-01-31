const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const fixIndexes = async () => {
    try {
        console.log('Connecting to MongoDB...');
        // Ensure we use the same URI as the main app
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bangladesh-voting-system');
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        const db = mongoose.connection.db;
        const collection = db.collection('votes');

        console.log('Fetching indexes for "votes" collection...');
        const indexes = await collection.indexes();
        console.log('Existing indexes:', indexes);

        // The specific index causing trouble: user_1_election_1
        const indexName = 'user_1_election_1';

        const indexExists = indexes.some(idx => idx.name === indexName);

        if (indexExists) {
            console.log(`Found problematic index: ${indexName}. Dropping it...`);
            await collection.dropIndex(indexName);
            console.log('Index dropped successfully.');
        } else {
            console.log(`Index ${indexName} not found. Searching for other potential bad indexes...`);
            // Optional: Drop any index that isn't _id_ if we want to be aggressive, 
            // but for now let's stick to the specific error.
        }

        console.log('Database fix complete.');
        process.exit();
    } catch (error) {
        console.error('Error fixing database:', error);
        process.exit(1);
    }
};

fixIndexes();

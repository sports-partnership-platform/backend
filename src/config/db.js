const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  const localUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sports_partnership_db';
  
  try {
    // Attempt local MongoDB with 1s timeout
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 1000 });
    console.log(`Connected to local MongoDB at ${localUri}`);
  } catch (err) {
    console.log('Local MongoDB not found. Starting MongoMemoryServer fallback...');
    mongoServer = await MongoMemoryServer.create();
    const memoryUri = mongoServer.getUri();
    await mongoose.connect(memoryUri);
    console.log(`Connected to MongoMemoryServer at ${memoryUri}`);
  }
};

module.exports = connectDB;

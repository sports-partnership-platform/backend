const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');

let mongoServer;

const connectDB = async () => {
  const customUri = process.env.MONGODB_URI;
  
  if (customUri) {
    try {
      await mongoose.connect(customUri);
      console.log(`Connected to configured MongoDB at ${customUri}`);
      return;
    } catch (err) {
      console.log(`Failed to connect to configured MONGODB_URI: ${err.message}. Falling back...`);
    }
  }

  // Attempt local MongoDB service
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/sports_partnership_db', { serverSelectionTimeoutMS: 1000 });
    console.log('Connected to local MongoDB service at mongodb://127.0.0.1:27017/sports_partnership_db');
    return;
  } catch (err) {
    console.log('Local MongoDB service not running. Using persistent embedded MongoDB on disk...');
  }

  // Ensure persistent data directory exists
  const dbDir = path.resolve(__dirname, '../../data/db');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbPath: dbDir,
      storageEngine: 'wiredTiger'
    }
  });

  const memoryUri = mongoServer.getUri();
  await mongoose.connect(memoryUri);
  console.log(`Connected to persistent embedded MongoDB at ${dbDir}`);
};

module.exports = connectDB;


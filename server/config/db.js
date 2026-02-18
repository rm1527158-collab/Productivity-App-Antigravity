const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod = null;

/**
 * Initialize in-memory MongoDB instance
 */
const initMemoryDB = async () => {
  try {
    mongod = await MongoMemoryServer.create({
      instance: {
        dbName: 'operability',
        port: 27017 // Use standard MongoDB port
      }
    });
    
    const uri = mongod.getUri();
    console.log('MongoDB Memory Server started at:', uri);
    return uri;
  } catch (error) {
    console.error('Failed to start MongoDB Memory Server:', error);
    throw error;
  }
};

/**
 * Connect to database (either memory server or external MongoDB)
 */
let cachedConn = null;

/**
 * Connect to database (either memory server or external MongoDB)
 */
const connectDB = async () => {
  if (cachedConn) {
    return cachedConn;
  }

  try {
    let mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    // In production, we must have a MONGODB_URI
    if (process.env.NODE_ENV === 'production') {
      if (!mongoUri) {
        throw new Error('MONGODB_URI is not defined in environment variables.');
      }
    } else {
        // Use in-memory database if no URI is provided or if USE_MEMORY_DB is true (dev only)
        if (!mongoUri || process.env.USE_MEMORY_DB === 'true') {
          console.log('Using MongoDB Memory Server for local development...');
          mongoUri = await initMemoryDB();
        }
    }
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    
    mongoose.connection.on('error', err => {
        console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected');
    });

    cachedConn = conn;
    return conn;
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    // Only exit process in non-serverless environments or if critical
    // We should NOT exit in serverless/production often, but for connection failure it's fatal.
    if (process.env.NODE_ENV !== 'production') {
       process.exit(1);
    }
    throw error;
  }
};

/**
 * Stop memory database (call this on server shutdown)
 */
const stopMemoryDB = async () => {
  if (mongod) {
    await mongod.stop();
    console.log('MongoDB Memory Server stopped');
  }
};

module.exports = { connectDB, stopMemoryDB };

/**
 * Database Connection Module
 * Handles MongoDB connection with proper error handling and retry logic
 */

const mongoose = require("mongoose");
const { MONGO_URI, NODE_ENV } = require("./environment");
const dbgr = require("debug")("development: mongoose");

// Connection options
const connectionOptions = {
  // Set connection timeout
  connectTimeoutMS: 10000,
  // Set socket timeout
  socketTimeoutMS: 45000,
  // Set server selection timeout
  serverSelectionTimeoutMS: 10000,
};

// Maximum retry attempts
const MAX_RETRIES = 3;

/**
 * Connect to MongoDB with retry logic
 * @param {number} retryAttempt - Current retry attempt
 * @returns {Promise} Mongoose connection
 */
const connectionDB = async (retryAttempt = 0) => {
  try {
    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(MONGO_URI, connectionOptions);
    
    // Set up connection event handlers
    mongoose.connection.on('error', err => {
      dbgr(`❌ MongoDB connection error: ${err}`);
      if (NODE_ENV === 'production') {
        // In production, consider notifying administrators
        console.error(`MongoDB connection error: ${err}`);
      }
    });
    
    mongoose.connection.on('disconnected', () => {
      dbgr('MongoDB disconnected, attempting to reconnect...');
    });
    
    // Log successful connection
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Retry connection with exponential backoff
    const maxRetries = 3;
    let retryCount = 0;
    
    const retryConnection = async () => {
      if (retryCount < maxRetries) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`Retrying connection in ${delay}ms... (Attempt ${retryCount}/${maxRetries})`);
        
        setTimeout(async () => {
          try {
            const conn = await mongoose.connect(MONGO_URI, connectionOptions);
            console.log(`MongoDB Connected on retry: ${conn.connection.host}`);
          } catch (retryError) {
            console.error(`Retry ${retryCount} failed:`, retryError);
            retryConnection();
          }
        }, delay);
      } else {
        console.error('Max retries reached. Could not connect to MongoDB.');
        process.exit(1);
      }
    };
    
    retryConnection();
  }
};

module.exports = connectionDB;
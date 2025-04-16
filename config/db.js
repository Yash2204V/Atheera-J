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
    dbgr(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    dbgr(`❌ MongoDB connection error: ${err.message}`);
    
    // Implement retry logic
    if (retryAttempt < MAX_RETRIES) {
      dbgr(`Retrying connection (${retryAttempt + 1}/${MAX_RETRIES})...`);
      // Exponential backoff: 2^retryAttempt * 1000ms
      const retryDelay = Math.pow(2, retryAttempt) * 1000;
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return connectionDB(retryAttempt + 1);
    }
    
    // If all retries fail, exit in production or just log in development
    if (NODE_ENV === 'production') {
      console.error('Failed to connect to MongoDB after multiple attempts. Exiting...');
      process.exit(1);
    } else {
      console.error('Failed to connect to MongoDB after multiple attempts.');
    }
  }
};

module.exports = connectionDB;
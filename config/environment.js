/**
 * Environment Configuration
 * Centralizes all environment variables with proper validation and defaults
 */

// Load environment-specific configurations
const env = process.env.NODE_ENV || 'development';

// Set default values for critical configurations
const defaults = {
  port: 4000,
  jwtExpiresIn: '1h',
  mongoUri: 'mongodb://127.0.0.1:27017/ATHEERA'
};

// Configuration object with validation
const config = {
  // Database
  MONGO_URI: process.env.MONGO_URI || defaults.mongoUri,
  
  // Session & Authentication
  EXPRESS_SESSION_SECRET: process.env.EXPRESS_SESSION_SECRET,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || defaults.jwtExpiresIn,
  
  // Environment
  NODE_ENV: env,
  DEBUG: process.env.DEBUG,
  
  // Server
  BASE_URL: process.env.BASE_URL || `http://localhost:${process.env.PORT || defaults.port}`,
  PORT: parseInt(process.env.PORT || defaults.port, 10),
  
  // OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  
  // Twilio
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_VERIFY_SERVICE_SID: process.env.TWILIO_VERIFY_SERVICE_SID,
  
  // Email
  EMAIL: process.env.EMAIL,
  APP_PASSWORD: process.env.APP_PASSWORD,
  
  // Admin
  PASSCODE: process.env.PASSCODE
};

// Validate critical configuration
const validateConfig = () => {
  const requiredVars = [
    'EXPRESS_SESSION_SECRET',
    'JWT_SECRET',
    'MONGO_URI'
  ];
  
  // In production, ensure all required variables are set
  if (env === 'production') {
    const missingVars = requiredVars.filter(varName => !config[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    // Additional production checks
    if (config.EXPRESS_SESSION_SECRET === 'your_session_secret') {
      throw new Error('Default session secret detected in production environment');
    }
    
    if (config.JWT_SECRET === 'your_jwt_secret') {
      throw new Error('Default JWT secret detected in production environment');
    }
  }
};

// Only validate in production to allow development flexibility
if (env === 'production') {
  validateConfig();
}

module.exports = config;
/**
 * JWT Token Generation Utility
 * Creates secure JWT tokens with proper configuration
 */

const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV } = require("../config/environment");

/**
 * Generate a JWT token for user authentication
 * @param {string} _id - User ID to encode in the token
 * @returns {string} JWT token
 */
const generateToken = (_id) => {
  // Set token options
  const options = {
    expiresIn: JWT_EXPIRES_IN,
  };
  
  // Add additional options for production
  if (NODE_ENV === 'production') {
    options.issuer = 'atheera-api';
    options.audience = 'atheera-client';
  }
  
  // Sign the token with user ID and options
  const token = jwt.sign(
    { _id: _id.toString() }, 
    JWT_SECRET, 
    options
  );
  
  return token;
};

module.exports = generateToken;
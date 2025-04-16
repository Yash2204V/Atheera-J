const jwt = require("jsonwebtoken");
const { JWT_SECRET, NODE_ENV } = require("../config/environment");

/**
 * JWT Token Verification Utility
 * Verifies the validity of JWT tokens and decodes the payload
 */


/**
 * Verify a JWT token for user authentication
 * @param {string} token - JWT token to verify
 * @returns {object|null} Decoded token payload or null if verification fails
 */
const verifyToken = (token) => {
    try {
        // Set token options
        const options = {};
        
        // Add additional options for production
        if (NODE_ENV === 'production') {
            options.issuer = 'atheera-api';
            options.audience = 'atheera-client';
        }
        
        // Verify the token with secret and options
        const decoded = jwt.verify(token, JWT_SECRET, options);
        
        return decoded;
    } catch (error) {
        console.error("Token verification failed:", error);
        return null;
    }
};

module.exports = verifyToken;
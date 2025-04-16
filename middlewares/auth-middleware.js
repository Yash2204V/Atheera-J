/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

const jwt = require("jsonwebtoken");
const { JWT_SECRET, NODE_ENV } = require("../config/environment");
const User = require("../models/user.model");
const dbgr = require("debug")("development: middleware");

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from cookies
    const token = req.cookies?.token;
    
    if (!token) {
      dbgr("⚠️ No authentication token found");
      return res.redirect("/user/login");
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user by ID and token
    const user = await User.findOne({ 
      _id: decoded._id, 
      "tokens.token": token 
    });

    if (!user) {
      throw new Error("Invalid token or user not found");
    }

    // Check if token is about to expire (within 15 minutes)
    const tokenExp = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    
    // If token is about to expire, issue a new one
    if (tokenExp - now < fifteenMinutes) {
      // Remove the current token
      user.tokens = user.tokens.filter(t => t.token !== token);
      
      // Generate a new token
      const newToken = await user.generateAuthToken();
      
      // Set the new token in cookies
      res.cookie('token', newToken, {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        maxAge: 3600000, // 1 hour
        sameSite: 'lax'
      });
    }

    // Attach user and token to request
    req.user = user;
    req.token = token;
    
    dbgr(`✅ User authenticated: ${user.email}`);
    next();
  } catch (err) {
    dbgr(`❌ Authentication Error: ${err.message}`);
    
    // Clear the invalid token
    res.clearCookie("token");
    
    // Redirect to login
    res.status(401).redirect("/user/login");
  }
};

module.exports = authMiddleware;
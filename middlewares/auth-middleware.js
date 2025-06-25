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
    console.log('Auth middleware: Checking request headers:', {
      accept: req.headers.accept,
      'x-requested-with': req.headers['x-requested-with'],
      path: req.path
    });
    
    // Get token from cookies
    const token = req.cookies?.token;
    console.log('Auth middleware: Token present:', !!token);
    
    if (!token) {
      console.log('Auth middleware: No token found');
      
      // Check if request is for API (JSON) or HTML view
      if (req.headers.accept?.includes('application/json') || 
          req.headers['x-requested-with'] === 'XMLHttpRequest' ||
          req.path.startsWith('/wishlist/')) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }
      
      // Preserve the intended destination in the redirect
      const redirectUrl = `/user/login?redirect=${encodeURIComponent(req.originalUrl)}`;
      return res.redirect(redirectUrl);
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Auth middleware: Token decoded successfully');
    
    // Find user by ID and token
    const user = await User.findOne({ 
      _id: decoded._id, 
      "tokens.token": token 
    });
    console.log('Auth middleware: User found:', !!user);

    if (!user) {
      console.log('Auth middleware: User not found or token invalid');
      // Check if request is for API (JSON) or HTML view
      if (req.headers.accept?.includes('application/json') || 
          req.headers['x-requested-with'] === 'XMLHttpRequest' ||
          req.path.startsWith('/wishlist/')) {
        return res.status(401).json({
          success: false,
          message: "Invalid token or user not found"
        });
      }
      
      throw new Error("Invalid token or user not found");
    }

    // Check if token is about to expire (within 15 minutes)
    const tokenExp = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    
    // If token is about to expire, issue a new one
    if (tokenExp - now < fifteenMinutes) {
      console.log('Auth middleware: Token about to expire, generating new one');
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
    
    console.log('Auth middleware: Authentication successful');
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    
    // Clear the invalid token
    res.clearCookie("token");
    
    // Check if request is for API (JSON) or HTML view
    if (req.headers.accept?.includes('application/json') || 
        req.headers['x-requested-with'] === 'XMLHttpRequest' ||
        req.path.startsWith('/wishlist/')) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
        error: err.message
      });
    }
    
    // Redirect to login
    res.status(401).redirect("/user/login");
  }
};

// Export middleware
module.exports = {
  requireAuth: authMiddleware
};
/**
 * Admin Authentication Middleware
 * Verifies JWT tokens and ensures user has admin role
 */

const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/environment");
const User = require("../models/user.model");
const dbgr = require("debug")("development: middleware");

/**
 * Admin authentication middleware
 * Verifies JWT token and ensures user has admin role
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const adminAuthMiddleware = async (req, res, next) => {
  try {
    // Get token from cookies
    const token = req.cookies?.token;
    
    if (!token) {
      dbgr("⚠️ No authentication token found");
      
      // Check if request is for API (JSON) or HTML view
      if (req.headers.accept?.includes('application/json') || 
          req.headers['x-requested-with'] === 'XMLHttpRequest' ||
          req.path.includes('/api')) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }
      
      return res.redirect("/user/login");
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find admin by ID, token, and role
    const admin = await User.findOne({ 
      _id: decoded._id, 
      "tokens.token": token,
      role: "admin"
    });

    if (!admin) {
      // Check if request is for API (JSON) or HTML view
      if (req.headers.accept?.includes('application/json') || 
          req.headers['x-requested-with'] === 'XMLHttpRequest' ||
          req.path.includes('/api')) {
        return res.status(403).json({
          success: false,
          message: "Admin privileges required"
        });
      }
      
      throw new Error("Unauthorized: Admin privileges required");
    }

    // Attach admin to request
    req.admin = admin;
    req.user = admin; // Also set as user for compatibility
    req.token = token;
    
    dbgr(`✅ Admin authenticated: ${admin.email}`);
    next();
  } catch (err) {
    dbgr(`❌ Admin Authentication Error: ${err.message}`);
    
    // Check if request is for API (JSON) or HTML view
    if (req.headers.accept?.includes('application/json') || 
        req.headers['x-requested-with'] === 'XMLHttpRequest' ||
        req.path.includes('/api')) {
      return res.status(403).json({
        success: false,
        message: "Admin authentication failed",
        error: err.message
      });
    }
    
    // Clear the invalid token
    res.clearCookie("token");
    
    // Redirect to login with error message
    req.session.adminAuthError = "Admin privileges required";
    res.status(403).redirect("/user/login");
  }
};

module.exports = adminAuthMiddleware; 
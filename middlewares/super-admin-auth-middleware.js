/**
 * Super Admin Authentication Middleware
 * Verifies JWT tokens and ensures user has super-admin role
 */

const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/environment");
const User = require("../models/user.model");
const dbgr = require("debug")("development: middleware");

/**
 * Super admin authentication middleware
 * Verifies JWT token and ensures user has super-admin role
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const superAdminAuthMiddleware = async (req, res, next) => {
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
      
      return res.redirect("/super-admin-auth");
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find super admin by ID, token, and role
    const superAdmin = await User.findOne({ 
      _id: decoded._id, 
      "tokens.token": token,
      role: "super-admin"
    });

    if (!superAdmin) {
      // Check if request is for API (JSON) or HTML view
      if (req.headers.accept?.includes('application/json') || 
          req.headers['x-requested-with'] === 'XMLHttpRequest' ||
          req.path.includes('/api')) {
        return res.status(403).json({
          success: false,
          message: "Super Admin privileges required"
        });
      }
      
      throw new Error("Unauthorized: Super Admin privileges required");
    }

    // Attach super admin to request
    req.superAdmin = superAdmin;
    req.user = superAdmin; // Also set as user for compatibility
    req.token = token;
    
    dbgr(`✅ Super Admin authenticated: ${superAdmin.email}`);
    next();
  } catch (err) {
    dbgr(`❌ Super Admin Authentication Error: ${err.message}`);
    
    // Check if request is for API (JSON) or HTML view
    if (req.headers.accept?.includes('application/json') || 
        req.headers['x-requested-with'] === 'XMLHttpRequest' ||
        req.path.includes('/api')) {
      return res.status(403).json({
        success: false,
        message: "Super Admin authentication failed",
        error: err.message
      });
    }
    
    // Clear the invalid token
    res.clearCookie("token");
    
    // Redirect to super admin auth with error message
    req.session.superAdminAuthError = "Super Admin privileges required";
    res.status(403).redirect("/super-admin-auth");
  }
};

module.exports = superAdminAuthMiddleware; 
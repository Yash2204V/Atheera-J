const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/environment");
const User = require("../models/user.model");
const dbgr = require("debug")("development: middleware");

/**
 * Check if user is logged in and attach user to request
 * This is a lighter version of auth middleware that doesn't redirect
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const loggedIn = async (req, res, next) => {
    try {
        // Get token from cookies
        const token = req.cookies?.token;
        
        // Set token flag for EJS templates (backward compatibility)
        res.locals.token = token ? true : false;
        
        if (!token) {
            return next();
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Find user by ID and token
        const user = await User.findOne({ 
            _id: decoded._id, 
            "tokens.token": token 
        });

        if (user) {
            // Attach user and token to request
            req.user = user;
            req.token = token;
            dbgr(`✅ User authenticated: ${user.email}`);
        }
    } catch (err) {
        dbgr(`❓ Token validation error: ${err.message}`);
        // Clear invalid token
        res.clearCookie("token");
    }
    
    next();
};

module.exports = loggedIn;
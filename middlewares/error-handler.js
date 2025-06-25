/**
 * Global Error Handler Middleware
 * Provides consistent error responses and logging
 */

const { NODE_ENV } = require('../config/environment');

/**
 * Error handler middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Default status code and message
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || "🚨 An unexpected error occurred";
  let errorDetails = {};
  
  // Handle specific error types
  if (err.name === "ValidationError") {
    // Mongoose validation error
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(", ");
    errorDetails.fields = Object.keys(err.errors);
  } else if (err.name === "CastError") {
    // Mongoose cast error (invalid ID)
    statusCode = 404;
    message = `Resource not found with ID: ${err.value}`;
    errorDetails.resource = err.path;
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    statusCode = 400;
    message = "Duplicate field value entered";
    errorDetails.field = Object.keys(err.keyPattern)[0];
  } else if (err.name === "JsonWebTokenError") {
    // JWT validation error
    statusCode = 401;
    message = "Invalid authentication token";
  } else if (err.name === "TokenExpiredError") {
    // JWT expiration error
    statusCode = 401;
    message = "Authentication token expired";
  }

  // Log error details (only in development mode)
  if (NODE_ENV !== "production") {
    console.error(`❌ Error: ${message}`);
    console.error(`🔍 Stack Trace: ${err.stack}`);
  } else {
    // In production, log to a proper logging service
    // Consider using Winston, Bunyan, or a cloud logging service
    console.error({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: message,
      path: req.path,
      method: req.method,
      ip: req.ip,
      statusCode,
      ...(Object.keys(errorDetails).length > 0 && { details: errorDetails }),
      stack: err.stack
    });
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    ...(NODE_ENV !== "production" && { stack: err.stack }),
    ...(Object.keys(errorDetails).length > 0 && { details: errorDetails })
  });
};

module.exports = errorHandler;
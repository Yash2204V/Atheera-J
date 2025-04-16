/**
 * User Model
 * Defines the schema and methods for user data
*/

const mongoose = require("mongoose");
const generateToken = require("../utils/generateToken");

/**
 * User Schema
 * Defines the structure and validation for user data
 */
const userSchema = new mongoose.Schema({
  // OAuth identifiers
  googleId: { 
    type: String, 
    unique: true,
    sparse: true // Allows null values while maintaining uniqueness
  },
  
  // User information
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true
  },
  
  // Authentication
  tokens: [{ 
    token: { 
      type: String, 
      required: true 
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: '7d' // Automatically remove tokens after 7 days
    }
  }],
  
  // Shopping cart
  cart: [{
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product", 
      required: true 
    },
    variantId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true 
    },
    quantity: { 
      type: Number, 
      default: 1, 
      required: true,
      min: [1, 'Quantity must be at least 1'],
      max: [10, 'Quantity cannot exceed 10'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be a whole number'
      }
    },
    size: { 
      type: String, 
      required: true,
      enum: {
        values: ["None"],
        message: '{VALUE} is not a supported size'
      }
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Wishlist
  wishlist: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // User role
  role: { 
    type: String, 
    enum: ["user", "admin"], 
    default: "user" 
  },
  
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Pre-save middleware to limit tokens
 * Keeps only the 5 most recent tokens
 */
userSchema.pre('save', function(next) {
  if (this.tokens.length > 5) {
    // Sort tokens by creation date (descending)
    this.tokens.sort((a, b) => b.createdAt - a.createdAt);
    
    // Keep only the 5 most recent tokens
    this.tokens = this.tokens.slice(0, 5);
  }
  next();
});

/**
 * Generate JWT token for authentication
 * @returns {string} JWT token
 */
userSchema.methods.generateAuthToken = async function() {
  const token = generateToken(this._id);
  
  // Add token to tokens array
  this.tokens.push({ 
    token,
    createdAt: new Date()
  });
  
  // Update last login time
  this.lastLogin = new Date();
  
  await this.save();
  return token;
};

/**
 * Virtual for cart total
 * Calculates the total price of items in the cart
 */
userSchema.virtual('cartTotal').get(function() {
  if (!this.cart || this.cart.length === 0) return 0;
  
  return this.cart.reduce((total, item) => {
    // This is a placeholder - actual calculation would need
    // to be done after populating the product details
    return total + (item.quantity || 0);
  }, 0);
});

/**
 * Index for efficient queries
 */
userSchema.index({ role: 1 });
userSchema.index({ 'cart.product': 1 });
userSchema.index({ 'wishlist.product': 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
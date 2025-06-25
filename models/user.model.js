/**
 * User Model
 * Defines the schema and methods for user data
*/

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
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
  // Password (only required for email/password login)
  password: {
    type: String,
    trim: true
  },
  // Phone authentication
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true, // Allows null values while maintaining uniqueness
    trim: true
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  // Additional user information
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer not to say'],
    default: 'prefer not to say'
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
      max: [10, 'Quantity cannot exceed 10']
    },
    size: { 
      type: String, 
      required: true 
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Orders
  orders: [{
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      sparse: true
    },
    products: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      variantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      size: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      }
    }],
    totalAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    paymentMethod: {
      type: String,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // User role
  role: { 
    type: String, 
    enum: ["user", "admin", "super-admin"], 
    default: "user" 
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },

  // Addresses
  addresses: [{
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'ZIP code is required'],
      trim: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Recently viewed products
  recentlyViewed: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true, // This will add createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Pre-save middleware to hash password and limit tokens
 */
userSchema.pre('save', async function(next) {
  console.log('Pre-save hook triggered');
  console.log('Is password modified:', this.isModified('password'));
  
  // Hash password if it's modified or if it's a new user AND password exists
  if ((this.isModified('password') || this.isNew) && this.password) {
    try {
      console.log('Hashing password...');
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      console.log('Password hashed successfully');
    } catch (error) {
      console.error('Error hashing password:', error);
      return next(error);
    }
  }

  // Limit tokens to 5 most recent
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
 * Compare provided password with stored hash
 * @param {string} candidatePassword - Password to compare
 * @returns {boolean} Whether password matches
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log('Comparing passwords...');
  console.log('Has stored password:', !!this.password);
  console.log('Stored password length:', this.password ? this.password.length : 0);
  console.log('Candidate password length:', candidatePassword ? candidatePassword.length : 0);
  
  if (!this.password) {
    console.log('No stored password found');
    return false;
  }
  
  try {
    console.log('Attempting bcrypt comparison...');
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password match result:', isMatch);
    if (!isMatch) {
      console.log('Password comparison failed');
    }
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
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
userSchema.index({ phoneNumber: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
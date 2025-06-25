/**
 * Script to create or update a super admin account
 * Run with: node setup-super-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MONGO_URI } = require('./config/environment');

// Connect to database
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import User model
const User = require('./models/user.model');

async function setupSuperAdmin() {
  try {
    const email = 'admin@gmail.com';
    const password = 'admin@123';
    
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      console.log(`Updating existing user: ${email}`);
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Update user to super-admin
      user = await User.findOneAndUpdate(
        { email },
        { 
          role: 'super-admin',
          password: hashedPassword 
        },
        { new: true }
      );
    } else {
      console.log(`Creating new super admin: ${email}`);
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create new user
      user = new User({
        email,
        password: hashedPassword,
        name: 'Super Admin',
        role: 'super-admin'
      });
      
      await user.save();
    }
    
    console.log('Super admin account set up successfully:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${user.role}`);
    
    // Test the password comparison
    const isMatch = await user.comparePassword(password);
    console.log(`Password comparison test: ${isMatch ? 'PASSED' : 'FAILED'}`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error setting up super admin:', error);
    process.exit(1);
  }
}

// Run the function
setupSuperAdmin(); 
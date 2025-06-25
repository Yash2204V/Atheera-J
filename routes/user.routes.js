// 🌟 Import Required Modules
const express = require("express");
const router = express.Router();
const { generateOTP, storeOTP, verifyOTP } = require('../utils/otpManager');
const { sendOTPEmail } = require('../utils/transporter');

// 🔐 Import Middleware & Controllers
const { requireAuth } = require("../middlewares/auth-middleware");
const { 
  authGoogle, 
  authGoogleCallback, 
  logout, 
  loginPage,
  initiatePhoneVerification,
  verifyPhoneCode,
  registerWithPhone,
  updateProfile
} = require("../controllers/user.controller");
const User = require("../models/user.model");
const { NODE_ENV } = require("../config/environment");

// 📌 ================== ROUTES ================== 📌

// 🔗 Google Authentication
router.get("/auth/google", authGoogle); // 🔹 Initiate Google Login
router.get("/auth/google/callback", authGoogleCallback); // 🔹 Google Auth Callback

// 📱 Phone Authentication
router.post("/auth/phone/send-code", initiatePhoneVerification); // 🔹 Send verification code
router.post("/auth/phone/verify-code", verifyPhoneCode); // 🔹 Verify code
router.post("/auth/phone/register", registerWithPhone); // 🔹 Register with phone number

// 🚪 Logout Route (Protected)
router.get("/logout", requireAuth, logout);
router.post("/logout", requireAuth, logout); // For React app

// 🧐 Login-Page
router.get("/login", loginPage);
router.get("/login-page", loginPage);

// 🔐 API Endpoints for React
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for email:', email);
    console.log('Entered password:', password);
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }
    
    console.log('Found user:', user.email);
    console.log('Stored password hash:', user.password);
    
    // Check password
    const isMatch = await user.comparePassword(password);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }
    
    // Generate authentication token
    const token = await user.generateAuthToken();
    
    // Set JWT token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      maxAge: 3600000, // 1 hour
      sameSite: 'lax'
    });
    
    // Return user info (without password)
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login"
    });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already in use"
      });
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password // will be hashed in the model's pre-save hook
    });
    
    // Save user
    await user.save();
    
    // Generate authentication token
    const token = await user.generateAuthToken();
    
    // Set JWT token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      maxAge: 3600000, // 1 hour
      sameSite: 'lax'
    });
    
    // Return user info (without password)
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during signup"
    });
  }
});

// Check authentication status
router.get("/check-auth", (req, res) => {
  if (req.user) {
    // Include all relevant user data including timestamps and phone number
    const { _id, name, email, role, phoneNumber, gender, createdAt, updatedAt } = req.user;
    res.json({ 
      user: { 
        _id, 
        name, 
        email, 
        role, 
        phoneNumber, 
        gender, 
        createdAt, 
        updatedAt 
      } 
    });
  } else {
    res.json({ user: null });
  }
});

// Profile routes
router.put("/profile", requireAuth, updateProfile);

// 🔹 Send email verification code
router.post("/auth/email/send-code", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }
    
    // Check if email is already registered for signup
    if (req.query.action === 'signup') {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already registered"
        });
      }
    }
    
    // Generate and store OTP
    const otp = generateOTP();
    storeOTP(email, otp);
    
    // Send OTP email
    await sendOTPEmail(email, otp);
    
    res.status(200).json({
      success: true,
      message: "Verification code sent to email"
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send verification code"
    });
  }
});

// 🔹 Verify email code
router.post("/auth/email/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required"
      });
    }
    
    // Verify the code
    const isValid = verifyOTP(email, code);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code"
      });
    }
    
    // If this is a login attempt, find user and generate token
    if (req.query.action === 'login') {
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Account not found with this email"
        });
      }
      
      // Generate authentication token
      const token = await user.generateAuthToken();
      
      // Set JWT token in cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        maxAge: 3600000, // 1 hour
        sameSite: 'lax'
      });
      
      return res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          gender: user.gender,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    }
    
    // For registration, just confirm verification
    res.status(200).json({
      success: true,
      message: "Email verified",
      verified: true
    });
    
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Verification failed"
    });
  }
});

// 🔹 Register with email
router.post("/auth/email/register", async (req, res) => {
  try {
    const { name, email, password, gender } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }
    
    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password, // will be hashed in the model's pre-save hook
      emailVerified: true,
      gender: gender || 'prefer not to say'
    });
    
    // Save user
    await user.save();
    
    // Generate authentication token
    const token = await user.generateAuthToken();
    
    // Set JWT token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      maxAge: 3600000, // 1 hour
      sameSite: 'lax'
    });
    
    // Return success response
    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error("Email registration error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register"
    });
  }
});

// 🚀 Export Router
module.exports = router;

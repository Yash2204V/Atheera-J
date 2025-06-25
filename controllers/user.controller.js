/**
 * User Controller
 * Handles user authentication and account management
 */

// Import required modules
const { OAuth2Client } = require("google-auth-library");
const dbgr = require("debug")("development: user-controller");
const bcrypt = require("bcryptjs");
const path = require("path");
const session = require('express-session');
const MongoStore = require('connect-mongo'); // or another store

// Import config & models
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  NODE_ENV
} = require("../config/environment");
const User = require("../models/user.model");
const verifyToken = require("../utils/verifyToken");
const { sendVerificationCode, verifyCode } = require("../utils/twilioClient");

// Initialize OAuth2 Client
const oAuth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL
);

/**
 * Google Authentication - Initiates the Login Flow
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const authGoogle = (req, res) => {
  // If user is already logged in, redirect to home
  if (req.cookies.token) {
    return res.redirect("/");
  }

  // Generate Google OAuth URL
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    prompt: 'consent'
  });

  // Redirect to Google OAuth
  res.redirect(authUrl);
};

/**
 * Google OAuth Callback - Handles Authentication Response
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const authGoogleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    // Exchange authorization code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Fetch user profile data
    const { data } = await oAuth2Client.request({
      url: 'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses'
    });

    // Extract user information
    const email = data.emailAddresses[0].value;
    const name = data.names[0].displayName;
    const googleId = data.resourceName.split('/')[1];

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = new User({
        googleId,
        name,
        email
      });
    } else {
      // Update existing user's Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
      }

      // Update name if it has changed
      if (user.name !== name) {
        user.name = name;
      }
    }

    // Check if this is a regular user login attempt and user is an admin
    const isRegularLogin = !req.session.isAdminLogin && !req.session.isSuperAdminLogin;
    if (isRegularLogin && user && (user.role === 'admin' || user.role === 'super-admin')) {
      // Set error message in session
      req.session.authError = 'Please use the admin login page';
      return res.redirect('/user/login?error=invalid_credentials');
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

    // Check if this was an admin login attempt
    const isAdminLogin = req.session.isAdminLogin;
    const isSuperAdminLogin = req.session.isSuperAdminLogin;

    // Clear the admin login flags from session
    if (isAdminLogin) {
      req.session.isAdminLogin = false;
    }
    if (isSuperAdminLogin) {
      req.session.isSuperAdminLogin = false;
    }

    // Super admin login takes precedence over admin login
    if (isSuperAdminLogin && user.role === 'super-admin') {
      // Handle API requests and browser requests differently
      if (req.headers.accept?.includes('application/json') ||
        req.headers['x-requested-with'] === 'XMLHttpRequest') {
        return res.json({
          success: true,
          redirect: '/super-admin'
        });
      }
      return res.redirect('/super-admin');
    }

    // If this was an super admin login and user is not an super admin
    if (isSuperAdminLogin && user.role !== 'super-admin') {
      return res.redirect('/super-admin-auth');
    }

    // If this was an admin login and user is not an admin
    if (isAdminLogin && user.role !== 'admin' && user.role !== 'super-admin') {
      return res.redirect('/admin-auth');
    }

    // If this was an admin login and user is an admin
    if (isAdminLogin && (user.role === 'admin' || user.role === 'super-admin')) {
      // Handle API requests and browser requests differently
      if (req.headers.accept?.includes('application/json') ||
        req.headers['x-requested-with'] === 'XMLHttpRequest') {
        return res.json({
          success: true,
          redirect: '/admin-haha'
        });
      }
      return res.redirect('/admin-haha');
    }

    // Regular user login - redirect to home
    res.redirect('/');
  } catch (err) {
    dbgr('❌ Auth error:', err);

    // Set error message in session
    req.session.authError = 'Authentication failed. Please try again.';

    // Check if this was an admin login attempt
    const isAdminLogin = req.session.isAdminLogin;

    // Redirect to appropriate login page with error
    if (isAdminLogin) {
      res.redirect('/admin/login?error=auth_failed');
    } else {
      res.redirect('/user/login?error=auth_failed');
    }
  }
};

/**
 * Login Page Controller
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const loginPage = async (req, res) => {
  // If request is for the API, return JSON
  if (req.headers.accept?.includes('application/json') ||
    req.headers['x-requested-with'] === 'XMLHttpRequest') {
    return res.json({
      success: false,
      message: "You need to log in",
      redirectTo: "/user/login"
    });
  }

  // For browser requests, serve the React app
  res.sendFile(path.join(__dirname, '../public/dist/index.html'));
};

/**
 * Logout Controller - Clears Authentication Token
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const logout = async (req, res) => {
  try {
    // If there's a user and token on the request
    if (req.user && req.token) {
      // Remove current token from user's tokens array
      req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
      await req.user.save();
    }

    // Clear token cookie
    res.clearCookie('token');

    // For API requests, return JSON
    if (req.headers.accept?.includes('application/json') ||
      req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.json({
        success: true,
        message: "Logged out successfully"
      });
    }

    // Redirect to home
    res.redirect('/');
  } catch (error) {
    dbgr("❌ Logout failed:", error);

    // For API requests, return JSON
    if (req.headers.accept?.includes('application/json') ||
      req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(500).json({
        success: false,
        message: "Logout failed"
      });
    }

    // Redirect to login
    res.status(500).redirect('/user/login');
  }
};

/**
 * Initiate Phone Verification
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const initiatePhoneVerification = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    // Check if phone is already registered
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser && req.query.action === 'signup') {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered"
      });
    }

    // Send verification code via Twilio
    const verification = await sendVerificationCode(phoneNumber);

    res.status(200).json({
      success: true,
      message: "Verification code sent",
      status: verification.status
    });
  } catch (error) {
    dbgr("❌ Phone verification error:", error);

    // Handle Twilio specific errors
    if (error.code === 60200) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format"
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to send verification code",
      error: error.message
    });
  }
};

/**
 * Verify Phone Code
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const verifyPhoneCode = async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({
        success: false,
        message: "Phone number and verification code are required"
      });
    }

    // Verify the code
    const verificationCheck = await verifyCode(phoneNumber, code);

    if (verificationCheck.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code"
      });
    }

    // If this is a login attempt, find user and generate token
    if (req.query.action === 'login') {
      const user = await User.findOne({ phoneNumber });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Account not found with this phone number"
        });
      }

      // Check if this is an admin login request and user is not an admin
      const isAdminLogin = req.originalUrl.includes('/admin/');
      if (isAdminLogin && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: "You do not have admin privileges"
        });
      }

      // Set phoneVerified to true if not already
      if (!user.phoneVerified) {
        user.phoneVerified = true;
        await user.save();
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
      message: "Phone number verified",
      verified: true
    });

  } catch (error) {
    dbgr("❌ Verification error:", error);

    res.status(500).json({
      success: false,
      message: "Verification failed",
      error: error.message
    });
  }
};

/**
 * Register user with phone
 * @param {Request} req - Express request object 
 * @param {Response} res - Express response object
 */
const registerWithPhone = async (req, res) => {
  try {
    const { name, email, phoneNumber, gender } = req.body;

    if (!name || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Name and phone number are required"
      });
    }

    // Check if phone is already registered
    const existingPhone = await User.findOne({ phoneNumber });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered"
      });
    }

    // Check if email is already registered (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already in use"
        });
      }
    }

    // Create new user
    const user = new User({
      name,
      phoneNumber,
      phoneVerified: true,
      email: email || `${phoneNumber.replace(/\D/g, '')}@phone.user`, // Create fallback email if not provided
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
    dbgr("❌ Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message
    });
  }
};

/**
 * Login User
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check if password matches
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check if this is a regular user login attempt and user is an admin
    const isRegularLogin = req.originalUrl.includes('/user/login');
    if (isRegularLogin && (user.role === 'admin' || user.role === 'super-admin')) {
      return res.status(403).json({
        success: false,
        message: "Please use the admin login page"
      });
    }

    // Check if this is an admin login request and user is not an admin
    const isAdminLogin = req.originalUrl.includes('/admin/');
    if (isAdminLogin && user.role !== 'admin' && user.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        message: "You do not have admin privileges"
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

    // Return success response
    res.status(200).json({
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
  } catch (error) {
    dbgr("❌ Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
};

/**
 * Update user profile
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const updateProfile = async (req, res) => {
  try {
    const { name, phoneNumber } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    // Update user fields
    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    // Save updated user
    await user.save();

    // Return updated user data
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
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
  } catch (error) {
    dbgr("❌ Profile update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message
    });
  }
};

// Export controllers
module.exports = {
  authGoogle,
  authGoogleCallback,
  logout,
  loginPage,
  initiatePhoneVerification,
  verifyPhoneCode,
  registerWithPhone,
  loginUser,
  updateProfile
};
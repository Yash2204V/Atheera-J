/**
 * User Controller
 * Handles user authentication and account management
 */

// Import required modules
const { OAuth2Client } = require("google-auth-library");
const dbgr = require("debug")("development: user-controller");

// Import config & models
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  NODE_ENV
} = require("../config/environment");
const User = require("../models/user.model");
const verifyToken = require("../utils/verifyToken");

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
      req.flash('success', 'Welcome to Atheera! Your account has been created successfully.');
    } else {
      // Update existing user's Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
      }

      // Update name if it has changed
      if (user.name !== name) {
        user.name = name;
      }
      req.flash('success', 'Welcome back to Atheera!');
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

    // Redirect based on user role
    if (user.role === "admin") {
      return res.redirect('/admin');
    }

    res.redirect('/');
  } catch (err) {
    dbgr('❌ Auth error:', err);
    req.flash('error', 'Authentication failed. Please try again.');
    res.redirect('/user/login');
  }
};

/**
 * Login Page - Conditional Rendering
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const loginPage = async (req, res) => {
  // If user is already logged in, redirect to account
  if (req.cookies.token) {
    const user = await User.findById(verifyToken(req.cookies.token));
    return res.render("account", { name: user.name });
  }

  res.render("login");
};

/**
 * Logout Controller - Clears Authentication Token
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const logout = async (req, res) => {
  try {
    // Remove current token from user's tokens array
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    await req.user.save();

    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error('Failed to destroy session:', err);
        return res.status(500).send('Failed to log out');
      }

      // Clear session and token cookies
      res.clearCookie('connect.sid');
      res.clearCookie('token');
      // Redirect to home
      res.redirect('/');
    });
  } catch (error) {
    dbgr("❌ Logout failed:", error);
    req.flash('error', 'Logout failed. Please try again.');
    res.status(500).redirect('/login');
  }
};

// Export controllers
module.exports = {
  authGoogle,
  authGoogleCallback,
  logout,
  loginPage
};
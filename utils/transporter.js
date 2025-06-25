/**
 * Email Transport Configuration
 * Sets up nodemailer with proper error handling and retry logic
 */

const nodemailer = require("nodemailer");
const { EMAIL, APP_PASSWORD, NODE_ENV } = require("../config/environment");

// Create reusable transporter with configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  secure: false,
  auth: {
    user: EMAIL,
    pass: APP_PASSWORD,
  },
  // Set timeouts
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});

// Verify connection configuration
(async function() {
  if (NODE_ENV === 'production') {
    try {
      await transporter.verify();
      console.log('✅ Email service connection established successfully');
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      // In production, you might want to implement a fallback email service
    }
  }
})();

/**
 * Enhanced send method with retry logic
 * @param {Object} mailOptions - Email options
 * @param {number} retries - Number of retries (default: 3)
 * @returns {Promise} - Email send result
 */
transporter.sendWithRetry = async (mailOptions, retries = 3) => {
  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    if (retries > 0) {
      console.log(`Email send failed, retrying... (${retries} attempts left)`);
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, (4 - retries) * 1000));
      return transporter.sendWithRetry(mailOptions, retries - 1);
    }
    throw error; // Re-throw if all retries failed
  }
};

/**
 * Send OTP verification email
 * @param {string} email - Email address to send OTP to
 * @param {string} otp - OTP code to send
 * @returns {Promise} - Nodemailer send response
 */
const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: EMAIL,
      to: email,
      subject: 'Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #4F46E5; font-size: 32px; letter-spacing: 5px; text-align: center; padding: 20px; background: #F3F4F6; border-radius: 8px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw error;
  }
};

module.exports = {
  transporter,
  sendOTPEmail
};
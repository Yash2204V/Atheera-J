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

module.exports = transporter;
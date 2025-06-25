/**
 * OTP Manager Utility
 * Handles OTP generation, storage, and verification
 */

const crypto = require('crypto');

// In-memory storage for OTPs (in production, use Redis or similar)
const otpStore = new Map();

/**
 * Generate a 6-digit OTP
 * @returns {string} - 6-digit OTP
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Store OTP with expiration
 * @param {string} identifier - Email or phone number
 * @param {string} otp - OTP code
 * @param {number} expiryMinutes - Expiry time in minutes
 */
const storeOTP = (identifier, otp, expiryMinutes = 10) => {
  const expiryTime = Date.now() + (expiryMinutes * 60 * 1000);
  otpStore.set(identifier, {
    otp,
    expiryTime
  });
};

/**
 * Verify OTP
 * @param {string} identifier - Email or phone number
 * @param {string} otp - OTP code to verify
 * @returns {boolean} - Whether OTP is valid
 */
const verifyOTP = (identifier, otp) => {
  const storedData = otpStore.get(identifier);
  
  if (!storedData) {
    return false;
  }
  
  if (Date.now() > storedData.expiryTime) {
    otpStore.delete(identifier);
    return false;
  }
  
  if (storedData.otp !== otp) {
    return false;
  }
  
  // Clear OTP after successful verification
  otpStore.delete(identifier);
  return true;
};

/**
 * Check if OTP exists and is not expired
 * @param {string} identifier - Email or phone number
 * @returns {boolean} - Whether valid OTP exists
 */
const hasValidOTP = (identifier) => {
  const storedData = otpStore.get(identifier);
  
  if (!storedData) {
    return false;
  }
  
  if (Date.now() > storedData.expiryTime) {
    otpStore.delete(identifier);
    return false;
  }
  
  return true;
};

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP,
  hasValidOTP
}; 
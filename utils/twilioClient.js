/**
 * Twilio Client Utility
 * Setup for Twilio services including phone verification
 */

const twilio = require('twilio');
const { 
  TWILIO_ACCOUNT_SID, 
  TWILIO_AUTH_TOKEN, 
  TWILIO_VERIFY_SERVICE_SID 
} = require('../config/environment');
const dbgr = require('debug')('development: twilio');

// Initialize Twilio client
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * Send verification code to phone number
 * @param {string} phoneNumber - Phone number to send verification code to
 * @returns {Promise} - Twilio verification response
 */
const sendVerificationCode = async (phoneNumber) => {
  try {
    const verification = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: phoneNumber,
        channel: 'sms'
      });
    
    dbgr(`Verification sent to ${phoneNumber}, status: ${verification.status}`);
    return verification;
  } catch (error) {
    dbgr('❌ Error sending verification:', error);
    throw error;
  }
};

/**
 * Verify code sent to phone number
 * @param {string} phoneNumber - Phone number to verify
 * @param {string} code - Verification code
 * @returns {Promise} - Twilio verification check response
 */
const verifyCode = async (phoneNumber, code) => {
  try {
    const verification_check = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: phoneNumber,
        code: code
      });
    
    dbgr(`Verification check for ${phoneNumber}, status: ${verification_check.status}`);
    return verification_check;
  } catch (error) {
    dbgr('❌ Error verifying code:', error);
    throw error;
  }
};

module.exports = {
  sendVerificationCode,
  verifyCode
}; 
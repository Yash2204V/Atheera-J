const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { 
    createEnquiry,
    getAllEnquiries,
    updateEnquiryStatus,
    getUserEnquiries
} = require('../controllers/enquiry.controller');

// Create new enquiry
router.post('/', auth, createEnquiry);

// Get all enquiries (admin only)
router.get('/all', auth, getAllEnquiries);

// Update enquiry status (admin only)
router.patch('/:enquiryId/status', auth, updateEnquiryStatus);

// Get user's enquiries
router.get('/user', auth, getUserEnquiries);

module.exports = router; 
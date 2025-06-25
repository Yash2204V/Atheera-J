const Enquiry = require('../models/enquiry.model');
const dbgr = require('debug')('development: enquiry-controller');
const { verifyCode } = require('../utils/twilioClient');

/**
 * Create a new enquiry
 */
const createEnquiry = async (req, res) => {
    try {
        const { email, phoneNumber, products, verificationCode } = req.body;
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Please login to place an enquiry'
            });
        }

        if (!email || !phoneNumber || !products || !products.length) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Skip verification since it's already done in the PhoneAuth component
        // The verificationCode is only used for logging purposes
        if (!verificationCode) {
            return res.status(400).json({
                success: false,
                message: 'Phone verification is required'
            });
        }

        const enquiry = new Enquiry({
            user: user._id,
            email,
            phoneNumber,
            products: products.map(p => ({
                product: p.productId,
                quantity: p.quantity
            }))
        });

        await enquiry.save();

        return res.status(201).json({
            success: true,
            message: 'Enquiry submitted successfully',
            enquiry
        });
    } catch (error) {
        dbgr('🛑 Create Enquiry Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to submit enquiry',
            error: error.message
        });
    }
};

/**
 * Get all enquiries (admin only)
 */
const getAllEnquiries = async (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        if (!user || !['admin', 'super-admin'].includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // First, get all enquiries
        const enquiries = await Enquiry.find({})
            .populate('user', 'name email phoneNumber')
            .populate({
                path: 'products.product',
                select: 'title images description category variants',
                model: 'Product',
                options: { lean: true }
            })
            .sort('-createdAt')
            .lean();

        // Filter out enquiries where all products are null (deleted)
        const validEnquiries = enquiries.filter(enquiry => {
            // Check if any products still exist
            return enquiry.products && enquiry.products.some(item => item.product !== null);
        });

        // Update enquiries in database to remove non-existent products
        for (const enquiry of validEnquiries) {
            // Filter out non-existent products
            const validProducts = enquiry.products.filter(item => item.product !== null);
            
            // If the products array has changed, update the enquiry
            if (validProducts.length !== enquiry.products.length) {
                await Enquiry.findByIdAndUpdate(enquiry._id, {
                    products: validProducts
                });
            }
        }

        // Apply pagination to the filtered enquiries
        const totalEnquiries = validEnquiries.length;
        const paginatedEnquiries = validEnquiries.slice(skip, skip + limit);

        // Sanitize the enquiries data with proper null checks
        const sanitizedEnquiries = paginatedEnquiries.map(enquiry => ({
            ...enquiry,
            products: (enquiry.products || [])
                .filter(item => item && item.product !== null)
                .map(item => ({
                    ...item,
                    product: item.product ? {
                        title: item.product.title || 'Product not found',
                        images: item.product.images || [],
                        description: item.product.description || 'No description available',
                        category: item.product.category || 'N/A',
                        variants: item.product.variants || []
                    } : {
                        title: 'Product not found',
                        images: [],
                        description: 'No description available',
                        category: 'N/A',
                        variants: []
                    }
                }))
        }));

        return res.json({
            success: true,
            enquiries: sanitizedEnquiries,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalEnquiries / limit),
                totalEnquiries,
                hasMore: page * limit < totalEnquiries
            }
        });
    } catch (error) {
        dbgr('🛑 Get All Enquiries Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch enquiries',
            error: error.message
        });
    }
};

/**
 * Update enquiry status (admin only)
 */
const updateEnquiryStatus = async (req, res) => {
    try {
        const { enquiryId } = req.params;
        const { status, notes } = req.body;
        const user = req.user;

        if (!user || !['admin', 'super-admin'].includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const enquiry = await Enquiry.findById(enquiryId);
        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: 'Enquiry not found'
            });
        }

        enquiry.status = status;
        if (notes) {
            enquiry.notes = notes;
        }

        await enquiry.save();

        return res.json({
            success: true,
            message: 'Enquiry status updated',
            enquiry
        });
    } catch (error) {
        dbgr('🛑 Update Enquiry Status Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update enquiry status',
            error: error.message
        });
    }
};

/**
 * Get user's enquiries
 */
const getUserEnquiries = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Please login to view your enquiries'
            });
        }

        const enquiries = await Enquiry.find({ user: user._id })
            .populate('products.product', 'title images')
            .sort('-createdAt');

        return res.json({
            success: true,
            enquiries
        });
    } catch (error) {
        dbgr('🛑 Get User Enquiries Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch your enquiries',
            error: error.message
        });
    }
};

/**
 * Delete enquiry (admin only)
 */
const deleteEnquiry = async (req, res) => {
    try {
        const { enquiryId } = req.params;
        const user = req.user;

        if (!user || !['admin', 'super-admin'].includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const enquiry = await Enquiry.findById(enquiryId);
        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: 'Enquiry not found'
            });
        }

        await enquiry.deleteOne();

        return res.json({
            success: true,
            message: 'Enquiry deleted successfully'
        });
    } catch (error) {
        dbgr('🛑 Delete Enquiry Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete enquiry',
            error: error.message
        });
    }
};

module.exports = {
    createEnquiry,
    getAllEnquiries,
    updateEnquiryStatus,
    getUserEnquiries,
    deleteEnquiry
}; 
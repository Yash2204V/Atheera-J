const User = require("../models/user.model");
const Product = require("../models/product.model");
const Enquiry = require("../models/enquiry.model");
const dbgr = require("debug")("development: super-admin-controller");

/**
 * Super Admin Dashboard - Get Dashboard Data
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getSuperAdminDashboard = async (req, res) => {
    try {
        const searchQuery = req.query.query || '';
        const userPage = parseInt(req.query.userPage) || 1;
        const adminPage = parseInt(req.query.adminPage) || 1;
        const productPage = parseInt(req.query.productPage) || 1;
        const enquiryPage = parseInt(req.query.enquiryPage) || 1;
        const DEFAULT_LIMIT = 10;

        // Build search criteria
        const userSearchCriteria = searchQuery ? {
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } },
                { email: { $regex: searchQuery, $options: 'i' } },
                { phoneNumber: { $regex: searchQuery, $options: 'i' } }
            ]
        } : {};

        const productSearchCriteria = searchQuery ? {
            $or: [
                { title: { $regex: searchQuery, $options: 'i' } },
                { category: { $regex: searchQuery, $options: 'i' } },
                { subCategory: { $regex: searchQuery, $options: 'i' } },
                { subSubCategory: { $regex: searchQuery, $options: 'i' } }
            ]
        } : {};

        const enquirySearchCriteria = searchQuery ? {
            $or: [
                { email: { $regex: searchQuery, $options: 'i' } },
                { phoneNumber: { $regex: searchQuery, $options: 'i' } },
                { status: { $regex: searchQuery, $options: 'i' } }
            ]
        } : {};

        // Always treat as API request for React app
        const isApiRequest = true;

        // Get users (regular users)
        const userCriteria = { ...userSearchCriteria, role: 'user' };
        const users = await User.find(userCriteria)
            .sort({ createdAt: -1 })
            .limit(DEFAULT_LIMIT)
            .skip((userPage - 1) * DEFAULT_LIMIT)
            .select('-tokens -cart -__v');
        
        const totalUsers = await User.countDocuments(userCriteria);

        // Get admins
        const adminCriteria = { ...userSearchCriteria, role: 'admin' };
        const admins = await User.find(adminCriteria)
            .sort({ createdAt: -1 })
            .limit(DEFAULT_LIMIT)
            .skip((adminPage - 1) * DEFAULT_LIMIT)
            .select('-tokens -cart -__v');
        
        const totalAdmins = await User.countDocuments(adminCriteria);

        // Get products (limited data for dashboard)
        const products = await Product.find(productSearchCriteria)
            .sort({ createdAt: -1 })
            .limit(DEFAULT_LIMIT)
            .skip((productPage - 1) * DEFAULT_LIMIT)
            .select('title category subCategory description createdAt');
        
        const totalProducts = await Product.countDocuments(productSearchCriteria);

        // Get enquiries
        const enquiries = await Enquiry.find(enquirySearchCriteria)
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
        const paginatedEnquiries = validEnquiries.slice((enquiryPage - 1) * DEFAULT_LIMIT, enquiryPage * DEFAULT_LIMIT);

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

        // Return JSON response for API requests
        return res.json({
            success: true,
            users,
            totalUsers,
            currentUserPage: userPage,
            admins,
            totalAdmins,
            currentAdminPage: adminPage,
            products,
            totalProducts,
            currentProductPage: productPage,
            enquiries: sanitizedEnquiries,
            totalEnquiries,
            currentEnquiryPage: enquiryPage,
            searchQuery
        });
    } catch (error) {
        dbgr("🛑 Super Admin Dashboard Error:", error);
        
        // Return JSON error response
        return res.status(500).json({
            success: false,
            message: "Error fetching dashboard data",
            error: error.message
        });
    }
};

/**
 * Get All Users
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getAllUsers = async (req, res) => {
    try {
        const query = req.query.query || '';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const role = req.query.role;

        // Build search criteria
        const searchCriteria = {
            $and: [
                role ? { role } : {},
                query ? {
                    $or: [
                        { name: { $regex: query, $options: 'i' } },
                        { email: { $regex: query, $options: 'i' } },
                        { phoneNumber: { $regex: query, $options: 'i' } }
                    ]
                } : {}
            ]
        };

        // Get users
        const users = await User.find(searchCriteria)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .select('-tokens -password -__v');
        
        const totalUsers = await User.countDocuments(searchCriteria);

        // Return JSON response
        res.json({
            success: true,
            users,
            totalUsers,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit)
        });
    } catch (error) {
        dbgr("🛑 Get All Users Error:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching users",
            error: error.message
        });
    }
};

/**
 * Update User Role
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role specified"
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true, runValidators: true }
        ).select('-tokens -password -__v');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: `User role updated to ${role}`,
            user
        });
    } catch (error) {
        dbgr("🛑 Update User Role Error:", error);
        res.status(500).json({
            success: false,
            message: "Error updating user role",
            error: error.message
        });
    }
};

/**
 * Delete User
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent deleting super-admin
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.role === 'super-admin') {
            return res.status(403).json({
                success: false,
                message: "Cannot delete a super admin account"
            });
        }

        await User.findByIdAndDelete(userId);

        res.json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        dbgr("🛑 Delete User Error:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting user",
            error: error.message
        });
    }
};

module.exports = {
    getSuperAdminDashboard,
    getAllUsers,
    updateUserRole,
    deleteUser
}; 
const express = require("express");
const router = express.Router();
const path = require("path");

// 🛡️ Middleware imports
const superAdminAuthMiddleware = require("../middlewares/super-admin-auth-middleware");

// 📸 Multer for file uploads
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// 🎯 Controller imports
const {
    getSuperAdminDashboard,
    getAllUsers,
    updateUserRole,
    deleteUser
} = require("../controllers/super-admin.controller");

// Import admin controllers to reuse product functionality
const {
    searchAdminMod,
    createProduct,
    deleteProduct,
    updatePageP,
    editProduct,
    getCategories
} = require("../controllers/admin.controller");

// Import user controllers for auth
const {
    authGoogle,
    initiatePhoneVerification,
    verifyPhoneCode,
    registerWithPhone,
    loginUser
} = require("../controllers/user.controller");

// Import enquiry controller
const {
    getAllEnquiries,
    updateEnquiryStatus,
    deleteEnquiry
} = require("../controllers/enquiry.controller");

/*  
=========================
 🔐 Super Admin Authentication 
=========================
*/

// Super Admin login routes - reuse the same auth endpoints as admin
router.post("/login", loginUser);
router.get("/auth/google", (req, res, next) => {
    // Store super admin redirect in session
    req.session.isSuperAdminLogin = true;
    req.session.save(() => {
        next();
    });
}, authGoogle);

// Phone authentication routes for super admin
router.post("/auth/phone/send-code", initiatePhoneVerification);
router.post("/auth/phone/verify-code", verifyPhoneCode);
router.post("/auth/phone/register", registerWithPhone);

/*  
=========================
 🎩 Super Admin Dashboard 
=========================
*/

// Main dashboard route - handle both API and frontend requests
router.get("/", superAdminAuthMiddleware, (req, res) => {
    // Check if this is an API request
    if (req.headers.accept?.includes('application/json') || 
        req.headers['x-requested-with'] === 'XMLHttpRequest' ||
        req.path.includes('/api')) {
        return getSuperAdminDashboard(req, res);
    }
    // For regular browser requests, let the React router handle it
    res.sendFile(path.join(__dirname, '../public/dist/index.html'));
});

// API endpoints for dashboard data
router.get("/api", superAdminAuthMiddleware, getSuperAdminDashboard);
router.get("/users", superAdminAuthMiddleware, getAllUsers);
router.put("/users/:userId/role", superAdminAuthMiddleware, updateUserRole);
router.delete("/users/:userId", superAdminAuthMiddleware, deleteUser);

/*  
=========================
 🛍️ Product Management 
=========================
*/

// Product management endpoints
router.get("/products", superAdminAuthMiddleware, searchAdminMod);
router.post("/products/create", superAdminAuthMiddleware, upload.array('images', 7), createProduct);
router.delete("/products/:productid", superAdminAuthMiddleware, deleteProduct);

// Product edit endpoints - handle both API and frontend requests
router.get("/products/:productid/edit", superAdminAuthMiddleware, (req, res) => {
    // Check if this is an API request
    if (req.headers.accept?.includes('application/json') || 
        req.headers['x-requested-with'] === 'XMLHttpRequest') {
        return updatePageP(req, res);
    }
    // For regular browser requests, let the React router handle it
    res.sendFile(path.join(__dirname, '../public/dist/index.html'));
});

// API endpoint for updating product
router.post("/products/:productid", superAdminAuthMiddleware, editProduct);

// Get all categories
router.get("/categories", superAdminAuthMiddleware, getCategories);

/*  
=========================
 📝 Enquiry Management 
=========================
*/

// Get all enquiries
router.get("/enquiries", superAdminAuthMiddleware, getAllEnquiries);
router.get("/enquiries/api", superAdminAuthMiddleware, getAllEnquiries);

// Delete enquiry
router.delete("/enquiries/:enquiryId", superAdminAuthMiddleware, deleteEnquiry);

// Update enquiry status
router.patch("/enquiries/:enquiryId/status", superAdminAuthMiddleware, updateEnquiryStatus);

// 🚀 Export router
module.exports = router; 
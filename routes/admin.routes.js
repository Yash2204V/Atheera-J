const express = require("express");
const router = express.Router();
const path = require("path");

// 🛡️ Middleware imports
const adminAuthMiddleware = require("../middlewares/admin-auth-middleware");
const { requireAuth } = require("../middlewares/auth-middleware");
const upload = require("../middlewares/upload-middleware");

// 🎯 Controller imports
const {
    searchAdminMod,
    createProduct,
    deleteProduct,
    updatePageP,
    editProduct,
    getCategories,
    makeAdmin,
} = require("../controllers/admin.controller");
const {
    getAllEnquiries,
    updateEnquiryStatus,
    deleteEnquiry
} = require("../controllers/enquiry.controller");

// Import user controllers that we'll use for admin auth
const {
    authGoogle,
    initiatePhoneVerification,
    verifyPhoneCode,
    registerWithPhone,
    loginUser
} = require("../controllers/user.controller");

/*  
=========================
 🔐 Admin Authentication 
=========================
*/

// Admin login routes
router.post("/login", loginUser); // Reuse the login function but check for admin role
router.get("/auth/google", (req, res, next) => {
    // Store admin redirect in session
    req.session.isAdminLogin = true;
    req.session.save(() => { // Ensure session is saved before continuing
        next();
    });
}, authGoogle);

// Phone authentication routes for admin
router.post("/auth/phone/send-code", initiatePhoneVerification);
router.post("/auth/phone/verify-code", verifyPhoneCode);
router.post("/auth/phone/register", registerWithPhone);

/*  
=========================
 🎩 Admin Dashboard 
=========================
*/

// 🔍 Get admin panel data (HTML & API)
router.get("/", adminAuthMiddleware, (req, res) => {
    // Check if this is an API request
    if (req.headers.accept?.includes('application/json') || 
        req.headers['x-requested-with'] === 'XMLHttpRequest' ||
        req.path.includes('/api')) {
        return searchAdminMod(req, res);
    }
    // For regular browser requests, let the React router handle it
    res.sendFile(path.join(__dirname, '../public/dist/index.html'));
});
router.get("/api", adminAuthMiddleware, searchAdminMod);

// ➕ Create a new product (allows up to 7 images)
router.post("/create", upload.array('images', 7), adminAuthMiddleware, createProduct);

// ❌ Delete a product by ID
router.get("/delete/:productid", adminAuthMiddleware, deleteProduct);
router.delete("/products/:productid/delete", adminAuthMiddleware, deleteProduct);

// ✏️ Get edit page for a product
router.get("/edit/:productid", adminAuthMiddleware, updatePageP);
router.get("/edit/:productid/api", adminAuthMiddleware, updatePageP);

// 🛠️ Edit a product's details
router.post("/edit/:productid", adminAuthMiddleware, editProduct);
router.put("/products/:productid/update", adminAuthMiddleware, editProduct);

// Get all categories
router.get("/categories", adminAuthMiddleware, getCategories);

/*  
=========================
 📝 Enquiry Management 
=========================
*/

// Get all enquiries
router.get("/enquiries", adminAuthMiddleware, getAllEnquiries);
router.get("/enquiries/api", adminAuthMiddleware, getAllEnquiries);

// Delete enquiry
router.delete("/enquiries/:enquiryId", adminAuthMiddleware, deleteEnquiry);

// Update enquiry status
router.patch("/enquiries/:enquiryId/status", adminAuthMiddleware, updateEnquiryStatus);

/*  
=========================
 👥 User Routes 
=========================
*/

// 🔑 Make a user an admin with a valid passcode
router.get("/makeAdmin", requireAuth, makeAdmin);

// 🚀 Export router
module.exports = router; 
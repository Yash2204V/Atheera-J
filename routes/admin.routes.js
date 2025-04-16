const express = require("express");
const router = express.Router();

// 🛡️ Middleware imports
const adminAuthMiddleware = require("../middlewares/admin-auth-middleware");
const authMiddleware = require("../middlewares/auth-middleware");

// 🎯 Controller imports
const {
    searchAdminMod,
    createProduct,
    deleteProduct,
    updatePageP,
    editProduct,
    makeAdmin
} = require("../controllers/admin.controller");

// 📸 Multer for file uploads
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/*  
=========================
 🎩 Admin Routes 
=========================
*/

// 🔍 Get admin panel data
router.get("/", adminAuthMiddleware, searchAdminMod);

// ➕ Create a new product (allows up to 7 images)
router.post("/create", upload.array('images', 7), adminAuthMiddleware, createProduct);


// ❌ Delete a product by ID
router.get("/delete/:productid", adminAuthMiddleware, deleteProduct);

// ✏️ Get edit page for a product
router.get("/edit/:productid", adminAuthMiddleware, updatePageP);

// 🛠️ Edit a product's details
router.post("/edit/:productid", adminAuthMiddleware, editProduct);

/*  
=========================
 👥 User Routes 
=========================
*/

// 🔑 Make a user an admin with a valid passcode
router.get("/makeAdmin", authMiddleware, makeAdmin);

// 🚀 Export router
module.exports = router;

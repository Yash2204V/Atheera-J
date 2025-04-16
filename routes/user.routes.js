// 🌟 Import Required Modules
const express = require("express");
const router = express.Router();

// 🔐 Import Middleware & Controllers
const authMiddleware = require("../middlewares/auth-middleware");
const { authGoogle, authGoogleCallback, logout, loginPage } = require("../controllers/user.controller");

// 📌 ================== ROUTES ================== 📌

// 🔗 Google Authentication
router.get("/auth/google", authGoogle); // 🔹 Initiate Google Login
router.get("/auth/google/callback", authGoogleCallback); // 🔹 Google Auth Callback

// 🚪 Logout Route (Protected)
router.get("/logout", authMiddleware, logout);

// 🧐 Login-Page
router.get("/login", loginPage)
router.get("/login-page", loginPage);

// 🚀 Export Router
module.exports = router;

const express = require("express");
const { requireAuth } = require("../middlewares/auth-middleware");
const router = express.Router();
const {singleProductMail, multipleProductMail} = require("../controllers/mail.controller");

// 📩 Send Mail: Single Product 🛍️
router.get("/single/:productid", requireAuth, singleProductMail);

// 📩 Send Mail: Multiple Products 📦📦
router.get("/multiple", requireAuth, multipleProductMail);

module.exports = router;

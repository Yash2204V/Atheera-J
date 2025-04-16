const express = require("express");
const authMiddleware = require("../middlewares/auth-middleware");
const router = express.Router();
const { singleProductMail, multipleProductMail } = require("../controllers/mail.controller");

/**
 * @route GET /products/enquiry/single/:productid
 * @desc Send enquiry email for a single product
 * @access Private (requires authentication)
 */
router.get("/single/:productid", authMiddleware, singleProductMail);

/**
 * @route GET /products/enquiry/multiple
 * @desc Send enquiry email for multiple products in cart
 * @access Private (requires authentication)
 */
router.get("/multiple", authMiddleware, multipleProductMail);

module.exports = router;
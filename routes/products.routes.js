const express = require("express");
const { requireAuth } = require("../middlewares/auth-middleware");
const router = express.Router();
const mailRoute = require("./mail.routes");
const { product, shop, cart, addCart, updateCart, deleteCart, getCategories, addCategory, addSubCategory, addSubSubCategory, getCategoryRelationships } = require("../controllers/products.controller");
const Category = require("../sample/categories");

// 🛒 Cart Routes (Highest precedence)
router.get("/cart", requireAuth, cart);
router.get("/cart/api", requireAuth, (req, res) => {
  // This endpoint will only return JSON data for the cart
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "You must be logged in to view your cart"
    });
  }
  
  // Process the cart data similar to the cart controller but always return JSON
  req.headers.accept = 'application/json';
  req.headers['x-requested-with'] = 'XMLHttpRequest';
  return cart(req, res);
});
router.get("/addtocart/:productid", requireAuth, addCart);
router.post("/cart/add", requireAuth, addCart);
router.get("/deleted/:productid", requireAuth, deleteCart);
router.post("/cart/remove/:productid", requireAuth, deleteCart);
router.post("/cart/update/:productid", requireAuth, updateCart);
router.post("/cart/update", requireAuth, updateCart);

// 🛍️ Shop Routes
router.get("/shop", (req, res, next) => {
  // If it's an API request, handle it with the shop controller
  if (req.headers.accept?.includes('application/json') || 
      req.headers['x-requested-with'] === 'XMLHttpRequest' ||
      req.query.format === 'json') {
    return shop(req, res);
  }
  // For browser requests, let it pass through to the React app
  next();
});

// Categories API endpoints
router.get("/categories", getCategories);
router.get("/category-relationships", getCategoryRelationships);
router.post("/categories/add", addCategory);
router.post("/categories/sub/add", addSubCategory);
router.post("/categories/subsub/add", addSubSubCategory);

// 📦 Product Detail Routes - handle both URL patterns
router.get("/product/:id", (req, res, next) => {
  // Check if this is an API request
  if (req.headers.accept?.includes('application/json') || 
      req.headers['x-requested-with'] === 'XMLHttpRequest') {
    // Ensure id is a string before passing to product controller
    req.params.id = req.params.id.toString();
    return product(req, res);
  }
  // For browser requests, let it pass through to the React app
  next();
});

// ⚠️ Catch-all route MUST come last
router.get("/:id", (req, res, next) => {
  // Skip processing for special routes
  if (req.params.id === 'cart' || 
      req.params.id === 'shop' || 
      req.params.id === 'api' || 
      req.params.id === 'categories') {
    return next();
  }
  
  // Check if this is an API request
  if (req.headers.accept?.includes('application/json') || 
      req.headers['x-requested-with'] === 'XMLHttpRequest') {
    // Ensure id is a string before passing to product controller
    req.params.id = req.params.id.toString();
    return product(req, res);
  }
  // For browser requests, let it pass through to the React app
  next();
}); 

// 📧 Enquiry Mail
router.use("/enquiry", mailRoute);

module.exports = router;

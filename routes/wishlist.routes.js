const express = require('express');
const { requireAuth } = require('../middlewares/auth-middleware');
const router = express.Router();
const {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    checkWishlistStatus
} = require('../controllers/wishlist.controller');

// Get wishlist
router.get('/', requireAuth, getWishlist);

// Add to wishlist
router.post('/add/:productId', requireAuth, addToWishlist);

// Remove from wishlist
router.delete('/remove/:productId', requireAuth, removeFromWishlist);

// Check if product is in wishlist
router.get('/check/:productId', requireAuth, checkWishlistStatus);

module.exports = router; 
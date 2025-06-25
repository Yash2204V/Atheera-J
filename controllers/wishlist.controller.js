const Wishlist = require('../models/wishlist.model');
const Product = require('../models/product.model');
const dbgr = require('debug')('development: wishlist-controller');

/**
 * Get user's wishlist
 */
const getWishlist = async (req, res) => {
    try {
        const user = req.user;
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Please login to view your wishlist'
            });
        }

        // Find or create wishlist for user
        let wishlist = await Wishlist.findOne({ user: user._id })
            .populate('products.product');

        if (!wishlist) {
            wishlist = new Wishlist({ user: user._id, products: [] });
            await wishlist.save();
        }

        // Filter out products that have been deleted and format remaining products
        const validProducts = wishlist.products.filter(item => item.product != null);
        
        // If there were deleted products, update the wishlist
        if (validProducts.length !== wishlist.products.length) {
            wishlist.products = validProducts;
            await wishlist.save();
        }

        // Format product images for client
        const formattedProducts = validProducts.map(item => {
            const product = item.product.toObject();
            if (product.images && product.images.length > 0) {
                product.images = product.images.map(image => {
                    if (image.imageBuffer) {
                        return `data:${image.contentType || 'image/jpeg'};base64,${image.imageBuffer.toString('base64')}`;
                    }
                    return image;
                });
            }
            return {
                ...product,
                addedAt: item.addedAt
            };
        });

        return res.json({
            success: true,
            wishlist: formattedProducts
        });
    } catch (error) {
        dbgr('🛑 Get Wishlist Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch wishlist',
            error: error.message
        });
    }
};

/**
 * Add product to wishlist
 */
const addToWishlist = async (req, res) => {
    try {
        const user = req.user;
        const { productId } = req.params;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Please login to add items to wishlist'
            });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Find or create wishlist
        let wishlist = await Wishlist.findOne({ user: user._id });
        if (!wishlist) {
            wishlist = new Wishlist({ user: user._id, products: [] });
        }

        // Check if product already in wishlist
        const existingProduct = wishlist.products.find(
            item => item.product.toString() === productId
        );

        if (existingProduct) {
            return res.json({
                success: true,
                message: 'Product already in wishlist'
            });
        }

        // Add product to wishlist
        wishlist.products.push({ product: productId });
        await wishlist.save();

        return res.json({
            success: true,
            message: 'Product added to wishlist'
        });
    } catch (error) {
        dbgr('🛑 Add to Wishlist Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add product to wishlist',
            error: error.message
        });
    }
};

/**
 * Remove product from wishlist
 */
const removeFromWishlist = async (req, res) => {
    try {
        const user = req.user;
        const { productId } = req.params;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Please login to remove items from wishlist'
            });
        }

        // Find wishlist
        const wishlist = await Wishlist.findOne({ user: user._id });
        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: 'Wishlist not found'
            });
        }

        // Remove product from wishlist
        wishlist.products = wishlist.products.filter(
            item => item.product.toString() !== productId
        );
        await wishlist.save();

        return res.json({
            success: true,
            message: 'Product removed from wishlist'
        });
    } catch (error) {
        dbgr('🛑 Remove from Wishlist Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to remove product from wishlist',
            error: error.message
        });
    }
};

/**
 * Check if product is in wishlist
 */
const checkWishlistStatus = async (req, res) => {
    try {
        const user = req.user;
        const { productId } = req.params;

        if (!user) {
            return res.json({
                success: true,
                inWishlist: false
            });
        }

        const wishlist = await Wishlist.findOne({ user: user._id });
        if (!wishlist) {
            return res.json({
                success: true,
                inWishlist: false
            });
        }

        const inWishlist = wishlist.products.some(
            item => item.product.toString() === productId
        );

        return res.json({
            success: true,
            inWishlist
        });
    } catch (error) {
        dbgr('🛑 Check Wishlist Status Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to check wishlist status',
            error: error.message
        });
    }
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    checkWishlistStatus
}; 
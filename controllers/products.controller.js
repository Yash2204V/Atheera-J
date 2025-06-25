/**
 * Products Controller
 * Handles product listing, details, and cart operations
 */

const Product = require("../models/product.model");
const Category = require("../sample/categories");
const dbgr = require("debug")("development: products-controller");
const path = require("path");

// Helper function to convert image buffers to base64 strings
const formatProductImagesForClient = (products) => {
    if (Array.isArray(products)) {
        return products.map(product => {
            const formattedProduct = product.toObject ? product.toObject() : { ...product };
            
            if (formattedProduct.images && formattedProduct.images.length > 0) {
                formattedProduct.images = formattedProduct.images.map(image => {
                    if (image.imageBuffer) {
                        return `data:${image.contentType || 'image/jpeg'};base64,${image.imageBuffer.toString('base64')}`;
                    }
                    return image; // Keep as is if already formatted
                });
            }
            
            return formattedProduct;
        });
    } else if (products) {
        const formattedProduct = products.toObject ? products.toObject() : { ...products };
        
        if (formattedProduct.images && formattedProduct.images.length > 0) {
            formattedProduct.images = formattedProduct.images.map(image => {
                if (image.imageBuffer) {
                    return `data:${image.contentType || 'image/jpeg'};base64,${image.imageBuffer.toString('base64')}`;
                }
                return image; // Keep as is if already formatted
            });
        }
        
        return formattedProduct;
    }
    
    return products;
};

/**
 * Shop page - Lists products with filtering and sorting
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const shop = async (req, res) => {
    try {
        // Extract query parameters with defaults
        const { 
            query = '', 
            sortBy = 'createdAt', 
            sortOrder = 'desc', 
            page = 1,
            category = '',
            subCategory = '',
            subSubCategory = '',
            minPrice = '',
            maxPrice = ''
        } = req.query;
        
        const DEFAULT_LIMIT = 20;
        const pageNum = parseInt(page, 10);
        
        // Sorting order
        const order = sortOrder === 'desc' ? -1 : 1;

        // Build search criteria
        const searchCriteria = {};
        
        // Add text search if query exists
        if (query) {
            searchCriteria.$or = [
                { title: { $regex: query, $options: 'i' } },
                { category: { $regex: query, $options: 'i' } },
                { subCategory: { $regex: query, $options: 'i' } },
                { subSubCategory: { $regex: query, $options: 'i' } }
            ];
        }
        
        // Add category filter if provided
        if (category) {
            searchCriteria.category = category;
        }
        
        // Add subcategory filter if provided
        if (subCategory) {
            searchCriteria.subCategory = subCategory;
        }
        
        // Add sub-subcategory filter if provided
        if (subSubCategory) {
            searchCriteria.subSubCategory = subSubCategory;
        }
        
        // Add price range filter if provided
        if (minPrice || maxPrice) {
            searchCriteria['variants.price'] = {};
            
            if (minPrice) {
                searchCriteria['variants.price'].$gte = parseInt(minPrice, 10);
            }
            
            if (maxPrice) {
                searchCriteria['variants.price'].$lte = parseInt(maxPrice, 10);
            }
        }

        // Count total products matching criteria
        const totalProducts = await Product.find(searchCriteria).countDocuments();
        
        // Calculate total pages
        const totalPages = Math.ceil(totalProducts / DEFAULT_LIMIT);

        // Handle special sorting cases
        let products;
        if (sortBy === 'variants.0.price') {
            // For price sorting, use aggregation
            products = await Product.aggregate([
                { $match: searchCriteria },
                { $addFields: {
                    effectivePrice: {
                        $cond: {
                            if: { $gt: [{ $arrayElemAt: ['$variants.discount', 0] }, 0] },
                            then: { $arrayElemAt: ['$variants.discount', 0] },
                            else: { $arrayElemAt: ['$variants.price', 0] }
                        }
                    }
                }},
                { $sort: { effectivePrice: order } },
                { $skip: (pageNum - 1) * DEFAULT_LIMIT },
                { $limit: DEFAULT_LIMIT }
            ]);
        } else if (sortBy === 'rating') {
            // For rating sorting, use aggregation to convert quality to number
            products = await Product.aggregate([
                { $match: searchCriteria },
                { $addFields: {
                    rating: {
                        $let: {
                            vars: {
                                quality: { $arrayElemAt: ['$variants.quality', 0] }
                            },
                            in: {
                                $cond: {
                                    if: { $isNumber: '$$quality' },
                                    then: '$$quality',
                                    else: {
                                        $cond: {
                                            if: { $regexMatch: { input: '$$quality', regex: /^\d+$/ } },
                                            then: { $toInt: '$$quality' },
                                            else: 0
                                        }
                                    }
                                }
                            }
                        }
                    }
                }},
                { $sort: { rating: order } },
                { $skip: (pageNum - 1) * DEFAULT_LIMIT },
                { $limit: DEFAULT_LIMIT }
            ]);
        } else {
            // For other sorting options, use regular find
            products = await Product.find(searchCriteria)
                .sort({ [sortBy]: order })
                .skip((pageNum - 1) * DEFAULT_LIMIT)
                .limit(DEFAULT_LIMIT);
        }
            
        // Format images for client
        const formattedProducts = formatProductImagesForClient(products);
        
        // Return JSON response
        return res.json({
            success: true,
            products: formattedProducts,
            categories: Category,
            currentPage: pageNum,
            searchQuery: query,
            totalProducts,
            sortBy,
            sortOrder,
            category,
            subCategory,
            subSubCategory,
            minPrice,
            maxPrice,
            pagination: {
                currentPage: pageNum,
                totalPages: totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });
    } catch (error) {
        dbgr("🛑 Shop Error:", error);
        
        // Return error response
        res.status(500).json({ 
            success: false,
            message: "Failed to load products. Please try again.",
            error: error.message
        });
    }
};

/**
 * Product details page
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const product = async (req, res) => {
    try {
        // Ensure we have a valid ID string
        const productId = req.params.id.toString();
        
        // Get product by ID
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).json({ 
                success: false,
                message: "Product not found"
            });
        }

        // Get related products (same category and subcategory)
        const relatedProducts = await Product.find({
            _id: { $ne: product._id },
            category: product.category,
            subCategory: product.subCategory
        }).limit(4);
        
        // Format images for client
        const formattedProduct = formatProductImagesForClient(product);
        const formattedRelatedProducts = formatProductImagesForClient(relatedProducts);

        // Return JSON response
        return res.json({ 
            success: true,
            product: formattedProduct,
            relatedProducts: formattedRelatedProducts,
        });
    } catch (error) {
        dbgr("🛑 Product Fetch Error:", error);
        
        // Return error response
        res.status(500).json({ 
            success: false,
            message: "Error loading product",
            error: error.message
        });
    }
};

/**
 * Cart page
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const cart = async (req, res) => {
    try {
        const user = req.user;
        
        if (!user) {
            // For API requests, return JSON
            if (req.headers['x-requested-with'] === 'XMLHttpRequest' || 
                (req.headers.accept && req.headers.accept.includes('application/json'))) {
                return res.status(401).json({
                    success: false,
                    message: "You must be logged in to view your cart"
                });
            }
            
            // For browser requests, redirect to login
            return res.redirect('/user/login?redirect=/products/cart');
        }
        
        // Check if this is an API request
        const isApiRequest = req.path.endsWith('/api') || 
                            req.headers['x-requested-with'] === 'XMLHttpRequest' || 
                            (req.headers.accept && req.headers.accept.includes('application/json'));
        
        // For API requests, process and return JSON data
        if (isApiRequest) {
            // Populate cart with product details
            await user.populate("cart.product");
            
            // Filter out null products (products that were deleted)
            user.cart = user.cart.filter(item => item.product !== null);
            
            // Calculate total price
            let totalPrice = 0;
            let totalDiscount = 0;
            let subtotal = 0;
            
            for (const item of user.cart) {
                const product = item.product;
                
                if (product) {
                    const variant = product.variants.find(p => p.size === item.size) || product.variants[0];
                    const originalPrice = variant ? variant.price : 0;
                    const discountedPrice = variant && variant.discount ? variant.discount : originalPrice;
                    
                    subtotal += originalPrice * item.quantity;
                    totalPrice += discountedPrice * item.quantity;
                    totalDiscount += (originalPrice - discountedPrice) * item.quantity;
                }
            }
            
            const finalTotal = totalPrice;
            
            // Format product images for client
            const formattedCart = user.cart.map(item => {
                const cartItem = item.toObject ? item.toObject() : { ...item };
                
                if (cartItem.product) {
                    cartItem.product = formatProductImagesForClient(cartItem.product);
                }
                
                return cartItem;
            });
            
            // Return JSON response
            return res.json({ 
                success: true,
                cart: formattedCart,
                cartSummary: {
                    subtotal,
                    discount: totalDiscount,
                    total: finalTotal
                },
                messages: {
                    success: req.session.cartSuccess || '',
                    error: req.session.cartError || ''
                }
            });
        }
        
        // For regular browser requests, always serve the React app's HTML file
        return res.sendFile(path.join(__dirname, '../public/dist/index.html'));
        
    } catch (error) {
        dbgr("🛑 Cart Error:", error);
        
        // Check if this is an API request
        const isApiRequest = req.path.endsWith('/api') || 
                            req.headers['x-requested-with'] === 'XMLHttpRequest' || 
                            (req.headers.accept && req.headers.accept.includes('application/json'));
        
        if (isApiRequest) {
            // Return JSON error response for API requests
            res.status(500).json({ 
                success: false,
                message: "Failed to load cart. Please try again.",
                error: error.message
            });
        } else {
            // For regular browser requests, serve the React app's HTML file
            return res.sendFile(path.join(__dirname, '../public/dist/index.html'));
        }
    } finally {
        // Clear session messages after sending
        req.session.cartSuccess = '';
        req.session.cartError = '';
    }
};

/**
 * Add product to cart
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const addCart = async (req, res) => {
    try {
        const { productid } = req.params;
        const { quantity = 1, size = "None", direct } = req.query;
        const user = req.user;
        
        // Check if this is an AJAX request
        const isAjaxRequest = req.headers['x-requested-with'] === 'XMLHttpRequest' || 
                            (req.headers.accept && req.headers.accept.includes('application/json'));
        
        // Validate inputs
        if (!user) {
            if (isAjaxRequest) {
                return res.status(401).json({ 
                    success: false,
                    message: "User not found" 
                });
            }
            return res.redirect('/user/login?redirect=/products/cart');
        }
        
        if (!productid) {
            if (isAjaxRequest) {
                return res.status(400).json({ 
                    success: false,
                    message: "Invalid product" 
                });
            }
            req.session.cartError = "Invalid product";
            return res.redirect("/products/cart");
        }

        // Get product details
        const product = await Product.findById(productid);
        
        if (!product) {
            if (isAjaxRequest) {
                return res.status(404).json({ 
                    success: false,
                    message: "Product not found" 
                });
            }
            req.session.cartError = "Product not found";
            return res.redirect("/products/cart");
        }
        
        const { category, subCategory, subSubCategory, variants } = product;
        
        // Check if product is available
        if (!product.availability) {
            if (isAjaxRequest) {
                return res.status(400).json({ 
                    success: false,
                    message: "Product is out of stock" 
                });
            }
            req.session.cartError = "Product is out of stock";
            return direct ? 
                res.redirect("/products/cart") : 
                res.redirect(`/products/${productid}`);
        }
        
        // Find selected variant
        const selectedVariant = variants.find(v => v.size === size) || variants[0];
        
        // Check if variant has stock
        if (selectedVariant.quantity < parseInt(quantity)) {
            if (isAjaxRequest) {
                return res.status(400).json({ 
                    success: false,
                    message: `Only ${selectedVariant.quantity} items available` 
                });
            }
            req.session.cartError = `Only ${selectedVariant.quantity} items available`;
            return direct ? 
                res.redirect("/products/cart") : 
                res.redirect(`/products/${productid}`);
        }

        // Check if product already exists in cart with same size
        const cartItem = user.cart.find(item => 
            item.product.toString() === productid && 
            item.size === selectedVariant.size
        );
        
        if (cartItem) {
            // Update quantity if product exists
            const newQuantity = cartItem.quantity + parseInt(quantity);
            
            // Check if new quantity exceeds stock
            if (newQuantity > selectedVariant.quantity) {
                if (isAjaxRequest) {
                    return res.status(400).json({ 
                        success: false,
                        message: `Cannot add more than ${selectedVariant.quantity} items` 
                    });
                }
                req.session.cartError = `Cannot add more than ${selectedVariant.quantity} items`;
                return direct ? 
                    res.redirect("/products/cart") : 
                    res.redirect(`/products/${productid}`);
            }
            
            cartItem.quantity = newQuantity;
        } else {
            // Add new item to cart
            user.cart.push({ 
                product: productid, 
                quantity: parseInt(quantity), 
                size: selectedVariant.size, 
                variantId: selectedVariant._id 
            });
        }

        // Save user cart
        await user.save();
        
        // Set success message
        req.session.cartSuccess = "Product added to cart";

        // Return appropriate response based on request type
        if (isAjaxRequest) {
            return res.json({
                success: true,
                message: "Product added to cart"
            });
        }

        // Redirect to cart page instead of back to shop page with filters
        return direct ? 
            res.redirect("/products/cart") : 
            res.redirect(`/products/${productid}`);
    } catch (error) {
        dbgr("🛑 Add to Cart Error:", error);
        
        // Set error message
        req.session.cartError = "Failed to add product to cart";
        
        // Return appropriate response based on request type
        if (req.headers['x-requested-with'] === 'XMLHttpRequest' || 
            (req.headers.accept && req.headers.accept.includes('application/json'))) {
            return res.status(500).json({
                success: false,
                message: "Failed to add product to cart"
            });
        }
        
        // Redirect to product page or shop
        return req.query.direct ? 
            res.redirect("/products/shop") : 
            res.redirect(`/products/${req.params.productid || ''}`);
    }
};

/**
 * Remove product from cart
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const deleteCart = async (req, res) => {
    try {
        const user = req.user;
        const { productid } = req.params;

        // Validate user
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // First try to find item by cart item ID
        let cartItemIndex = user.cart.findIndex(item => item._id.toString() === productid);
        
        // If not found by item ID, try to find by product ID
        if (cartItemIndex === -1) {
            cartItemIndex = user.cart.findIndex(item => item.product && item.product.toString() === productid);
        }
        
        if (cartItemIndex === -1) {
            req.session.cartError = "Product not found in cart";
            return res.redirect("/products/cart");
        }

        // Remove product from cart
        user.cart.splice(cartItemIndex, 1);
        await user.save();
        
        // Set success message
        req.session.cartSuccess = "Product removed from cart";

        // Redirect to cart
        res.redirect("/products/cart");
    } catch (error) {
        dbgr("🛑 Delete from Cart Error:", error);
        
        // Set error message
        req.session.cartError = "Failed to remove product from cart";
        
        // Redirect to cart
        res.redirect("/products/cart");
    }
};

/**
 * Update cart item (quantity and size)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const updateCart = async (req, res) => {
    try {
        const { productid } = req.params;
        const { quantity = 1, size = "None" } = req.body;
        const user = req.user;

        // Validate user
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // First try to find item by cart item ID
        let cartItem = user.cart.find(item => item._id.toString() === productid);
        
        // If not found by item ID, try to find by product ID
        if (!cartItem) {
            cartItem = user.cart.find(item => item.product && item.product.toString() === productid);
        }
        
        if (!cartItem) {
            req.session.cartError = "Product not found in cart";
            return res.redirect("/products/cart");
        }

        // Get product details - need to handle both populated and non-populated cases
        const productId = cartItem.product._id ? cartItem.product._id : cartItem.product;
        const product = await Product.findById(productId);
        
        if (!product) {
            req.session.cartError = "Product not found";
            return res.redirect("/products/cart");
        }
        
        // Find selected variant
        const selectedVariant = product.variants.find(v => v.size === size) || product.variants[0];
        
        // Check if variant has stock
        if (selectedVariant.quantity < parseInt(quantity)) {
            req.session.cartError = `Only ${selectedVariant.quantity} items available`;
            return res.redirect("/products/cart");
        }

        // Update cart item
        cartItem.quantity = parseInt(quantity);
        cartItem.size = size;
        cartItem.variantId = selectedVariant._id;

        // Save user cart
        await user.save();
        
        // Set success message
        req.session.cartSuccess = "Cart updated successfully";

        // Redirect to cart
        res.redirect("/products/cart");
    } catch (error) {
        dbgr("🛑 Update Cart Error:", error);
        
        // Set error message
        req.session.cartError = "Failed to update cart";
        
        // Redirect to cart
        res.redirect("/products/cart");
    }
};

/**
 * Get all categories
 */
const getCategories = async (req, res) => {
    try {
        console.log('Fetching categories from database...'); // Debug log

        // First, let's check if we have any products at all
        const totalProducts = await Product.countDocuments();
        console.log('Total products in database:', totalProducts);

        // Get unique categories, subcategories, and sub-subcategories from products
        const categories = await Product.distinct('category');
        console.log('All categories before filtering:', categories);

        // Get categories excluding 'default'
        const filteredCategories = await Product.distinct('category', { 
            category: { $exists: true, $ne: 'default', $ne: null, $ne: '' } 
        });
        console.log('Filtered categories:', filteredCategories);

        // Get subcategories excluding 'default'
        const subCategories = await Product.distinct('subCategory', { 
            subCategory: { $exists: true, $ne: 'default', $ne: null, $ne: '' } 
        });
        console.log('Filtered subcategories:', subCategories);

        // Get sub-subcategories excluding 'default'
        const subSubCategories = await Product.distinct('subSubCategory', { 
            subSubCategory: { $exists: true, $ne: 'default', $ne: null, $ne: '' } 
        });
        console.log('Filtered sub-subcategories:', subSubCategories);

        // Sort categories alphabetically
        filteredCategories.sort();
        subCategories.sort();
        subSubCategories.sort();

        // Log the final response
        console.log('Sending response with categories:', {
            categories: filteredCategories,
            subCategories,
            subSubCategories
        });

        return res.status(200).json({
            success: true,
            categories: filteredCategories,
            subCategories,
            subSubCategories
        });
    } catch (error) {
        console.error("🛑 Get Categories Error:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Add a new category
 */
const addCategory = async (req, res) => {
    try {
        const { category } = req.body;
        if (!category) {
            return res.status(400).json({
                success: false,
                error: 'Category name is required'
            });
        }

        // Check if category already exists in any product
        const existingCategory = await Product.findOne({ category });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                error: 'Category already exists'
            });
        }

        // No need to create a product, just return success
        return res.status(200).json({
            success: true,
            message: 'Category is available for use'
        });
    } catch (error) {
        console.error("🛑 Add Category Error:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Add a new sub-category
 */
const addSubCategory = async (req, res) => {
    try {
        const { category, subCategory } = req.body;
        if (!category || !subCategory) {
            return res.status(400).json({
                success: false,
                error: 'Category and sub-category names are required'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Sub-category added successfully'
        });
    } catch (error) {
        console.error("🛑 Add Sub-Category Error:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Add a new sub-sub-category
 */
const addSubSubCategory = async (req, res) => {
    try {
        const { category, subCategory, subSubCategory } = req.body;
        if (!category || !subCategory || !subSubCategory) {
            return res.status(400).json({
                success: false,
                error: 'Category, sub-category, and sub-sub-category names are required'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Sub-sub-category added successfully'
        });
    } catch (error) {
        console.error("🛑 Add Sub-Sub-Category Error:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Get category relationships
 */
const getCategoryRelationships = async (req, res) => {
    try {
        // Get all products to build the relationships
        const products = await Product.find({}, 'category subCategory subSubCategory');
        
        // Build relationships map
        const relationships = {};
        
        products.forEach(product => {
            // Skip if any category is default or empty
            if (!product.category || product.category === 'default' ||
                !product.subCategory || product.subCategory === 'default' ||
                !product.subSubCategory || product.subSubCategory === 'default') {
                return;
            }

            if (!relationships[product.category]) {
                relationships[product.category] = {
                    subCategories: new Set(),
                    subSubCategories: {}
                };
            }
            
            // Add subcategory
            relationships[product.category].subCategories.add(product.subCategory);
            
            // Initialize subSubCategories object for this subcategory if it doesn't exist
            if (!relationships[product.category].subSubCategories[product.subCategory]) {
                relationships[product.category].subSubCategories[product.subCategory] = new Set();
            }
            
            // Add sub-subcategory
            relationships[product.category].subSubCategories[product.subCategory].add(product.subSubCategory);
        });
        
        // Convert Sets to Arrays for JSON serialization and sort them
        Object.keys(relationships).forEach(category => {
            relationships[category].subCategories = Array.from(relationships[category].subCategories).sort();
            Object.keys(relationships[category].subSubCategories).forEach(subCategory => {
                relationships[category].subSubCategories[subCategory] = 
                    Array.from(relationships[category].subSubCategories[subCategory]).sort();
            });
        });

        return res.status(200).json({
            success: true,
            relationships
        });
    } catch (error) {
        console.error("🛑 Get Category Relationships Error:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Export controllers
module.exports = {
    shop,
    product,
    cart,
    addCart,
    deleteCart,
    updateCart,
    getCategories,
    addCategory,
    addSubCategory,
    addSubSubCategory,
    getCategoryRelationships
};
const { PASSCODE } = require("../config/environment");
const Product = require("../models/product.model");
const User = require("../models/user.model");
const dbgr = require("debug")("development: admin-controller");
const { uploadMultipleImages, deleteImage } = require("../utils/cloudinary.utils");
const Enquiry = require("../models/enquiry.model");

/**
 * Admin Dashboard - Search and Filter Products
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const searchAdminMod = async (req, res) => {
    try {
        const searchQuery = req.query.query || '';
        const page = parseInt(req.query.page) || 1;
        const DEFAULT_LIMIT = 25;
        const skip = (page - 1) * DEFAULT_LIMIT;

        // Build search criteria
        const searchCriteria = {
            $or: [
                { title: { $regex: searchQuery, $options: 'i' } },
                { category: { $regex: searchQuery, $options: 'i' } },
                { subCategory: { $regex: searchQuery, $options: 'i' } },
                { subSubCategory: { $regex: searchQuery, $options: 'i' } }
            ]
        };

        // Get total count of products
        const totalProducts = await Product.countDocuments(searchCriteria);

        // Get products with pagination
        const products = await Product.find(searchCriteria)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(DEFAULT_LIMIT);

        // Get enquiries count
        const enquiries = await Enquiry.find({})
            .populate('products.product')
            .lean();

        // Filter out enquiries where all products are null (deleted)
        const validEnquiries = enquiries.filter(enquiry => {
            return enquiry.products && enquiry.products.some(item => item.product !== null);
        });

        // Format images for JSON response
        const formattedProducts = products.map(product => {
            const formattedProduct = product.toObject();
            
            // Format images as base64 for JSON response
            if (formattedProduct.images && formattedProduct.images.length > 0) {
                formattedProduct.images = formattedProduct.images.map(image => {
                    if (image.imageBuffer) {
                        return `data:${image.contentType || 'image/jpeg'};base64,${image.imageBuffer.toString('base64')}`;
                    }
                    return image;
                });
            }
            
            return formattedProduct;
        });

        // Return JSON response for API requests
        return res.json({
            success: true,
            products: formattedProducts,
            totalProducts,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / DEFAULT_LIMIT),
            totalEnquiries: validEnquiries.length,
            searchQuery
        });
    } catch (error) {
        dbgr("🛑 Admin Search Error:", error);
        
        // Return JSON error response
        return res.status(500).json({
            success: false,
            message: "Error fetching products",
            error: error.message
        });
    }
};

/**
 * Create Product Controller
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const createProduct = async (req, res) => {
    try {
        // Validate files
        if (!req.files) {
            throw new Error("No images were uploaded. Please upload product images.");
        }
        
        if (req.files.length < 3) {
            throw new Error(`Please upload at least 3 images. You uploaded ${req.files.length} image${req.files.length === 1 ? '' : 's'}.`);
        }
        
        if (req.files.length > 7) {
            throw new Error(`Maximum 7 images allowed. You uploaded ${req.files.length} images.`);
        }

        // Upload images to Cloudinary
        const cloudinaryResults = await uploadMultipleImages(req.files);

        // Convert files to image documents with Cloudinary URLs and optimization info
        const imageDocs = cloudinaryResults.map(result => ({
            url: result.url,
            public_id: result.public_id,
            contentType: 'image/jpeg', // Cloudinary automatically converts images
            optimization: result.optimization // Include optimization information
        }));

        // Parse variants if they're sent as a string
        let variants = req.body.variants;
        if (typeof variants === 'string') {
            try {
                variants = JSON.parse(variants);
            } catch (e) {
                throw new Error("Invalid product variants format. Please check the data and try again.");
            }
        }

        // Validate required fields with descriptive messages
        if (!req.body.title) throw new Error("Product title is required.");
        if (!req.body.category) throw new Error("Product category is required.");
        if (!req.body.subCategory) throw new Error("Product sub-category is required.");
        if (!req.body.subSubCategory) throw new Error("Product sub-sub-category is required.");
        if (!req.body.description) throw new Error("Product description is required.");
        if (!variants || !Array.isArray(variants) || variants.length === 0) {
            throw new Error("At least one product variant is required. Please add size and price details.");
        }

        const productData = {
            ...req.body,
            variants,
            images: imageDocs
        };

        const product = await Product.create(productData);
        
        // Calculate total optimization
        const totalOptimization = imageDocs.reduce((acc, image) => {
            if (image.optimization) {
                acc.totalImages++;
                acc.originalSizes.push(image.optimization.originalSize);
                acc.optimizedSizes.push(image.optimization.optimizedSize);
                acc.reductions.push(image.optimization.reduction);
            }
            return acc;
        }, { totalImages: 0, originalSizes: [], optimizedSizes: [], reductions: [] });

        // Return success response with optimization details
        return res.status(200).json({
            success: true,
            message: "Product created successfully!",
            product: product,
            imageOptimization: {
                totalImages: totalOptimization.totalImages,
                originalSizes: totalOptimization.originalSizes,
                optimizedSizes: totalOptimization.optimizedSizes,
                reductions: totalOptimization.reductions
            }
        });
        
    } catch (error) {
        dbgr("🛑 Create Product Error:", error);
        
        // Get a user-friendly error message
        let errorMessage = error.message;
        
        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            // Extract all validation error messages and join them
            errorMessage = Object.values(error.errors)
                .map(err => err.message)
                .join('. ');
        }
        
        // Handle other specific errors
        if (error.code === 11000) {
            errorMessage = "A product with this title already exists.";
        }
        
        // Return error response with just the error message
        return res.status(400).json({
            success: false,
            error: errorMessage
        });
    }
};

/**
 * Delete Product Controller
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.productid);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                error: "Product not found or already deleted"
            });
        }

        // Delete images from Cloudinary
        for (const image of product.images) {
            if (image.public_id) {
                await deleteImage(image.public_id);
            }
        }

        // Find all enquiries that contain this product
        const enquiries = await Enquiry.find({
            'products.product': req.params.productid
        });

        // For each enquiry, remove the product from its products array
        for (const enquiry of enquiries) {
            // Remove the product from the enquiry's products array
            enquiry.products = enquiry.products.filter(
                item => item.product.toString() !== req.params.productid
            );

            // If the enquiry has no products left, delete the entire enquiry
            if (enquiry.products.length === 0) {
                await Enquiry.findByIdAndDelete(enquiry._id);
            } else {
                await enquiry.save();
            }
        }

        // Delete the product
        await Product.findByIdAndDelete(req.params.productid);
        
        return res.status(200).json({
            success: true,
            message: "Product and associated enquiries deleted successfully"
        });
    } catch (error) {
        dbgr("🛑 Delete Product Error:", error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Get Product for Update Page
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const updatePageP = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.productid });
        
        if (!product) {
            throw new Error("Product not found");
        }
        
        // Format product for JSON response
        const formattedProduct = product.toObject();
        
        // Convert image buffers to base64 strings
        if (formattedProduct.images && formattedProduct.images.length > 0) {
            formattedProduct.images = formattedProduct.images.map(image => {
                if (image.imageBuffer) {
                    return `data:${image.contentType || 'image/jpeg'};base64,${image.imageBuffer.toString('base64')}`;
                }
                return image;
            });
        }
        
        return res.json({
            success: true,
            product: formattedProduct
        });
    } catch (error) {
        dbgr("🛑 Update Page Error:", error);
        
        // Return JSON error response
        return res.status(400).json({
            success: false,
            message: "Failed to fetch product details",
            error: error.message
        });
    }
};

/**
 * Edit Product Controller
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const editProduct = async (req, res) => {
    try {
        const productId = req.params.productid;
        const existingProduct = await Product.findById(productId);
        
        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                error: "Product not found"
            });
        }

        let imageDocs = existingProduct.images;

        // Handle new images if uploaded
        if (req.files && req.files.length > 0) {
            // Delete existing images from Cloudinary
            for (const image of existingProduct.images) {
                if (image.public_id) {
                    await deleteImage(image.public_id);
                }
            }

            // Upload new images to Cloudinary
            const cloudinaryResults = await uploadMultipleImages(req.files);
            imageDocs = cloudinaryResults.map(result => ({
                url: result.url,
                public_id: result.public_id,
                contentType: 'image/jpeg'
            }));
        }

        // Parse variants if they're sent as a string
        let variants = req.body.variants;
        if (typeof variants === 'string') {
            try {
                variants = JSON.parse(variants);
            } catch (e) {
                throw new Error("Invalid product variants format");
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            {
                ...req.body,
                variants,
                images: imageDocs
            },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: updatedProduct
        });
    } catch (error) {
        dbgr("🛑 Edit Product Error:", error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Make User an Admin Controller
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const makeAdmin = async (req, res) => {
    try {
        const passcode = req.query.passcode;

        if (passcode === PASSCODE) {
            const user = await User.findOneAndUpdate(
                { _id: req.user._id },
                { role: "admin" },
                { new: true } // Return updated document
            );

            return res.status(200).json({
                success: true,
                message: "🎉 You are now an admin!",
                user
            });
        }

        return res.status(400).json({
            success: false,
            message: "❌ Invalid passcode!"
        });
    } catch (error) {
        dbgr("🛑 Make Admin Error:", error);
        
        return res.status(500).json({
            success: false,
            message: "⚠️ Internal Server Error",
            error: error.message
        });
    }
};

/**
 * Get all unique categories from products
 */
const getCategories = async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        const subCategories = await Product.distinct('subCategory');
        const subSubCategories = await Product.distinct('subSubCategory');

        return res.status(200).json({
            success: true,
            categories,
            subCategories,
            subSubCategories
        });
    } catch (error) {
        dbgr("🛑 Get Categories Error:", error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

/**
 * Get All Enquiries Controller
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getAllEnquiries = async (req, res) => {
    try {
        const enquiries = await Enquiry.find({})
            .populate('products.product')
            .sort({ createdAt: -1 })
            .lean();

        // Filter out enquiries where all products are null (deleted)
        const validEnquiries = enquiries.filter(enquiry => {
            return enquiry.products && enquiry.products.some(item => item.product !== null);
        });

        return res.json({
            success: true,
            enquiries: validEnquiries
        });
    } catch (error) {
        dbgr("🛑 Get Enquiries Error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching enquiries",
            error: error.message
        });
    }
};

/**
 * Update Enquiry Status Controller
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const updateEnquiryStatus = async (req, res) => {
    try {
        const { enquiryId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        const enquiry = await Enquiry.findByIdAndUpdate(
            enquiryId,
            { status },
            { new: true }
        ).populate('products.product');

        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: "Enquiry not found"
            });
        }

        return res.json({
            success: true,
            message: "Enquiry status updated successfully",
            enquiry
        });
    } catch (error) {
        dbgr("🛑 Update Enquiry Status Error:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating enquiry status",
            error: error.message
        });
    }
};

// Export all controllers
module.exports = {
    searchAdminMod,
    createProduct,
    deleteProduct,
    updatePageP,
    editProduct,
    getCategories,
    getAllEnquiries,
    updateEnquiryStatus,
    makeAdmin
}; 
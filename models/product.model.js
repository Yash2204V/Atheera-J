/**
 * Product Model
 * Defines the schema and methods for product data
 */

const mongoose = require("mongoose");

/**
 * Product Schema
 * Defines the structure and validation for product data
 */

const imageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    public_id: {
        type: String,
        required: true
    }
});

const productSchema = new mongoose.Schema({
    // Basic product information
    // Product images
    images: {
        type: [imageSchema],
        validate: {
            validator: function (val) {
                if (!val || val.length === 0) {
                    throw new Error("At least one image is required");
                }
                if (val.length > 7 || val.length < 3) {
                    throw new Error("You can upload a ranges from 3 to 7 images");
                }
                return true;
            },
            message: props => props.reason
        }
    },
    // Title
    title: {
        type: String,
        required: [true, 'Product title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    // Product details
    description: {
        type: String,
        default: "",
        trim: true,
        required: [true, 'Description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    generalDetails: {
        type: String,
        default: "",
        trim: true,
        required: [true, 'General Details is required'],
        maxlength: [2000, 'General Details cannot exceed 2000 characters']
    },
    // Categorization
    category: {
        type: String,
        enum: {
            values: ["jewellery"],
            message: '{VALUE} is not a supported category'
        },
        required: [true, 'Category is required'],
        trim: true,
        index: true
    },
    subCategory: {
        type: String,
        required: [true, 'Sub-category is required'],
        trim: true,
        index: true
    },
    subSubCategory: {
        type: String,
        required: [true, 'Sub-sub-category is required'],
        trim: true,
        index: true
    },
    quality: {
        type: String,
        required: true,
        default: ""
    },
    // Product variants
    variants: [{
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            auto: true
        },
        modelno: {
            type: String,
            required: [true, 'Model number is required'],
            trim: true
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative']
        },
        discount: {
            type: Number,
            default: 0,
            min: [0, 'Discount cannot be negative'],
            validate: {
                validator: function (value) {
                    return value <= this.price;
                },
                message: 'Discount price cannot be greater than regular price'
            }
        },
        size: {
            type: String,
            enum: {
                values: ["None"],
                message: '{VALUE} is not a supported size'
            },
            default: "None"
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [0, 'Quantity cannot be negative'],
            validate: {
                validator: Number.isInteger,
                message: 'Quantity must be a whole number'
            }
        },
    }],

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
}, {
    timestamps: true
});

// Add indexes for efficient queries
productSchema.index({ title: 'text', category: 'text', subCategory: 'text' });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'variants.price': 1 });

/**
 * Virtual for effective price
 * Returns the lowest price after applying discount
 */
productSchema.virtual('effectivePrice').get(function () {
    if (!this.variants || this.variants.length === 0) return 0;

    return this.variants.reduce((minPrice, variant) => {
        const effectivePrice = variant.discount > 0 ? variant.discount : variant.price;
        return effectivePrice < minPrice ? effectivePrice : minPrice;
    }, Infinity);
});

/**
 * Virtual for total stock
 * Returns the sum of quantities across all variants
 */
productSchema.virtual('totalStock').get(function () {
    if (!this.variants || this.variants.length === 0) return 0;

    return this.variants.reduce((total, variant) => {
        return total + (variant.quantity || 0);
    }, 0);
});

/**
 * Middleware for Dynamic Validation of subCategory & subSubCategory
 */
productSchema.pre("validate", function (next) {
    const validSubCategories = {
        jewellery: ["diamond", "gold"],
    };

    const validSubSubCategories = {
        diamond: ["necklace", "pendant", "earring", "ring", "bracelet"],
        gold: ["necklace", "pendant", "earring", "ring", "bracelet"]
    };

    // Validate subCategory
    if (!validSubCategories[this.category]?.includes(this.subCategory)) {
        return next(new Error(`Invalid sub-category '${this.subCategory}' for the selected category '${this.category}'`));
    }

    // Validate subSubCategory
    if (!validSubSubCategories[this.subCategory]?.includes(this.subSubCategory)) {
        return next(new Error(`Invalid sub-sub-category '${this.subSubCategory}' for the selected sub-category '${this.subCategory}'`));
    }

    next();
});

/**
 * Pre-save middleware to update availability based on stock
 */
productSchema.pre('save', function (next) {
    // Check if any variant has stock
    const hasStock = this.variants.some(variant => variant.quantity > 0);

    // Update availability based on stock
    this.availability = hasStock;

    next();
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
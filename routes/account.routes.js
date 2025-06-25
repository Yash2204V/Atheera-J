const express = require("express");
const { requireAuth } = require("../middlewares/auth-middleware");
const path = require("path");
const router = express.Router();
const User = require("../models/user.model");
const { verifyCode } = require("../utils/twilioClient");

// Account page
router.get("/", requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dist/index.html'));
});

// Account API endpoint
router.get("/api", requireAuth, async (req, res) => {
    try {
        // Fetch fresh user data from database
        const user = await req.user.constructor.findById(req.user._id).lean();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Format dates
        const formattedUser = {
            ...user,
            createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
            updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : null
        };

        res.json({
            success: true,
            user: formattedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching user data",
            error: error.message
        });
    }
});

// Orders API endpoint
router.get("/orders/api", requireAuth, (req,res) => {
    // Ensure orders array exists, default to empty array if undefined
    const orders = req.user.orders || [];
    
    res.json({
        success: true,
        orders: orders
    });
});

// Order details API endpoint
router.get("/orders/:id/api", requireAuth, (req,res) => {
    // Ensure orders array exists, default to empty array if undefined
    const orders = req.user.orders || [];
    const order = orders.find(o => o._id.toString() === req.params.id);
    
    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }
    
    res.json({
        success: true,
        order
    });
});

// Cart API endpoint
router.get("/cart/api", requireAuth, (req,res) => {
    // Ensure cart array exists, default to empty array if undefined
    const cart = req.user.cart || [];
    
    res.json({
        success: true,
        cart: cart
    });
});

// Recently viewed API endpoint
router.get("/recently-viewed/api", requireAuth, async (req, res) => {
  console.log('Recently viewed API endpoint hit:', {
    path: req.path,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    url: req.url,
    method: req.method,
    headers: req.headers
  });
  
  try {
    console.log('Fetching recently viewed products for user:', req.user._id);
    
    // Populate product details for recently viewed items
    const user = await req.user.populate('recentlyViewed.product');
    console.log('User populated with recently viewed products:', user.recentlyViewed.length);
    
    // Sort by most recently viewed and filter out null products
    const recentlyViewed = user.recentlyViewed
      .filter(item => item.product !== null) // Filter out null products
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .map(item => ({
        ...item.product.toObject(),
        viewedAt: item.viewedAt
      }));
    console.log('Formatted recently viewed products:', recentlyViewed.length);

    res.json({
      success: true,
      recentlyViewed
    });
  } catch (error) {
    console.error('Error in recently viewed API:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching recently viewed products",
      error: error.message
    });
  }
});

// Add product to recently viewed
router.post("/recently-viewed/:productId", requireAuth, async (req, res) => {
  try {
    const productId = req.params.productId;
    
    // Remove existing entry if product was already viewed
    req.user.recentlyViewed = req.user.recentlyViewed.filter(
      item => item.product.toString() !== productId
    );
    
    // Add new entry at the beginning
    req.user.recentlyViewed.unshift({
      product: productId,
      viewedAt: new Date()
    });
    
    // Keep only the 20 most recent items
    if (req.user.recentlyViewed.length > 20) {
      req.user.recentlyViewed = req.user.recentlyViewed.slice(0, 20);
    }
    
    await req.user.save();
    
    res.json({
      success: true,
      message: "Product added to recently viewed"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding product to recently viewed",
      error: error.message
    });
  }
});

// Clear recently viewed
router.delete("/recently-viewed", requireAuth, async (req, res) => {
  try {
    req.user.recentlyViewed = [];
    await req.user.save();
    
    res.json({
      success: true,
      message: "Recently viewed products cleared"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error clearing recently viewed products",
      error: error.message
    });
  }
});

// Static pages
router.get("/customer-care", (req, res) => {
    res.redirect('/customer-care');
});

router.get("/terms", (req, res) => {
    res.redirect('/terms');
});

router.get("/promotional-terms", (req, res) => {
    res.redirect('/promotional-terms');
});

router.get("/returns-refund", (req, res) => {
    res.redirect('/returns-refund');
});

router.get("/who-we-are", (req, res) => {
    res.redirect('/who-we-are');
});

// Address Management Routes
router.get("/addresses/api", requireAuth, (req, res) => {
  // Ensure addresses array exists, default to empty array if undefined
  const addresses = req.user.addresses || [];
  
  res.json({
    success: true,
    addresses: addresses
  });
});

// Add new address
router.post("/addresses/add", requireAuth, async (req, res) => {
  try {
    const {
      name,
      phoneNumber,
      street,
      city,
      state,
      country,
      zipCode,
      isDefault
    } = req.body;

    // Validate required fields
    if (!name || !phoneNumber || !street || !city || !state || !country || !zipCode) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // If this is the first address or isDefault is true, set all other addresses to non-default
    if (isDefault) {
      req.user.addresses.forEach(addr => addr.isDefault = false);
    }

    // Add new address
    req.user.addresses.push({
      name,
      phoneNumber,
      street,
      city,
      state,
      country,
      zipCode,
      isDefault: isDefault || req.user.addresses.length === 0 // Make default if first address
    });

    await req.user.save();

    res.json({
      success: true,
      message: "Address added successfully",
      addresses: req.user.addresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding address",
      error: error.message
    });
  }
});

// Update address
router.put("/addresses/:addressId", requireAuth, async (req, res) => {
  try {
    const addressId = req.params.addressId;
    const {
      name,
      phoneNumber,
      street,
      city,
      state,
      country,
      zipCode,
      isDefault
    } = req.body;

    // Validate required fields
    if (!name || !phoneNumber || !street || !city || !state || !country || !zipCode) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Find the address
    const address = req.user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    // If setting as default, update other addresses
    if (isDefault) {
      req.user.addresses.forEach(addr => {
        if (addr._id.toString() !== addressId) {
          addr.isDefault = false;
        }
      });
    }

    // Update address fields
    address.name = name;
    address.phoneNumber = phoneNumber;
    address.street = street;
    address.city = city;
    address.state = state;
    address.country = country;
    address.zipCode = zipCode;
    address.isDefault = isDefault;

    await req.user.save();

    res.json({
      success: true,
      message: "Address updated successfully",
      addresses: req.user.addresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating address",
      error: error.message
    });
  }
});

// Delete address
router.delete("/addresses/:addressId", requireAuth, async (req, res) => {
  try {
    const addressId = req.params.addressId;

    // Find the address
    const address = req.user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    // Remove the address
    req.user.addresses.pull(addressId);

    // If the deleted address was default and there are other addresses,
    // make the first remaining address default
    if (address.isDefault && req.user.addresses.length > 0) {
      req.user.addresses[0].isDefault = true;
    }

    await req.user.save();

    res.json({
      success: true,
      message: "Address deleted successfully",
      addresses: req.user.addresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting address",
      error: error.message
    });
  }
});

// Set default address
router.put("/addresses/:addressId/default", requireAuth, async (req, res) => {
  try {
    const addressId = req.params.addressId;

    // Find the address
    const address = req.user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found"
      });
    }

    // Set all addresses to non-default
    req.user.addresses.forEach(addr => addr.isDefault = false);

    // Set the selected address as default
    address.isDefault = true;

    await req.user.save();

    res.json({
      success: true,
      message: "Default address updated successfully",
      addresses: req.user.addresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating default address",
      error: error.message
    });
  }
});

// Update phone number
router.put("/phone", requireAuth, async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
            });
        }

        // Check if phone number is already registered by another user
        const existingUser = await User.findOne({ 
            phoneNumber, 
            _id: { $ne: req.user._id } // Exclude current user
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "This phone number is already registered to another account"
            });
        }

        // Update phone number
        const user = await User.findById(req.user._id);
        user.phoneNumber = phoneNumber;
        user.phoneVerified = true;
        await user.save();

        // Format dates for response
        const formattedUser = {
            ...user.toObject(),
            createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
            updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : null
        };

        res.json({
            success: true,
            message: "Phone number updated successfully",
            user: formattedUser
        });
    } catch (error) {
        console.error("Error updating phone number:", error);
        res.status(500).json({
            success: false,
            message: "Error updating phone number",
            error: error.message
        });
    }
});

module.exports = router;
/**
 * Mail Controller
 * Handles email sending for product enquiries
 */

const Product = require("../models/product.model");
const transporter = require("../utils/transporter");
const dbgr = require("debug")("development: mail-controller");

// Import config
const { EMAIL, NODE_ENV } = require("../config/environment");

/**
 * Single Product Enquiry Mail
 * Sends an email with details about a single product enquiry
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const singleProductMail = async (req, res) => {
  try {
    const { productid } = req.params;
    const user = req.user;
    const phoneNumber = req.query.query || "N/A";
    const variant = req.query.variant || "N/A";
    // console.log("QUERY:", req.query);
    

    // Validate inputs
    if (!productid) {
      req.flash('error', 'Product ID is required');
      return res.status(400).json({ message: "Product ID is required" });
    }
    
    if (!user) {
      req.flash('error', 'User authentication required');
      return res.status(401).json({ message: "User authentication required" });
    }

    // Fetch product details
    const product = await Product.findById(productid);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.status(404).json({ message: "Product not found" });
    }

    // Get variant details
    const variantDetails = product.variants.find(v => v.size === variant) || product.variants[0];
    
    if (!variantDetails) {
      req.flash('error', 'Variant not found');
      return res.status(404).json({ message: "Variant not found" });
    }
    const effectivePrice = variantDetails.discount || variantDetails.price;
    const formattedDate = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Create email content
    const emailContent = {
      from: `ATHEERA 👗🥻 <${EMAIL}>`,
      to: EMAIL,
      subject: `Product Enquiry - ${product.title} (SKU: ${variantDetails.modelno})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #444c34; border-bottom: 2px solid #444c34; padding-bottom: 10px;">Product Enquiry Details</h1>
          
          <h2 style="color: #34455d; margin-top: 20px;">Customer Information</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #e0e0e0; background-color: #f9f9f9;"><strong>Name:</strong></td>
              
              <td style="padding: 8px; border: 1px solid #e0e0e0;">${user.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e0e0e0; background-color: #f9f9f9;"><strong>Email:</strong></td>
              <td style="padding: 8px; border: 1px solid #e0e0e0;">${user.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e0e0e0; background-color: #f9f9f9;"><strong>Phone:</strong></td>
              <td style="padding: 8px; border: 1px solid #e0e0e0;">${phoneNumber}</td>
            </tr>
          </table>

          <h2 style="color: #34455d; margin-top: 20px;">Product Information</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #e0e0e0; background-color: #f9f9f9;"><strong>SKU/Model No:</strong></td>
              <td style="padding: 8px; border: 1px solid #e0e0e0;">${variantDetails.modelno}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e0e0e0; background-color: #f9f9f9;"><strong>Title:</strong></td>
              <td style="padding: 8px; border: 1px solid #e0e0e0;">${product.title}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e0e0e0; background-color: #f9f9f9;"><strong>Category:</strong></td>
              <td style="padding: 8px; border: 1px solid #e0e0e0;">${product.category} › ${product.subCategory} › ${product.subSubCategory}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e0e0e0; background-color: #f9f9f9;"><strong>Size:</strong></td>
              <td style="padding: 8px; border: 1px solid #e0e0e0;">${variantDetails.size}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e0e0e0; background-color: #f9f9f9;"><strong>Original Price:</strong></td>
              <td style="padding: 8px; border: 1px solid #e0e0e0;">₹${variantDetails.price}</td>
            </tr>
            ${variantDetails.discount ? `
            <tr>
              <td style="padding: 8px; border: 1px solid #e0e0e0; background-color: #f9f9f9;"><strong>Discount:</strong></td>
              <td style="padding: 8px; border: 1px solid #e0e0e0;">₹${variantDetails.price - variantDetails.discount}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px; border: 1px solid #e0e0e0; background-color: #f9f9f9;"><strong>Final Price:</strong></td>
              <td style="padding: 8px; border: 1px solid #e0e0e0; font-weight: bold; color: #d84126;">₹${effectivePrice}</td>
            </tr>
          </table>

          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0; color: #666;">
              <strong>Enquiry Date:</strong> ${formattedDate}
            </p>
          </div>
        </div>
      `,
    };

    // Send email with retry logic
    if (NODE_ENV === 'production') {
      await transporter.sendWithRetry(emailContent);
    } else {
      await transporter.sendMail(emailContent);
    }

    dbgr("✅ Single Product Enquiry Sent!");
    req.flash('success', 'Your enquiry has been sent successfully!');
    res.redirect(`/products/product/${productid}`);
  } catch (err) {
    dbgr("❌ Error in Single Product Enquiry:", err);
    req.flash('error', 'Failed to send enquiry. Please try again.');
    res.status(500).redirect(`/products/product/${req.params.productid || ''}`);
  }
};

/**
 * Multiple Products Enquiry Mail
 * Sends an email with details about multiple products in the cart
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const multipleProductMail = async (req, res) => {
  try {
    const user = req.user;
    const phoneNumber = req.query.query || "N/A";

    // Validate user & cart
    if (!user) {
      req.flash('error', 'User authentication required');
      return res.status(401).json({ message: "User authentication required" });
    }
    
    if (!user?.cart?.length) {
      req.flash('error', 'Your cart is empty. Add products before sending an enquiry.');
      return res.redirect("/products/cart");
    }

    // Fetch products details
    const products = await Promise.all(
      user.cart.map(async (cartItem) => {
        const product = await Product.findById(cartItem.product._id);
        if (!product) return null;

        const variant = product.variants.find(v => v.size === cartItem.size) || product.variants[0];
        const finalPrice = variant.discount || variant.price;

        return {
          id: product._id,
          title: product.title,
          quantity: cartItem.quantity,
          size: cartItem.size,
          modelNo: variant?.modelno || "N/A",
          category: product.category,
          subCategory: product.subCategory,
          subSubCategory: product.subSubCategory,
          originalPrice: variant?.price || "N/A",
          finalPrice: finalPrice,
          totalPrice: finalPrice * cartItem.quantity,
          createdAt: new Date(product.createdAt).toLocaleString()
        };
      })
    );

    // Filter out null entries (products not found)
    const validProducts = products.filter(p => p !== null);
    
    if (validProducts.length === 0) {
      req.flash('error', 'No valid products found in your cart.');
      return res.redirect("/products/cart");
    }

    // Calculate total price
    const totalPrice = validProducts.reduce((sum, product) => sum + product.totalPrice, 0);

    // Create product table rows
    const productRows = validProducts.map(product => `
      <tr>
        <td style="padding: 8px; border: 1px solid #e0e0e0;">${product.id}</td>
        <td style="padding: 8px; border: 1px solid #e0e0e0;">${product.title}</td>
        <td style="padding: 8px; border: 1px solid #e0e0e0;">${product.modelNo}</td>
        <td style="padding: 8px; border: 1px solid #e0e0e0;">${product.category} › ${product.subCategory} › ${product.subSubCategory}</td>
        <td style="padding: 8px; border: 1px solid #e0e0e0;">${product.size}</td>
        <td style="padding: 8px; border: 1px solid #e0e0e0;">${product.quantity}</td>
        <td style="padding: 8px; border: 1px solid #e0e0e0;">₹${product.finalPrice}</td>
        <td style="padding: 8px; border: 1px solid #e0e0e0;">₹${product.totalPrice}</td>
        <td style="padding: 8px; border: 1px solid #e0e0e0;">${product.createdAt}</td>
      </tr>
    `).join('');

    const emailContent = {
      from: `ATHEERA 👗🥻 <${EMAIL}>`,
      to: EMAIL,
      subject: "New Cart Enquiry",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #d84126; border-bottom: 2px solid #d84126; padding-bottom: 10px;">Cart Enquiry Details</h1>
          
          <h2 style="color: #34455d; margin-top: 20px;">Customer Information</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #e0e0e0; background-color: #f9f9f9;"><strong>Name:</strong></td>
              <td style="padding: 8px; border: 1px solid #e0e0e0;">${user.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e0e0e0; background-color: #f9f9f9;"><strong>Email:</strong></td>
              <td style="padding: 8px; border: 1px solid #e0e0e0;">${user.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e0e0e0; background-color: #f9f9f9;"><strong>Phone:</strong></td>
              <td style="padding: 8px; border: 1px solid #e0e0e0;">${phoneNumber}</td>
            </tr>
          </table>

          <h2 style="color: #34455d;">Product Details</h2>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
              <thead>
                <tr style="background-color: #f9f9f9;">
                  <th style="padding: 8px; border: 1px solid #e0e0e0;">ID</th>
                  <th style="padding: 8px; border: 1px solid #e0e0e0;">Title</th>
                  <th style="padding: 8px; border: 1px solid #e0e0e0;">Model No</th>
                  <th style="padding: 8px; border: 1px solid #e0e0e0;">Category</th>
                  <th style="padding: 8px; border: 1px solid #e0e0e0;">Size</th>
                  <th style="padding: 8px; border: 1px solid #e0e0e0;">Quantity</th>
                  <th style="padding: 8px; border: 1px solid #e0e0e0;">Unit Price</th>
                  <th style="padding: 8px; border: 1px solid #e0e0e0;">Total</th>
                  <th style="padding: 8px; border: 1px solid #e0e0e0;">Created Date</th>
                </tr>
              </thead>
              <tbody>
                ${productRows}
              </tbody>
            </table>
          </div>

          <div style="margin-top: 20px; text-align: right; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">
            <h3 style="color: #34455d; margin: 0;">Total Order Value: <span style="color: #d84126;">₹${totalPrice}</span></h3>
          </div>
          
          <p style="margin-top: 20px; color: #666; font-style: italic;">
            Enquiry received on ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    };

    // Send email with retry logic
    if (NODE_ENV === 'production') {
      await transporter.sendWithRetry(emailContent);
    } else {
      await transporter.sendMail(emailContent);
    }

    dbgr("✅ Multiple Product Enquiry Sent!");
    req.flash('success', 'Your enquiry has been sent successfully!');
    res.redirect("/products/cart");
  } catch (err) {
    dbgr("❌ Error in Multiple Product Enquiry:", err);
    req.flash('error', 'Failed to send enquiry. Please try again.');
    res.status(500).redirect("/products/cart");
  }
};

module.exports = { singleProductMail, multipleProductMail };
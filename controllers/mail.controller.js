/**
 * Mail Controller
 * Handles email sending for product enquiries
 */

// Import required modules
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

    // Validate inputs
    if (!productid) {
      return res.status(400).json({ message: "Product ID is required" });
    }
    
    if (!user) {
      return res.status(401).json({ message: "User authentication required" });
    }

    // Fetch product details
    const product = await Product.findById(productid);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get variant details
    const variant = product.variants[0] || {};
    const modelNo = variant.modelno || "N/A";
    const price = variant.price || "N/A";
    const discountPrice = variant.discount || "N/A";

    // Create email content
    const emailContent = {
      from: `ATHEERA 👗🥻 <${EMAIL}>`,
      to: EMAIL,
      subject: "Single Product Enquiry",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #444c34; border-bottom: 2px solid #444c34; padding-bottom: 10px;">Product Enquiry</h1>
          
          <h2 style="color: #34455d; margin-top: 20px;">User Details</h2>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0;">
            <tr>
              <td style="border: 1px solid #e0e0e0; padding: 8px; background-color: #f9f9f9;"><strong>Name:</strong></td>
              <td style="border: 1px solid #e0e0e0; padding: 8px;">${user.name}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #e0e0e0; padding: 8px; background-color: #f9f9f9;"><strong>Email:</strong></td>
              <td style="border: 1px solid #e0e0e0; padding: 8px;">${user.email}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #e0e0e0; padding: 8px; background-color: #f9f9f9;"><strong>Phone No:</strong></td>
              <td style="border: 1px solid #e0e0e0; padding: 8px;">${phoneNumber}</td>
            </tr>
          </table>

          <h2 style="color: #34455d; margin-top: 20px;">Product Details</h2>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0;">
            <tr>
              <td style="border: 1px solid #e0e0e0; padding: 8px; background-color: #f9f9f9;"><strong>ID:</strong></td>
              <td style="border: 1px solid #e0e0e0; padding: 8px;">${product._id}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #e0e0e0; padding: 8px; background-color: #f9f9f9;"><strong>Title:</strong></td>
              <td style="border: 1px solid #e0e0e0; padding: 8px;">${product.title}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #e0e0e0; padding: 8px; background-color: #f9f9f9;"><strong>Model:</strong></td>
              <td style="border: 1px solid #e0e0e0; padding: 8px;">${modelNo}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #e0e0e0; padding: 8px; background-color: #f9f9f9;"><strong>Category:</strong></td>
              <td style="border: 1px solid #e0e0e0; padding: 8px;">${product.category}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #e0e0e0; padding: 8px; background-color: #f9f9f9;"><strong>Sub Category:</strong></td>
              <td style="border: 1px solid #e0e0e0; padding: 8px;">${product.subCategory}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #e0e0e0; padding: 8px; background-color: #f9f9f9;"><strong>Sub Sub Category:</strong></td>
              <td style="border: 1px solid #e0e0e0; padding: 8px;">${product.subSubCategory}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #e0e0e0; padding: 8px; background-color: #f9f9f9;"><strong>Price:</strong></td>
              <td style="border: 1px solid #e0e0e0; padding: 8px;">₹${price}</td>
            </tr>
            ${discountPrice !== "N/A" ? `
            <tr>
              <td style="border: 1px solid #e0e0e0; padding: 8px; background-color: #f9f9f9;"><strong>Discount Price:</strong></td>
              <td style="border: 1px solid #e0e0e0; padding: 8px;">₹${discountPrice}</td>
            </tr>` : ''}
          </table>
          
          <p style="margin-top: 20px; color: #666;">This enquiry was sent on ${new Date().toLocaleString()}</p>
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
    
    // Set success message in session
    req.session.enquirySuccess = "Your enquiry has been sent successfully!";
    
    // Redirect back to product page
    res.redirect(`/products/product/${productid}`);
  } catch (err) {
    dbgr("❌ Error in Single Product Enquiry:", err);
    
    // Set error message in session
    req.session.enquiryError = "Failed to send enquiry. Please try again.";
    
    // Redirect with error
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
      return res.status(401).json({ message: "User authentication required" });
    }
    
    if (!user?.cart?.length) {
      req.session.cartError = "Your cart is empty. Add products before sending an enquiry.";
      return res.redirect("/products/cart");
    }

    // Fetch products details
    const products = await Promise.all(
      user.cart.map(async (cartItem) => {
        const product = await Product.findById(cartItem.product._id);
        if (!product) return null;

        const variant = product.variants.find(v => v.size === cartItem.size) || product.variants[0];

        return {
          id: product._id,
          title: product.title,
          quantity: cartItem.quantity,
          size: cartItem.size,
          model: variant?.modelno || "N/A",
          category: product.category,
          subCategory: product.subCategory,
          subSubCategory: product.subSubCategory,
          price: variant?.price || "N/A",
          discount: variant?.discount || "N/A"
        };
      })
    );

    // Filter out null entries (products not found)
    const validProducts = products.filter(p => p !== null);
    
    if (validProducts.length === 0) {
      req.session.cartError = "No valid products found in your cart.";
      return res.redirect("/products/cart");
    }

    // Calculate total price
    const totalPrice = validProducts.reduce((sum, product) => {
      const price = product.discount !== "N/A" ? product.discount : product.price;
      return sum + (price !== "N/A" ? price * product.quantity : 0);
    }, 0);

    // Create email content
    let productTableRows = validProducts.map(product => `
      <tr>
        <td style="border: 1px solid #e0e0e0; padding: 8px;">${product.title}</td>
        <td style="border: 1px solid #e0e0e0; padding: 8px;">${product.quantity}</td>
        <td style="border: 1px solid #e0e0e0; padding: 8px;">${product.size}</td>
        <td style="border: 1px solid #e0e0e0; padding: 8px;">₹${product.price}</td>
        <td style="border: 1px solid #e0e0e0; padding: 8px;">₹${product.discount}</td>
      </tr>
    `).join('');

    const emailContent = {
      from: `ATHEERA 👗🥻 <${EMAIL}>`,
      to: EMAIL,
      subject: "Multiple Products Enquiry",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0e0e0;">
          <h1>Cart Enquiry</h1>
          <h2>User Details</h2>
          <p><strong>Name:</strong> ${user.name}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Phone No:</strong> ${phoneNumber}</p>
          <h2>Product Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <th style="border: 1px solid #e0e0e0; padding: 8px;">Title</th>
              <th style="border: 1px solid #e0e0e0; padding: 8px;">Quantity</th>
              <th style="border: 1px solid #e0e0e0; padding: 8px;">Size</th>
              <th style="border: 1px solid #e0e0e0; padding: 8px;">Price</th>
              <th style="border: 1px solid #e0e0e0; padding: 8px;">Discount</th>
            </tr>
            ${productTableRows}
          </table>
          <h3>Total Price: ₹${totalPrice}</h3>
          <p>Enquiry sent on ${new Date().toLocaleString()}</p>
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
    req.session.enquirySuccess = "Your enquiry has been sent successfully!";
    res.redirect("/products/cart");
  } catch (err) {
    dbgr("❌ Error in Multiple Product Enquiry:", err);
    req.session.enquiryError = "Failed to send enquiry. Please try again.";
    res.status(500).redirect("/products/cart");
  }
};

// Export controllers
module.exports = {
  singleProductMail,
  multipleProductMail
};
/**
 * Main Application Entry Point
 * Sets up Express server with middleware and routes
 */

// Load Environment Variables
require("dotenv").config();

// Import Required Modules
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const dbgr = require("debug")("development: app");
const MongoStore = require("connect-mongo");
const helmet = require("helmet");
const compression = require("compression");

// Import Configuration & Environment Variables
const connectionDB = require("./config/db");
const { 
  NODE_ENV, 
  EXPRESS_SESSION_SECRET, 
  BASE_URL, 
  PORT,
  MONGO_URI 
} = require("./config/environment");

// Connect to Database
connectionDB();

// Initialize Express App
const app = express();

// Set up view engine (will be deprecated in favor of React)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Security Headers Middleware
if (NODE_ENV === 'production') {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],

                // ✅ Allow external scripts (No inline scripts)
                scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"], 

                // ✅ Allow Tailwind & external styles (inline styles needed for Tailwind)
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],

                // ✅ Allow images from self, data URIs, and external icon sources
                imgSrc: ["'self'", "data:", "https://img.icons8.com", "https://images.unsplash.com", "https://res.cloudinary.com"],

                // ✅ Allow fonts from Google Fonts and CDNs
                fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],

                // ✅ Other security settings
                objectSrc: ["'none'"], // Prevents loading objects like Flash, etc.
                upgradeInsecureRequests: [],
            }
        },
        frameguard: { action: 'sameorigin' }
    }));
} else {
    // In development, disable CSP for easy debugging
    app.use(helmet({
        contentSecurityPolicy: false
    }));
}

// Compression Middleware
app.use(compression());

// Request Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session Configuration
if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
app.use(session({
  secret: EXPRESS_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    ttl: 24 * 60 * 60, // 24 hours
    autoRemove: 'native',
    touchAfter: 24 * 3600
  }),
  cookie: {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));


// Static Files
app.use(express.static(path.join(__dirname, "public")));

// In development mode, serve webpack output directory
app.use(express.static(path.join(__dirname, "public/dist")));

// Request Logging in Development
if (NODE_ENV !== 'production') {
  const morgan = require('morgan');
  app.use(morgan('dev'));
}

// Authentication Middleware
const loggedIn = require("./middlewares/check-user-logged-in");
app.use(loggedIn);

// Define API Routes
const userRoute = require("./routes/user.routes");
const productsRoute = require("./routes/products.routes");
const adminRoute = require("./routes/admin.routes");
const accountRoute = require("./routes/account.routes");
const superAdminRoute = require("./routes/super-admin.routes");
const wishlistRoute = require("./routes/wishlist.routes");
const enquiryRoute = require("./routes/enquiry.routes");

// Mount API Route Handlers - For JSON API requests only
app.use("/user", userRoute);
app.use("/products", productsRoute);
app.use("/account", accountRoute);
app.use("/admin-haha", adminRoute);
app.use("/admin", adminRoute);
app.use("/super-admin", superAdminRoute);
app.use("/wishlist/api", wishlistRoute);
app.use("/enquiry", enquiryRoute);

// Special catch-all route for super admin dashboard to ensure React router works properly
app.get('/super-admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dist/index.html'));
});

// Special catch-all route for admin dashboard to ensure React router works properly
app.get('/admin-haha/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dist/index.html'));
});

// Special catch-all route for wishlist page to ensure React router works properly
app.get('/wishlist', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/dist/index.html'));
});

// Serve React app for all other routes
app.get('*', (req, res, next) => {
  // Check if the request is for an API route
  if (req.path.startsWith('/api') || 
      req.path.startsWith('/account/api') ||
      req.path.startsWith('/wishlist/api') ||
      req.path.startsWith('/admin/api') ||
      req.path.startsWith('/super-admin')) {
    return next();
  }

  // Special handling for user routes
  if (req.path.startsWith('/user')) {
    // If it's an API request, let it pass through
    if (req.headers.accept?.includes('application/json') || 
        req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return next();
    }
    // For browser requests, serve the React app
    return res.sendFile(path.join(__dirname, 'public/dist/index.html'));
  }

  // Special handling for account page
  if (req.path === '/account') {
    return res.sendFile(path.join(__dirname, 'public/dist/index.html'));
  }

  // Special handling for admin login page
  if (req.path === '/admin/login') {
    return res.sendFile(path.join(__dirname, 'public/dist/index.html'));
  }

  // Special handling for shop page
  if (req.path === '/products/shop') {
    // If it's an API request, let it pass through
    if (req.headers.accept?.includes('application/json') || 
        req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return next();
    }
    // For browser requests, serve the React app
    return res.sendFile(path.join(__dirname, 'public/dist/index.html'));
  }

  res.sendFile(path.join(__dirname, 'public/dist/index.html'));
});

// Global Error Handling
const errorHandler = require("./middlewares/error-handler");
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  dbgr(`✅ Server running on ${BASE_URL}`);
  
  if (NODE_ENV === 'production') {
    console.log(`Server running in production mode`);
  } else {
    console.log(`Server running in ${NODE_ENV} mode at ${BASE_URL}`);
  }
});

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});
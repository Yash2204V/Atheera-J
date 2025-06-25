import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import components
import Header from './Header';
import Footer from './Footer';

// Import pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Shop from '../pages/Shop';
import Product from '../pages/Product';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import OrderDetails from '../pages/OrderDetails';
import Account from '../pages/Account';
import AdminDashboard from '../pages/AdminDashboard';
import UpdateProduct from '../pages/UpdateProduct';
import AdminAuth from '../pages/AdminAuth';
import AdminLogin from '../pages/AdminLogin';
import SuperAdminLogin from '../pages/SuperAdminLogin';
import SuperAdminAuth from '../pages/SuperAdminAuth';
import SuperAdminDashboard from '../pages/SuperAdminDashboard';
import ProductCreate from '../pages/ProductCreate';
import CustomerCare from '../pages/CustomerCare';
import PromotionalTerms from '../pages/PromotionalTerms';
import ReturnsRefund from '../pages/ReturnsRefund';
import Terms from '../pages/Terms';
import WhoWeAre from '../pages/WhoWeAre';
import RecentlyViewed from '../pages/RecentlyViewed';
import ErrorPage from '../pages/ErrorPage';
import Wishlist from '../pages/Wishlist';

// Context provider
import { AuthProvider, useAuth } from '../context/AuthContext';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Static Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/user/login" element={<Login />} />
      <Route path="/user/signup" element={<Signup />} />
      
      {/* Cart Routes - Place before product routes to avoid conflicts */}
      <Route path="/products/cart" element={<Cart />} />
      <Route path="/cart" element={<Navigate to="/products/cart" replace />} />
      
      {/* Shop Route */}
      <Route path="/products/shop" element={<Shop />} />
      
      {/* Product Routes */}
      <Route path="/products/product/:id" element={<Product />} />
      <Route path="/products/:id" element={<Product />} />
      
      {/* Wishlist Route */}
      <Route 
        path="/wishlist" 
        element={user ? <Wishlist /> : <Navigate to="/user/login?redirect=/wishlist" />} 
      />
      
      {/* Checkout and Orders */}
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/account/orders/:id" element={<OrderDetails />} />
      
      {/* Protected Routes */}
      <Route path="/account" element={user ? <Account /> : <Navigate to="/user/login" />} />
      
      {/* Admin Routes */}
      <Route 
        path="/admin-haha" 
        element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/user/login" />} 
      />
      <Route 
        path="/admin-haha/edit/:productid" 
        element={user && user.role === 'admin' ? <UpdateProduct /> : <Navigate to="/user/login" />} 
      />
      <Route 
        path="/admin-haha/create" 
        element={user && (user.role === 'admin' || user.role === 'super-admin') ? <ProductCreate /> : <Navigate to="/user/login" />} 
      />
      <Route path="/admin-auth" element={<AdminAuth />} />
      
      {/* New Admin Login Route */}
      <Route path="/admin/login" element={<AdminLogin />} />
      
      {/* Super Admin Routes */}
      <Route 
        path="/super-admin" 
        element={user && user.role === 'super-admin' ? <SuperAdminDashboard /> : <Navigate to="/super-admin-auth" />} 
      />
      <Route 
        path="/super-admin/products/create" 
        element={user && user.role === 'super-admin' ? <ProductCreate /> : <Navigate to="/super-admin-auth" />} 
      />
      <Route 
        path="/super-admin/products/:productid/edit" 
        element={user && user.role === 'super-admin' ? <UpdateProduct /> : <Navigate to="/super-admin-auth" />} 
      />
      <Route path="/super-admin-auth" element={<SuperAdminAuth />} />
      <Route path="/super-admin/login" element={<SuperAdminLogin />} />
      
      {/* Static Pages */}
      <Route path="/customer-care" element={<CustomerCare />} />
      <Route path="/promotional-terms" element={<PromotionalTerms />} />
      <Route path="/returns-refund" element={<ReturnsRefund />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/who-we-are" element={<WhoWeAre />} />
      <Route path="/recently-viewed" element={<RecentlyViewed />} />
      
      {/* Catch-all route - must be last */}
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            <AppRoutes />
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 
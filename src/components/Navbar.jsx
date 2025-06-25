import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [cartItems, setCartItems] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetchCartItems();
    if (user) {
      fetchWishlistCount();
    }
  }, [user]);

  const fetchCartItems = async () => {
    try {
      const response = await fetch('/products/cart', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setCartItems(data.cart.items.length);
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
    }
  };

  const fetchWishlistCount = async () => {
    try {
      const response = await fetch('/wishlist', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setWishlistCount(data.wishlist.length);
      }
    } catch (error) {
      console.error('Error fetching wishlist count:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-primary">
            E-Commerce
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-600 hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/products/shop" className="text-gray-600 hover:text-primary transition-colors">
              Shop
            </Link>
            <Link to="/about" className="text-gray-600 hover:text-primary transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-primary transition-colors">
              Contact
            </Link>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-6">
            {/* Action Icons with Labels */}
            <div className="flex items-center gap-6">
              {/* Wishlist */}
              <Link 
                to="/wishlist" 
                className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors"
                title="Wishlist"
              >
                <div className="relative">
                  <i className="fas fa-heart text-xl"></i>
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1">Wishlist</span>
              </Link>

              {/* Cart */}
              <Link 
                to="/products/cart" 
                className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors"
                title="Cart"
              >
                <div className="relative">
                  <i className="fas fa-shopping-cart text-xl"></i>
                  {cartItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartItems}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1">Cart</span>
              </Link>

              {/* User Menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors"
                  >
                    <i className="fas fa-user text-xl"></i>
                    <span className="text-xs mt-1">Account</span>
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <Link
                        to="/account"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        My Account
                      </Link>
                      <Link
                        to="/account/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        My Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/user/login"
                  className="flex flex-col items-center text-gray-600 hover:text-primary transition-colors"
                >
                  <i className="fas fa-sign-in-alt text-xl"></i>
                  <span className="text-xs mt-1">Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 
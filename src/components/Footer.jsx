import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <>
      {/* Newsletter */}
      <section className="bg-primary py-16">
        <div className="container">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Subscribe to Our Newsletter</h2>
            <p className="text-gray-200 mb-8">Stay updated with our latest collections and exclusive offers</p>
            <form className="flex gap-2">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button 
                type="submit"
                className="px-6 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-16 pb-12 border-t border-gray-100">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <img src="/images/icons/favicon.png" alt="Atheera Logo" className="h-12 w-auto" />
                <span className="text-2xl font-semibold text-primary">Atheera</span>
              </div>
              <p className="text-gray-500">
                Your premier destination for luxury fashion and traditional wear.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Quick Links</h3>
              <ul className="space-y-4">
                <li><Link to="/who-we-are" className="text-gray-500 hover:text-primary transition-colors">About Us</Link></li>
                <li><Link to="/customer-care" className="text-gray-500 hover:text-primary transition-colors">Contact Us</Link></li>
                <li><Link to="/terms" className="text-gray-500 hover:text-primary transition-colors">Terms & Conditions</Link></li>
                <li><Link to="/promotional-terms" className="text-gray-500 hover:text-primary transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>

            {/* Account */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Account</h3>
              <ul className="space-y-4">
                <li><Link to="/account" className="text-gray-500 hover:text-primary transition-colors">My Account</Link></li>
                <li><Link to="/account" className="text-gray-500 hover:text-primary transition-colors">Order History</Link></li>
                <li><Link to="/account" className="text-gray-500 hover:text-primary transition-colors">Wishlist</Link></li>
                <li><Link to="/returns-refund" className="text-gray-500 hover:text-primary transition-colors">Returns</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Contact Info</h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-gray-500">
                  <i className="fas fa-map-marker-alt text-primary"></i>
                  123 Fashion Street, Design District
                </li>
                <li className="flex items-center gap-3 text-gray-500">
                  <i className="fas fa-phone text-primary"></i>
                  +1 234 567 8900
                </li>
                <li className="flex items-center gap-3 text-gray-500">
                  <i className="fas fa-envelope text-primary"></i>
                  contact@atheera.com
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      {/* Copyright */}
      <div className="bg-gray-800 py-4">
        <div className="container flex flex-col md:flex-row items-center justify-between">
          <p className="text-white text-center md:text-left mb-4 md:mb-0">
            © 2025 Atheera - All Rights Reserved
          </p>
          <div className="flex items-center gap-4">
            <img src="/images/methods.png" alt="Payment Methods" className="h-5" />
          </div>
        </div>
      </div>
    </>
  );
}

export default Footer; 
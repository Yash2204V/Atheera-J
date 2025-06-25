import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AccountLayout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    account: true,
    orders: false,
    address: false,
    other: false
  });

  // Keep the "other" section expanded when on any of its pages
  useEffect(() => {
    const otherSectionPaths = [
      '/recently-viewed',
      '/customer-care',
      '/terms',
      '/promotional-terms',
      '/returns-refund',
      '/who-we-are'
    ];
    
    if (otherSectionPaths.includes(location.pathname)) {
      setExpandedSections(prev => ({
        ...prev,
        other: true
      }));
    }
  }, [location.pathname]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleLinkClick = (e, path) => {
    e.preventDefault();
    
    // Only close mobile menu if it's open
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }

    // Use navigate for smooth transitions
    navigate(path);
  };

  return (
    <div className="container lg:grid grid-cols-12 items-start gap-6 pt-4 pb-16">
      {/* Mobile Menu Button */}
      <button 
        className="lg:hidden w-full mb-4 flex items-center justify-between p-4 bg-white rounded-lg shadow"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <span className="font-medium">Account Menu</span>
        <i className={`fas fa-chevron-${isMobileMenuOpen ? 'up' : 'down'}`}></i>
      </button>

      {/* Sidebar */}
      <div className={`col-span-3 ${isMobileMenuOpen ? 'block' : 'hidden'} lg:block`}>
        {/* Account Profile */}
        <div className="px-4 py-3 shadow flex items-center gap-4 bg-white rounded">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="text-xl font-bold">{user?.name ? user.name.charAt(0) : 'U'}</span>
          </div>
          <div className="flex-1">
            <p className="text-gray-600">Hello,</p>
            <h4 className="font-medium">{user?.name || 'User'}</h4>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
        
        {/* Profile Links */}
        <div className="mt-6 bg-white shadow rounded p-4 divide-y divide-gray-200 space-y-4 text-gray-600">
          {/* Account Section */}
          <div>
            <button 
              onClick={() => toggleSection('account')}
              className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
            >
              <span className="font-medium">Account</span>
              <i className={`fas fa-chevron-${expandedSections.account ? 'up' : 'down'}`}></i>
            </button>
            {expandedSections.account && (
              <div className="pl-4 mt-2 space-y-2">
                <a 
                  href="/account"
                  className={`block w-full text-left p-2 rounded-lg hover:bg-gray-50 ${
                    location.pathname === '/account' ? 'bg-primary text-white' : ''
                  }`}
                  onClick={(e) => handleLinkClick(e, '/account')}
                >
                  Account Overview
                </a>
                <a 
                  href="/account?tab=profile"
                  className={`block w-full text-left p-2 rounded-lg hover:bg-gray-50 ${
                    location.pathname === '/account' && location.search.includes('tab=profile') ? 'bg-primary text-white' : ''
                  }`}
                  onClick={(e) => handleLinkClick(e, '/account?tab=profile')}
                >
                  Profile Information
                </a>
              </div>
            )}
          </div>

          {/* Orders Section */}
          <div>
            <button 
              onClick={() => toggleSection('orders')}
              className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
            >
              <span className="font-medium">Orders</span>
              <i className={`fas fa-chevron-${expandedSections.orders ? 'up' : 'down'}`}></i>
            </button>
            {expandedSections.orders && (
              <div className="pl-4 mt-2 space-y-2">
                <a 
                  href="/account?tab=orders"
                  className={`block w-full text-left p-2 rounded-lg hover:bg-gray-50 ${
                    location.pathname === '/account' && location.search.includes('tab=orders') ? 'bg-primary text-white' : ''
                  }`}
                  onClick={(e) => handleLinkClick(e, '/account?tab=orders')}
                >
                  My Orders
                </a>
              </div>
            )}
          </div>

          {/* Address Section */}
          <div>
            <button 
              onClick={() => toggleSection('address')}
              className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
            >
              <span className="font-medium">Address</span>
              <i className={`fas fa-chevron-${expandedSections.address ? 'up' : 'down'}`}></i>
            </button>
            {expandedSections.address && (
              <div className="pl-4 mt-2 space-y-2">
                <a 
                  href="/account?tab=address"
                  className={`block w-full text-left p-2 rounded-lg hover:bg-gray-50 ${
                    location.pathname === '/account' && location.search.includes('tab=address') ? 'bg-primary text-white' : ''
                  }`}
                  onClick={(e) => handleLinkClick(e, '/account?tab=address')}
                >
                  Manage Addresses
                </a>
              </div>
            )}
          </div>

          {/* Other Links Section */}
          <div>
            <button 
              onClick={() => toggleSection('other')}
              className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
            >
              <span className="font-medium">Other</span>
              <i className={`fas fa-chevron-${expandedSections.other ? 'up' : 'down'}`}></i>
            </button>
            {expandedSections.other && (
              <div className="pl-4 mt-2 space-y-2">
                <a 
                  href="/account/recently-viewed" 
                  className={`block w-full text-left p-2 rounded-lg hover:bg-gray-50 ${
                    location.pathname === '/account/recently-viewed' ? 'bg-primary text-white' : ''
                  }`}
                >
                  Recently Viewed
                </a>
                <a 
                  href="/customer-care" 
                  className={`block w-full text-left p-2 rounded-lg hover:bg-gray-50 ${
                    location.pathname === '/customer-care' ? 'bg-primary text-white' : ''
                  }`}
                  onClick={(e) => handleLinkClick(e, '/customer-care')}
                >
                  Customer Care
                </a>
                <a 
                  href="/terms" 
                  className={`block w-full text-left p-2 rounded-lg hover:bg-gray-50 ${
                    location.pathname === '/terms' ? 'bg-primary text-white' : ''
                  }`}
                  onClick={(e) => handleLinkClick(e, '/terms')}
                >
                  Terms & Conditions
                </a>
                <a 
                  href="/promotional-terms" 
                  className={`block w-full text-left p-2 rounded-lg hover:bg-gray-50 ${
                    location.pathname === '/promotional-terms' ? 'bg-primary text-white' : ''
                  }`}
                  onClick={(e) => handleLinkClick(e, '/promotional-terms')}
                >
                  Promotions Terms
                </a>
                <a 
                  href="/returns-refund" 
                  className={`block w-full text-left p-2 rounded-lg hover:bg-gray-50 ${
                    location.pathname === '/returns-refund' ? 'bg-primary text-white' : ''
                  }`}
                  onClick={(e) => handleLinkClick(e, '/returns-refund')}
                >
                  Returns & Refunds
                </a>
                <a 
                  href="/who-we-are" 
                  className={`block w-full text-left p-2 rounded-lg hover:bg-gray-50 ${
                    location.pathname === '/who-we-are' ? 'bg-primary text-white' : ''
                  }`}
                  onClick={(e) => handleLinkClick(e, '/who-we-are')}
                >
                  Who We Are
                </a>
                <a 
                  href="/user/logout" 
                  className="block w-full text-left p-2 rounded-lg text-red-600 hover:bg-red-50"
                  onClick={(e) => handleLinkClick(e, '/user/logout')}
                >
                  Logout
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="col-span-9 mt-6 lg:mt-0">
        {children}
      </div>
    </div>
  );
}

export default AccountLayout; 
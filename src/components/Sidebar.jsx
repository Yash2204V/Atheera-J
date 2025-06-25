import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Sidebar({ type = 'account' }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  // Default account sidebar
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <i className="fas fa-user text-2xl"></i>
        </div>
        <div>
          <h3 className="font-medium text-lg">My Account</h3>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>
      
      <nav className="space-y-2">
        <Link 
          to="/account" 
          className={`flex items-center gap-3 w-full p-3 rounded-lg ${
            isActive('/account') ? 'bg-primary text-white' : 'hover:bg-gray-50'
          }`}
        >
          <i className="fas fa-tachometer-alt"></i>
          <span>Dashboard</span>
        </Link>
        
        <Link 
          to="/account/orders" 
          className={`flex items-center gap-3 w-full p-3 rounded-lg ${
            isActive('/account/orders') ? 'bg-primary text-white' : 'hover:bg-gray-50'
          }`}
        >
          <i className="fas fa-shopping-bag"></i>
          <span>My Orders</span>
        </Link>
        
        <Link 
          to="/account/profile" 
          className={`flex items-center gap-3 w-full p-3 rounded-lg ${
            isActive('/account/profile') ? 'bg-primary text-white' : 'hover:bg-gray-50'
          }`}
        >
          <i className="fas fa-user-circle"></i>
          <span>Profile</span>
        </Link>
        
        <Link 
          to="/account/addresses" 
          className={`flex items-center gap-3 w-full p-3 rounded-lg ${
            isActive('/account/addresses') ? 'bg-primary text-white' : 'hover:bg-gray-50'
          }`}
        >
          <i className="fas fa-map-marker-alt"></i>
          <span>Addresses</span>
        </Link>
        
        <Link 
          to="/account/wishlist" 
          className={`flex items-center gap-3 w-full p-3 rounded-lg ${
            isActive('/account/wishlist') ? 'bg-primary text-white' : 'hover:bg-gray-50'
          }`}
        >
          <i className="fas fa-heart"></i>
          <span>Wishlist</span>
        </Link>
        
        <Link 
          to="/recently-viewed" 
          className={`flex items-center gap-3 w-full p-3 rounded-lg ${
            isActive('/recently-viewed') ? 'bg-primary text-white' : 'hover:bg-gray-50'
          }`}
        >
          <i className="fas fa-history"></i>
          <span>Recently Viewed</span>
        </Link>
        
        <Link 
          to="/" 
          className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50"
        >
          <i className="fas fa-home"></i>
          <span>Back to Home</span>
        </Link>
        
        <a 
          href="/user/logout" 
          className="flex items-center gap-3 w-full p-3 rounded-lg text-red-600 hover:bg-red-50"
          onClick={(e) => {
            e.preventDefault();
            logout();
          }}
        >
          <i className="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </a>
      </nav>
    </div>
  );
}

export default Sidebar; 
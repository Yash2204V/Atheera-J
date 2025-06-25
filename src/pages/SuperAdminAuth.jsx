import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function SuperAdminAuth() {
  const { user } = useAuth();
  
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Super Admin Access Required</h1>
          <p className="text-gray-600">
            {user ? 'Your account does not have super admin privileges.' : 'You need to be logged in as a super admin to access this area.'}
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">What is a Super Admin?</h2>
            <p className="text-gray-600 mb-4">
              Super Admins have the highest level of access in the system. They can manage all users, including regular admins, 
              and have complete control over all aspects of the platform.
            </p>
            <p className="text-gray-600">
              If you believe you should have Super Admin access, please contact the system owner.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            {user ? (
              <>
                <Link 
                  to="/" 
                  className="w-full sm:w-auto px-6 py-3 bg-primary text-white font-medium rounded-lg text-center hover:bg-opacity-90 transition-colors"
                >
                  Return to Home
                </Link>
                {user.role === 'admin' && (
                  <Link 
                    to="/admin-haha" 
                    className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg text-center hover:bg-gray-300 transition-colors"
                  >
                    Go to Admin Dashboard
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link 
                  to="/user/login" 
                  className="w-full sm:w-auto px-6 py-3 bg-primary text-white font-medium rounded-lg text-center hover:bg-opacity-90 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/" 
                  className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg text-center hover:bg-gray-300 transition-colors"
                >
                  Return to Home
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminAuth; 
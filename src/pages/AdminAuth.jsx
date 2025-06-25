import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminAuth() {
  const { user, refreshAuthStatus } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleMakeAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/admin-haha/makeAdmin?passcode=${passcode}`);
      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ Admin privileges granted! Updating your session...');
        // Refresh auth status to update the user object with admin role
        const refreshed = await refreshAuthStatus();
        if (refreshed) {
          setTimeout(() => {
            navigate('/admin-haha');
          }, 1500);
        }
      } else {
        setMessage(`❌ ${data.message || 'Failed to get admin privileges'}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto mt-10 p-6 max-w-md bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Admin Authentication</h1>
      
      {user ? (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <p className="font-medium">Current Status:</p>
          <p>User: {user.name || user.email}</p>
          <p>Role: <span className={user.role === 'admin' ? 'text-green-600 font-bold' : 'text-gray-600'}>
            {user.role || 'regular user'}
          </span></p>
        </div>
      ) : (
        <div className="mb-6 p-4 border rounded-lg bg-yellow-50 text-yellow-700">
          Please log in first to access admin features.
        </div>
      )}

      {user && user.role !== 'admin' && (
        <form onSubmit={handleMakeAdmin} className="space-y-4">
          <div>
            <label htmlFor="passcode" className="block text-sm font-medium text-gray-700 mb-1">
              Admin Passcode
            </label>
            <input
              type="password"
              id="passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter passcode"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Get Admin Access'}
          </button>
          
          {message && (
            <div className={`p-3 rounded-md text-center ${message.startsWith('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}
        </form>
      )}

      {user && user.role === 'admin' && (
        <div className="flex flex-col space-y-4">
          <div className="p-3 rounded-md bg-green-100 text-green-700 text-center">
            You already have admin privileges! 🎉
          </div>
          <button
            onClick={() => navigate('/admin-haha')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Admin Dashboard
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminAuth; 
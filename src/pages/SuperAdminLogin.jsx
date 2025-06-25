import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertMessage from '../components/AlertMessage';
import PhoneAuth from '../components/PhoneAuth';

function SuperAdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('email'); // 'email', 'phone', or 'google'
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is already logged in as super admin
  useEffect(() => {
    if (user && user.role === 'super-admin') {
      navigate('/super-admin');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/super-admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to login as super admin');
      }

      setUser(data.user);
      
      if (data.user.role === 'super-admin') {
        navigate('/super-admin');
      } else {
        throw new Error('You do not have super admin privileges');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Direct the browser to the Google auth URL, not an AJAX request
    window.location.href = '/super-admin/auth/google';
  };

  return (
    <div className="container mx-auto px-4 py-16 flex justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">Super Admin Login</h2>
          
          {error && <AlertMessage type="error" message={error} className="mb-6" />}
          
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-6">
            <button 
              className={`flex-1 py-2 font-medium text-center ${activeTab === 'email' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('email')}
            >
              Email
            </button>
            <button 
              className={`flex-1 py-2 font-medium text-center ${activeTab === 'phone' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('phone')}
            >
              Phone
            </button>
            <button 
              className={`flex-1 py-2 font-medium text-center ${activeTab === 'google' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('google')}
            >
              Google
            </button>
          </div>
          
          {/* Email Login Form */}
          {activeTab === 'email' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-primary text-white py-2 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}
          
          {/* Phone Auth */}
          {activeTab === 'phone' && (
            <PhoneAuth mode="login" adminMode={true} superAdminMode={true} />
          )}
          
          {/* Google Login */}
          {activeTab === 'google' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Sign in with your Google account to access super admin features.
              </p>
              
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          )}
          
          <div className="mt-6 text-center text-sm text-gray-600">
            Not a super admin? <Link to="/admin/login" className="text-primary hover:underline">Admin Login</Link> or <Link to="/user/login" className="text-primary hover:underline">User Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminLogin; 
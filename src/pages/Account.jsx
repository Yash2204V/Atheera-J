import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import PhoneAuth from '../components/PhoneAuth';

function Account() {
  const { user, logout, setUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [orderSummary, setOrderSummary] = useState({
    total: 0,
    count: 0,
    pending: 0,
    delivered: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    account: true,
    orders: false,
    profile: false,
    address: false,
    other: false
  });
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: '',
    isDefault: false
  });
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber === 'NA' ? '' : user.phoneNumber);
  const [editingPhone, setEditingPhone] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  useEffect(() => {
    // Fetch user data including addresses
    const fetchUserData = async () => {
      try {
        const response = await fetch('/account/api', {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
          setUser(prev => ({
            ...prev,
            ...data.user,
            addresses: data.user.addresses || []
          }));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    // Fetch user orders
    const fetchOrders = async () => {
      try {
        const response = await fetch('/account/orders/api');
        const data = await response.json();
        
        if (data.success) {
          setOrders(data.orders);
          
          // Calculate order summary
          const summary = {
            total: data.orders.reduce((sum, order) => sum + order.totalAmount, 0),
            count: data.orders.length,
            pending: data.orders.filter(order => order.status !== 'Delivered').length,
            delivered: data.orders.filter(order => order.status === 'Delivered').length
          };
          setOrderSummary(summary);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchUserData();
      fetchOrders();
    }
  }, [user, setUser]);

  if (!user) {
    return <Navigate to="/user/login" />;
  }

  if (loading) {
    return (
      <div className="container py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData(e.target);
      const response = await fetch('/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          phoneNumber: formData.get('phoneNumber')
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully');
      setUser(data.user); // Update the user context with new data
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Close mobile menu when a tab is clicked
    setIsMobileMenuOpen(false);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/account/addresses/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: addressForm.name,
          phoneNumber: addressForm.phone,
          street: addressForm.street,
          city: addressForm.city,
          state: addressForm.state,
          country: addressForm.country,
          zipCode: addressForm.zip,
          isDefault: addressForm.isDefault
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Failed to save address. Please try again.'
        }));
        throw new Error(errorData.message);
      }

      const data = await response.json();
      setSuccess('Address added successfully');
      
      // Update user state with new addresses
      setUser(prev => ({
        ...prev,
        addresses: data.addresses || []
      }));
      
      setIsAddressModalOpen(false);
      resetAddressForm();
    } catch (err) {
      setError(err.message || 'Failed to save address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/account/addresses/${addressId}/default`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Failed to set default address. Please try again.'
        }));
        throw new Error(errorData.message);
      }

      const data = await response.json();
      setSuccess('Default address updated successfully');
      
      // Update user state with new addresses
      setUser(prev => ({
        ...prev,
        addresses: data.addresses || []
      }));
    } catch (err) {
      setError(err.message || 'Failed to set default address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/account/addresses/${addressId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Failed to delete address. Please try again.'
        }));
        throw new Error(errorData.message);
      }

      const data = await response.json();
      setSuccess('Address deleted successfully');
      
      // Update user state with new addresses
      setUser(prev => ({
        ...prev,
        addresses: data.addresses || []
      }));
    } catch (err) {
      setError(err.message || 'Failed to delete address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = async (address) => {
    setEditingAddress(address);
    setAddressForm({
      name: address.name,
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zipCode,
      country: address.country,
      phone: address.phoneNumber,
      isDefault: address.isDefault
    });
    setIsAddressModalOpen(true);
  };

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/account/addresses/${editingAddress._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: addressForm.name,
          phoneNumber: addressForm.phone,
          street: addressForm.street,
          city: addressForm.city,
          state: addressForm.state,
          country: addressForm.country,
          zipCode: addressForm.zip,
          isDefault: addressForm.isDefault
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'Failed to update address. Please try again.'
        }));
        throw new Error(errorData.message);
      }

      const data = await response.json();
      setSuccess('Address updated successfully');
      
      // Update user state with new addresses
      setUser(prev => ({
        ...prev,
        addresses: data.addresses || []
      }));
      
      setIsAddressModalOpen(false);
      resetAddressForm();
    } catch (err) {
      setError(err.message || 'Failed to update address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      name: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      country: '',
      phone: '',
      isDefault: false
    });
    setEditingAddress(null);
  };

  const handleAddressInputChange = (e) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhoneNumberChange = (e) => {
    const phoneNumber = e.target.value;
    setPhoneNumber(phoneNumber);
    // Reset verification when phone number changes
    setVerifiedPhone('');
    setVerificationCode('');
    setIsPhoneVerified(false);
    setShowPhoneVerification(false);
    setVerificationSuccess(false);
  };

  const handleSendOTP = async () => {
    try {
      if (!phoneNumber) {
        toast.error('Please enter a phone number');
        return;
      }

      // Format phone number to E.164 format
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (formattedPhone.startsWith('91')) {
        formattedPhone = formattedPhone.substring(2);
      }
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1);
      }
      if (formattedPhone.length !== 10) {
        toast.error('Please enter a valid 10-digit Indian mobile number');
        return;
      }
      formattedPhone = `+91${formattedPhone}`;

      const response = await fetch('/user/auth/phone/send-code?action=verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber: formattedPhone })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      setShowPhoneVerification(true);
      setPhoneNumber(formattedPhone);
      toast.success('OTP sent successfully!');
    } catch (err) {
      console.error('Error sending OTP:', err);
      toast.error(err.message || 'Failed to send OTP. Please try again.');
    }
  };

  const handlePhoneUpdate = async () => {
    if (!isPhoneVerified) {
      setShowPhoneVerification(true);
      return;
    }

    try {
      const response = await axios.put('/account/phone', { 
        phoneNumber: verifiedPhone
      });
      
      if (response.data.success) {
        setUser(response.data.user);
        setEditingPhone(false);
        setShowPhoneVerification(false);
        setVerifiedPhone('');
        setVerificationCode('');
        setIsPhoneVerified(false);
        setVerificationSuccess(false);
        setPhoneNumber(response.data.user.phoneNumber);
        toast.success('Phone number updated successfully');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error updating phone number';
      toast.error(errorMessage);
      
      // If the error is about phone number already being registered, reset the form
      if (errorMessage.includes('already registered')) {
        setEditingPhone(false);
        setShowPhoneVerification(false);
        setVerifiedPhone('');
        setVerificationCode('');
        setIsPhoneVerified(false);
        setVerificationSuccess(false);
        setPhoneNumber(user.phoneNumber === 'NA' ? '' : user.phoneNumber);
      }
    }
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
            <span className="text-xl font-bold">{user.name ? user.name.charAt(0) : 'U'}</span>
          </div>
          <div className="flex-1">
            <p className="text-gray-600">Hello,</p>
            <h4 className="font-medium">{user.name || 'User'}</h4>
            <p className="text-xs text-gray-500">{user.email}</p>
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
                <button 
                  onClick={() => handleTabChange('overview')}
                  className={`w-full text-left p-2 rounded-lg ${activeTab === 'overview' ? 'bg-primary text-white' : 'hover:bg-gray-50'}`}
                >
                  Account Overview
                </button>
                <button 
                  onClick={() => handleTabChange('profile')}
                  className={`w-full text-left p-2 rounded-lg ${activeTab === 'profile' ? 'bg-primary text-white' : 'hover:bg-gray-50'}`}
                >
                  Profile Information
                </button>
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
                <button 
                  onClick={() => handleTabChange('orders')}
                  className={`w-full text-left p-2 rounded-lg ${activeTab === 'orders' ? 'bg-primary text-white' : 'hover:bg-gray-50'}`}
                >
                  My Orders
                </button>
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
                <button 
                  onClick={() => handleTabChange('address')}
                  className={`w-full text-left p-2 rounded-lg ${activeTab === 'address' ? 'bg-primary text-white' : 'hover:bg-gray-50'}`}
                >
                  Manage Addresses
                </button>
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
                <Link 
                  to="/account/recently-viewed" 
                  className="block w-full text-left p-2 rounded-lg hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Recently Viewed
                </Link>
                <Link 
                  to="/customer-care" 
                  className="block w-full text-left p-2 rounded-lg hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Customer Care
                </Link>
                <Link 
                  to="/terms" 
                  className="block w-full text-left p-2 rounded-lg hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Terms & Conditions
                </Link>
                <Link 
                  to="/promotional-terms" 
                  className="block w-full text-left p-2 rounded-lg hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Promotions Terms
                </Link>
                <Link 
                  to="/returns-refund" 
                  className="block w-full text-left p-2 rounded-lg hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Returns & Refunds
                </Link>
                <Link 
                  to="/who-we-are" 
                  className="block w-full text-left p-2 rounded-lg hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Who We Are
                </Link>
                <button 
                  onClick={(e) => {
                    handleLogout(e);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-lg text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="col-span-9 mt-6 lg:mt-0">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Account Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">My Account</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Account Overview */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Overview</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{user.phoneNumber || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Created:</span>
                      <span className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Shopping Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Shopping Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Orders:</span>
                      <span className="font-medium">{orderSummary.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pending Orders:</span>
                      <span className="font-medium">{orderSummary.pending}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed Orders:</span>
                      <span className="font-medium">{orderSummary.delivered}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Spent:</span>
                      <span className="font-medium">₹{orderSummary.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link to="/cart" className="bg-primary/5 p-4 rounded-lg text-center hover:bg-primary/10 transition-colors">
                    <i className="fas fa-shopping-cart text-2xl text-primary mb-2"></i>
                    <p className="text-gray-700">My Cart</p>
                  </Link>
                  <Link to="/account/recently-viewed" className="bg-primary/5 p-4 rounded-lg text-center hover:bg-primary/10 transition-colors">
                    <i className="fas fa-history text-2xl text-primary mb-2"></i>
                    <p className="text-gray-700">Recently Viewed</p>
                  </Link>
                  <Link to="/customer-care" className="bg-primary/5 p-4 rounded-lg text-center hover:bg-primary/10 transition-colors">
                    <i className="fas fa-headset text-2xl text-primary mb-2"></i>
                    <p className="text-gray-700">Customer Care</p>
                  </Link>
                  <button onClick={handleLogout} className="bg-red-50 p-4 rounded-lg text-center hover:bg-red-100 transition-colors">
                    <i className="fas fa-sign-out-alt text-2xl text-red-500 mb-2"></i>
                    <p className="text-gray-700">Logout</p>
                  </button>
                </div>
              </div>
            </>
          )}
          
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <>
              <h2 className="text-2xl font-medium mb-6">My Orders</h2>
              
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-shopping-bag text-4xl text-gray-300 mb-4"></i>
                  <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                  <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
                  <Link 
                    to="/products/shop" 
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order._id} className="border rounded-lg overflow-hidden">
                      {/* Order Header */}
                      <div className="flex flex-col md:flex-row justify-between bg-gray-50 p-4 border-b">
                        <div>
                          <p className="text-sm text-gray-500">Order ID</p>
                          <p className="font-medium">{order._id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total</p>
                          <p className="font-medium">₹{order.totalAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <span 
                            className={`inline-block px-2 py-1 rounded text-xs font-medium 
                              ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                                order.status === 'Processing' ? 'bg-blue-100 text-blue-800' : 
                                'bg-yellow-100 text-yellow-800'}`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>
                      
                      {/* Order Items */}
                      <div className="p-4 space-y-4">
                        {order.items.map((item) => (
                          <div key={item._id} className="flex gap-4">
                            <img 
                              src={item.product.images[0]} 
                              alt={item.product.name} 
                              className="w-16 h-16 object-cover rounded-md"
                            />
                            <div>
                              <h4 className="font-medium">{item.product.name}</h4>
                              <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                              <p className="text-sm text-gray-500">Size: {item.size}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <>
              <h2 className="text-2xl font-medium mb-6">Profile Information</h2>
              
              {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                  {success}
                </div>
              )}
              
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Name</label>
                  <input 
                    type="text" 
                    name="name"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                    defaultValue={user.name}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50 cursor-not-allowed"
                    defaultValue={user.email}
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Phone Number</label>
                  {editingPhone ? (
                    <div className="space-y-4">
                      {showPhoneVerification ? (
                        <div>
                          <h4 className="text-lg font-medium mb-4">Enter OTP</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            We've sent a verification code to {phoneNumber}
                          </p>
                          <div className="space-y-4">
                            <div>
                              <label className="text-gray-600 mb-2 block">
                                Verification Code <span className="text-primary">*</span>
                              </label>
                              <input
                                type="text"
                                className="block w-full border border-gray-300 px-4 py-3 text-gray-600 text-sm rounded focus:ring-0 focus:border-primary placeholder-gray-400"
                                placeholder="Enter 6-digit code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                required
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const response = await fetch('/user/auth/phone/verify-code?action=verify', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json'
                                      },
                                      body: JSON.stringify({ 
                                        phoneNumber, 
                                        code: verificationCode 
                                      })
                                    });
                                    
                                    const data = await response.json();
                                    
                                    if (!response.ok) {
                                      throw new Error(data.message || 'Failed to verify code');
                                    }
                                    
                                    setVerifiedPhone(phoneNumber);
                                    setIsPhoneVerified(true);
                                    setVerificationSuccess(true);
                                    setShowPhoneVerification(false);
                                    toast.success('Phone number verified successfully!');
                                  } catch (err) {
                                    toast.error(err.message || 'Failed to verify code');
                                  }
                                }}
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
                              >
                                Verify Code
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPhoneVerification(false);
                                  setVerificationCode('');
                                }}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <input
                              type="tel"
                              value={phoneNumber}
                              onChange={handlePhoneNumberChange}
                              className="flex-1 px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                              required
                              disabled={isPhoneVerified}
                              placeholder="Enter your phone number"
                            />
                            {!isPhoneVerified && phoneNumber && (
                              <button
                                type="button"
                                onClick={handleSendOTP}
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors whitespace-nowrap"
                              >
                                Send OTP
                              </button>
                            )}
                          </div>
                          {verificationSuccess && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-sm text-green-600 flex items-center gap-2">
                                <i className="fas fa-check-circle"></i>
                                Phone number verified successfully! You can now save your changes.
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPhone(false);
                                setShowPhoneVerification(false);
                                setVerifiedPhone('');
                                setVerificationCode('');
                                setIsPhoneVerified(false);
                                setVerificationSuccess(false);
                                setPhoneNumber(user.phoneNumber === 'NA' ? '' : user.phoneNumber);
                              }}
                              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handlePhoneUpdate}
                              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                                isPhoneVerified 
                                  ? 'bg-primary hover:bg-primary-dark' 
                                  : 'bg-gray-400 cursor-not-allowed'
                              }`}
                              disabled={!isPhoneVerified}
                            >
                              Save Phone
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.phoneNumber === 'NA' ? 'Not set' : user.phoneNumber}</p>
                      <button
                        type="button"
                        onClick={() => setEditingPhone(true)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
                
                <button 
                  type="submit"
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </>
          )}
          
          {/* Address Tab */}
          {activeTab === 'address' && (
            <>
              <h2 className="text-2xl font-medium mb-6">Manage Addresses</h2>
              
              {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                  {success}
                </div>
              )}
              
              <div className="mb-6">
                <button 
                  onClick={() => {
                    resetAddressForm();
                    setIsAddressModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 p-4 rounded-lg w-full hover:border-primary transition"
                >
                  <i className="fas fa-plus text-gray-500"></i>
                  <span>Add New Address</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {user.addresses && user.addresses.length > 0 ? (
                  user.addresses.map((address, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:border-primary transition">
                      <div className="flex justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{address.name}</h3>
                          {address.isDefault && (
                            <span className="inline-block px-2 py-1 mt-1 bg-primary/10 text-primary text-xs rounded">
                              Default Address
                            </span>
                          )}
                        </div>
                        <div className="space-x-2">
                          {!address.isDefault && (
                            <button 
                              onClick={() => handleSetDefaultAddress(address._id)}
                              className="text-primary hover:text-primary-dark"
                              title="Set as default"
                            >
                              <i className="fas fa-star"></i>
                            </button>
                          )}
                          <button 
                            onClick={() => handleEditAddress(address)}
                            className="text-primary hover:text-primary-dark"
                            title="Edit address"
                          >
                            <i className="fas fa-pencil-alt"></i>
                          </button>
                          <button 
                            onClick={() => handleDeleteAddress(address._id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete address"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{address.street}</p>
                      <p className="text-sm text-gray-600">{address.city}, {address.state} {address.zipCode}</p>
                      <p className="text-sm text-gray-600">{address.country}</p>
                      <p className="text-sm text-gray-600">Phone: {address.phoneNumber}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-map-marker-alt text-4xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-medium mb-2">No addresses saved</h3>
                    <p className="text-gray-500">Add a new address to make checkout easier.</p>
                  </div>
                )}
              </div>

              {/* Address Modal */}
              {isAddressModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-medium">
                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                      </h3>
                      <button 
                        onClick={() => {
                          setIsAddressModalOpen(false);
                          resetAddressForm();
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    
                    <form onSubmit={editingAddress ? handleUpdateAddress : handleAddressSubmit} className="space-y-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Full Name
                        </label>
                        <input 
                          type="text"
                          name="name"
                          value={addressForm.name}
                          onChange={handleAddressInputChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Street Address
                        </label>
                        <input 
                          type="text"
                          name="street"
                          value={addressForm.street}
                          onChange={handleAddressInputChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">
                            City
                          </label>
                          <input 
                            type="text"
                            name="city"
                            value={addressForm.city}
                            onChange={handleAddressInputChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">
                            State
                          </label>
                          <input 
                            type="text"
                            name="state"
                            value={addressForm.state}
                            onChange={handleAddressInputChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">
                            ZIP Code
                          </label>
                          <input 
                            type="text"
                            name="zip"
                            value={addressForm.zip}
                            onChange={handleAddressInputChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-medium mb-2">
                            Country
                          </label>
                          <input 
                            type="text"
                            name="country"
                            value={addressForm.country}
                            onChange={handleAddressInputChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Phone Number
                        </label>
                        <input 
                          type="tel"
                          name="phone"
                          value={addressForm.phone}
                          onChange={handleAddressInputChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                          required
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="isDefault"
                          id="isDefault"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm(prev => ({
                            ...prev,
                            isDefault: e.target.checked
                          }))}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                          Set as default address
                        </label>
                      </div>
                      
                      <div className="flex justify-end gap-4 mt-6">
                        <button 
                          type="button"
                          onClick={() => {
                            setIsAddressModalOpen(false);
                            resetAddressForm();
                          }}
                          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : (editingAddress ? 'Update Address' : 'Save Address')}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Account; 
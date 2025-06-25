import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import AddressManagement from '../components/Account/AddressManagement';

const Account = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await axios.get('/account/api');
      if (response.data.success) {
        setUser(response.data.user);
        setPhoneNumber(response.data.user.phoneNumber === 'NA' ? '' : response.data.user.phoneNumber);
      }
    } catch (error) {
      toast.error('Error fetching user data');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneUpdate = async () => {
    try {
      const response = await axios.put('/account/phone', { phoneNumber });
      if (response.data.success) {
        setUser(response.data.user);
        setEditingPhone(false);
        toast.success('Phone number updated successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating phone number');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>
        
        {/* User Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Name</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-gray-600">Phone Number</p>
              {editingPhone ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                  <button
                    onClick={handlePhoneUpdate}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingPhone(false);
                      setPhoneNumber(user.phoneNumber === 'NA' ? '' : user.phoneNumber);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <p className="font-medium">{user.phoneNumber === 'NA' ? 'Not set' : user.phoneNumber}</p>
                  <button
                    onClick={() => setEditingPhone(true)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
            <div>
              <p className="text-gray-600">Gender</p>
              <p className="font-medium capitalize">{user.gender}</p>
            </div>
            <div>
              <p className="text-gray-600">Account Created</p>
              <p className="font-medium">
                {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Address Management */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <AddressManagement />
        </div>

        {/* Orders Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">My Orders</h2>
          {user.orders && user.orders.length > 0 ? (
            <div className="space-y-4">
              {user.orders.map((order) => (
                <div key={order._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Order #{order.orderNumber}</p>
                      <p className="text-gray-600">
                        {formatDate(order.createdAt)}
                      </p>
                      <p className="text-gray-600">Status: {order.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Total: ${order.totalAmount}</p>
                      <button
                        onClick={() => navigate(`/account/orders/${order._id}`)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No orders found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Account; 
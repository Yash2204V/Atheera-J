import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertMessage from '../components/AlertMessage';

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Fetch order details
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/account/orders/${id}/api`);
        const data = await response.json();
        
        if (data.success) {
          setOrder(data.order);
        } else {
          setError('Failed to load order details');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching order:', error);
        setError('Failed to load order details');
        setLoading(false);
      }
    };

    if (user) {
      fetchOrder();
    } else {
      setLoading(false);
      navigate('/login');
    }
  }, [id, user, navigate]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-0 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-0">
        <AlertMessage type="error" message={error || 'Order not found'} />
        <div className="text-center">
          <Link to="/account/orders" className="text-primary hover:underline">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <div className="flex flex-col lg:flex-row justify-between items-start mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-gray-500">Order #{order._id}</p>
        </div>
        
        <div className="flex items-center">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
          <Link to="/account/orders" className="ml-4 text-primary hover:underline">
            Back to Orders
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Information */}
        <div className="md:col-span-2">
          {/* Order Items */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium mb-4">Items</h2>
            
            <div className="divide-y divide-gray-200">
              {order.items.map((item) => (
                <div key={item._id} className="py-4 flex gap-4">
                  <img 
                    src={item.product.images[0]} 
                    alt={item.product.name} 
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium">
                        <Link to={`/products/${item.product._id}`} className="hover:text-primary">
                          {item.product.name}
                        </Link>
                      </h3>
                      <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {item.size && `Size: ${item.size} | `}
                      Quantity: {item.quantity}
                    </p>
                    <p className="text-sm text-gray-500">
                      Price: ₹{item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Shipping Details */}
          <div className="bg-white shadow rounded-lg p-6 mb-6 md:mb-0">
            <h2 className="text-lg font-medium mb-4">Shipping Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Shipping Address</h3>
                <p>{order.shippingDetails.fullName}</p>
                <p>{order.shippingDetails.address}</p>
                <p>{order.shippingDetails.city}, {order.shippingDetails.state}</p>
                <p>PIN: {order.shippingDetails.pincode}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Contact Information</h3>
                <p>Email: {order.shippingDetails.email}</p>
                <p>Phone: {order.shippingDetails.phone}</p>
              </div>
            </div>
            
            {order.trackingInfo && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-medium text-gray-700 mb-2">Tracking Information</h3>
                <p>Tracking Number: {order.trackingInfo.number}</p>
                <p>Courier: {order.trackingInfo.courier}</p>
                <a 
                  href={order.trackingInfo.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Track Order <i className="fas fa-external-link-alt text-xs"></i>
                </a>
              </div>
            )}
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="md:col-span-1">
          <div className="bg-white shadow rounded-lg p-6 sticky top-20">
            <h2 className="text-lg font-medium mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>
                  {order.shippingCost > 0 
                    ? `₹${order.shippingCost.toFixed(2)}` 
                    : 'Free'
                  }
                </span>
              </div>
              
              <div className="flex justify-between border-t pt-3 font-medium">
                <span>Total</span>
                <span>₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-700 mb-2">More Information</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date</span>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status</span>
                  <span className={order.isPaid ? 'text-green-600' : 'text-red-600'}>
                    {order.isPaid ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
            
            {order.status === 'delivered' && !order.isReviewed && (
              <div className="mt-6">
                <Link 
                  to={`/account/orders/${order._id}/review`}
                  className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark block text-center"
                >
                  Write a Review
                </Link>
              </div>
            )}
            
            {order.status === 'pending' && (
              <div className="mt-6">
                <button 
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to cancel this order?')) {
                      try {
                        const response = await fetch(`/account/orders/${order._id}/cancel`, {
                          method: 'POST',
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                          setOrder(prev => ({
                            ...prev,
                            status: 'cancelled'
                          }));
                        } else {
                          setError(data.message || 'Failed to cancel order');
                        }
                      } catch (error) {
                        console.error('Error cancelling order:', error);
                        setError('Failed to cancel order');
                      }
                    }
                  }}
                  className="w-full border border-red-500 text-red-500 py-2 rounded-lg hover:bg-red-50 block text-center"
                >
                  Cancel Order
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails; 
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [summary, setSummary] = useState({
    subtotal: 0,
    discount: 0,
    shipping: 0,
    total: 0
  });
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'cod'
  });
  
  const [errors, setErrors] = useState({});
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Fetch user data if logged in
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        pincode: user.address?.pincode || ''
      }));
    }

    // Fetch cart data
    const fetchCart = async () => {
      try {
        const response = await fetch('/cart/api');
        const data = await response.json();
        
        if (data.success) {
          setCartItems(data.items || []);
          setSummary({
            subtotal: data.subtotal || 0,
            discount: data.discount || 0,
            shipping: data.shipping || 0,
            total: data.total || 0
          });
        } else {
          // If no items in cart, redirect to cart page
          navigate('/cart');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching cart:', error);
        setLoading(false);
        navigate('/cart');
      }
    };

    fetchCart();
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is being filled
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'PIN code is required';
    } else if (!/^\d{6}$/.test(formData.pincode.replace(/[^0-9]/g, ''))) {
      newErrors.pincode = 'PIN code must be 6 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to the first error
      const firstError = document.querySelector('.error-message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setProcessing(true);
    
    try {
      const response = await fetch('/checkout/place-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shippingDetails: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode
          },
          paymentMethod: formData.paymentMethod
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOrderId(data.orderId);
        setOrderPlaced(true);
        
        // Clear cart if order is successful
        localStorage.removeItem('recentlyViewed');
      } else {
        setErrors({
          form: data.message || 'An error occurred while placing your order'
        });
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setErrors({
        form: 'An error occurred while placing your order. Please try again.'
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-0 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-0">
        <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
            <i className="fas fa-check-circle text-4xl"></i>
          </div>
          <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your order. Your order ID is <span className="font-medium">{orderId}</span>.
          </p>
          <p className="text-gray-600 mb-8">
            We have sent an order confirmation to your email. You can also track your order status in your account.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to={`/account/orders/${orderId}`}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
            >
              Track Order
            </Link>
            <Link 
              to="/products/shop"
              className="border border-primary text-primary px-6 py-2 rounded-lg hover:bg-primary-50"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>
      
      {errors.form && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{errors.form}</p>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Checkout Form */}
        <div className="lg:w-2/3">
          <form onSubmit={handleSubmit}>
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium mb-6">Shipping Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Full Name *
                  </label>
                  <input 
                    type="text" 
                    name="fullName" 
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg ${errors.fullName ? 'border-red-500' : ''}`}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600 error-message">{errors.fullName}</p>
                  )}
                </div>
                
                {/* Email */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Email *
                  </label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 error-message">{errors.email}</p>
                  )}
                </div>
                
                {/* Phone */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Phone Number *
                  </label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg ${errors.phone ? 'border-red-500' : ''}`}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600 error-message">{errors.phone}</p>
                  )}
                </div>
                
                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Address *
                  </label>
                  <textarea 
                    name="address" 
                    value={formData.address}
                    onChange={handleChange}
                    rows="2"
                    className={`w-full px-4 py-2 border rounded-lg ${errors.address ? 'border-red-500' : ''}`}
                  ></textarea>
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600 error-message">{errors.address}</p>
                  )}
                </div>
                
                {/* City */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    City *
                  </label>
                  <input 
                    type="text" 
                    name="city" 
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg ${errors.city ? 'border-red-500' : ''}`}
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600 error-message">{errors.city}</p>
                  )}
                </div>
                
                {/* State */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    State *
                  </label>
                  <input 
                    type="text" 
                    name="state" 
                    value={formData.state}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg ${errors.state ? 'border-red-500' : ''}`}
                  />
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600 error-message">{errors.state}</p>
                  )}
                </div>
                
                {/* PIN Code */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    PIN Code *
                  </label>
                  <input 
                    type="text" 
                    name="pincode" 
                    value={formData.pincode}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg ${errors.pincode ? 'border-red-500' : ''}`}
                  />
                  {errors.pincode && (
                    <p className="mt-1 text-sm text-red-600 error-message">{errors.pincode}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium mb-6">Payment Method</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="cod" 
                    name="paymentMethod" 
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary"
                  />
                  <label htmlFor="cod" className="ml-3 text-gray-700">
                    Cash on Delivery
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="card" 
                    name="paymentMethod" 
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary"
                  />
                  <label htmlFor="card" className="ml-3 text-gray-700">
                    Credit/Debit Card (Online Payment)
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="upi" 
                    name="paymentMethod" 
                    value="upi"
                    checked={formData.paymentMethod === 'upi'}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary"
                  />
                  <label htmlFor="upi" className="ml-3 text-gray-700">
                    UPI
                  </label>
                </div>
              </div>
              
              {formData.paymentMethod !== 'cod' && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <i className="fas fa-info-circle mr-2"></i>
                    Online payment will be processed after order confirmation. 
                    You will be redirected to the payment gateway after placing the order.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <Link 
                to="/cart"
                className="flex items-center text-primary hover:underline"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Cart
              </Link>
              
              <button 
                type="submit"
                disabled={processing}
                className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
              >
                {processing ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    Place Order
                    <i className="fas fa-arrow-right"></i>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        
        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white shadow rounded-lg p-6 sticky top-20">
            <h2 className="text-lg font-medium mb-6">Order Summary</h2>
            
            <div className="max-h-60 overflow-y-auto mb-6">
              {cartItems.map((item) => (
                <div key={item._id} className="flex gap-4 mb-4 pb-4 border-b last:border-b-0">
                  <img 
                    src={item.product.images[0]} 
                    alt={item.product.name} 
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {item.size && `Size: ${item.size} | `}
                      Qty: {item.quantity}
                    </p>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        ₹{item.product.price.toFixed(2)} × {item.quantity}
                      </span>
                      <span className="text-sm font-medium">
                        ₹{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{summary.subtotal.toFixed(2)}</span>
              </div>
              
              {summary.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{summary.discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>
                  {summary.shipping > 0 
                    ? `₹${summary.shipping.toFixed(2)}` 
                    : 'Free'
                  }
                </span>
              </div>
              
              <div className="flex justify-between border-t pt-3 font-medium text-lg">
                <span>Total</span>
                <span>₹{summary.total.toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              type="button" 
              onClick={() => {
                // Scroll to submit button on mobile
                const submitButton = document.querySelector('button[type="submit"]');
                if (submitButton) {
                  submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="w-full mt-6 bg-primary text-white py-3 rounded-lg hover:bg-primary-dark lg:hidden"
            >
              Proceed to Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout; 
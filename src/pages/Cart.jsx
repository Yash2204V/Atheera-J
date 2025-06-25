import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmationDialog from '../components/ConfirmationDialog';
import PhoneAuth from '../components/PhoneAuth';

function Cart() {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cartSummary, setCartSummary] = useState({
    subtotal: 0,
    discount: 0,
    total: 0
  });
  const [showEnquiryForm, setShowEnquiryForm] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [enquiryData, setEnquiryData] = useState({
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || ''
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showClearCartDialog, setShowClearCartDialog] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch cart data
  const fetchCart = async () => {
    try {
      console.log('Fetching cart data...');
      setLoading(true);
      
      // Use the dedicated API endpoint for cart data
      const response = await fetch('/products/cart/api', {
        credentials: 'include'
      });

      // Debug response information
      console.log('Cart response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cart: ${response.status}`);
      }

      // Attempt to parse as JSON
      const data = await response.json();
      console.log('Cart data received:', data);

      if (data.success) {
        // Format the cart items to ensure proper image handling
        const formattedCart = data.cart.map(item => ({
          ...item,
          product: {
            ...item.product,
            images: item.product.images.map(image => {
              if (typeof image === 'string') return image;
              if (image.imageBuffer) {
                return `data:${image.contentType || 'image/jpeg'};base64,${image.imageBuffer.toString('base64')}`;
              }
              return image.url || image;
            })
          }
        }));
        
        setCart(formattedCart);
        setCartSummary(data.cartSummary || { subtotal: 0, discount: 0, total: 0 });
        
        // Handle messages
        if (data.messages) {
          if (data.messages.success) setSuccess(data.messages.success);
          if (data.messages.error) setError(data.messages.error);
        }
      } else {
        setError(data.message || 'Failed to load cart');
        setCart([]);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Could not connect to the server. Please try again.');
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle URL parameters for adding to cart
  useEffect(() => {
    // Only fetch cart if user is logged in
    if (!user) {
      setLoading(false);
      return;
    }

    const queryParams = new URLSearchParams(location.search);
    const productId = queryParams.get('product');
    const action = queryParams.get('action');
    
    if (productId && action === 'add' && user) {
      // Clean URL params but keep the current location
      navigate(location.pathname, { replace: true });
      
      // Fetch cart to reflect any changes
      fetchCart();
    } else {
      fetchCart();
    }
  }, [location, user, navigate]);

  // Handle quantity change using form submission (like the EJS version)
  const handleQuantityChange = async (e, productId, currentQuantity, change) => {
    e.preventDefault();
    const newQuantity = currentQuantity + change;
    
    if (newQuantity < 1 || newQuantity > 10) return;
    
    try {
      const response = await fetch(`/products/cart/update/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
        credentials: 'include'
      });
      
      if (response.ok) {
        fetchCart(); // Refresh cart data
      } else {
        setError('Failed to update quantity');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError('Failed to update quantity');
    }
  };

  // Handle item deletion from cart
  const handleRemoveItem = async (itemId) => {
    setItemToDelete(itemId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteItem = async () => {
    try {
      const response = await fetch(`/products/cart/remove/${itemToDelete}`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        setSuccess('Item removed from cart successfully');
        fetchCart(); // Refresh cart data
      } else {
        setError('Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      setError('Failed to remove item');
    } finally {
      setShowDeleteDialog(false);
      setItemToDelete(null);
    }
  };

  // Handle clear cart
  const handleClearCart = () => {
    setShowClearCartDialog(true);
  };

  const confirmClearCart = async () => {
    try {
      const response = await fetch('/products/cart/clear', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        setSuccess('Cart cleared successfully');
        fetchCart(); // Refresh cart data
      } else {
        setError('Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      setError('Failed to clear cart');
    } finally {
      setShowClearCartDialog(false);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handlePhoneNumberChange = (e) => {
    const phoneNumber = e.target.value;
    setEnquiryData(prev => ({ ...prev, phoneNumber }));
    // Reset verification when phone number changes
    setVerifiedPhone('');
    setVerificationCode('');
    setIsPhoneVerified(false);
    setShowPhoneVerification(false);
  };

  const handleSendOTP = async () => {
    try {
      if (!enquiryData.phoneNumber) {
        setError('Please enter a phone number');
        return;
      }

      // Format phone number to E.164 format
      let formattedPhone = enquiryData.phoneNumber.replace(/\D/g, '');
      if (formattedPhone.startsWith('91')) {
        formattedPhone = formattedPhone.substring(2);
      }
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1);
      }
      if (formattedPhone.length !== 10) {
        setError('Please enter a valid 10-digit Indian mobile number');
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
      setEnquiryData(prev => ({ ...prev, phoneNumber: formattedPhone }));
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    }
  };

  const handleEnquirySubmit = async () => {
    try {
      if (!enquiryData.email || !enquiryData.phoneNumber) {
        setError('Please provide both email and phone number');
        return;
      }

      if (!isPhoneVerified) {
        setShowPhoneVerification(true);
        return;
      }

      const products = cart.map(item => ({
        productId: item.product._id,
        quantity: item.quantity
      }));

      const response = await fetch('/enquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email: enquiryData.email,
          phoneNumber: verifiedPhone,
          products,
          verificationCode
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Enquiry submitted successfully!');
        setShowEnquiryForm(false);
        setShowPhoneVerification(false);
        setVerifiedPhone('');
        setVerificationCode('');
        setIsPhoneVerified(false);
        // Clear cart after successful enquiry
        setCart([]);
      } else {
        setError(data.message || 'Failed to submit enquiry');
      }
    } catch (err) {
      console.error('Error submitting enquiry:', err);
      setError('Failed to submit enquiry. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-16 text-center">
        <h2 className="text-2xl font-medium mb-4">Please log in to view your cart</h2>
        <Link 
          to={`/user/login?redirect=${encodeURIComponent(location.pathname)}`}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-16">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Shopping Cart</h1>
      
      {/* Success/Error Messages */}
      {(success || error) && (
        <div className={`mb-6 p-4 rounded-lg ${success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {success || error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="lg:w-2/3">
          {cart.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <img src="/images/empty-cart.webp" alt="Empty Cart" className="w-64 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Looks like you haven't added any items to your cart yet.</p>
              <Link 
                to="/products/shop" 
                className="inline-block px-8 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => {
                // Skip invalid items
                if (!item.product) return null;
                
                // Calculate prices
                const variant = item.product.variants && item.product.variants.length > 0 
                  ? item.product.variants[0] 
                  : { price: 0, discount: 0 };
                
                const price = variant.price || 0;
                const discountedPrice = variant.discount || price;
                const hasDiscount = variant.discount && variant.discount < price;
                
                return (
                  <div key={item._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Product Image */}
                        <div className="w-full sm:w-24 h-48 sm:h-24 flex-shrink-0">
                          <img 
                            src={item.product.images && item.product.images.length > 0 
                              ? item.product.images[0]
                              : '/images/placeholder.jpg'
                            }
                            alt={item.product.title || item.product.name || 'Product'} 
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/placeholder.jpg';
                            }}
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            {item.product.title || item.product.name || 'Product'}
                          </h3>
                          <p className="text-sm text-gray-500 mb-4 capitalize">
                            {item.product.category || ''} › {item.product.subCategory || ''} › 
                            {item.product.subSubCategory || ''}
                          </p>
                          
                          {/* Price Info */}
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            {hasDiscount ? (
                              <>
                                <span className="text-lg text-gray-400 line-through">₹{price}</span>
                                <span className="text-xl font-bold text-primary">₹{discountedPrice}</span>
                              </>
                            ) : (
                              <span className="text-xl font-bold text-primary">₹{price}</span>
                            )}
                          </div>

                          {/* Size & Quantity Controls */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button 
                                type="button"
                                className="quantity-btn px-4 py-2 text-gray-600 hover:bg-gray-100"
                                onClick={(e) => handleQuantityChange(e, item.product._id, item.quantity, -1)}
                              >
                                <i className="fas fa-minus"></i>
                              </button>
                              <input 
                                type="number"
                                value={item.quantity}
                                readOnly
                                className="w-16 text-center border-x border-gray-300 py-2"
                                min="1"
                                max="10"
                              />
                              <button 
                                type="button"
                                className="quantity-btn px-4 py-2 text-gray-600 hover:bg-gray-100"
                                onClick={(e) => handleQuantityChange(e, item.product._id, item.quantity, 1)}
                              >
                                <i className="fas fa-plus"></i>
                              </button>
                            </div>

                            <button 
                              onClick={() => handleRemoveItem(item._id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <i className="fas fa-trash-alt"></i>
                              <span className="ml-2">Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{cartSummary.subtotal.toFixed(2)}</span>
              </div>
              {cartSummary.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{cartSummary.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>₹{cartSummary.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {!showEnquiryForm ? (
              <button 
                className="w-full mt-6 px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
                onClick={() => setShowEnquiryForm(true)}
                disabled={cart.length === 0}
              >
                <i className="fas fa-envelope"></i>
                Place Enquiry
              </button>
            ) : (
              <div className="mt-6 space-y-4">
                {showPhoneVerification ? (
                  <div>
                    <h4 className="text-lg font-medium mb-4">Enter OTP</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      We've sent a verification code to {enquiryData.phoneNumber}
                    </p>
                    <PhoneAuth 
                      mode="verify" 
                      initialPhone={enquiryData.phoneNumber}
                      onVerificationSuccess={(phone, code) => {
                        setVerifiedPhone(phone);
                        setVerificationCode(code);
                        setIsPhoneVerified(true);
                        setShowPhoneVerification(false);
                      }}
                    />
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); handleEnquirySubmit(); }}>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={enquiryData.email}
                        onChange={(e) => setEnquiryData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        Phone Number
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={enquiryData.phoneNumber}
                          onChange={handlePhoneNumberChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                          disabled={isPhoneVerified}
                          placeholder="Enter your phone number"
                        />
                        {!isPhoneVerified && enquiryData.phoneNumber && (
                          <button
                            type="button"
                            onClick={handleSendOTP}
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors whitespace-nowrap"
                          >
                            Send OTP
                          </button>
                        )}
                      </div>
                      {isPhoneVerified && (
                        <p className="text-sm text-green-600 mt-1">
                          ✓ Phone number verified: {verifiedPhone}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowEnquiryForm(false);
                          setShowPhoneVerification(false);
                          setVerifiedPhone('');
                          setVerificationCode('');
                          setIsPhoneVerified(false);
                        }}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
                        disabled={!isPhoneVerified}
                      >
                        Submit Enquiry
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Item Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDeleteItem}
        title="Remove Item"
        message="Are you sure you want to remove this item from your cart?"
      />

      {/* Clear Cart Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showClearCartDialog}
        onClose={() => setShowClearCartDialog(false)}
        onConfirm={confirmClearCart}
        title="Clear Cart"
        message="Are you sure you want to clear your entire cart? This action cannot be undone."
      />
    </div>
  );
}

export default Cart; 
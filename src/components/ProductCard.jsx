import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import PhoneAuth from './PhoneAuth';

function ProductCard({ product }) {
  const { user } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [enquiryData, setEnquiryData] = useState({
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || ''
  });
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  useEffect(() => {
    if (user) {
      checkWishlistStatus();
    }
  }, [user, product._id]);

  useEffect(() => {
    if (user) {
      setEnquiryData({
        email: user.email || '',
        phoneNumber: user.phoneNumber || ''
      });
    }
  }, [user]);

  const checkWishlistStatus = async () => {
    try {
      const response = await fetch(`/wishlist/api/check/${product._id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setIsInWishlist(data.inWishlist);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      window.location.href = '/user/login?redirect=/products/shop';
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/wishlist/api/${isInWishlist ? 'remove' : 'add'}/${product._id}`, {
        method: isInWishlist ? 'DELETE' : 'POST',
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setIsInWishlist(!isInWishlist);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneNumberChange = (e) => {
    const phoneNumber = e.target.value;
    setEnquiryData(prev => ({ ...prev, phoneNumber }));
    // Reset verification when phone number changes
    setVerifiedPhone('');
    setVerificationCode('');
    setIsPhoneVerified(false);
  };

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!enquiryData.email || !enquiryData.phoneNumber) {
      setError('Please provide both email and phone number');
      return;
    }

    if (!isPhoneVerified) {
      setShowPhoneVerification(true);
      return;
    }

    try {
      setIsSubmittingEnquiry(true);
      const response = await fetch('/enquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: enquiryData.email,
          phoneNumber: verifiedPhone,
          products: [{
            productId: product._id,
            quantity: 1
          }],
          verificationCode: verificationCode
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Enquiry submitted successfully!');
        setShowEnquiryModal(false);
        setShowPhoneVerification(false);
        setVerifiedPhone('');
        setVerificationCode('');
        setIsPhoneVerified(false);
      } else {
        setError(data.message || 'Failed to submit enquiry');
      }
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      setError('Failed to submit enquiry. Please try again.');
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              to={`/products/product/${product._id}`}
              className="bg-white p-3 rounded-full hover:bg-gray-100 transition-colors"
            >
              <i className="fas fa-eye text-gray-800"></i>
            </Link>
            <button
              onClick={handleWishlistToggle}
              disabled={isLoading}
              className="bg-white p-3 rounded-full hover:bg-gray-100 transition-colors"
            >
              <i className={`fas fa-heart ${isInWishlist ? 'text-red-500' : 'text-gray-400'}`}></i>
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
            <Link to={`/products/product/${product._id}`} className="hover:text-primary transition-colors">
              {product.name}
            </Link>
          </h3>
          <p className="text-sm text-gray-500 mb-3 capitalize">
            {product.subSubCategory} • {product.subCategory}
          </p>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-2">
              {product.variants[0].discount ? (
                <>
                  <span className="text-base text-gray-400 line-through">
                    ₹{product.variants[0].price}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    ₹{product.variants[0].discount}
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold text-primary">
                  ₹{product.variants[0].price}
                </span>
              )}
            </div>
            <div className="text-yellow-400 flex gap-1">
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
              <i className="fas fa-star"></i>
              <i className="fas fa-star-half-alt"></i>
            </div>
          </div>
          <button
            onClick={() => {
              if (!user) {
                window.location.href = '/user/login?redirect=/products/shop';
                return;
              }
              setShowEnquiryModal(true);
            }}
            className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
          >
            <i className="fas fa-envelope"></i>
            Place Enquiry
          </button>
        </div>
      </div>

      {/* Enquiry Modal */}
      {showEnquiryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Place Enquiry</h3>
              <button
                onClick={() => {
                  setShowEnquiryModal(false);
                  setShowPhoneVerification(false);
                  setVerifiedPhone('');
                  setVerificationCode('');
                  setIsPhoneVerified(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {showPhoneVerification ? (
              <div>
                <h4 className="text-lg font-medium mb-4">Verify Your Phone Number</h4>
                <PhoneAuth 
                  mode="verify" 
                  onVerificationSuccess={(phone, code) => {
                    setVerifiedPhone(phone);
                    setVerificationCode(code);
                    setIsPhoneVerified(true);
                    setShowPhoneVerification(false);
                  }}
                />
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={enquiryData.email}
                    onChange={(e) => setEnquiryData({ ...enquiryData, email: e.target.value })}
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
                        onClick={() => setShowPhoneVerification(true)}
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
                      setShowEnquiryModal(false);
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
                    disabled={isSubmittingEnquiry || !isPhoneVerified}
                  >
                    {isSubmittingEnquiry ? 'Submitting...' : 'Submit Enquiry'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default ProductCard; 
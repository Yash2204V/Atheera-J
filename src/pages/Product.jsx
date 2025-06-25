import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import PhoneAuth from '../components/PhoneAuth';

function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [success, setSuccess] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [enquiryData, setEnquiryData] = useState({
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || ''
  });
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [showQuantityDialog, setShowQuantityDialog] = useState(false);
  const [quantityMessage, setQuantityMessage] = useState('');

  useEffect(() => {
    // Reset state when product ID changes
    setProduct(null);
    setLoading(true);
    setError('');
    setSelectedImage(0);
    setQuantity(1);
    setSelectedSize('');
    setSuccess('');
    
    // Fetch product data
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/products/${id}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }

        const data = await response.json();
        if (data.success) {
          setProduct(data.product);
          setRelatedProducts(data.relatedProducts || []);
          
          // Set the selected size from the first variant
          if (data.product.variants && data.product.variants.length > 0) {
            setSelectedSize(data.product.variants[0].size);
          }
          
          // Add to recently viewed
          if (user) {
            try {
              await fetch(`/account/recently-viewed/${id}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include'
              });
            } catch (error) {
              console.error('Error adding to recently viewed:', error);
            }
          } else {
            // Store in localStorage for non-logged in users
            try {
              const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
              const productToAdd = {
                _id: data.product._id,
                name: data.product.title || data.product.name,
                price: data.product.variants && data.product.variants.length > 0 
                  ? data.product.variants[0].price 
                  : (data.product.price || 0),
                images: [data.product.images[0]],
                category: data.product.category
              };

              // Remove if already exists
              const filteredRecent = recentlyViewed.filter(p => p._id !== productToAdd._id);
              
              // Add to beginning of array
              const updatedRecent = [productToAdd, ...filteredRecent].slice(0, 20); // Keep only 20 items
              localStorage.setItem('recentlyViewed', JSON.stringify(updatedRecent));
            } catch (error) {
              console.error('Error updating localStorage:', error);
            }
          }
        } else {
          setError(data.message || 'Failed to load product');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, user]);

  useEffect(() => {
    if (user) {
      checkWishlistStatus();
    }
  }, [user, id]);

  const checkWishlistStatus = async () => {
    try {
      const response = await fetch(`/wishlist/api/check/${id}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setIsInWishlist(data.inWishlist);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      navigate('/user/login?redirect=/products/product/' + id);
      return;
    }

    // Show confirmation dialog for removal
    if (isInWishlist && !window.confirm('Are you sure you want to remove this item from your wishlist?')) {
      return;
    }

    try {
      setIsWishlistLoading(true);
      const response = await fetch(`/wishlist/api/${isInWishlist ? 'remove' : 'add'}/${id}`, {
        method: isInWishlist ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      // Handle redirects (for authentication)
      if (response.redirected) {
        window.location.href = response.url;
        return;
      }

      const data = await response.json();

      if (data.success) {
        setIsInWishlist(!isInWishlist);
        setSuccess(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to update wishlist');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      setError('Failed to update wishlist. Please try again.');
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    const maxQuantity = product.variants && product.variants.length > 0 
      ? product.variants.find(v => v.size === selectedSize)?.quantity || product.variants[0].quantity 
      : 10;
      
    if (value > 0 && value <= maxQuantity) {
      setQuantity(value);
    }
  };

  const handleIncrement = () => {
    // Find the selected variant
    const selectedVariant = product.variants && product.variants.length > 0 
      ? product.variants.find(v => v.size === selectedSize) || product.variants[0]
      : null;

    // Get the maximum available quantity
    const maxQuantity = selectedVariant ? selectedVariant.quantity : product.quantity;

    // Only increment if we haven't reached the maximum quantity
    if (quantity < maxQuantity) {
      setQuantity(prev => prev + 1);
    } else {
      setError(`Maximum available quantity is ${maxQuantity}`);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    // Check if product is available
    if (!product.availability) {
      setError('This product is out of stock');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    // Check if size is selected for products with variants
    if (product.variants && product.variants.length > 0 && !selectedSize) {
      setError('Please select a size');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    // Find the selected variant
    const selectedVariant = product.variants && product.variants.length > 0 
      ? product.variants.find(v => v.size === selectedSize) || product.variants[0]
      : null;
    
    // Check if selected variant has stock
    if (selectedVariant && selectedVariant.quantity < quantity) {
      setQuantityMessage(`Only ${selectedVariant.quantity} items available in ${selectedSize} size. Please reduce the quantity.`);
      setShowQuantityDialog(true);
      return;
    }
    
    setAddingToCart(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(`/products/addtocart/${product._id}?quantity=${quantity}&size=${selectedSize || (selectedVariant ? selectedVariant.size : 'None')}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (response.redirected) {
        window.location.href = response.url;
        return;
      }

      const data = await response.json();
      if (data.success) {
        setSuccess(`Successfully added ${quantity} item${quantity > 1 ? 's' : ''} to cart!`);
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError(data.message || 'Failed to add product to cart');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('Failed to add product to cart');
      setTimeout(() => setError(''), 3000);
    } finally {
      setAddingToCart(false);
    }
  };

  const navigateToCart = () => {
    navigate('/products/cart');
  };

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
        toast.error('Please enter a phone number');
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
      setEnquiryData(prev => ({ ...prev, phoneNumber: formattedPhone }));
    } catch (err) {
      console.error('Error sending OTP:', err);
      toast.error(err.message || 'Failed to send OTP. Please try again.');
    }
  };

  const handleEnquirySubmit = async () => {
    if (!enquiryData.email || !enquiryData.phoneNumber) {
      toast.error('Please provide both email and phone number');
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
            quantity: quantity
          }],
          verificationCode
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
        toast.error(data.message || 'Failed to submit enquiry');
      }
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      toast.error('Failed to submit enquiry');
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  useEffect(() => {
    const checkCartStatus = async () => {
      try {
        const response = await fetch('/products/cart', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const cartItem = data.cartItems.find(item => 
            item.product._id === product._id && 
            (!selectedSize || item.size === selectedSize)
          );
          setIsInCart(!!cartItem);
        }
      } catch (error) {
        console.error('Error checking cart status:', error);
      }
    };

    if (product) {
      checkCartStatus();
    }
  }, [product, selectedSize]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Error</p>
          <p>{error || 'Product not found'}</p>
          <button
            onClick={() => navigate('/products/shop')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Quantity Limit Dialog */}
      {showQuantityDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <i className="fas fa-exclamation-circle text-yellow-500 text-4xl mb-4"></i>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Quantity Limit Reached</h3>
              <p className="text-gray-600 mb-6">{quantityMessage}</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowQuantityDialog(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setQuantity(selectedVariant.quantity);
                    setShowQuantityDialog(false);
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Set to Maximum
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50 flex items-center gap-2">
          <i className="fas fa-check-circle"></i>
          <span>{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 flex items-center gap-2">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-50">
              <img 
                src={product.images[selectedImage]?.url || product.images[selectedImage]} 
                alt={product.title || product.name} 
                className="w-full h-full object-contain"
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((image, index) => (
                  <div 
                    key={index}
                    className={`cursor-pointer rounded-md overflow-hidden border-2 ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img 
                      src={image?.url || image} 
                      alt={`${product.title || product.name} - View ${index + 1}`} 
                      className="w-full h-20 object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title || product.name}</h1>
                <p className="text-gray-500 mb-4">Model No: {product.variants[0]?.modelno || 'N/A'}</p>
                <p className="text-gray-600 mb-4">Category: {product.category} › {product.subCategory} › {product.subSubCategory}</p>
              </div>
              <button
                onClick={handleWishlistToggle}
                disabled={isWishlistLoading}
                className="text-2xl hover:text-primary transition-colors"
              >
                <i className={`fas fa-heart ${isInWishlist ? 'text-red-500' : 'text-gray-400'}`}></i>
              </button>
            </div>
            
            {/* Price Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-baseline gap-2">
                {product.variants && product.variants.length > 0 ? (
                  <>
                    <span className="text-3xl font-bold text-primary">₹{product.variants[0].discount.toFixed(2)}</span>
                    {product.variants[0].discount > 0 && (
                      <>
                        <span className="text-xl text-gray-500 line-through">₹{product.variants[0].price.toFixed(2)}</span>
                        <span className="bg-red-100 text-red-800 text-sm px-2 py-1 rounded">
                          {Math.round((1 - product.variants[0].discount / product.variants[0].price) * 100)}% Off
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <span className="text-3xl font-bold text-primary">₹{(product.price || 0).toFixed(2)}</span>
                )}
              </div>
            </div>

            {/* Size Selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Select Size</h3>
                <div className="grid grid-cols-5 gap-2">
                  {product.variants.map((variant, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedSize(variant.size)}
                      className={`p-2 text-center rounded-md border ${
                        selectedSize === variant.size
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-300 hover:border-primary'
                      } ${variant.quantity <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={variant.quantity <= 0}
                    >
                      {variant.size}
                      <div className="text-xs mt-1">
                        {variant.quantity > 0 ? `Only ${variant.quantity} left` : 'Out of stock'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleDecrement}
                className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-gray-100"
                disabled={quantity <= 1}
              >
                <i className="fas fa-minus"></i>
              </button>
              <span className="text-lg font-medium">{quantity}</span>
              <button
                onClick={handleIncrement}
                className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-gray-100"
                disabled={quantity >= (product.variants && product.variants.length > 0 
                  ? (product.variants.find(v => v.size === selectedSize) || product.variants[0]).quantity 
                  : product.quantity)}
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              {isInCart ? (
                <div className="flex flex-col space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-green-700 font-medium">This item is in your cart</p>
                  </div>
                  <button
                    onClick={() => window.location.href = '/cart'}
                    className="w-full py-3 px-6 rounded-lg text-white font-medium transition-colors bg-green-600 hover:bg-green-700 flex items-center justify-center"
                  >
                    <i className="fas fa-shopping-cart mr-2"></i>
                    Go to Cart
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || !product.availability}
                  className="w-full py-3 px-6 rounded-lg text-white font-medium transition-colors bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {addingToCart ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Adding...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-shopping-cart mr-2"></i>
                      Add to Cart
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => setShowEnquiryModal(true)}
                className="w-full py-3 px-6 border border-primary text-primary rounded-md hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <i className="fas fa-envelope"></i>
                Place Enquiry
              </button>
            </div>

            {/* Social Share */}
            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-3">Share:</h3>
              <div className="flex space-x-4">
                <button className="text-gray-600 hover:text-primary">
                  <i className="fab fa-facebook fa-lg"></i>
                </button>
                <button className="text-gray-600 hover:text-primary">
                  <i className="fab fa-twitter fa-lg"></i>
                </button>
                <button className="text-gray-600 hover:text-primary">
                  <i className="fab fa-pinterest fa-lg"></i>
                </button>
                <button className="text-gray-600 hover:text-primary">
                  <i className="fab fa-whatsapp fa-lg"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="border-t border-gray-200 p-6">
          <h2 className="text-2xl font-bold mb-6">Product Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Quality</h3>
                <p className="text-gray-600">Quality is our priority 💞💕💞💕💞💕💞💕</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">General Details</h3>
                <p className="text-gray-600">{product.generalDetails || 'No general details available.'}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Size Guide</h3>
                <p className="text-gray-600">
                  {product.variants && product.variants.length > 0 && (
                    <>
                      Length 🎽TOP-{product.variants[0].topLength || 'N/A'}+ 👖Bottom - {product.variants[0].bottomLength || 'N/A'}+
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(relatedProduct => (
              <div key={relatedProduct._id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
                <Link to={`/products/product/${relatedProduct._id}`} className="block">
                  <img 
                    src={relatedProduct.images[0]?.url || relatedProduct.images[0]} 
                    alt={relatedProduct.title || relatedProduct.name} 
                    className="w-full h-64 object-cover"
                  />
                </Link>
                <div className="p-4">
                  <Link to={`/products/product/${relatedProduct._id}`} className="block">
                    <h3 className="font-medium text-lg mb-1 hover:text-primary transition">{relatedProduct.title || relatedProduct.name}</h3>
                  </Link>
                  <p className="text-gray-500 text-sm mb-2 capitalize">
                    {relatedProduct.subSubCategory} • {relatedProduct.subCategory}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-baseline gap-2">
                      {relatedProduct.variants && relatedProduct.variants.length > 0 ? (
                        <>
                          <span className="text-lg font-bold text-primary">
                            ₹{relatedProduct.variants[0].discount.toFixed(2)}
                          </span>
                          {relatedProduct.variants[0].discount > 0 && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹{relatedProduct.variants[0].price.toFixed(2)}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-lg font-bold text-primary">
                          ₹{(relatedProduct.price || 0).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <Link 
                      to={`/products/product/${relatedProduct._id}`}
                      className="text-primary hover:text-primary-dark"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                    disabled={!isPhoneVerified}
                  >
                    Submit Enquiry
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Product; 
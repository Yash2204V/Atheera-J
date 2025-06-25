import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmationDialog from '../components/ConfirmationDialog';

function Wishlist() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/user/login?redirect=/wishlist');
      return;
    }
    fetchWishlist();
  }, [user, navigate]);

  const fetchWishlist = async () => {
    try {
      const response = await fetch('/wishlist/api', {
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
        // Filter out any null or undefined products
        const validItems = data.wishlist.filter(item => item && item._id);
        setWishlistItems(validItems);
        
        // If some items were filtered out, show a message
        if (validItems.length < data.wishlist.length) {
          setError('Some products in your wishlist are no longer available');
          setTimeout(() => setError(''), 5000);
        }
      } else {
        setError(data.message || 'Failed to fetch wishlist');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setError('Failed to fetch wishlist. Please try again later.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveClick = (productId) => {
    setItemToDelete(productId);
    setShowDeleteDialog(true);
  };

  const removeFromWishlist = async () => {
    try {
      const response = await fetch(`/wishlist/api/remove/${itemToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
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
        setWishlistItems(prev => prev.filter(item => item._id !== itemToDelete));
        setSuccess('Product removed from wishlist');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to remove product from wishlist');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      setError('Failed to remove product from wishlist');
      setTimeout(() => setError(''), 3000);
    } finally {
      setShowDeleteDialog(false);
      setItemToDelete(null);
    }
  };

  const addToCart = async (productId) => {
    try {
      const response = await fetch(`/products/addtocart/${productId}`, {
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
        // Remove from wishlist after successfully adding to cart
        const removeResponse = await fetch(`/wishlist/api/remove/${productId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (removeResponse.ok) {
          // Update the wishlist items state
          setWishlistItems(prev => prev.filter(item => item._id !== productId));
          setSuccess('Product added to cart and removed from wishlist');
          // Refresh the wishlist
          await fetchWishlist();
        } else {
        setSuccess('Product added to cart');
        }
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to add product to cart');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('Failed to add product to cart');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-0 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <h1 className="text-2xl font-bold mb-8">My Wishlist</h1>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError('')}>
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </span>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{success}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setSuccess('')}>
            <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </span>
        </div>
      )}

      {wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-4">Your wishlist is empty</h3>
          <Link 
            to="/products/shop" 
            className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlistItems.map(product => (
            <div 
              key={product._id} 
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <Link to={`/products/product/${product._id}`}>
                <img 
                  src={product.images[0]?.url || product.images[0]} 
                  alt={product.name} 
                  className="w-full h-64 object-cover"
                />
              </Link>
              <div className="p-4">
                <Link to={`/products/product/${product._id}`}>
                  <h3 className="font-medium text-lg mb-2">{product.name}</h3>
                </Link>
                <p className="text-gray-500 text-sm mb-2">{product.category}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-lg">
                        ₹{product.variants[0].discount}
                  </span>
                  <span className="text-sm text-gray-500">
                    Added {new Date(product.addedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => addToCart(product._id)}
                    className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => handleRemoveClick(product._id)}
                    className="px-4 py-2 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setItemToDelete(null);
        }}
        onConfirm={removeFromWishlist}
        title="Remove from Wishlist"
        message="Are you sure you want to remove this item from your wishlist?"
      />
    </div>
  );
}

export default Wishlist; 
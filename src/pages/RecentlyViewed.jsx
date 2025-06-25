import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccountLayout from '../components/AccountLayout';

function RecentlyViewed() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    account: true,
    orders: false,
    profile: false,
    address: false,
    other: false
  });

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      try {
        console.log('Fetching recently viewed products...');
        const response = await fetch('/account/recently-viewed/api', {
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'include'
        });
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
          // Ensure all required fields are present and properly formatted
          const formattedProducts = (data.recentlyViewed || []).map(product => ({
            _id: product._id,
            name: product.name || product.title || 'Untitled Product',
            price: product.price || (product.variants && product.variants[0]?.price) || 0,
            category: product.category || 'Uncategorized',
            images: Array.isArray(product.images) && product.images.length > 0 
              ? product.images.map(img => img?.url || img)
              : ['/images/placeholder.jpg']
          }));
          setProducts(formattedProducts);
        } else {
          // If API call fails for logged in user, try local storage as a fallback
          console.warn('Failed to fetch recently viewed from API, trying local storage');
          loadFromLocalStorage();
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching recently viewed products from API:', error);
        // Fallback to local storage on API error
        loadFromLocalStorage();
        setLoading(false);
      }
    };

    const loadFromLocalStorage = () => {
       const localRecentlyViewed = localStorage.getItem('recentlyViewed');
       if (localRecentlyViewed) {
         try {
           const parsedData = JSON.parse(localRecentlyViewed);
           // Format local data similarly
           const formattedProducts = parsedData.map(product => ({
             _id: product._id,
             name: product.name || product.title || 'Untitled Product',
             price: product.price || (product.variants && product.variants[0]?.price) || 0,
             category: product.category || 'Uncategorized',
             images: Array.isArray(product.images) && product.images.length > 0 
               ? product.images.map(img => img?.url || img)
               : ['/images/placeholder.jpg']
           }));
           setProducts(formattedProducts);
         } catch (err) {
           console.error('Error parsing locally stored recently viewed products:', err);
           setProducts([]); // Clear products if local storage is invalid
         }
       } else {
          setProducts([]); // Ensure state is empty if no local data
       }
    };

    if (user) {
      fetchRecentlyViewed();
    } else {
      loadFromLocalStorage();
    }
    
  }, [user]); // Added user to dependency array

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <AccountLayout>
        <div className="flex justify-center items-center min-h-96">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
            <p className="text-gray-600 font-medium">Loading your recently viewed products...</p>
          </div>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary to-secondary px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Recently Viewed</h1>
              <p className="text-white/90">Products you've recently browsed</p>
            </div>
            <div className="hidden md:flex items-center space-x-2 text-white/90">
              <i className="fas fa-history text-2xl"></i>
              <span className="text-lg font-medium">{products.length} {products.length === 1 ? 'Product' : 'Products'}</span>
            </div>
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-8">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex flex-col items-center space-y-6">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                  <i className="fas fa-eye-slash text-4xl text-primary/60"></i>
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-gray-800">No Recently Viewed Products</h2>
                  <p className="text-gray-600 max-w-md">Start browsing our amazing collection to see your recently viewed products here.</p>
                </div>
                <Link 
                  to="/products/shop" 
                  className="inline-flex items-center space-x-2 bg-primary text-white px-8 py-4 rounded-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <i className="fas fa-shopping-bag"></i>
                  <span className="font-semibold">Browse Products</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map(product => (
                  <div key={product._id} className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden">
                    {/* Product Image */}
                    <div className="relative overflow-hidden">
                      <Link to={`/products/product/${product._id}`}>
                        <img 
                          src={product.images[0]} 
                          alt={product.name} 
                          className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/placeholder.jpg';
                          }}
                        />
                      </Link>
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Link 
                          to={`/products/product/${product._id}`}
                          className="bg-white text-primary px-6 py-2 rounded-full font-semibold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-lg hover:shadow-xl"
                        >
                          Quick View
                        </Link>
                      </div>
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-6 space-y-4">
                      <div className="space-y-2">
                        <Link to={`/products/product/${product._id}`} className="block">
                          <h3 className="font-bold text-xl text-gray-800 hover:text-primary transition-colors duration-200 line-clamp-2 leading-tight">
                            {product.name}
                          </h3>
                        </Link>
                        <div className="flex items-center space-x-2">
                          <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                            {product.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="space-y-1">
                          <span className="text-2xl font-bold text-gray-900">₹{Number(product.price).toLocaleString()}</span>
                        </div>
                        <Link 
                          to={`/products/product/${product._id}`}
                          className="inline-flex items-center space-x-1 text-primary hover:text-primary/80 font-semibold transition-colors duration-200"
                        >
                          {/* <span>View</span>
                          <i className="fas fa-arrow-right text-sm"></i> */}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-gray-200 space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-2 text-gray-600">
                  <i className="fas fa-info-circle"></i>
                  <span>Showing your last {products.length} viewed products</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/products/shop" 
                    className="inline-flex items-center space-x-2 text-primary hover:text-primary/80 font-semibold transition-colors duration-200"
                  >
                    <i className="fas fa-shopping-bag"></i>
                    <span>Continue Shopping</span>
                  </Link>
                  <Link 
                    to="/cart" 
                    className="inline-flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <i className="fas fa-shopping-cart"></i>
                    <span>View Cart</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AccountLayout>
  );
}

export default RecentlyViewed; 
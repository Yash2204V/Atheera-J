import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmationDialog from '../components/ConfirmationDialog';

function Shop() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for products and UI
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categories, setCategories] = useState({});
  const [totalProducts, setTotalProducts] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [addingToCart, setAddingToCart] = useState(false);
  // Add wishlist states
  const [wishlistItems, setWishlistItems] = useState(new Set());
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState('');
  const [wishlistSuccess, setWishlistSuccess] = useState('');
  
  // State for filters
  const [filters, setFilters] = useState({
    query: '',
    category: '',
    subCategory: '',
    subSubCategory: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1
  });
  
  // State for mobile filter visibility
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  
  // State for category relationships
  const [categoryRelationships, setCategoryRelationships] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  
  // State for wishlist confirmation dialog
  const [showWishlistDialog, setShowWishlistDialog] = useState(false);
  const [itemToToggle, setItemToToggle] = useState(null);
  
  // Parse query params on component mount and location change
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    setFilters(prev => ({
      ...prev,
      query: searchParams.get('query') || '',
      category: searchParams.get('category') || '',
      subCategory: searchParams.get('subCategory') || '',
      subSubCategory: searchParams.get('subSubCategory') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      page: parseInt(searchParams.get('page') || '1', 10)
    }));
    
    // Reset products when filters change (except pagination)
    if (!searchParams.has('page') || searchParams.get('page') === '1') {
      setProducts([]);
    }
  }, [location.search]);
  
  // Fetch products based on filters
  const fetchProducts = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else if (initialLoad) {
        setLoading(true);
      }
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      // Make API request
      const response = await fetch(`/products/shop?${queryParams.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        if (isLoadMore) {
          setProducts(prev => [...prev, ...data.products]);
        } else {
          setProducts(data.products);
        }
        
        setCategories(data.categories || {});
        setTotalProducts(data.totalProducts || 0);
        setPagination(data.pagination || {
          currentPage: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        });
      } else {
        console.error('Error fetching products:', data.message);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setInitialLoad(false);
    }
  }, [filters]);
  
  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
    fetchCategoryRelationships();
  }, [fetchProducts]);
  
  // Fetch category relationships
  const fetchCategoryRelationships = async () => {
    try {
      const response = await fetch('/products/category-relationships');
      const data = await response.json();
      if (data.success) {
        setCategoryRelationships(data.relationships || {});
      }
    } catch (error) {
      console.error('Error fetching category relationships:', error);
    }
  };
  
  // Toggle category/subcategory visibility
  const toggleElement = (id) => {
    const element = document.getElementById(id);
    const icon = document.querySelector(`[data-target="${id}"] i`);
    if (element && icon) {
      element.classList.toggle('hidden');
      icon.classList.toggle('fa-chevron-down');
      icon.classList.toggle('fa-chevron-up');
    }
  };
  
  // Update URL with new filters
  const updateFilters = (newFilters) => {
    // Only reset page to 1 if we're changing filters other than page
    const shouldResetPage = Object.keys(newFilters).some(key => key !== 'page');
    const updatedFilters = { 
      ...filters, 
      ...newFilters,
      page: shouldResetPage ? 1 : (newFilters.page || filters.page)
    };
    
    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    // Update URL
    navigate(`/products/shop?${queryParams.toString()}`);
  };
  
  // Handle sort change
  const handleSortChange = (e) => {
    const [sortBy, sortOrder] = e.target.value.split('_');
    console.log('Sorting by:', sortBy, 'Order:', sortOrder); // Debug log
    updateFilters({ sortBy, sortOrder });
  };
  
  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    updateFilters({ query: e.target.query.value });
  };
  
  // Handle category/subcategory filter
  const handleCategoryFilter = (category, subCategory, subSubCategory) => {
    const newFilters = {
      category: category || '',
      subCategory: subCategory || '',
      subSubCategory: subSubCategory || ''
    };
    updateFilters(newFilters);
  };
  
  // Load more products
  const loadMoreProducts = () => {
    updateFilters({ page: filters.page + 1 });
  };
  
  // Handle page change
  const handlePageChange = (pageNumber) => {
    updateFilters({ page: pageNumber });
  };
  
  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, pagination.currentPage - halfVisible);
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };
  
  // Clear all filters
  const clearFilters = () => {
    navigate('/products/shop');
  };
  
  // Toggle mobile filter
  const toggleMobileFilter = () => {
    setShowMobileFilter(!showMobileFilter);
    if (!showMobileFilter) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };
  
  // Handle adding product to cart
  const handleAddToCart = async (productId, event) => {
    event.preventDefault();
    
    if (!user) {
      navigate('/user/login');
      return;
    }
    
    setAddingToCart(true);
    
    try {
      // Use fetch to call the server endpoint directly
      const response = await fetch(`/products/addtocart/${productId}?direct=true`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.redirected) {
        window.location.href = response.url;
      } else if (response.ok) {
        // Refresh the current page to show the notification
        window.location.reload();
      } else {
        console.error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };
  
  // Toggle category expansion
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  
  // Add function to check wishlist status for all products
  const checkWishlistStatus = async (productIds) => {
    if (!user) return;
    
    try {
      const newWishlistItems = new Set(wishlistItems);
      
      for (const productId of productIds) {
        console.log('Checking wishlist status for product:', productId);
        const response = await fetch(`/wishlist/api/check/${productId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // Handle unauthorized error
            navigate('/user/login?redirect=/products/shop');
            return;
          }
          const errorData = await response.json();
          console.error('Wishlist check error:', errorData);
          continue;
        }
        
        const data = await response.json();
        console.log('Wishlist check response:', data);
        
        if (data.success && data.inWishlist) {
          newWishlistItems.add(productId);
        }
      }
      
      setWishlistItems(newWishlistItems);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  // Add effect to check wishlist status when products change
  useEffect(() => {
    if (products.length > 0) {
      checkWishlistStatus(products.map(p => p._id));
    }
  }, [products]);

  // Add wishlist toggle function
  const handleWishlistToggle = async (productId, event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      navigate('/user/login?redirect=/products/shop');
      return;
    }

    const isInWishlist = wishlistItems.has(productId);
    
    if (isInWishlist) {
      setItemToToggle(productId);
      setShowWishlistDialog(true);
    } else {
      await addToWishlist(productId);
    }
  };

  const addToWishlist = async (productId) => {
    try {
      setIsWishlistLoading(true);
      setWishlistError('');
      
      const response = await fetch(`/wishlist/api/add/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      if (response.status === 401) {
        navigate('/user/login?redirect=/products/shop');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server error');
      }

      const data = await response.json();
      
      if (data.success) {
        const newWishlistItems = new Set(wishlistItems);
        newWishlistItems.add(productId);
        setWishlistItems(newWishlistItems);
        setWishlistSuccess('Added to wishlist');
        setTimeout(() => setWishlistSuccess(''), 3000);
      } else {
        setWishlistError(data.message || 'Failed to update wishlist');
        setTimeout(() => setWishlistError(''), 3000);
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      setWishlistError(error.message || 'Failed to update wishlist. Please try again.');
      setTimeout(() => setWishlistError(''), 3000);
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const removeFromWishlist = async () => {
    try {
      setIsWishlistLoading(true);
      setWishlistError('');
      
      const response = await fetch(`/wishlist/api/remove/${itemToToggle}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Server error');
      }

      const data = await response.json();
      
      if (data.success) {
        const newWishlistItems = new Set(wishlistItems);
        newWishlistItems.delete(itemToToggle);
        setWishlistItems(newWishlistItems);
        setWishlistSuccess('Removed from wishlist');
        setTimeout(() => setWishlistSuccess(''), 3000);
      } else {
        setWishlistError(data.message || 'Failed to update wishlist');
        setTimeout(() => setWishlistError(''), 3000);
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      setWishlistError(error.message || 'Failed to update wishlist. Please try again.');
      setTimeout(() => setWishlistError(''), 3000);
    } finally {
      setIsWishlistLoading(false);
      setShowWishlistDialog(false);
      setItemToToggle(null);
    }
  };
  
  return (
    <div className="container py-16">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="lg:w-1/4">
          {/* Mobile Filter Button */}
          <button 
            className="lg:hidden w-full mb-4 px-4 py-2 bg-primary text-white rounded-lg flex items-center justify-between"
            onClick={toggleMobileFilter}
          >
            <span>Show Filters</span>
            <i className="fas fa-filter"></i>
          </button>
          
          <div 
            className={`${
              showMobileFilter ? 'block' : 'hidden'
            } lg:block fixed lg:static inset-0 lg:inset-auto z-50 lg:z-auto bg-white lg:bg-transparent transform transition-transform duration-300`}
          >
            {/* Close button for mobile */}
            <button 
              className="lg:hidden absolute right-4 top-4 text-gray-500 hover:text-gray-700"
              onClick={toggleMobileFilter}
            >
              <i className="fas fa-times text-xl"></i>
            </button>
            
            <div className="h-full lg:h-auto overflow-y-auto lg:overflow-visible p-6 lg:p-0">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                {/* Categories */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Categories</h3>
                  <div className="space-y-2">
                    {Object.entries(categoryRelationships).map(([category, data]) => (
                      <div key={category}>
                        <button
                          className="w-full flex items-center justify-between text-gray-700 hover:text-primary transition-colors"
                          onClick={() => toggleCategory(category)}
                        >
                          <span className="capitalize font-medium">{category}</span>
                          <i className={`fas fa-chevron-${expandedCategories[category] ? 'up' : 'down'} text-sm`}></i>
                        </button>
                        
                        {expandedCategories[category] && (
                          <div className="mt-3 ml-4">
                            {data.subCategories.map(subCategory => (
                              <div key={subCategory}>
                                <button
                                  className={`w-full flex items-center justify-between text-gray-600 hover:text-primary transition-colors ${
                                    filters.subCategory === subCategory ? 'text-primary font-medium' : ''
                                  }`}
                                  onClick={() => {
                                    handleCategoryFilter(category, subCategory);
                                  }}
                                >
                                  <span className="capitalize">{subCategory}</span>
                                  {data.subSubCategories[subCategory]?.length > 0 && (
                                    <i className="fas fa-chevron-right text-sm"></i>
                                  )}
                                </button>
                                
                                {data.subSubCategories[subCategory]?.length > 0 && (
                                  <ul className="mt-2 space-y-2 ml-4">
                                    {data.subSubCategories[subCategory].map(subSubCategory => (
                                      <li key={subSubCategory}>
                                        <button
                                          className={`w-full text-left text-gray-500 hover:text-primary transition-colors flex items-center gap-2 ${
                                            filters.subSubCategory === subSubCategory ? 'text-primary font-medium' : ''
                                          }`}
                                          onClick={() => {
                                            handleCategoryFilter(category, subCategory, subSubCategory);
                                          }}
                                        >
                                          <i className="fas fa-angle-right text-xs"></i>
                                          <span className="capitalize">{subSubCategory}</span>
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Price Range */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Range</h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-sm text-gray-600 mb-1 block">Min</label>
                        <input 
                          type="number" 
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="₹0"
                          value={filters.minPrice}
                          onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                          onBlur={() => updateFilters({minPrice: filters.minPrice})}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-sm text-gray-600 mb-1 block">Max</label>
                        <input 
                          type="number" 
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="₹10000"
                          value={filters.maxPrice}
                          onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                          onBlur={() => updateFilters({maxPrice: filters.maxPrice})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Clear Filters */}
                {(filters.query || filters.category || filters.subCategory || filters.minPrice || filters.maxPrice) && (
                  <button
                    className="w-full px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                    onClick={clearFilters}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Overlay for mobile filter */}
          <div 
            className={`fixed inset-0 bg-black bg-opacity-50 z-40 ${showMobileFilter ? 'block' : 'hidden'} lg:hidden`}
            onClick={toggleMobileFilter}
          ></div>
        </div>
        
        {/* Products Grid */}
        <div className="lg:w-3/4">
          {/* Products Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold">All Products</h1>
              <p className="text-gray-500">{totalProducts} products found</p>
            </div>
            
            {/* Sort Dropdown */}
            <div className="w-full sm:w-auto">
              <select 
                onChange={handleSortChange}
                value={`${filters.sortBy}_${filters.sortOrder}`}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="createdAt_desc">Newest First</option>
                <option value="variants.0.price_asc">Price: Low to High</option>
                <option value="variants.0.price_desc">Price: High to Low</option>
                {/* <option value="title_asc">Name: A to Z</option>
                <option value="title_desc">Name: Z to A</option>
                <option value="rating_desc">Rating: High to Low</option> */}
              </select>
            </div>
          </div>
          
          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or search terms</p>
              <button 
                onClick={clearFilters}
                className="text-primary hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <div 
                    key={product._id} 
                    className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square overflow-hidden">
                      <img 
                        src={product.images[0]?.url || product.images[0]} 
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
                          onClick={(e) => handleAddToCart(product._id, e)}
                          className="bg-white p-3 rounded-full hover:bg-gray-100 transition-colors"
                          disabled={addingToCart}
                        >
                          <i className="fas fa-shopping-cart text-gray-800"></i>
                        </button>
                        <button
                          onClick={(e) => handleWishlistToggle(product._id, e)}
                          className="bg-white p-3 rounded-full hover:bg-gray-100 transition-colors"
                          disabled={isWishlistLoading}
                        >
                          <i className={`fas fa-heart ${wishlistItems.has(product._id) ? 'text-red-500' : 'text-gray-800'}`}></i>
                        </button>
                      </div>
                    </div>
                    
                    {/* Show wishlist error/success messages */}
                    {wishlistError && (
                      <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
                        {wishlistError}
                      </div>
                    )}
                    {wishlistSuccess && (
                      <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
                        {wishlistSuccess}
                      </div>
                    )}
                    
                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                        <Link to={`/products/product/${product._id}`} className="hover:text-primary transition-colors">
                          {product.title || product.name}
                        </Link>
                      </h3>
                      <p className="text-sm text-gray-500 mb-2 capitalize">
                        {product.subSubCategory} • {product.subCategory}
                      </p>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
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
                        {/* <div className="text-yellow-400 flex gap-1">
                          {[...Array(5)].map((_, index) => {
                            // Debug the entire product and its variants
                            console.log('Full product:', product);
                            console.log('Product variants:', product.variants);
                            
                            // Get the quality value from the first variant
                            const qualityValue = product.variants[0]?.quality;
                            console.log('Raw quality value:', qualityValue);
                            
                            // Convert to number, handling both string and number types
                            let rating = 0;
                            if (qualityValue) {
                              if (typeof qualityValue === 'string') {
                                // Try to extract number from string
                                const numMatch = qualityValue.match(/\d+/);
                                rating = numMatch ? parseInt(numMatch[0]) : 0;
                              } else {
                                rating = Number(qualityValue);
                              }
                            }
                            console.log('Final rating:', rating);
                            
                            // Show filled star if current index is less than rating
                            const starType = index < rating ? 'fas fa-star' : 'far fa-star';
                            return <i key={index} className={starType}></i>;
                          })}
                        </div> */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center mt-8 gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className={`px-4 py-2 rounded-lg ${
                      pagination.hasPrevPage
                        ? 'bg-primary text-white hover:bg-primary-dark'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  
                  {generatePageNumbers().map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-lg ${
                        pageNum === pagination.currentPage
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className={`px-4 py-2 rounded-lg ${
                      pagination.hasNextPage
                        ? 'bg-primary text-white hover:bg-primary-dark'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Wishlist Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showWishlistDialog}
        onClose={() => {
          setShowWishlistDialog(false);
          setItemToToggle(null);
        }}
        onConfirm={removeFromWishlist}
        title="Remove from Wishlist"
        message="Are you sure you want to remove this item from your wishlist?"
      />
    </div>
  );
}

export default Shop; 
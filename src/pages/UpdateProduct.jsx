import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function UpdateProduct() {
  const { productid } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super-admin';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [product, setProduct] = useState(null);
  const [variantCount, setVariantCount] = useState(0);
  const variantsContainerRef = useRef(null);
  
  // Category states
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewSubCategory, setShowNewSubCategory] = useState(false);
  const [showNewSubSubCategory, setShowNewSubSubCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [newSubSubCategory, setNewSubSubCategory] = useState('');
  
  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    brand: '',
    weight: '',
    category: '',
    subCategory: '',
    subSubCategory: '',
    variants: []
  });
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/products/categories');
        const data = await response.json();
        if (data.success) {
          setCategories(data.categories || []);
          setSubCategories(data.subCategories || []);
          setSubSubCategories(data.subSubCategories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);
  
  useEffect(() => {
    // Check if user is authenticated and has admin role
    if (!user) {
      navigate('/user/login');
      return;
    }
    
    if (!isAdmin && !isSuperAdmin) {
      navigate('/');
      return;
    }
    
    // Fetch product data
    fetchProduct();
  }, [user, navigate, productid, isAdmin, isSuperAdmin]);
  
  const fetchProduct = async () => {
    try {
      const endpoint = isSuperAdmin 
        ? `/super-admin/products/${productid}/edit`
        : `/admin-haha/edit/${productid}/api`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch product');
      }
      
      setProduct(data.product);
      setFormData({
        title: data.product.title || '',
        description: data.product.description || '',
        brand: data.product.brand || '',
        weight: data.product.weight || '',
        category: data.product.category || '',
        subCategory: data.product.subCategory || '',
        subSubCategory: data.product.subSubCategory || '',
        variants: data.product.variants || []
      });
      setVariantCount(data.product.variants.length);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleVariantChange = (index, field, value) => {
    setFormData(prev => {
      const updatedVariants = [...prev.variants];
      updatedVariants[index] = {
        ...updatedVariants[index],
        [field]: value
      };
      return {
        ...prev,
        variants: updatedVariants
      };
    });
  };
  
  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          modelno: '',
          size: 'None',
          quality: '',
          price: '',
          discount: '',
          quantity: ''
        }
      ]
    }));
    setVariantCount(prev => prev + 1);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const endpoint = isSuperAdmin
        ? `/super-admin/products/${productid}`
        : `/admin-haha/edit/${productid}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update product');
      }
      
      // Navigate back to the appropriate dashboard
      navigate(isSuperAdmin ? '/super-admin?tab=products' : '/admin-haha');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddNewCategory = async () => {
    if (!newCategory) return;
    
    try {
      const response = await fetch('/products/categories/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category: newCategory })
      });
      
      const data = await response.json();
      if (data.success) {
        setCategories(prev => [...prev, newCategory]);
        setFormData(prev => ({ ...prev, category: newCategory }));
        setNewCategory('');
        setShowNewCategory(false);
      }
    } catch (error) {
      console.error('Error adding new category:', error);
      setError('Failed to add new category');
    }
  };

  const handleAddNewSubCategory = async () => {
    if (!newSubCategory || !formData.category) return;
    
    try {
      const response = await fetch('/products/categories/sub/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          category: formData.category,
          subCategory: newSubCategory 
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSubCategories(prev => [...prev, newSubCategory]);
        setFormData(prev => ({ ...prev, subCategory: newSubCategory }));
        setNewSubCategory('');
        setShowNewSubCategory(false);
      }
    } catch (error) {
      console.error('Error adding new sub-category:', error);
      setError('Failed to add new sub-category');
    }
  };

  const handleAddNewSubSubCategory = async () => {
    if (!newSubSubCategory || !formData.category || !formData.subCategory) return;
    
    try {
      const response = await fetch('/products/categories/subsub/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          category: formData.category,
          subCategory: formData.subCategory,
          subSubCategory: newSubSubCategory 
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSubSubCategories(prev => [...prev, newSubSubCategory]);
        setFormData(prev => ({ ...prev, subSubCategory: newSubSubCategory }));
        setNewSubSubCategory('');
        setShowNewSubSubCategory(false);
      }
    } catch (error) {
      console.error('Error adding new sub-sub-category:', error);
      setError('Failed to add new sub-sub-category');
    }
  };
  
  // If loading, show loading indicator
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If error occurred, show error message
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <Link 
          to="/admin-haha" 
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          Back to Admin Dashboard
        </Link>
      </div>
    );
  }
  
  // If not logged in or not an admin, don't render anything
  if (!user || (!isAdmin && !isSuperAdmin)) {
    return null;
  }
  
  // If product not found, don't render anything
  if (!product) {
    return null;
  }
  
  return (
    <div className="font-['helvetica_now_display'] bg-gray-50">
      <a href="/user/logout">
        <div className="fixed top-1 right-4 bg-red-100 border border-red-400 text-red-700 p-2 rounded-lg shadow-lg z-50">
          Logout
        </div>
      </a>

      <nav className="w-full bg-white shadow-sm px-4 py-3">
        <h3 className="text-xl font-bold text-gray-800">Update Product - Atheera</h3>
      </nav>

      <div className="container mx-auto px-4 py-6">
        <div className="w-full bg-white rounded-xl shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Title</label>
                <input 
                  name="title" 
                  type="text" 
                  required 
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  name="description" 
                  rows="3" 
                  required
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand (Optional)</label>
                  <input 
                    name="brand" 
                    type="text" 
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (Optional)</label>
                  <input 
                    name="weight" 
                    type="text" 
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  {showNewCategory ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Enter new category"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewCategory}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select 
                      name="category" 
                      required
                      value={formData.category}
                      onChange={(e) => {
                        if (e.target.value === 'other') {
                          setShowNewCategory(true);
                        } else {
                          handleInputChange(e);
                        }
                      }}
                      className="w-full text-sm px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="other">+ Add New Category</option>
                    </select>
                  )}
                </div>

                {/* Sub Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
                  {showNewSubCategory ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSubCategory}
                        onChange={(e) => setNewSubCategory(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Enter new sub-category"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewSubCategory}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select 
                      name="subCategory" 
                      required
                      value={formData.subCategory}
                      onChange={(e) => {
                        if (e.target.value === 'other') {
                          setShowNewSubCategory(true);
                        } else {
                          handleInputChange(e);
                        }
                      }}
                      className="w-full text-sm px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select Sub Category</option>
                      {subCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="other">+ Add New Sub Category</option>
                    </select>
                  )}
                </div>

                {/* Sub Sub Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sub Sub Category</label>
                  {showNewSubSubCategory ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSubSubCategory}
                        onChange={(e) => setNewSubSubCategory(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Enter new sub-sub-category"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewSubSubCategory}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select 
                      name="subSubCategory" 
                      required
                      value={formData.subSubCategory}
                      onChange={(e) => {
                        if (e.target.value === 'other') {
                          setShowNewSubSubCategory(true);
                        } else {
                          handleInputChange(e);
                        }
                      }}
                      className="w-full text-sm px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select Sub Sub Category</option>
                      {subSubCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="other">+ Add New Sub Sub Category</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Variants Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Variants</h3>
                <button 
                  type="button" 
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  onClick={addVariant}
                >
                  <i className="ri-add-circle-line"></i>
                  Add Variant
                </button>
              </div>

              <div id="variants-updated-container" ref={variantsContainerRef} className="space-y-4">
                {formData.variants.map((variant, index) => (
                  <div key={index} className="variant-updated-entry bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Model No</label>
                        <input 
                          name={`variants[${index}][modelno]`} 
                          type="text" 
                          required 
                          value={variant.modelno || ''}
                          onChange={(e) => handleVariantChange(index, 'modelno', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                          <select 
                            name={`variants[${index}][size]`}
                            value={variant.size || 'None'}
                            onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="None">Select Size</option>
                            <option value="XS">XS</option>
                            <option value="S">S</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                            <option value="XXL">XXL</option>
                            <option value="XXXL">XXXL</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quality</label>
                          <input 
                            name={`variants[${index}][quality]`} 
                            type="text" 
                            required 
                            value={variant.quality || ''}
                            onChange={(e) => handleVariantChange(index, 'quality', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                          <input 
                            name={`variants[${index}][price]`} 
                            type="number" 
                            required 
                            value={variant.price || ''}
                            onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price</label>
                          <input 
                            name={`variants[${index}][discount]`} 
                            type="number" 
                            value={variant.discount || ''}
                            onChange={(e) => handleVariantChange(index, 'discount', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                          <input 
                            name={`variants[${index}][quantity]`} 
                            type="number" 
                            required 
                            value={variant.quantity || ''}
                            onChange={(e) => handleVariantChange(index, 'quantity', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="submit"
                className="flex-1 bg-primary border border-primary text-white px-8 py-3 font-medium rounded uppercase hover:bg-transparent hover:text-primary transition"
              >
                Update Product
              </button>
              <Link 
                to={isSuperAdmin ? '/super-admin?tab=products' : '/admin-haha'}
                className="flex-1 bg-gray-200 text-gray-800 px-8 py-3 font-medium rounded uppercase text-center hover:bg-gray-300 transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
      
      {/* Include required scripts */}
      <link href="https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css" rel="stylesheet" />
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
        integrity="sha512-iBBXm8fW90+nuLcSKlbmrPcLa0OT92xO1BIsZ+ywDWZCvqsWgccV3gFoRBv0z+8dLJgyAHIhR35VZc2oM/gI1w=="
        crossOrigin="anonymous" 
      />
    </div>
  );
}

export default UpdateProduct; 
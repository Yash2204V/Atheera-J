import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProductCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const [fileStatus, setFileStatus] = useState('Click to upload images');
  const [fileCount, setFileCount] = useState('');
  const [variantCount, setVariantCount] = useState(1);
  const variantsContainerRef = useRef(null);
  
  // Form states
  const [productData, setProductData] = useState({
    title: '',
    description: '',
    brand: '',
    weight: '',
    category: '',
    subCategory: '',
    subSubCategory: '',
    variants: [{
      modelno: '',
      size: 'None',
      quality: '',
      price: '',
      discount: '',
      quantity: ''
    }]
  });
  
  // Add these state variables at the top with other state declarations
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewSubCategory, setShowNewSubCategory] = useState(false);
  const [showNewSubSubCategory, setShowNewSubSubCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [newSubSubCategory, setNewSubSubCategory] = useState('');
  
  // Add this after the other state declarations
  const [selectedSizes, setSelectedSizes] = useState({
    S: { checked: false, quantity: 0 },
    M: { checked: false, quantity: 0 },
    L: { checked: false, quantity: 0 },
    XL: { checked: false, quantity: 0 },
    XXL: { checked: false, quantity: 0 },
    '3XL': { checked: false, quantity: 0 }
  });
  
  useEffect(() => {
    // Check if user is authenticated and has admin or super-admin role
    if (!user) {
      navigate('/user/login');
      return;
    }
    
    if (user.role !== 'admin' && user.role !== 'super-admin') {
      navigate('/');
      return;
    }
  }, [user, navigate]);
  
  // Add this useEffect to fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const endpoint = user.role === 'super-admin' 
          ? '/super-admin/categories' 
          : '/admin-haha/categories';
        
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (data.success) {
          setCategories(data.categories);
          setSubCategories(data.subCategories);
          setSubSubCategories(data.subSubCategories);
        }
      } catch (error) {
        setError('Failed to fetch categories');
      }
    };

    fetchCategories();
  }, [user.role]);
  
  const handleFileChange = async (e) => {
    const files = e.target.files;
    let count = files.length;
    
    if (count > 7) {
      alert('You can only upload up to 7 images.');
      count = 7;
    } else if (count < 3) {
      alert('You must upload at least 3 images.');
      count = 0;
      e.target.value = null;
    }
    
    if (count > 0) {
      setFileStatus(`Processing ${count} image(s)...`);
      
      // Create a new FormData object
      const formData = new FormData();
      
      // Process each file
      for (let i = 0; i < count; i++) {
        const file = files[i];
        
        // Create a canvas for image compression
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Load and compress image
        await new Promise((resolve) => {
          img.onload = () => {
            // Calculate new dimensions (max 800px width/height)
            let width = img.width;
            let height = img.height;
            const maxSize = 800;
            
            if (width > height && width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            } else if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
            
            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress image
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to blob with compression
            canvas.toBlob((blob) => {
              // Create a new file from the blob
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              
              // Add to FormData
              formData.append('images', compressedFile);
              resolve();
            }, 'image/jpeg', 0.7); // 70% quality
          };
          
          img.src = URL.createObjectURL(file);
        });
      }
      
      setFileStatus(`Uploaded ${count}, left ${7 - count} image(s)`);
      setFileCount(`Selected ${count} image(s)`);
      
      // Store the FormData for later use
      setProductData(prev => ({
        ...prev,
        formData: formData
      }));
    } else {
      setFileStatus('You must upload at least 3 images.');
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleVariantChange = (index, field, value) => {
    setProductData(prev => {
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
    setProductData(prev => ({
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
  
  const handleSizeChange = (size) => {
    setSelectedSizes(prev => ({
      ...prev,
      [size]: {
        ...prev[size],
        checked: !prev[size].checked
      }
    }));
  };
  
  const handleSizeQuantityChange = (size, quantity) => {
    setSelectedSizes(prev => ({
      ...prev,
      [size]: {
        ...prev[size],
        quantity: parseInt(quantity) || 0
      }
    }));
  };
  
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData(e.target);
      
      // Convert selected sizes to variants
      const variants = Object.entries(selectedSizes)
        .filter(([_, data]) => data.checked && data.quantity > 0)
        .map(([size, data]) => ({
          modelno: productData.variants[0]?.modelno || '',
          size: size,
          quality: productData.variants[0]?.quality || '',
          price: productData.variants[0]?.price || '',
          discount: productData.variants[0]?.discount || '',
          quantity: data.quantity
        }));

      // Add variants to formData
      formData.append('variants', JSON.stringify(variants));
      
      // Determine the appropriate endpoint based on user role
      const endpoint = user.role === 'super-admin' 
        ? '/super-admin/products/create' 
        : '/admin-haha/create';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong while creating the product');
      }
      
      const data = await response.json();
      
      // Reset form
      e.target.reset();
      setProductData({
        title: '',
        description: '',
        brand: '',
        weight: '',
        category: '',
        subCategory: '',
        subSubCategory: '',
        variants: [{
          modelno: '',
          size: 'None',
          quality: '',
          price: '',
          discount: '',
          quantity: ''
        }]
      });
      setSelectedSizes({
        S: { checked: false, quantity: 0 },
        M: { checked: false, quantity: 0 },
        L: { checked: false, quantity: 0 },
        XL: { checked: false, quantity: 0 },
        XXL: { checked: false, quantity: 0 },
        '3XL': { checked: false, quantity: 0 }
      });
      
      // Navigate back to the appropriate dashboard
      if (user.role === 'super-admin') {
        navigate('/super-admin?tab=products');
      } else {
        navigate('/admin-haha');
      }
      
    } catch (err) {
      setError(err.message);
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
        setProductData(prev => ({ ...prev, category: newCategory }));
        setNewCategory('');
        setShowNewCategory(false);
      } else {
        setError(data.error || 'Failed to add new category');
      }
    } catch (error) {
      console.error('Error adding new category:', error);
      setError('Failed to add new category');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Create New Product</h1>
        <button
          onClick={() => user.role === 'super-admin' ? navigate('/super-admin?tab=products') : navigate('/admin-haha')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md flex items-start">
          <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="font-semibold mb-1">Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleCreateProduct} className="space-y-6">
          {/* Product Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Product Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-gray-700 text-sm font-medium mb-1">
                  Product Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={productData.title}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="brand" className="block text-gray-700 text-sm font-medium mb-1">
                  Brand <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={productData.brand}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-gray-700 text-sm font-medium mb-1">
                Description <span className="text-red-600">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={productData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="category" className="block text-gray-700 text-sm font-medium mb-1">
                  Category <span className="text-red-600">*</span>
                </label>
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
                    <button
                      type="button"
                      onClick={() => setShowNewCategory(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <select
                    id="category"
                    name="category"
                    value={productData.category}
                    onChange={(e) => {
                      if (e.target.value === 'other') {
                        setShowNewCategory(true);
                      } else {
                        handleInputChange(e);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="other">+ Add New Category</option>
                  </select>
                )}
              </div>
              
              <div>
                <label htmlFor="subCategory" className="block text-gray-700 text-sm font-medium mb-1">
                  Sub Category <span className="text-red-600">*</span>
                </label>
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
                      onClick={() => {
                        if (newSubCategory) {
                          setSubCategories(prev => [...prev, newSubCategory]);
                          setProductData(prev => ({ ...prev, subCategory: newSubCategory }));
                          setShowNewSubCategory(false);
                        }
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <select
                    id="subCategory"
                    name="subCategory"
                    value={productData.subCategory}
                    onChange={(e) => {
                      if (e.target.value === 'other') {
                        setShowNewSubCategory(true);
                      } else {
                        handleInputChange(e);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select Sub Category</option>
                    {subCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="other">+ Add New Sub Category</option>
                  </select>
                )}
              </div>
              
              <div>
                <label htmlFor="subSubCategory" className="block text-gray-700 text-sm font-medium mb-1">
                  Sub Sub Category <span className="text-red-600">*</span>
                </label>
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
                      onClick={() => {
                        if (newSubSubCategory) {
                          setSubSubCategories(prev => [...prev, newSubSubCategory]);
                          setProductData(prev => ({ ...prev, subSubCategory: newSubSubCategory }));
                          setShowNewSubSubCategory(false);
                        }
                      }}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <select
                    id="subSubCategory"
                    name="subSubCategory"
                    value={productData.subSubCategory}
                    onChange={(e) => {
                      if (e.target.value === 'other') {
                        setShowNewSubSubCategory(true);
                      } else {
                        handleInputChange(e);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
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
            
            <div>
              <label htmlFor="weight" className="block text-gray-700 text-sm font-medium mb-1">
                Weight (in kg)
              </label>
              <input
                type="text"
                id="weight"
                name="weight"
                value={productData.weight}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          {/* Product Images */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Product Images</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="flex flex-col items-center">
                <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                <p className="text-gray-600 mb-2">{fileStatus}</p>
                <p className="text-sm text-gray-500 mb-4">Upload at least 3 images (maximum 7)</p>
                <div>
                  <input
                    type="file"
                    id="images"
                    name="images"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    accept="image/*"
                    required
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90"
                  >
                    Select Images
                  </button>
                </div>
                {fileCount && <p className="mt-2 text-sm text-gray-600">{fileCount}</p>}
              </div>
            </div>
          </div>
          
          {/* Product Variants */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Product Variants</h2>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="modelno" className="block text-gray-700 text-sm font-medium mb-1">
                    Model Number
                  </label>
                  <input
                    type="text"
                    id="modelno"
                    name="modelno"
                    value={productData.variants[0]?.modelno || ''}
                    onChange={(e) => handleVariantChange(0, 'modelno', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                <div>
                  <label htmlFor="quality" className="block text-gray-700 text-sm font-medium mb-1">
                    Quality Rating (1-5)
                  </label>
                  <input
                    type="number"
                    id="quality"
                    name="quality"
                    value={productData.variants[0]?.quality || ''}
                    onChange={(e) => handleVariantChange(0, 'quality', e.target.value)}
                    min="1"
                    max="5"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label htmlFor="price" className="block text-gray-700 text-sm font-medium mb-1">
                    Price <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={productData.variants[0]?.price || ''}
                    onChange={(e) => handleVariantChange(0, 'price', e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="discount" className="block text-gray-700 text-sm font-medium mb-1">
                    Discount price
                  </label>
                  <input
                    type="number"
                    id="discount"
                    name="discount"
                    value={productData.variants[0]?.discount || ''}
                    onChange={(e) => handleVariantChange(0, 'discount', e.target.value)}
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Size and Quantity Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-700">Size and Quantity</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(selectedSizes).map(([size, data]) => (
                    <div key={size} className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={data.checked}
                          onChange={() => handleSizeChange(size)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="text-gray-700 font-medium">{size}</span>
                      </label>
                      {data.checked && (
                        <input
                          type="number"
                          value={data.quantity}
                          onChange={(e) => handleSizeQuantityChange(size, e.target.value)}
                          min="0"
                          placeholder="Quantity"
                          className="w-full border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => user.role === 'super-admin' ? navigate('/super-admin?tab=products') : navigate('/admin-haha')}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductCreate; 
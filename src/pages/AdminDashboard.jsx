import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmationDialog from '../components/ConfirmationDialog';

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Dashboard data states
  const [products, setProducts] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination states
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalEnquiries, setTotalEnquiries] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  
  // Delete states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [enquiryToDelete, setEnquiryToDelete] = useState(null);
  
  // Format functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };
  
  const handleUpdateEnquiryStatus = async (enquiryId, newStatus) => {
    try {
      const response = await fetch(`/admin-haha/enquiries/${enquiryId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the enquiry in the local state
        setEnquiries(enquiries.map(enq => 
          enq._id === enquiryId ? { ...enq, status: newStatus } : enq
        ));
        
        // If the modal is open and this is the selected enquiry, update it too
        if (selectedEnquiry && selectedEnquiry._id === enquiryId) {
          setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
        }
      } else {
        setError(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Please try again.');
    }
  };
  
  useEffect(() => {
    // Check if user is authenticated and has admin role
    if (!user) {
      navigate('/user/login');
      return;
    }
    
    if (user.role !== 'admin' && user.role !== 'super-admin') {
      navigate('/');
      return;
    }
    
    // Get query parameters
    const query = searchParams.get('query') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const tab = searchParams.get('tab') || 'products';
    
    setSearchQuery(query);
    setCurrentPage(page);
    setActiveTab(tab);
    
    // Fetch data based on active tab
    if (tab === 'products') {
      fetchProducts(query, page);
    } else if (tab === 'enquiries') {
      fetchEnquiries(query, page);
    }
    
  }, [user, navigate, searchParams]);
  
  const fetchProducts = async (query, page) => {
    try {
      setLoading(true);
      
      // Call the API endpoint to fetch products
      const response = await fetch(`/admin-haha/api?query=${query}&page=${page}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      
      setProducts(data.products || []);
      setTotalProducts(data.totalProducts || 0);
      setTotalEnquiries(data.totalEnquiries || 0);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  const fetchEnquiries = async (query, page) => {
    try {
      setLoading(true);
      const response = await fetch(`/admin-haha/enquiries?query=${query}&page=${page}`);
      if (!response.ok) {
        throw new Error('Failed to fetch enquiries');
      }
      const data = await response.json();
      setEnquiries(data.enquiries || []);
      setTotalEnquiries(data.pagination?.totalEnquiries || 0);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    const params = { 
      query: searchQuery,
      tab: activeTab,
      page: 1
    };
    
    setSearchParams(params);
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page when changing tabs
    
    const params = { 
      query: searchQuery,
      tab: tab,
      page: 1
    };
    
    setSearchParams(params);
    
    // Fetch data based on selected tab
    if (tab === 'products') {
      fetchProducts(searchQuery, 1);
    } else if (tab === 'enquiries') {
      fetchEnquiries(searchQuery, 1);
    }
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    
    setSearchParams({ 
      query: searchQuery, 
      page: page,
      tab: activeTab
    });
  };
  
  const handleDeleteClick = (enquiryId) => {
    if (!enquiryId) {
      setError('Invalid enquiry ID');
      return;
    }
    setEnquiryToDelete(enquiryId);
    setShowDeleteDialog(true);
  };
  
  const handleDeleteProductClick = (productId) => {
    if (!productId) {
      setError('Invalid product ID');
      return;
    }
    setProductToDelete(productId);
    setShowDeleteDialog(true);
  };
  
  const handleDeleteProduct = async () => {
    if (!productToDelete) {
      setError('No product selected for deletion');
      setShowDeleteDialog(false);
      return;
    }

    try {
      setIsDeleting(true);
      
      // Optimistically update UI
      setProducts(products.filter(product => product._id !== productToDelete));
      setShowDeleteDialog(false);
      setProductToDelete(null);

      const response = await fetch(`/admin-haha/products/${productToDelete}/delete`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }

      setSuccess('Product deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err.message || 'Failed to delete product. Please try again.');
      setTimeout(() => setError(''), 3000);
      
      // Revert optimistic update on error
      try {
        const response = await fetch(`/admin-haha/api?query=${searchQuery}&page=${currentPage}`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (fetchError) {
        console.error('Error fetching products after deletion failure:', fetchError);
      }
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleDeleteEnquiry = async () => {
    if (!enquiryToDelete) {
      setError('No enquiry selected for deletion');
      setShowDeleteDialog(false);
      return;
    }

    try {
      const response = await fetch(`/admin/enquiries/${enquiryToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      const data = await response.json();

      if (data.success) {
        setEnquiries(enquiries.filter(enq => enq._id !== enquiryToDelete));
        setShowDeleteDialog(false);
        setEnquiryToDelete(null);
        setSuccess('Enquiry deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to delete enquiry');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Error deleting enquiry:', err);
      setError('Failed to delete enquiry. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };
  
  // Generate pagination buttons
  const renderPagination = (currentPage, totalItems) => {
    const pageSize = 25; // Default limit in API
    const totalPages = Math.ceil(totalItems / pageSize);
    
    if (totalPages <= 1) {
      return null;
    }
    
    return (
      <div className="flex justify-center mt-6 space-x-2">
        {currentPage > 1 && (
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Previous
          </button>
        )}
        
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          // Logic to show pages around current page
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          
          return (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`px-3 py-1 rounded-md ${
                currentPage === pageNum
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        
        {currentPage < totalPages && (
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Next
          </button>
        )}
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Admin Dashboard</h1>
        
        <form onSubmit={handleSearchSubmit} className="w-full md:w-auto">
          <div className="flex">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="border border-gray-300 rounded-l-lg px-4 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="bg-primary text-white px-4 py-2 rounded-r-lg hover:bg-opacity-90"
            >
              Search
            </button>
          </div>
        </form>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
          <p>{success}</p>
        </div>
      )}
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => handleTabChange('products')}
          className={`px-4 py-2 border-b-2 font-medium text-sm ${
            activeTab === 'products'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Products ({totalProducts})
        </button>
        <button
          onClick={() => handleTabChange('enquiries')}
          className={`px-4 py-2 border-b-2 font-medium text-sm ${
            activeTab === 'enquiries'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Enquiries ({totalEnquiries})
        </button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'products' ? (
        <div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Sub-Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    products.map(product => (
                      <tr key={product._id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 truncate max-w-md" title={product.title}>
                            {product.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 truncate max-w-[150px]" title={product.category}>
                          {product.category}
                        </td>
                        <td className="px-6 py-4 text-gray-500 truncate max-w-[150px]" title={product.subCategory}>
                          {product.subCategory}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          <div className="truncate max-w-[200px]" title={product.description || 'No description'}>
                            {product.description ? 
                              (product.description.length > 60 ? 
                                `${product.description.substring(0, 60)}...` : 
                                product.description
                              ) : 
                              'No description'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Link
                              to={`/admin-haha/edit/${product._id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteProductClick(product._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {renderPagination(currentPage, totalProducts)}
        </div>
      ) : (
        <div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products Summary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {enquiries.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No enquiries found
                      </td>
                    </tr>
                  ) : (
                    enquiries.map(enquiry => (
                      <tr key={enquiry._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(enquiry.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{enquiry.email}</div>
                          <div className="text-sm text-gray-500">{enquiry.phoneNumber}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex flex-col gap-2">
                            <div className="font-medium">{enquiry.products.length} items</div>
                            <div className="text-xs text-gray-500">
                              {enquiry.products.slice(0, 2).map((item, index) => (
                                <div key={index} className="flex items-center gap-2 mb-1">
                                  {item.product.images && item.product.images[0] && (
                                    <img 
                                      src={item.product.images[0].url} 
                                      alt={item.product.title}
                                      className="w-8 h-8 object-cover rounded"
                                    />
                                  )}
                                  <span className="truncate max-w-xs">{item.product.title} (x{item.quantity})</span>
                                </div>
                              ))}
                              {enquiry.products.length > 2 && (
                                <div className="text-indigo-600">
                                  +{enquiry.products.length - 2} more items
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={enquiry.status}
                            onChange={(e) => handleUpdateEnquiryStatus(enquiry._id, e.target.value)}
                            className={`px-2 py-1 text-xs font-semibold rounded-full border focus:outline-none focus:ring-2 focus:ring-primary
                              ${enquiry.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
                              ${enquiry.status === 'contacted' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
                              ${enquiry.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                              ${enquiry.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200' : ''}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="contacted">Contacted</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedEnquiry(enquiry);
                                setShowModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleDeleteClick(enquiry._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {renderPagination(currentPage, totalEnquiries)}
        </div>
      )}
      
      {/* Only show Add New Product button when on products tab */}
      {activeTab === 'products' && (
        <div className="mt-8 flex justify-end">
          <Link
            to="/admin-haha/create"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90"
          >
            Add New Product
          </Link>
        </div>
      )}

      {/* Enquiry Details Modal */}
      {showModal && selectedEnquiry && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Enquiry Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <p><span className="font-medium">Email:</span> {selectedEnquiry.email}</p>
                <p><span className="font-medium">Phone:</span> {selectedEnquiry.phoneNumber}</p>
                <p><span className="font-medium">Date:</span> {formatDate(selectedEnquiry.createdAt)}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Status</h3>
                <select
                  value={selectedEnquiry.status}
                  onChange={(e) => handleUpdateEnquiryStatus(selectedEnquiry._id, e.target.value)}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-semibold mb-2">Products</h3>
              <div className="space-y-4">
                {selectedEnquiry.products.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    {item.product.images && item.product.images[0] && (
                      <img 
                        src={item.product.images[0].url} 
                        alt={item.product.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product.title}</h4>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-sm text-gray-600">Price: {formatPrice(item.product.variants[0].price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setProductToDelete(null);
          setEnquiryToDelete(null);
        }}
        onConfirm={activeTab === 'products' ? handleDeleteProduct : handleDeleteEnquiry}
        title={activeTab === 'products' ? 'Delete Product' : 'Delete Enquiry'}
        message={`Are you sure you want to delete this ${activeTab === 'products' ? 'product' : 'enquiry'}? This action cannot be undone.`}
        isLoading={activeTab === 'products' ? isDeleting : false}
      />
    </div>
  );
}

export default AdminDashboard; 
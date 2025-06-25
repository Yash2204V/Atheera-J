import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ConfirmationDialog from '../../components/ConfirmationDialog';

function Enquiries() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [enquiryToDelete, setEnquiryToDelete] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEnquiries: 0
  });

  useEffect(() => {
    fetchEnquiries(pagination.currentPage);
  }, [pagination.currentPage]);

  const fetchEnquiries = async (page) => {
    try {
      const endpoint = user.role === 'super-admin' ? '/super-admin/enquiries' : '/admin/enquiries';
      console.log('Fetching from endpoint:', endpoint);
      
      const response = await fetch(`${endpoint}?page=${page}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw API response:', data);

      if (data.success) {
        // Ensure we have valid data structure with proper null checks
        const safeEnquiries = (data.enquiries || []).map(enquiry => {
          console.log('Processing enquiry:', enquiry);
          return {
            ...enquiry,
            products: (enquiry.products || []).map(item => {
              console.log('Processing product item:', item);
              
              // Ensure product data exists and has required fields
              const product = item.product || {};
              return {
                ...item,
                product: {
                  title: product.title || 'Product not found',
                  images: product.images || [],
                  description: product.description || 'No description available',
                  category: product.category || 'N/A',
                  variants: product.variants || []
                }
              };
            })
          };
        });

        console.log('Processed enquiries:', safeEnquiries);
        setEnquiries(safeEnquiries);
        setPagination(data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalEnquiries: 0
        });
      } else {
        setError(data.message || 'Failed to fetch enquiries');
      }
    } catch (err) {
      console.error('Error fetching enquiries:', err);
      setError('Unable to connect to the server. Please make sure the backend server is running.');
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  };

  // Add a debug effect to log state changes
  useEffect(() => {
    console.log('Current enquiries state:', enquiries);
  }, [enquiries]);

  const handleStatusUpdate = async (enquiryId, newStatus) => {
    try {
      const endpoint = user.role === 'super-admin' ? '/super-admin/enquiries' : '/admin/enquiries';
      const response = await fetch(`${endpoint}/${enquiryId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        setEnquiries(enquiries.map(enq => 
          enq._id === enquiryId ? { ...enq, status: newStatus } : enq
        ));
        setShowModal(false);
      } else {
        setError(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Please try again.');
    }
  };

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

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= pagination.totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setPagination(prev => ({ ...prev, currentPage: i }))}
          className={`px-3 py-1 mx-1 rounded ${
            pagination.currentPage === i
              ? 'bg-primary text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }
    return (
      <div className="flex justify-center items-center mt-6">
        <button
          onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
          disabled={pagination.currentPage === 1}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed mr-2"
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
          disabled={pagination.currentPage === pagination.totalPages}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed ml-2"
        >
          Next
        </button>
      </div>
    );
  };

  const handleDeleteClick = (enquiryId) => {
    setEnquiryToDelete(enquiryId);
    setShowDeleteDialog(true);
  };

  const handleDeleteEnquiry = async () => {
    try {
      const endpoint = user.role === 'super-admin' ? '/super-admin/enquiries' : '/admin/enquiries';
      const response = await fetch(`${endpoint}/${enquiryToDelete}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setEnquiries(enquiries.filter(enq => enq._id !== enquiryToDelete));
        setShowDeleteDialog(false);
        setEnquiryToDelete(null);
      } else {
        setError(data.message || 'Failed to delete enquiry');
      }
    } catch (err) {
      console.error('Error deleting enquiry:', err);
      setError('Failed to delete enquiry. Please try again.');
    }
  };

  // Add error boundary
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user || !['admin', 'superadmin'].includes(user.role)) {
    return (
      <div className="container py-8">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  // Add a check for empty enquiries
  if (!enquiries || enquiries.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Enquiries</h1>
          <button
            onClick={() => navigate('/admin-haha')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Products
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">No enquiries found.</p>
        </div>
      </div>
    );
  }

  const renderProductImage = (product) => {
    console.log('Rendering product image for:', product);
    console.log('Product images:', product?.images);
    
    if (!product || !product.images || !product.images[0]) {
      console.log('No images found for product');
      return null;
    }

    // Log the first image object
    console.log('First image object:', product.images[0]);
    
    // Try different possible image URL formats
    const imageUrl = product.images[0].url || 
      (product.images[0].filename ? `/uploads/${product.images[0].filename}` : null) ||
      (typeof product.images[0] === 'string' ? product.images[0] : null);
    
    console.log('Final image URL:', imageUrl);
    
    if (!imageUrl) {
      console.log('No valid image URL found');
      return null;
    }

    return (
      <img 
        src={imageUrl}
        alt={product.title || 'Product image'}
        className="w-8 h-8 object-cover rounded"
        onError={(e) => {
          console.log('Image failed to load:', imageUrl);
          e.target.onerror = null;
          e.target.src = '/placeholder-image.png';
        }}
      />
    );
  };

  const renderProductDetails = (product) => {
    console.log('Rendering product details for:', product);
    if (!product) {
      console.log('No product data available');
      return null;
    }
    return (
      <div className="flex items-center space-x-3">
        {renderProductImage(product)}
        <span className="text-sm font-medium text-gray-900">
          {product.title || 'Product not found'}
        </span>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Enquiries</h1>
        <button
          onClick={() => navigate('/admin-haha')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Products
        </button>
      </div>

      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    User Info
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Enquiry ({pagination.totalEnquiries})
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enquiries.map((enquiry) => (
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
                        <div className="font-medium">{enquiry.products?.length || 0} items</div>
                        <div className="text-xs text-gray-500">
                          {(enquiry.products || []).slice(0, 2).map((item, index) => (
                            <div key={index} className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {item.product?.title || 'Product not found'}
                              </span>
                              <span className="text-gray-400">× {item.quantity}</span>
                            </div>
                          ))}
                          {enquiry.products?.length > 2 && (
                            <div className="text-gray-400">
                              +{enquiry.products.length - 2} more items
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${enquiry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${enquiry.status === 'contacted' ? 'bg-blue-100 text-blue-800' : ''}
                        ${enquiry.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                        ${enquiry.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}`}>
                        {enquiry.status?.charAt(0).toUpperCase() + enquiry.status?.slice(1) || 'Pending'}
                      </span>
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
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {renderPagination()}

      {/* Detailed View Modal */}
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
                  value={selectedEnquiry.status || 'pending'}
                  onChange={(e) => handleStatusUpdate(selectedEnquiry._id, e.target.value)}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Products</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(selectedEnquiry.products || []).map((item, index) => {
                      const product = item.product || {};
                      const variant = product.variants?.[0];
                      const price = variant ? (variant.discount > 0 ? variant.discount : variant.price) : 0;
                      
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4">
                            {renderProductDetails(product)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              <p className="font-medium">Category: {product.category || 'N/A'}</p>
                              <p className="text-gray-500 mt-1">{product.description || 'No description available'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatPrice(price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.quantity || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatPrice(price * (item.quantity || 0))}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-50">
                      <td colSpan="4" className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                        Total Amount:
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(
                          (selectedEnquiry.products || []).reduce((total, item) => {
                            const product = item.product || {};
                            const variant = product.variants?.[0];
                            const price = variant ? (variant.discount > 0 ? variant.discount : variant.price) : 0;
                            return total + (price * (item.quantity || 0));
                          }, 0)
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {selectedEnquiry.notes && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-gray-700">{selectedEnquiry.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setEnquiryToDelete(null);
        }}
        onConfirm={handleDeleteEnquiry}
        title="Delete Enquiry"
        message="Are you sure you want to delete this enquiry? This action cannot be undone."
      />
    </div>
  );
}

export default Enquiries; 
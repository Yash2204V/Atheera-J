import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmationDialog from '../components/ConfirmationDialog';

function SuperAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Dashboard data states
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [products, setProducts] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination states
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalEnquiries, setTotalEnquiries] = useState(0);
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [currentAdminPage, setCurrentAdminPage] = useState(1);
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [currentEnquiryPage, setCurrentEnquiryPage] = useState(1);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  
  // Delete states
  const [isDeleting, setIsDeleting] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
  
  useEffect(() => {
    // Check if user is authenticated and has super-admin role
    if (!user) {
      navigate('/user/login');
      return;
    }
    
    if (user.role !== 'super-admin') {
      navigate('/super-admin-auth');
      return;
    }
    
    // Get query parameters
    const query = searchParams.get('query') || '';
    const userPage = parseInt(searchParams.get('userPage')) || 1;
    const adminPage = parseInt(searchParams.get('adminPage')) || 1;
    const productPage = parseInt(searchParams.get('productPage')) || 1;
    const enquiryPage = parseInt(searchParams.get('enquiryPage')) || 1;
    const tab = searchParams.get('tab') || 'users';
    
    setSearchQuery(query);
    setCurrentUserPage(userPage);
    setCurrentAdminPage(adminPage);
    setCurrentProductPage(productPage);
    setCurrentEnquiryPage(enquiryPage);
    setActiveTab(tab);
    
    // Fetch dashboard data
    fetchDashboardData(query, userPage, adminPage, productPage, enquiryPage);
    
  }, [user, navigate, searchParams]);
  
  const fetchDashboardData = async (query, userPage, adminPage, productPage, enquiryPage) => {
    try {
      setLoading(true);
      
      // Call the API endpoint to fetch dashboard data
      const response = await fetch(`/super-admin/api?query=${query}&userPage=${userPage}&adminPage=${adminPage}&productPage=${productPage}&enquiryPage=${enquiryPage}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      
      setUsers(data.users || []);
      setAdmins(data.admins || []);
      setProducts(data.products || []);
      setEnquiries(data.enquiries || []);
      setTotalUsers(data.totalUsers || 0);
      setTotalAdmins(data.totalAdmins || 0);
      setTotalProducts(data.totalProducts || 0);
      setTotalEnquiries(data.totalEnquiries || 0);
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
      tab: activeTab
    };
    
    // Add pagination parameters
    if (activeTab === 'users') params.userPage = 1;
    if (activeTab === 'admins') params.adminPage = 1;
    if (activeTab === 'products') params.productPage = 1;
    if (activeTab === 'enquiries') params.enquiryPage = 1;
    
    setSearchParams(params);
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    const params = { 
      query: searchQuery,
      tab: tab
    };
    
    // Add pagination parameters
    if (tab === 'users') params.userPage = currentUserPage;
    if (tab === 'admins') params.adminPage = currentAdminPage;
    if (tab === 'products') params.productPage = currentProductPage;
    if (tab === 'enquiries') params.enquiryPage = currentEnquiryPage;
    
    setSearchParams(params);
  };
  
  const handlePageChange = (tab, page) => {
    if (tab === 'users') {
      setCurrentUserPage(page);
      setSearchParams({ 
        query: searchQuery, 
        userPage: page,
        adminPage: currentAdminPage,
        productPage: currentProductPage,
        enquiryPage: currentEnquiryPage,
        tab: activeTab
      });
    } else if (tab === 'admins') {
      setCurrentAdminPage(page);
      setSearchParams({ 
        query: searchQuery, 
        userPage: currentUserPage,
        adminPage: page,
        productPage: currentProductPage,
        enquiryPage: currentEnquiryPage,
        tab: activeTab
      });
    } else if (tab === 'products') {
      setCurrentProductPage(page);
      setSearchParams({ 
        query: searchQuery, 
        userPage: currentUserPage,
        adminPage: currentAdminPage,
        productPage: page,
        enquiryPage: currentEnquiryPage,
        tab: activeTab
      });
    } else if (tab === 'enquiries') {
      setCurrentEnquiryPage(page);
      setSearchParams({ 
        query: searchQuery, 
        userPage: currentUserPage,
        adminPage: currentAdminPage,
        productPage: currentProductPage,
        enquiryPage: page,
        tab: activeTab
      });
    }
  };
  
  const handleMakeAdmin = async (userId) => {
    try {
      const response = await fetch(`/super-admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'admin' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user role');
      }
      
      // Refetch dashboard data
      fetchDashboardData(searchQuery, currentUserPage, currentAdminPage, currentProductPage, currentEnquiryPage);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleMakeUser = async (userId) => {
    try {
      const response = await fetch(`/super-admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'user' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user role');
      }
      
      // Refetch dashboard data
      fetchDashboardData(searchQuery, currentUserPage, currentAdminPage, currentProductPage, currentEnquiryPage);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/super-admin/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      // Refetch dashboard data
      fetchDashboardData(searchQuery, currentUserPage, currentAdminPage, currentProductPage, currentEnquiryPage);
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleDeleteClick = (enquiryId) => {
    setEnquiryToDelete(enquiryId);
    setShowDeleteDialog(true);
  };
  
  const handleDeleteProduct = async () => {
    try {
      setIsDeleting(true);
      
      // Optimistically update UI
      setProducts(products.filter(product => product._id !== productToDelete));
      setShowDeleteDialog(false);
      setProductToDelete(null);

      const response = await fetch(`/super-admin/products/${productToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // If deletion failed, revert the optimistic update
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }

      setError('');
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err.message || 'Failed to delete product. Please try again.');
      
      // Revert optimistic update on error
      const response = await fetch(`/super-admin/api?query=${searchQuery}&page=${currentProductPage}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateEnquiryStatus = async (enquiryId, newStatus) => {
    try {
      const response = await fetch(`/super-admin/enquiries/${enquiryId}/status`, {
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

  const handleDeleteEnquiry = async () => {
    if (!enquiryToDelete) {
      setError('No enquiry selected for deletion');
      return;
    }

    try {
      const response = await fetch(`/super-admin/enquiries/${enquiryToDelete}`, {
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

  const handleDeleteProductClick = (productId) => {
    setProductToDelete(productId);
    setShowDeleteDialog(true);
  };

  // Generate pagination buttons
  const renderPagination = (tab, currentPage, totalItems) => {
    const totalPages = Math.ceil(totalItems / 10);
    
    if (totalPages <= 1) {
      return null;
    }
    
    return (
      <div className="flex justify-center mt-6 space-x-2">
        {currentPage > 1 && (
          <button
            onClick={() => handlePageChange(tab, currentPage - 1)}
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
              onClick={() => handlePageChange(tab, pageNum)}
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
            onClick={() => handlePageChange(tab, currentPage + 1)}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Next
          </button>
        )}
      </div>
    );
  };
  
  const renderUsersTable = () => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {user.phoneNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleMakeAdmin(user._id)}
                        className="text-primary hover:text-primary-dark"
                      >
                        Make Admin
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const renderAdminsTable = () => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No admins found
                  </td>
                </tr>
              ) : (
                admins.map(admin => (
                  <tr key={admin._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{admin.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {admin.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {admin.phoneNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleMakeUser(admin._id)}
                        className="text-primary hover:text-primary-dark"
                      >
                        Revoke Admin
                      </button>
                      <button
                        onClick={() => handleDeleteUser(admin._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const renderProductsTable = () => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub-Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!products || products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 truncate max-w-xs" title={product?.title || 'N/A'}>
                        {product?.title || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 truncate max-w-xs" title={product?.category || 'N/A'}>
                      {product?.category || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 truncate max-w-xs" title={product?.subCategory || 'N/A'}>
                      {product?.subCategory || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <div className="truncate max-w-xs" title={product?.description || 'No description'}>
                        {product?.description ? 
                          (product.description.length > 50 ? 
                            `${product.description.substring(0, 50)}...` : 
                            product.description
                          ) : 
                          'No description'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {product?.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link
                        to={`/super-admin/products/${product._id}/edit`}
                        className="text-primary hover:text-primary-dark inline-block mr-2"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteProductClick(product._id)}
                        className="text-red-600 hover:text-red-900 inline-block"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const renderEnquiriesTable = () => {
    return (
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
                          <i className="fas fa-trash-alt"></i>
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
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Super Admin Dashboard</h1>
        
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
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => handleTabChange('users')}
          className={`px-4 py-2 border-b-2 font-medium text-sm ${
            activeTab === 'users'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Users ({totalUsers})
        </button>
        <button
          onClick={() => handleTabChange('admins')}
          className={`px-4 py-2 border-b-2 font-medium text-sm ${
            activeTab === 'admins'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Admins ({totalAdmins})
        </button>
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
      
      {/* Content based on active tab */}
      {activeTab === 'users' && renderUsersTable()}
      {activeTab === 'admins' && renderAdminsTable()}
      {activeTab === 'products' && renderProductsTable()}
      {activeTab === 'enquiries' && renderEnquiriesTable()}

      {/* Pagination */}
      {activeTab === 'users' && renderPagination('users', currentUserPage, totalUsers)}
      {activeTab === 'admins' && renderPagination('admins', currentAdminPage, totalAdmins)}
      {activeTab === 'products' && renderPagination('products', currentProductPage, totalProducts)}
      {activeTab === 'enquiries' && renderPagination('enquiries', currentEnquiryPage, totalEnquiries)}
      
      <div className="mt-8 flex justify-end">
        <Link
          to={activeTab === 'products' ? '/super-admin/products/create' : '/super-admin'}
          className={`px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 ${activeTab !== 'products' ? 'opacity-0 pointer-events-none' : ''}`}
        >
          Add New Product
        </Link>
      </div>

      {/* Enquiry Details Modal */}
      {showModal && selectedEnquiry && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
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
                    {selectedEnquiry.products.map((item, index) => {
                      const variant = item.product.variants && item.product.variants[0];
                      const price = variant ? (variant.discount > 0 ? variant.discount : variant.price) : 0;
                      const imageUrl = item.product.images && item.product.images[0] && 
                        (item.product.images[0].url || `/uploads/${item.product.images[0].filename}`);
                      
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              {imageUrl && (
                                <img 
                                  src={imageUrl}
                                  alt={item.product.title}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <span className="text-sm font-medium text-gray-900">
                                {item.product.title}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              <p className="font-medium">Category: {item.product.category}</p>
                              <p className="text-gray-500 mt-1">{item.product.description}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatPrice(price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatPrice(price * item.quantity)}
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
                          selectedEnquiry.products.reduce((total, item) => {
                            const variant = item.product.variants && item.product.variants[0];
                            const price = variant ? (variant.discount > 0 ? variant.discount : variant.price) : 0;
                            return total + (price * item.quantity);
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
          setProductToDelete(null);
          setEnquiryToDelete(null);
        }}
        onConfirm={productToDelete ? handleDeleteProduct : handleDeleteEnquiry}
        title={productToDelete ? "Delete Product" : "Delete Enquiry"}
        message={`Are you sure you want to delete this ${productToDelete ? "product" : "enquiry"}? This action cannot be undone.`}
        isLoading={productToDelete ? isDeleting : false}
      />
    </div>
  );
}

export default SuperAdminDashboard; 
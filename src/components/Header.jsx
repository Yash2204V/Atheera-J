import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { user, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedSubCategory, setExpandedSubCategory] = useState(null);
  // Store category relationships
  const [categoryMap, setCategoryMap] = useState({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        console.log('Fetching categories...'); // Debug log
        
        // Fetch categories from the database
        const response = await fetch('/products/categories');
        const data = await response.json();
        console.log('Raw Categories API Response:', data); // Debug log
        
        if (data.success) {
          // Filter out empty or default categories
          const validCategories = (data.categories || []).filter(cat => cat && cat !== 'default');
          const validSubCategories = (data.subCategories || []).filter(subCat => subCat && subCat !== 'default');
          const validSubSubCategories = (data.subSubCategories || []).filter(subSubCat => subSubCat && subSubCat !== 'default');
          
          console.log('Valid Categories:', validCategories); // Debug log
          console.log('Valid SubCategories:', validSubCategories); // Debug log
          console.log('Valid SubSubCategories:', validSubSubCategories); // Debug log
          
          setCategories(validCategories);
          setSubCategories(validSubCategories);
          setSubSubCategories(validSubSubCategories);
          
          // Fetch category relationships
          console.log('Fetching category relationships...'); // Debug log
          const relationshipsResponse = await fetch('/products/category-relationships');
          const relationshipsData = await relationshipsResponse.json();
          console.log('Raw Category Relationships API Response:', relationshipsData); // Debug log
          
          if (relationshipsData.success) {
            // Filter out default categories from relationships
            const filteredRelationships = {};
            Object.entries(relationshipsData.relationships || {}).forEach(([category, data]) => {
              if (category && category !== 'default') {
                filteredRelationships[category] = {
                  subCategories: (data.subCategories || []).filter(subCat => subCat && subCat !== 'default'),
                  subSubCategories: Object.fromEntries(
                    Object.entries(data.subSubCategories || {}).filter(([subCat]) => subCat && subCat !== 'default')
                  )
                };
              }
            });
            console.log('Filtered Relationships:', filteredRelationships); // Debug log
            setCategoryMap(filteredRelationships);
          }
        } else {
          console.error('Failed to fetch categories:', data.error); // Debug log
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const getSubCategoriesForCategory = (category) => {
    // Return subcategories that belong to this category based on database relationships
    const subCats = categoryMap[category]?.subCategories || [];
    return subCats.filter(subCat => subCat && subCat !== 'default');
  };

  const getSubSubCategoriesForSubCategory = (category, subCategory) => {
    // Return sub-subcategories that belong to this subcategory based on database relationships
    const subSubCats = categoryMap[category]?.subSubCategories?.[subCategory] || [];
    return subSubCats.filter(subSubCat => subSubCat && subSubCat !== 'default');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
  };

  const handleCategoryClick = (category) => {
    setExpandedCategory(category);
    setExpandedSubCategory(null);
  };

  const handleSubCategoryClick = (subCategory) => {
    setExpandedSubCategory(subCategory);
  };

  // Add mouse leave handlers
  const handleCategoryMouseLeave = () => {
    setExpandedCategory(null);
    setExpandedSubCategory(null);
  };

  const handleSubCategoryMouseLeave = () => {
    setExpandedSubCategory(null);
  };

  return (
    <>
      <header className="py-4 shadow-sm bg-white sticky top-0 z-40 border-b border-gray-100">
        <div className="container flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="/images/icons/favicon.png" 
              alt="Atheera Logo"
              className="h-10 md:h-14 w-auto transition-transform group-hover:scale-105 rounded-lg"
              style={{ width: "66px" }}

            />
            {/* <span className="text-2xl font-bold text-primary font-sans tracking-wide">Atheera</span> */}
          </Link>
      
          {/* Navigation Icons */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Super Admin panel - only visible if user is logged in and is super-admin */}
            {user && user.role === 'super-admin' && (
              <>
                <Link 
                  to="/super-admin" 
                  className="relative group flex items-center text-red-600 font-medium transition-colors"
                >
                  <i className="fas fa-user-shield mr-1"></i>
                  <span className="hidden md:inline">Super Admin</span>
                </Link>
                <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>
              </>
            )}
            
            {/* Admin panel - only visible if user is logged in and is admin (but not super-admin) */}
            {user && user.role === 'admin' && (
              <>
                <Link 
                  to="/admin-haha" 
                  className="relative group flex items-center text-primary font-medium transition-colors"
                >
                  <i className="fas fa-user-shield mr-1"></i>
                  <span className="hidden md:inline">Admin Panel</span>
                </Link>
                <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>
              </>
            )}

            {/* Wishlist with animated badge */}
            <Link to="/wishlist" className="relative group flex items-center hover:text-primary transition-colors">
              <div className="py-3 rounded-full hover:bg-gray-50 transition-all duration-300">
               <i className="fas fa-heart text-gray-800"></i>
              </div>
            </Link>

            {/* Cart with animated badge */}
            <Link to="/products/cart" className="relative group flex items-center hover:text-primary transition-colors">
              <div className="py-3 rounded-full hover:bg-gray-50 transition-all duration-300">
                <i className="fas fa-shopping-bag text-xl text-gray-700"></i>
              </div>
            </Link>
      
            {/* User Auth */}
            <div className="h-8 w-px bg-gray-200 mx-2"></div>
      
            {loading ? (
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : !user ? (
              <Link 
                to="/user/login" 
                className="flex items-center gap-2 hover:text-primary transition-colors group px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                <i className="far fa-user text-xl transform group-hover:-translate-y-0.5 transition"></i>
                <span className="hidden md:inline font-medium">Sign In</span>
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link 
                  to="/account" 
                  className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors group"
                >
                  <i className="fas fa-user-circle text-xl"></i>
                  <span className="hidden md:inline font-medium">
                    {user?.name ? `Hello, ${user.name.split(' ')[0]}` : 'My Account'}
                  </span>
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors group px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  <i className="fas fa-sign-out-alt text-xl"></i>
                  <span className="hidden md:inline font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-primary">
        <div className="container">
          <div className="flex items-center justify-between">
            {/* Categories Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-8 py-4 bg-primary text-white hover:bg-opacity-90 transition-colors">
                <i className="fas fa-bars"></i>
                <span>All Categories</span>
                <i className="fas fa-chevron-down text-sm"></i>
              </button>

              <div 
                className="absolute left-0 top-full w-64 bg-white shadow-lg py-3 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-300 z-50"
                onMouseLeave={handleCategoryMouseLeave}
              >
                {loadingCategories ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : categories.length > 0 ? (
                  categories.map((category) => (
                    <div key={category} className="relative group/category">
                      <Link 
                        to={`/products/shop?category=${category}`}
                        className="flex items-center px-6 py-3 hover:bg-gray-100 transition-colors justify-between"
                        onMouseEnter={() => handleCategoryClick(category)}
                      >
                        <span className="text-gray-600 text-sm capitalize">{category}</span>
                        {getSubCategoriesForCategory(category).length > 0 && (
                          <i className="fas fa-chevron-right text-xs text-gray-400"></i>
                        )}
                      </Link>

                      {/* Subcategories dropdown */}
                      {getSubCategoriesForCategory(category).length > 0 && expandedCategory === category && (
                        <div 
                          className="absolute left-full top-0 w-64 bg-white shadow-lg py-3 ml-0.5 z-50"
                          onMouseLeave={handleSubCategoryMouseLeave}
                        >
                          {getSubCategoriesForCategory(category).map((subCategory) => (
                            <div key={subCategory} className="relative group/subcategory">
                              <Link
                                to={`/products/shop?category=${category}&subCategory=${subCategory}`}
                                className="flex items-center px-6 py-3 hover:bg-gray-100 transition-colors justify-between"
                                onMouseEnter={() => handleSubCategoryClick(subCategory)}
                              >
                                <span className="text-gray-600 text-sm capitalize">{subCategory}</span>
                                {getSubSubCategoriesForSubCategory(category, subCategory).length > 0 && (
                                  <i className="fas fa-chevron-right text-xs text-gray-400"></i>
                                )}
                              </Link>

                              {/* Sub-subcategories dropdown */}
                              {getSubSubCategoriesForSubCategory(category, subCategory).length > 0 && expandedSubCategory === subCategory && (
                                <div className="absolute left-full top-0 w-64 bg-white shadow-lg py-3 ml-0.5 z-50">
                                  {getSubSubCategoriesForSubCategory(category, subCategory).map((subSubCategory) => (
                                    <Link
                                      key={subSubCategory}
                                      to={`/products/shop?category=${category}&subCategory=${subCategory}&subSubCategory=${subSubCategory}`}
                                      className="flex items-center px-6 py-3 hover:bg-gray-100 transition-colors"
                                    >
                                      <span className="text-gray-600 text-sm capitalize">{subSubCategory}</span>
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-3 text-gray-500 text-sm">No categories found</div>
                )}
              </div>
            </div>

            {/* Main Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-white hover:text-gray-200 transition-colors py-4">Home</Link>
              <Link to="/products/shop" className="text-white hover:text-gray-200 transition-colors py-4">Shop</Link>
              <Link to="/who-we-are" className="text-white hover:text-gray-200 transition-colors py-4">About Us</Link>
              <Link to="/customer-care" className="text-white hover:text-gray-200 transition-colors py-4">Contact</Link>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-4 text-white" onClick={toggleMobileMenu}>
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-lg">
          <button onClick={toggleMobileMenu} className="absolute right-4 top-4 text-gray-500 hover:text-gray-700">
            <i className="fas fa-times text-xl"></i>
          </button>

          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <Link to="/" className="block text-gray-700 hover:text-primary transition-colors" onClick={toggleMobileMenu}>Home</Link>
              <Link to="/products/shop" className="block text-gray-700 hover:text-primary transition-colors" onClick={toggleMobileMenu}>Shop</Link>
              <Link to="/who-we-are" className="block text-gray-700 hover:text-primary transition-colors" onClick={toggleMobileMenu}>About Us</Link>
              <Link to="/customer-care" className="block text-gray-700 hover:text-primary transition-colors" onClick={toggleMobileMenu}>Contact</Link>
              
              {/* Super Admin link in mobile menu - only for super-admins */}
              {user && user.role === 'super-admin' && (
                <Link to="/super-admin" className="block text-red-600 font-medium" onClick={toggleMobileMenu}>
                  <i className="fas fa-user-shield mr-2"></i>Super Admin
                </Link>
              )}
              
              {/* Admin link in mobile menu - only for admins */}
              {user && user.role === 'admin' && (
                <Link to="/admin-haha" className="block text-primary font-medium" onClick={toggleMobileMenu}>
                  <i className="fas fa-user-shield mr-2"></i>Admin Panel
                </Link>
              )}
              
              <Link to="/products/cart" className="block text-gray-700 hover:text-primary transition-colors" onClick={toggleMobileMenu}>
                <i className="fas fa-shopping-bag mr-2"></i>Cart
              </Link>
            </div>

            <hr className="border-gray-200" />

            <div className="space-y-3">
              {loading ? (
                <div className="w-full flex justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : !user ? (
                <Link to="/user/login" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors" onClick={toggleMobileMenu}>
                  <i className="far fa-user"></i>
                  <span>Login</span>
                </Link>
              ) : (
                <>
                  <Link to="/account" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors" onClick={toggleMobileMenu}>
                    <i className="fas fa-user-circle"></i>
                    <span>{user?.name ? `Hello, ${user.name.split(' ')[0]}` : 'My Account'}</span>
                  </Link>
                  <button onClick={(e) => { toggleMobileMenu(); handleLogout(e); }} className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors">
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
            
            {/* Admin login link - visible to everyone */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <Link to="/admin/login" className="flex items-center gap-2 text-gray-500 hover:text-primary text-sm transition-colors" onClick={toggleMobileMenu}>
                <i className="fas fa-shield-alt"></i>
                <span>Admin Login</span>
              </Link>
              
              <Link to="/super-admin/login" className="flex items-center gap-2 text-gray-500 hover:text-red-600 text-sm transition-colors mt-2" onClick={toggleMobileMenu}>
                <i className="fas fa-user-lock"></i>
                <span>Super Admin Login</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Header; 
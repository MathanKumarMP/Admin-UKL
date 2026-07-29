import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // View mode: 'list' (shows table view) or 'form' (shows inline form)
  const [currentView, setCurrentView] = useState('list');
  const [editingBanner, setEditingBanner] = useState(null);
  const [viewingBanner, setViewingBanner] = useState(null);

  // Table Controls & Pagination
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Default Form State
  const defaultFormData = {
    title: '',
    pageName: 'Home Page',
    linkUrl: '',
    status: 'Active',
    description: '',
    img: '',
    fileName: 'No file chosen',
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch Banners from API with pagination & search
  const fetchBanners = async (page = currentPage, limit = entriesPerPage, search = searchTerm) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('adminToken');
      const queryParams = new URLSearchParams({
        page: page,
        limit: limit,
        search: search
      });
      const response = await fetch(`${API_BASE}/api/admin/banners?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const startNo = ((data.page || page) - 1) * limit;
        const mapped = data.banners.map((item, index) => ({
          id: item._id,
          sNo: startNo + index + 1,
          title: item.title || '',
          pageName: item.pageName || 'Home Page',
          status: item.status || 'Active',
          img: item.image ? (item.image.startsWith('http') || item.image.startsWith('data:') ? item.image : `${API_BASE}${item.image.startsWith('/') ? '' : '/'}${item.image}`) : '',
          fileName: item.image ? item.image.split('/').pop() : '',
          description: item.description || '',
          linkUrl: item.linkUrl || '',
          order: item.order || 0
        }));
        setBanners(mapped);
        setTotalEntries(data.total !== undefined ? data.total : mapped.length);
        setTotalPages(data.totalPages !== undefined ? data.totalPages : (Math.ceil((data.total || mapped.length) / limit) || 1));
      } else {
        setErrorMsg(data.message || 'Failed to load banners.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners(currentPage, entriesPerPage, searchTerm);
  }, [currentPage, entriesPerPage, searchTerm]);

  // Handle File Input Change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast(`Image file "${file.name}" exceeds 5 MB limit. Please select an image under 5 MB.`, 'error');
        setFormErrors(prev => ({ ...prev, image: 'Image size must be less than 5 MB' }));
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
      setFormData({
        ...formData,
        fileName: file.name,
        img: URL.createObjectURL(file) // local preview URL
      });
      if (formErrors.image) {
        setFormErrors(prev => ({ ...prev, image: '' }));
      }
    }
  };

  // Server-Side Pagination Calculations
  const startIndex = totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * entriesPerPage, totalEntries);
  const currentSlice = banners;

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  const [deletingBannerId, setDeletingBannerId] = useState(null);

  const handleDelete = (id) => {
    setDeletingBannerId(id);
  };

  const confirmDelete = async () => {
    if (!deletingBannerId) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/banners/${deletingBannerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setBanners(prev => prev.filter(b => b.id !== deletingBannerId));
        setDeletingBannerId(null);
        fetchBanners();
        showToast(data.message || 'Banner deleted successfully', 'success');
      } else {
        showToast(data.message || 'Failed to delete banner.', 'error');
      }
    } catch (err) {
      console.error(err);
      setDeletingBannerId(null);
      showToast('Internet Error. Please check your network connection.', 'error');
    }
  };

  const handleOpenAddForm = () => {
    setFormData(defaultFormData);
    setSelectedFile(null);
    setEditingBanner(null);
    setFormErrors({});
    setErrorMsg('');
    setCurrentView('form');
  };

  const handleEdit = (item) => {
    setEditingBanner(item);
    setSelectedFile(null);
    setFormErrors({});
    setErrorMsg('');
    setFormData({
      title: item.title,
      pageName: item.pageName,
      linkUrl: item.linkUrl || '',
      status: item.status,
      description: item.description || '',
      img: item.img,
      fileName: item.fileName || 'banner_image.png'
    });
    setCurrentView('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Custom React State Validation
    const errors = {};
    if (!formData.title || !formData.title.trim()) {
      errors.title = 'Banner title is required';
    }
    if (!selectedFile && !editingBanner && !formData.img) {
      errors.image = 'Banner image is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('adminToken');
      const bodyFormData = new FormData();
      bodyFormData.append('title', formData.title);
      bodyFormData.append('pageName', formData.pageName);
      bodyFormData.append('status', formData.status);
      bodyFormData.append('linkUrl', formData.linkUrl);
      bodyFormData.append('description', formData.description);

      if (selectedFile) {
        bodyFormData.append('image', selectedFile);
      } else if (!editingBanner) {
        setErrorMsg('Please select a banner image file.');
        setLoading(false);
        return;
      }

      let url = `${API_BASE}/api/admin/banners`;
      let method = 'POST';

      if (editingBanner) {
        url = `${API_BASE}/api/admin/banners/${editingBanner.id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: bodyFormData
      });

      const data = await response.json();

      if (data.success) {
        const successMsg = data.message || (editingBanner ? 'Banner updated successfully' : 'Banner created successfully');
        setCurrentView('list');
        setEditingBanner(null);
        setFormData(defaultFormData);
        setSelectedFile(null);
        fetchBanners();
        showToast(successMsg, 'success');
      } else {
        setErrorMsg(data.message || 'Failed to save banner');
        showToast(data.message || 'Failed to save banner', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Internet Error. Please check your network connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="banners-module">
      
      {/* Floating Toast Notification Popup */}
      {toast && (
        <div className="toast-notification-container">
          <div className={`toast-popup-card ${toast.type}`}>
            <div className="toast-popup-icon-box">
              {toast.type === 'success' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              )}
            </div>
            <span className="toast-popup-text">{toast.message}</span>
            <button className="toast-popup-close-btn" onClick={() => setToast(null)}>✕</button>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="banner-list-header-bar">
        <h2 className="banner-header-title">Banner List</h2>
        
        {currentView === 'list' ? (
          <button className="btn-banner-add" onClick={handleOpenAddForm}>
            <span className="plus-icon">+</span> Add Banner
          </button>
        ) : (
          <button className="btn-secondary-dark" onClick={() => setCurrentView('list')}>
            ← Back to Banner List
          </button>
        )}
      </div>

      {errorMsg && <div className="login-error-alert" style={{ margin: '15px 0' }}>{errorMsg}</div>}

      {/* =========================================================================
          VIEW MODE 1: TABLE LIST VIEW
         ========================================================================= */}
      {currentView === 'list' && (
        <div className="blog-post-card-container">
          
          {/* Table Controls */}
          <div className="table-controls-row">
            <div className="entries-selector-group">
              <label>Show</label>
              <select 
                value={entriesPerPage} 
                onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="entries-select-dropdown"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <label>entries</label>
            </div>

            <div className="table-search-group">
              <label>Search:</label>
              <input
                type="text"
                className="search-input-field"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {/* Banner Data Table */}
          <div className="blog-post-table-wrapper">
            <table className="blog-post-table banner-table-styled">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>S.No</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Media</th>
                  <th style={{ textAlign: 'center' }}>Page Name</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Status</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && banners.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-records-cell" style={{ textAlign: 'center' }}>
                      Loading banners from server...
                    </td>
                  </tr>
                ) : currentSlice.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-records-cell" style={{ textAlign: 'center' }}>
                      No matching banners found
                    </td>
                  </tr>
                ) : (
                  currentSlice.map((item) => (
                    <tr key={item.id}>
                      <td className="sno-cell" style={{ textAlign: 'center' }}>{item.sNo}</td>
                      <td className="thumbnail-cell" style={{ textAlign: 'center' }}>
                        {item.img ? (
                          <img 
                            src={item.img} 
                            alt={item.pageName} 
                            className="table-thumb-img banner-media-preview" 
                            style={{ display: 'inline-block' }} 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://placehold.co/120x80/e2e8f0/475569?text=Banner';
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>No Image</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="page-name-tag">{item.pageName}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-pill ${item.status === 'Active' ? 'published' : 'inactive'}`}>
                          {item.status === 'Active' ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      <td className="action-cell" style={{ textAlign: 'center' }}>
                        <div className="action-btns-group" style={{ justifyContent: 'center' }}>
                          <button 
                            className="action-btn-circle view" 
                            onClick={() => setViewingBanner(item)}
                            title="View Banner Details"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          <button 
                            className="action-btn-circle edit" 
                            onClick={() => handleEdit(item)}
                            title="Edit Banner"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <button 
                            className="action-btn-circle delete" 
                            onClick={() => handleDelete(item.id)}
                            title="Delete Banner"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Pagination */}
          <div className="table-footer-pagination-row">
            <div className="pagination-info-text">
              Showing {startIndex} to {endIndex} of {totalEntries} entries
            </div>

            <div className="pagination-right-wrapper">
              <div className="pagination-controls-box">
                <button 
                  className="page-nav-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  Prev
                </button>

                {getPageNumbers().map((page, idx) => (
                  page === '...' ? (
                    <span key={`dots-${idx}`} className="page-nav-btn dots">...</span>
                  ) : (
                    <button
                       key={page}
                       className={`page-nav-btn ${currentPage === page ? 'active' : ''}`}
                       onClick={() => setCurrentPage(page)}
                    >
                       {page}
                    </button>
                  )
                ))}

                <button 
                  className="page-nav-btn"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: INLINE ADD / EDIT BANNER FORM VIEW
         ========================================================================= */}
      {currentView === 'form' && (
        <div className="blog-post-card-container inline-form-container add-banner-card-box">
          
          <div className="inline-form-header">
            <h3 className="form-title-heading banner-add-form-title">
              {editingBanner ? 'Edit Banner' : 'Add Banner'}
            </h3>
          </div>

          <form noValidate onSubmit={handleSubmit} className="modal-form blog-post-full-form">
            
            {/* Row 1: Banner Title * & Status * */}
            <div className="form-row-2col">
              <div className="form-group">
                <div className="label-with-error-row">
                  <label>Banner Title <span className="req-star">*</span></label>
                  {formErrors.title && <span className="field-error-text">{formErrors.title}</span>}
                </div>
                <input
                  type="text"
                  placeholder="Enter title"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (formErrors.title) {
                      setFormErrors(prev => ({ ...prev, title: '' }));
                    }
                  }}
                  className={formErrors.title ? 'input-field-error' : ''}
                />
              </div>

              <div className="form-group">
                <label style={{ marginBottom: '6px', display: 'block' }}>Status <span className="req-star">*</span></label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Row 2: Banner Image */}
            <div className="form-group">
              <div className="label-with-error-row">
                <label>Banner Image <span className="req-star">*</span></label>
                {formErrors.image && <span className="field-error-text">{formErrors.image}</span>}
              </div>
              <div className={`custom-file-upload-box ${formErrors.image ? 'input-field-error' : ''}`}>
                <input
                  type="file"
                  id="bannerMediaFileInput"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden-file-input"
                />
                <label htmlFor="bannerMediaFileInput" className="btn-choose-file">
                  Choose File
                </label>
                <span className="file-name-label">{formData.fileName}</span>
                {formData.img && (
                  <img src={formData.img} alt="Banner Preview" className="file-thumb-preview" />
                )}
              </div>
            </div>

            

            {/* Form Action Buttons */}
            <div className="modal-actions banner-form-actions-right">
              <button 
                type="button" 
                className="btn-cancel-outline" 
                onClick={() => {
                  setFormErrors({});
                  setErrorMsg('');
                  setCurrentView('list');
                }} 
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn-save-banner-filled" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* =========================================================================
          VIEW BANNER DETAILS MODAL
         ========================================================================= */}
      {viewingBanner && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3>Banner Details</h3>
              <button className="collapse-btn" onClick={() => setViewingBanner(null)}>✕</button>
            </div>

            <div className="banner-details-view-box" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {viewingBanner.img && (
                <img 
                  src={viewingBanner.img} 
                  alt={viewingBanner.title} 
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/600x300/e2e8f0/475569?text=Banner+Image';
                  }}
                />
              )}
              
              <div className="form-row-2col">
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Page Location:</span>
                  <div style={{ marginTop: '4px' }}>
                    <span className="page-name-tag">{viewingBanner.pageName}</span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Status:</span>
                  <div style={{ marginTop: '4px' }}>
                    <span className={`status-pill ${viewingBanner.status === 'Active' ? 'published' : 'inactive'}`}>
                      {viewingBanner.status === 'Active' ? '● Active' : '○ Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Banner Title:</span>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>{viewingBanner.title}</p>
              </div>

              {viewingBanner.description && (
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Description:</span>
                  <p style={{ fontSize: '13.5px', color: '#334155', marginTop: '2px', lineHeight: '1.5' }}>{viewingBanner.description}</p>
                </div>
              )}

              {viewingBanner.linkUrl && (
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Link URL:</span>
                  <p style={{ fontSize: '13px', color: '#004dad', marginTop: '2px' }}>
                    <a href={viewingBanner.linkUrl} target="_blank" rel="noreferrer" style={{ color: '#004dad', textDecoration: 'underline' }}>
                      {viewingBanner.linkUrl}
                    </a>
                  </p>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="btn-secondary-dark" onClick={() => setViewingBanner(null)}>
                  Close
                </button>  
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION POPUP MODAL */}
      {deletingBannerId && (
        <div className="admin-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="admin-modal" style={{ maxWidth: '420px', padding: '28px 24px', textAlign: 'center', borderRadius: '16px' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: '#fef2f2', 
              color: '#ef4444', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 16px auto',
              border: '1px solid #fee2e2',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>

            <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Confirm Delete
            </h3>

            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', marginBottom: '24px' }}>
              Are you sure you want to delete this banner? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn-cancel-outline" 
                onClick={() => setDeletingBannerId(null)}
                style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', fontWeight: 600 }}
              >
                Cancel
              </button>

              <button 
                type="button" 
                onClick={confirmDelete}
                style={{ 
                  flex: 1, 
                  padding: '10px 16px', 
                  background: '#dc2626', 
                  color: '#ffffff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontWeight: 700, 
                  fontSize: '14px', 
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      <button 
        className="floating-scroll-top-btn"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        title="Scroll to Top"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>

    </div>
  );
};

export default AdminBanners;

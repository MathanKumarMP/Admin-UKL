import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import g1 from '../assets/Explore1.png';
import g2 from '../assets/Explore2.png';
import g3 from '../assets/Explore3.png';
import g4 from '../assets/Explore4.png';
import g5 from '../assets/buildingnew2.png';
import g6 from '../assets/ASME.jpg';

const sampleVideo1 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
const sampleVideo2 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

const AdminGallery = () => {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // View mode: 'list' (shows table view) or 'form' (shows inline add/edit page view)
  const [currentView, setCurrentView] = useState('list');
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [selectedModalMedia, setSelectedModalMedia] = useState('');

  // Search & Pagination Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedFiles, setSelectedFiles] = useState([]);

  // Default Form State with Multi-Image & Multi-Video Support
  const defaultFormData = {
    title: '',
    mediaType: 'Image',
    status: 'Active',
    category: 'General',
    mediaList: [], // contains local URLs for preview or existing URLs
    fileName: 'No files selected',
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

  // Fetch Gallery Items from backend with pagination & search
  const fetchGallery = async (page = currentPage, limit = entriesPerPage, search = searchTerm) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('adminToken');
      const queryParams = new URLSearchParams({
        page: page,
        limit: limit,
        search: search
      });
      const response = await fetch(`${API_BASE}/api/admin/gallery?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const startNo = ((data.page || page) - 1) * limit;
        const mapped = data.items.map((item, index) => {
          // Map type to capitalise 'Image' or 'Video'
          const mediaType = item.type === 'video' ? 'Video' : 'Image';
          // Convert relative /uploads paths to full server URLs
          const mediaList = item.mediaUrls.map(url => (url.startsWith('http') || url.startsWith('data:') ? url : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`));
          return {
            id: item._id,
            sNo: startNo + index + 1,
            title: item.title || 'Untitled',
            mediaType,
            category: item.category || 'General',
            mediaUrl: mediaList[0] || '',
            mediaList,
            status: item.status || 'Active',
            fileName: `${mediaList.length} media file(s)`
          };
        });
        setGalleryItems(mapped);
        setTotalEntries(data.total !== undefined ? data.total : mapped.length);
        setTotalPages(data.totalPages !== undefined ? data.totalPages : (Math.ceil((data.total || mapped.length) / limit) || 1));
      } else {
        setErrorMsg(data.message || 'Failed to load gallery items.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery(currentPage, entriesPerPage, searchTerm);
  }, [currentPage, entriesPerPage, searchTerm]);

  // Handle File Input Change (Supports Multiple File Selection)
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
      const oversizedImage = files.find(file => file.type.startsWith('image/') && file.size > MAX_IMAGE_SIZE);
      if (oversizedImage) {
        showToast(`Image "${oversizedImage.name}" exceeds 5 MB limit. Please select an image under 5 MB.`, 'error');
        e.target.value = '';
        return;
      }

      const containsVideo = files.some(file => file.type.startsWith('video/'));
      const activeMediaType = containsVideo || formData.mediaType === 'Video' ? 'Video' : 'Image';
      
      // Store raw files
      setSelectedFiles(prev => [...prev, ...files]);

      const localUrls = files.map(file => URL.createObjectURL(file));
      setFormData(prev => {
        const updatedMedia = [...(prev.mediaList || []), ...localUrls];
        return {
          ...prev,
          mediaType: activeMediaType,
          mediaList: updatedMedia,
          mediaUrl: updatedMedia[0] || prev.mediaUrl,
          fileName: `${updatedMedia.length} ${activeMediaType === 'Video' ? 'video(s)' : 'image(s)'} selected`
        };
      });
    }
  };

  // Handle Media Type Change in Dropdown (Image vs Video)
  const handleMediaTypeChange = (newType) => {
    setFormData(prev => ({
      ...prev,
      mediaType: newType,
      mediaList: [],
      mediaUrl: '',
      fileName: 'No files selected'
    }));
    setSelectedFiles([]);
  };

  // Remove individual media item from form preview
  const handleRemoveMedia = (indexToRemove) => {
    const updatedMedia = formData.mediaList.filter((_, idx) => idx !== indexToRemove);
    const mediaLabel = formData.mediaType === 'Video' ? 'video(s)' : 'image(s)';
    
    // Also remove from selected raw files if it was newly added
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));

    setFormData({
      ...formData,
      mediaList: updatedMedia,
      mediaUrl: updatedMedia[0] || '',
      fileName: updatedMedia.length > 0 ? `${updatedMedia.length} ${mediaLabel} selected` : 'No files selected'
    });
  };

  // Server-Side Pagination Calculations
  const startIndex = totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * entriesPerPage, totalEntries);
  const currentSlice = galleryItems;

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

  const [deletingItemId, setDeletingItemId] = useState(null);

  const handleDelete = (id) => {
    setDeletingItemId(id);
  };

  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/gallery/${deletingItemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setDeletingItemId(null);
        fetchGallery();
        showToast(data.message || 'Gallery item deleted successfully', 'success');
      } else {
        showToast(data.message || 'Failed to delete gallery item', 'error');
      }
    } catch (err) {
      console.error(err);
      setDeletingItemId(null);
      showToast('Internet Error. Please check your network connection.', 'error');
    }
  };

  const handleOpenAddForm = () => {
    setFormData(defaultFormData);
    setSelectedFiles([]);
    setEditingItem(null);
    setFormErrors({});
    setErrorMsg('');
    setCurrentView('form');
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setSelectedFiles([]);
    setFormErrors({});
    setErrorMsg('');
    setFormData({
      title: item.title,
      mediaType: item.mediaType,
      status: item.status,
      category: item.category || 'General',
      mediaList: item.mediaList || [],
      mediaUrl: item.mediaUrl || '',
      fileName: `${item.mediaList.length} file(s) currently stored`
    });
    setCurrentView('form');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    const errors = {};
    if (!formData.title || !formData.title.trim()) {
      errors.title = 'Gallery title is required';
    }
    if (!editingItem && selectedFiles.length === 0 && (!formData.mediaList || formData.mediaList.length === 0)) {
      errors.files = 'At least one media file is required';
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
      bodyFormData.append('type', formData.mediaType.toLowerCase()); // backend expects 'image' or 'video'
      bodyFormData.append('category', formData.category || 'General');
      bodyFormData.append('status', formData.status);

      selectedFiles.forEach((file) => {
        bodyFormData.append('mediaFiles', file);
      });

      let url = `${API_BASE}/api/admin/gallery`;
      let method = 'POST';

      if (editingItem) {
        url = `${API_BASE}/api/admin/gallery/${editingItem.id}`;
        method = 'PUT';
      } else if (selectedFiles.length === 0) {
        setErrorMsg('Please select at least one image or video file to upload.');
        setLoading(false);
        return;
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
        const successMsg = data.message || (editingItem ? 'Gallery item updated successfully' : 'Gallery item uploaded successfully');
        setCurrentView('list');
        setEditingItem(null);
        setFormData(defaultFormData);
        setSelectedFiles([]);
        fetchGallery();
        showToast(successMsg, 'success');
      } else {
        setErrorMsg(data.message || 'Failed to save gallery item');
        showToast(data.message || 'Failed to save gallery item', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Internet Error. Please check your network connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gallery-module">
      
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

      {/* Header Bar matching UKL Theme */}
      <div className="banner-list-header-bar">
        <div>
          <h2 className="banner-header-title">Gallery Management</h2>
        </div>

        {currentView === 'list' ? (
          <button className="btn-save-banner-filled" onClick={handleOpenAddForm}>
            <span className="plus-icon" style={{ marginRight: '6px' }}>+</span> Add Gallery Item
          </button>
        ) : (
          <button className="btn-secondary-dark" onClick={() => setCurrentView('list')}>
            ← Back to Gallery List
          </button>
        )}
      </div>

      {errorMsg && <div className="login-error-alert" style={{ margin: '15px 0' }}>{errorMsg}</div>}

      {/* =========================================================================
          VIEW MODE 1: TABLE LIST VIEW
         ========================================================================= */}
      {currentView === 'list' && (
        <div className="blog-post-card-container">
          
          {/* Table Controls Row */}
          <div className="table-controls-row" style={{ marginBottom: '18px' }}>
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
                placeholder="Search title..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {/* Gallery Table */}
          <div className="blog-post-table-wrapper">
            <table className="blog-post-table gallery-table-styled">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>S.No</th>
                  <th style={{ width: '150px', textAlign: 'center' }}>Media</th>
                  <th style={{ textAlign: 'center' }}>Title</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Status</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && galleryItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-records-cell" style={{ textAlign: 'center' }}>
                      Loading gallery items...
                    </td>
                  </tr>
                ) : currentSlice.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-records-cell" style={{ textAlign: 'center' }}>
                      No gallery items found
                    </td>
                  </tr>
                ) : (
                  currentSlice.map((item) => {
                    const count = item.mediaList ? item.mediaList.length : 0;
                    const isVideo = item.mediaType === 'Video';

                    return (
                      <tr key={item.id}>
                        <td className="sno-cell" style={{ textAlign: 'center' }}>{item.sNo}</td>
                        <td className="thumbnail-cell" style={{ textAlign: 'center' }}>
                          <div className="gallery-thumbnail-wrapper-relative" style={{ display: 'inline-block', position: 'relative' }}>
                            {isVideo ? (
                              item.mediaUrl ? (
                                <div className="video-thumbnail-preview-container" style={{ position: 'relative', display: 'inline-block', borderRadius: '8px', overflow: 'hidden' }}>
                                  <video
                                    src={item.mediaUrl}
                                    className="table-thumb-img gallery-preview"
                                    style={{ width: '60px', height: '44px', objectFit: 'cover', display: 'block', borderRadius: '8px', background: '#0f172a' }}
                                    muted
                                    preload="metadata"
                                  />
                                  <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    background: 'rgba(0, 0, 0, 0.65)',
                                    color: '#ffffff',
                                    borderRadius: '50%',
                                    width: '22px',
                                    height: '22px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                                    pointerEvents: 'none'
                                  }}>▶</div>
                                </div>
                              ) : (
                                <div className="video-thumb-preview-placeholder">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#004dad' }}>
                                    <polygon points="23 7 16 12 23 17 23 7" />
                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                  </svg>
                                </div>
                              )
                            ) : (
                              item.mediaUrl && (
                                <img 
                                  src={item.mediaUrl} 
                                  alt={item.title} 
                                  className="table-thumb-img gallery-preview" 
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://placehold.co/100x70/e2e8f0/475569?text=Gallery';
                                  }}
                                />
                              )
                            )}
                            <span className="media-count-indicator-tag">{count} Files</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: '700', color: '#1e293b', textAlign: 'center' }}>
                          {item.title}
                          <span style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                            Type: {item.mediaType} | Category: {item.category}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`status-pill ${item.status === 'Active' ? 'published' : 'inactive'}`}>
                            {item.status === 'Active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="action-cell" style={{ textAlign: 'center' }}>
                          <div className="action-btns-group" style={{ justifyContent: 'center' }}>
                            <button 
                              className="action-btn-circle view" 
                              onClick={() => {
                                setViewingItem(item);
                                setSelectedModalMedia(item.mediaUrl);
                              }}
                              title="View Details"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button 
                              className="action-btn-circle edit" 
                              onClick={() => handleEdit(item)}
                              title="Edit Media"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                            <button 
                              className="action-btn-circle delete" 
                              onClick={() => handleDelete(item.id)}
                              title="Delete Item"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
          VIEW MODE 2: INLINE ADD / EDIT GALLERY FORM VIEW
         ========================================================================= */}
      {currentView === 'form' && (
        <div className="blog-post-card-container inline-form-container add-gallery-card-box">
          <div className="inline-form-header">
            <h3 className="form-title-heading banner-add-form-title">
              {editingItem ? 'Edit Gallery Media Item' : 'Add New Gallery Item'}
            </h3>
          </div>

          <form noValidate onSubmit={handleSubmit} className="modal-form blog-post-full-form">
            
            {/* Row 1 (2 Columns): Title & Media Type */}
            <div className="form-row-2col">
              <div className="form-group">
                <div className="label-with-error-row">
                  <label>Gallery Title / Project Name <span className="req-star">*</span></label>
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
                <label style={{ marginBottom: '6px', display: 'block' }}>Media Type <span className="req-star">*</span></label>
                <select
                  value={formData.mediaType}
                  onChange={(e) => handleMediaTypeChange(e.target.value)}
                >
                  <option value="Image">Image (Photos)</option>
                  <option value="Video">Video (Clips)</option>
                </select>
              </div>
            </div>

            {/* Row 2 (2 Columns): Select Files to Upload & Status */}
            <div className="form-row-2col">
              <div className="form-group">
                <div className="label-with-error-row">
                  <label>Select Images/Videos to Upload <span className="req-star">*</span></label>
                  {formErrors.files && <span className="field-error-text">{formErrors.files}</span>}
                </div>
                <div className={`custom-file-upload-box ${formErrors.files ? 'input-field-error' : ''}`}>
                  <input
                    type="file"
                    id="galleryFilesInput"
                    multiple
                    accept={formData.mediaType === 'Video' ? 'video/*' : 'image/*'}
                    onChange={(e) => {
                      handleFileChange(e);
                      if (formErrors.files) {
                        setFormErrors(prev => ({ ...prev, files: '' }));
                      }
                    }}
                    className="hidden-file-input"
                  />
                  <label htmlFor="galleryFilesInput" className="btn-choose-file">
                    Choose Files
                  </label>
                  <span className="file-name-label">{formData.fileName}</span>
                </div>
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



            {/* Preview Selected Files */}
            {formData.mediaList && formData.mediaList.length > 0 && (
              <div className="form-group">
                <label style={{ marginBottom: '6px', display: 'block' }}>Selected Media Files ({formData.mediaList.length})</label>
                <div className="gallery-bulk-preview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px', marginTop: '10px' }}>
                  {formData.mediaList.map((media, idx) => {
                    const isVid = formData.mediaType === 'Video';
                    return (
                      <div key={idx} className="preview-media-item-box" style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px', background: '#f8fafc' }}>
                        {isVid ? (
                          <video src={media} style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '6px' }} />
                        ) : (
                          <img src={media} alt="Preview" style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '6px' }} />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(idx)}
                          className="btn-remove-media-circle"
                          style={{
                            position: 'absolute',
                            top: '-6px',
                            right: '-6px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                          }}
                          title="Remove media"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="modal-actions banner-form-actions-right" style={{ marginTop: '24px' }}>
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
                {loading ? 'Saving...' : 'Save Gallery'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* =========================================================================
          VIEW GALLERY DETAILS MODAL (Pop-up slideshow preview when eye icon is clicked)
         ========================================================================= */}
      {viewingItem && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3>Gallery Media Slideshow</h3>
              <button className="collapse-btn" onClick={() => setViewingItem(null)}>✕</button>
            </div>

            <div className="gallery-details-slideshow-box" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Giant Active Image/Video Showcase */}
              <div className="slideshow-giant-window" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#0f172a', height: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {viewingItem.mediaType === 'Video' ? (
                  <video src={selectedModalMedia} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <img src={selectedModalMedia} alt="Selected" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )}
              </div>

              {/* Thumbnails list selector */}
              {viewingItem.mediaList && viewingItem.mediaList.length > 1 && (
                <div>
                  <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: 600 }}>Media List ({viewingItem.mediaList.length} files):</span>
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '6px 0' }}>
                    {viewingItem.mediaList.map((url, index) => {
                      const isActive = selectedModalMedia === url;
                      const isVid = viewingItem.mediaType === 'Video';
                      return (
                        <div 
                          key={index} 
                          onClick={() => setSelectedModalMedia(url)}
                          style={{
                            width: '74px',
                            height: '52px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            flexShrink: 0,
                            border: isActive ? '3.5px solid #004dad' : '1px solid #e2e8f0',
                            opacity: isActive ? 1 : 0.65,
                            transition: 'all 0.2s ease',
                            background: '#0f172a'
                          }}
                        >
                          {isVid ? (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#ffffff' }}>
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                            </div>
                          ) : (
                            <img src={url} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="form-row-2col">
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Media Category:</span>
                  <div style={{ marginTop: '4px' }}>
                    <span className="page-name-tag">{viewingItem.category}</span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Status:</span>
                  <div style={{ marginTop: '4px' }}>
                    <span className={`status-pill ${viewingItem.status === 'Active' ? 'published' : 'inactive'}`}>
                      {viewingItem.status === 'Active' ? '● Active' : '○ Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Title / Name:</span>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{viewingItem.title}</h4>
              </div>

              <div className="modal-actions" style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="btn-secondary-dark" onClick={() => setViewingItem(null)}>
                  Close
                </button>
                {/*  */}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION POPUP MODAL */}
      {deletingItemId && (
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
              Are you sure you want to delete this gallery item? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn-cancel-outline" 
                onClick={() => setDeletingItemId(null)}
                style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', fontWeight: 600 }}
              >
                Cancel
              </button>

              <button 
                type="button" 
                onClick={handleConfirmDelete}
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

export default AdminGallery;

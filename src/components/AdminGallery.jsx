import React, { useState } from 'react';
import g1 from '../assets/Explore1.png';
import g2 from '../assets/Explore2.png';
import g3 from '../assets/Explore3.png';
import g4 from '../assets/Explore4.png';
import g5 from '../assets/buildingnew2.png';
import g6 from '../assets/ASME.jpg';

const initialGalleryList = [
  { id: 1, sNo: 1, title: 'UKL Instruments Factory Complex', mediaType: 'Image', mediaUrl: g5, fileName: 'buildingnew2.png', status: 'Active' },
  { id: 2, sNo: 2, title: '8 Inch Side Port Vessel Assembly', mediaType: 'Image', mediaUrl: g1, fileName: 'Explore1.png', status: 'Active' },
  { id: 3, sNo: 3, title: '4 Inch End Port Vessel Manufacturing', mediaType: 'Image', mediaUrl: g2, fileName: 'Explore2.png', status: 'Active' },
  { id: 4, sNo: 4, title: 'ASME Certified Pressure Shell Inspection', mediaType: 'Image', mediaUrl: g6, fileName: 'ASME.jpg', status: 'Active' },
  { id: 5, sNo: 5, title: 'High Precision ID Mirror-Finish Process', mediaType: 'Video', mediaUrl: g3, fileName: 'Explore3.png', status: 'Active' },
  { id: 6, sNo: 6, title: 'Quality Assurance Testing Station', mediaType: 'Image', mediaUrl: g4, fileName: 'Explore4.png', status: 'Inactive' },
];

const AdminGallery = () => {
  const [galleryItems, setGalleryItems] = useState(initialGalleryList);
  
  // View mode: 'list' (shows table view) or 'form' (shows inline add/edit page view)
  const [currentView, setCurrentView] = useState('list');
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);

  // Search & Pagination Controls
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Default Form State (Only Image / Video and Title)
  const defaultFormData = {
    title: '',
    mediaType: 'Image',
    status: 'Active',
    mediaUrl: g1,
    fileName: 'No file chosen',
  };

  const [formData, setFormData] = useState(defaultFormData);

  // Handle File Input Change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          mediaUrl: reader.result,
          fileName: file.name,
          mediaType: isVideo ? 'Video' : 'Image'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter items by search term
  const filteredItems = galleryItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.mediaType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Calculations
  const totalEntries = filteredItems.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * entriesPerPage, totalEntries);
  const currentSlice = filteredItems.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this gallery media?')) {
      const updated = galleryItems.filter(item => item.id !== id).map((item, idx) => ({ ...item, sNo: idx + 1 }));
      setGalleryItems(updated);
    }
  };

  const handleOpenAddForm = () => {
    setFormData(defaultFormData);
    setEditingItem(null);
    setCurrentView('form');
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      ...defaultFormData,
      ...item,
      fileName: item.fileName || 'gallery_media.png'
    });
    setCurrentView('form');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      setGalleryItems(galleryItems.map(item => item.id === editingItem.id ? { ...formData, id: editingItem.id, sNo: editingItem.sNo } : item));
    } else {
      const newItem = {
        ...formData,
        id: Date.now(),
        sNo: galleryItems.length + 1
      };
      setGalleryItems([newItem, ...galleryItems]);
    }
    setCurrentView('list');
    setEditingItem(null);
    setFormData(defaultFormData);
  };

  return (
    <div className="gallery-module">
      
      {/* 1. Header Bar matching UKL Theme */}
      <div className="banner-list-header-bar">
        <div>
          <h2 className="banner-header-title">Gallery Management</h2>
          <span className="header-subtitle-info">Manage factory, product, and event images & videos.</span>
        </div>

        {currentView === 'list' ? (
          <button className="btn-save-banner-filled" onClick={handleOpenAddForm}>
            <span className="plus-icon" style={{ marginRight: '6px' }}>+</span> Add Media
          </button>
        ) : (
          <button className="btn-secondary-dark" onClick={() => setCurrentView('list')}>
            ← Back to Gallery List
          </button>
        )}
      </div>

      {/* =========================================================================
          VIEW MODE 1: TABLE LIST VIEW (Columns: S.No, Media, Title, Status, Actions)
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

          {/* Gallery Table: S.No, Media, Title, Status, Actions */}
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
                {currentSlice.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-records-cell" style={{ textAlign: 'center' }}>
                      No gallery media found
                    </td>
                  </tr>
                ) : (
                  currentSlice.map((item) => (
                    <tr key={item.id}>
                      <td className="sno-cell" style={{ textAlign: 'center' }}>{item.sNo}</td>
                      <td className="thumbnail-cell" style={{ textAlign: 'center' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <img 
                            src={item.mediaUrl} 
                            alt={item.title} 
                            className="table-thumb-img" 
                            style={{ width: '76px', height: '50px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0', display: 'block' }} 
                          />
                          {item.mediaType === 'Video' && (
                            <span style={{ position: 'absolute', bottom: '3px', right: '3px', background: 'rgba(0,77,173,0.85)', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px' }}>
                              ▶ VIDEO
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                        {item.title}
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
                            onClick={() => setViewingItem(item)}
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
                            title="Delete Media"
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

            <div className="pagination-controls-box">
              <button 
                className="page-nav-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                Prev
              </button>

              <button className="page-nav-btn active">
                {currentPage}
              </button>

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
      )}

      {/* =========================================================================
          VIEW MODE 2: INLINE ADD / EDIT GALLERY MEDIA FORM VIEW
         ========================================================================= */}
      {currentView === 'form' && (
        <div className="blog-post-card-container inline-form-container add-banner-card-box">
          
          <div className="inline-form-header">
            <h3 className="form-title-heading banner-add-form-title">
              {editingItem ? 'Edit Gallery Media' : 'Add New Gallery Media'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="modal-form blog-post-full-form">
            
            {/* Title / Caption */}
            <div className="form-group">
              <label>Title / Caption <span className="req-star">*</span></label>
              <input
                type="text"
                placeholder="e.g. UKL Instruments Factory Complex"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Media Type & Status */}
            <div className="form-row-2col">
              <div className="form-group">
                <label>Media Type <span className="req-star">*</span></label>
                <select
                  value={formData.mediaType}
                  onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                  required
                >
                  <option value="Image">Image</option>
                  <option value="Video">Video</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status <span className="req-star">*</span></label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Media File Uploader */}
            <div className="form-group">
              <label>Image / Video File <span className="req-star">*</span></label>
              <div className="custom-file-upload-box">
                <input
                  type="file"
                  id="galleryMediaFileInput"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden-file-input"
                />
                <label htmlFor="galleryMediaFileInput" className="btn-choose-file">
                  Choose File
                </label>
                <span className="file-name-label">{formData.fileName}</span>
                {formData.mediaUrl && (
                  <img src={formData.mediaUrl} alt="Preview" className="file-thumb-preview" style={{ width: '56px', height: '40px' }} />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="modal-actions banner-form-actions-right">
              <button type="button" className="btn-cancel-outline" onClick={() => setCurrentView('list')}>
                Cancel
              </button>
              <button type="submit" className="btn-save-banner-filled">
                {editingItem ? 'Update Media' : 'Save Media'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* =========================================================================
          READ-ONLY VIEW MEDIA DETAILS MODAL (Triggered by Eye 👁️ button)
         ========================================================================= */}
      {viewingItem && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: '#0f172a' }}>Gallery Media Details</h3>
              <button className="collapse-btn" onClick={() => setViewingItem(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <img 
                src={viewingItem.mediaUrl} 
                alt={viewingItem.title} 
                style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #e2e8f0' }} 
              />

              <div className="form-row-2col">
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Media Type:</span>
                  <div style={{ marginTop: '4px' }}>
                    <span className="page-name-tag">{viewingItem.mediaType}</span>
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
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Title / Caption:</span>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{viewingItem.title}</h4>
              </div>

              <div className="modal-actions" style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="btn-secondary-dark" onClick={() => setViewingItem(null)}>
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn-save-banner-filled"
                  onClick={() => {
                    handleEdit(viewingItem);
                    setViewingItem(null);
                  }}
                >
                  Edit Media
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Floating Scroll-to-Top Button */}
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

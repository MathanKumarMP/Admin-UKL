import React, { useState } from 'react';
import banner1 from '../assets/hero-bg.png';
import banner2 from '../assets/about-banner-bg.png';
import banner3 from '../assets/banner.png';

const initialBannersList = [
  {
    id: 1,
    sNo: 1,
    title: 'A Market leader in FRP pressure vessels for water purification',
    description: 'Welcome to UKL Instruments. High-pressure FRP membrane housings engineered for 300 to 1200 PSI.',
    linkUrl: 'https://uklinstruments.com/products',
    img: banner1,
    fileName: 'hero-bg.png',
    pageName: 'Homepage Hero Slider',
    status: 'Active',
  },
  {
    id: 2,
    sNo: 2,
    title: 'About Us Ocean Banner',
    description: 'Leading OEM Water Treatment Solutions across India and global markets.',
    linkUrl: 'https://uklinstruments.com/about',
    img: banner2,
    fileName: 'about-banner-bg.png',
    pageName: 'About Page Banner',
    status: 'Active',
  },
  {
    id: 3,
    sNo: 3,
    title: 'High-Strength FRP Membrane Vessels',
    description: 'Engineered for 300 to 1200 PSI Pressure Ratings with mirror finish inner diameter.',
    linkUrl: '',
    img: banner3,
    fileName: 'banner.png',
    pageName: 'Product Range Slider',
    status: 'Active',
  },
  {
    id: 4,
    sNo: 4,
    title: 'ASME Section X Certified Manufacturing Facility',
    description: 'Uncompromising Quality & Burst Pressure Testing for reverse osmosis plants.',
    linkUrl: 'https://uklinstruments.com/quality',
    img: banner1,
    fileName: 'hero-bg.png',
    pageName: 'Quality Page Banner',
    status: 'Active',
  },
  {
    id: 5,
    sNo: 5,
    title: 'Global Export Quality FRP Pressure Vessels',
    description: 'Trusted by Industrial RO Operators Worldwide in UAE, Oman, and USA.',
    linkUrl: '',
    img: banner2,
    fileName: 'about-banner-bg.png',
    pageName: 'Homepage Hero Slider',
    status: 'Inactive',
  }
];

const AdminBanners = () => {
  const [banners, setBanners] = useState(initialBannersList);
  
  // View mode: 'list' (shows table view) or 'form' (shows inline form)
  const [currentView, setCurrentView] = useState('list');
  const [editingBanner, setEditingBanner] = useState(null);
  const [viewingBanner, setViewingBanner] = useState(null);

  // Table Controls & Pagination
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Default Form State
  const defaultFormData = {
    title: '',
    pageName: '',
    linkUrl: '',
    status: 'Active',
    description: '',
    img: banner1,
    fileName: 'No file chosen',
  };

  const [formData, setFormData] = useState(defaultFormData);

  // Handle File Input Change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          img: reader.result,
          fileName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter & Search
  const filteredBanners = banners.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(term) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      item.pageName.toLowerCase().includes(term)
    );
  });

  // Pagination Calculations
  const totalEntries = filteredBanners.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * entriesPerPage, totalEntries);
  const currentSlice = filteredBanners.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      const updated = banners.filter(b => b.id !== id).map((item, idx) => ({ ...item, sNo: idx + 1 }));
      setBanners(updated);
    }
  };

  const handleOpenAddForm = () => {
    setFormData(defaultFormData);
    setEditingBanner(null);
    setCurrentView('form');
  };

  const handleEdit = (item) => {
    setEditingBanner(item);
    setFormData({
      ...defaultFormData,
      ...item,
      fileName: item.fileName || 'banner_image.png'
    });
    setCurrentView('form');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingBanner) {
      setBanners(banners.map(b => b.id === editingBanner.id ? { ...formData, id: editingBanner.id, sNo: editingBanner.sNo } : b));
    } else {
      const newBanner = {
        ...formData,
        id: Date.now(),
        sNo: banners.length + 1
      };
      setBanners([newBanner, ...banners]);
    }
    setCurrentView('list');
    setEditingBanner(null);
    setFormData(defaultFormData);
  };

  return (
    <div className="banners-module">
      
      {/* 1. Header Bar matching user's screenshot */}
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

      {/* =========================================================================
          VIEW MODE 1: TABLE LIST VIEW (Columns: S.No, Media, Page Name, Status, Action)
         ========================================================================= */}
      {currentView === 'list' && (
        <div className="blog-post-card-container">
          
          {/* Table Controls (Show entries & Search) */}
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

          {/* Banner Data Table: S.No, Media, Page Name, Status, Action */}
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
                {currentSlice.length === 0 ? (
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
                        <img src={item.img} alt={item.pageName} className="table-thumb-img banner-media-preview" style={{ display: 'inline-block' }} />
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
          VIEW MODE 2: INLINE ADD / EDIT BANNER FORM VIEW
         ========================================================================= */}
      {currentView === 'form' && (
        <div className="blog-post-card-container inline-form-container add-banner-card-box">
          
          <div className="inline-form-header">
            <h3 className="form-title-heading banner-add-form-title">
              {editingBanner ? 'Edit Banner' : 'Add Banner'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="modal-form blog-post-full-form">
            
            {/* Row 1: Banner Title * & Page Name * */}
            <div className="form-row-2col">
              <div className="form-group">
                <label>Banner Title <span className="req-star">*</span></label>
                <input
                  type="text"
                  placeholder="Enter title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Page Name <span className="req-star">*</span></label>
                <select
                  value={formData.pageName}
                  onChange={(e) => setFormData({ ...formData, pageName: e.target.value })}
                  required
                >
                  <option value="">Select Page</option>
                  <option value="Homepage Hero Slider">Homepage Hero Slider</option>
                  <option value="About Page Banner">About Page Banner</option>
                  <option value="Product Range Slider">Product Range Slider</option>
                  <option value="Quality Page Banner">Quality Page Banner</option>
                </select>
              </div>
            </div>

            {/* Row 2: Link (Optional) & Status * (Active or Inactive) */}
            <div className="form-row-2col">
              <div className="form-group">
                <label>Link (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter link URL"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                />
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

            {/* Row 3: Description */}
            <div className="form-group">
              <label>Description</label>
              <textarea
                rows="4"
                placeholder="Enter description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Row 4: Banner Image / Video * */}
            <div className="form-group">
              <label>Banner Image / Video <span className="req-star">*</span></label>
              <div className="custom-file-upload-box">
                <input
                  type="file"
                  id="bannerMediaFileInput"
                  accept="image/*,video/*"
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

            {/* Form Action Buttons (Cancel & Save at Bottom Right) */}
            <div className="modal-actions banner-form-actions-right">
              <button type="button" className="btn-cancel-outline" onClick={() => setCurrentView('list')}>
                Cancel
              </button>
              <button type="submit" className="btn-save-banner-filled">
                Save
              </button>
            </div>

          </form>
        </div>
      )}

      {/* =========================================================================
          VIEW BANNER DETAILS MODAL (Read-Only Preview when Eye 👁️ is clicked)
         ========================================================================= */}
      {viewingBanner && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3>Banner Details</h3>
              <button className="collapse-btn" onClick={() => setViewingBanner(null)}>✕</button>
            </div>

            <div className="banner-details-view-box" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <img 
                src={viewingBanner.img} 
                alt={viewingBanner.title} 
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }} 
              />
              
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

export default AdminBanners;

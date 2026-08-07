import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import ToastNotification from './ToastNotification';

const AdminEnquiries = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingEnquiry, setViewingEnquiry] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Fetch Enquiries from API with pagination & search
  const fetchEnquiries = async (page = currentPage, limit = entriesPerPage, search = searchTerm) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('adminToken');
      const queryParams = new URLSearchParams({
        page: page,
        limit: limit,
        search: search
      });
      const response = await fetch(`${API_BASE}/api/admin/enquiries?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const startNo = ((data.page || page) - 1) * limit;
        const mapped = data.enquiries.map((item, index) => ({
          id: item._id,
          sNo: startNo + index + 1,
          name: item.name,
          email: item.email,
          phone: item.phone,
          date: new Date(item.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),
          message: item.message,
          status: item.status
        }));
        setEnquiries(mapped);
        setTotalEntries(data.total !== undefined ? data.total : mapped.length);
        setTotalPages(data.totalPages !== undefined ? data.totalPages : (Math.ceil((data.total || mapped.length) / limit) || 1));
      } else {
        showToast(data.message || 'Network Error', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries(currentPage, entriesPerPage, searchTerm);
  }, [currentPage, entriesPerPage, searchTerm]);

  const loadViewEnquiryById = async (enquiryId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/api/admin/enquiries/${enquiryId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.enquiry) {
        const fresh = data.enquiry;
        setViewingEnquiry({
          ...fresh,
          id: fresh._id || fresh.id,
          date: fresh.createdAt ? new Date(fresh.createdAt).toLocaleString('en-IN') : ''
        });
      }
    } catch (err) {
      console.error('Error loading enquiry for view modal on refresh:', err);
    }
  };

  const closeViewEnquiryModal = () => {
    setViewingEnquiry(null);
    sessionStorage.removeItem('admin_enquiries_view_id');
    const url = new URL(window.location);
    url.searchParams.delete('viewId');
    window.history.pushState({}, '', url.pathname + url.search);
  };

  useEffect(() => {
    const syncViewStateFromURL = () => {
      const params = new URLSearchParams(window.location.search);
      const viewIdParam = params.get('viewId');
      if (viewIdParam) {
        loadViewEnquiryById(viewIdParam);
      } else {
        setViewingEnquiry(null);
        sessionStorage.removeItem('admin_enquiries_view_id');
      }
    };

    syncViewStateFromURL();

    window.addEventListener('popstate', syncViewStateFromURL);
    return () => window.removeEventListener('popstate', syncViewStateFromURL);
  }, []);

  // Server-Side Pagination Calculations
  const startIndex = totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * entriesPerPage, totalEntries);
  const currentSlice = enquiries;

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

  // Download Excel (.xlsx format) via real backend excel generator
  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/enquiries/export/excel`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `UKL_Customer_Enquiries_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Enquiries exported to Excel successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate Excel export.', 'error');
    }
  };

  const handleViewEnquiry = async (item) => {
    const enquiryId = item._id || item.id;
    sessionStorage.setItem('admin_enquiries_view_id', enquiryId);
    const url = new URL(window.location);
    url.searchParams.set('viewId', enquiryId);
    window.history.replaceState({}, '', url.pathname + url.search);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/api/admin/enquiries/${enquiryId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.enquiry) {
        const fresh = data.enquiry;
        setViewingEnquiry({
          ...fresh,
          id: fresh._id || fresh.id,
          date: fresh.createdAt ? new Date(fresh.createdAt).toLocaleString('en-IN') : item.date
        });
      } else {
        setViewingEnquiry(item);
      }
    } catch (err) {
      console.error('Error fetching single enquiry details for view:', err);
      setViewingEnquiry(item);
    }
  };

  const handleDelete = (id) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/enquiries/${deletingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setDeletingId(null);
        fetchEnquiries();
        showToast(data.message || 'Enquiry deleted successfully', 'success');
      } else {
        showToast(data.message || 'Failed to delete enquiry', 'error');
      }
    } catch (err) {
      console.error(err);
      setDeletingId(null);
      showToast('Network Error', 'error');
    }
  };

  return (
    <div className="enquiries-module">
      
      {/* Floating Toast Notification Popup */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* Header Bar matching UKL Theme */}
      <div className="banner-list-header-bar">
        <div>
          <h2 className="banner-header-title">Customer Enquiries</h2>
        </div>

        <div>
          <button 
            className="btn-excel-export" 
            onClick={handleExportExcel}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              background: '#107c41', 
              color: '#ffffff', 
              border: 'none', 
              padding: '10px 18px', 
              borderRadius: '8px', 
              fontWeight: '700', 
              fontSize: '13.5px', 
              cursor: 'pointer', 
              boxShadow: '0 2px 6px rgba(16,124,65,0.25)',
              transition: 'all 0.2s ease'
            }}
            title="Download Enquiries in Microsoft Excel format"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              style={{ marginRight: '6px' }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export to Excel
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE 1: TABLE LIST VIEW
         ========================================================================= */}
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
            <div className="search-input-wrapper">
              <svg className="search-icon-inside" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="search-input-field"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
        </div>

        {/* Enquiries Table */}
        <div className="blog-post-table-wrapper">
          <table className="blog-post-table enquiries-table-styled">
            <thead>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>S.No</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Date</th>
                <th style={{ width: '160px', textAlign: 'center' }}>Customer Name</th>
                <th style={{ width: '160px', textAlign: 'center' }}>Phone Number</th>
                <th style={{ width: '180px', textAlign: 'center' }}>Email</th>
                <th style={{ textAlign: 'center' }}>Description</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && enquiries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-records-cell" style={{ textAlign: 'center' }}>
                    Loading...
                  </td>
                </tr>
              ) : currentSlice.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-records-cell" style={{ textAlign: 'center' }}>
                    No matching enquiries found
                  </td>
                </tr>
              ) : (
                currentSlice.map((item) => (
                  <tr key={item.id}>
                    <td className="sno-cell" style={{ textAlign: 'center' }}>{item.sNo}</td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{item.date}</td>
                    <td style={{ fontWeight: '700', color: '#0f172a', textAlign: 'center' }}>{item.name}</td>
                    <td style={{ textAlign: 'center' }}>{item.phone}</td>
                    <td style={{ textAlign: 'center', color: '#004dad' }}>{item.email}</td>
                    <td className="desc-cell" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>
                      {item.message}
                    </td>
                    <td className="action-cell" style={{ textAlign: 'center' }}>
                      <div className="action-btns-group" style={{ justifyContent: 'center' }}>
                        <button 
                          className="action-btn-circle view" 
                          onClick={() => handleViewEnquiry(item)}
                          title="View Details"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button 
                          className="action-btn-circle delete" 
                          onClick={() => handleDelete(item.id)}
                          title="Delete Enquiry"
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

      {/* =========================================================================
          VIEW ENQUIRY DETAILS MODAL
         ========================================================================= */}
      {viewingEnquiry && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Customer Enquiry Details
              </h3>
              <button 
                onClick={closeViewEnquiryModal}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Date</label>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{viewingEnquiry.date}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Customer Name</label>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{viewingEnquiry.name}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Phone Number</label>
                  <div style={{ color: '#334155', fontWeight: 600 }}>{viewingEnquiry.phone}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Email Address</label>
                  <div style={{ color: '#004dad', fontWeight: 600 }}>{viewingEnquiry.email}</div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Description / Full Message</label>
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155', lineHeight: '1.6', wordBreak: 'break-word' }}>
                  {viewingEnquiry.message}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
              <button 
                type="button"
                className="btn-secondary-dark"
                onClick={closeViewEnquiryModal}
                style={{ padding: '8px 22px', borderRadius: '6px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION POPUP MODAL */}
      {deletingId && (
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
              Are you sure you want to delete this customer enquiry? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn-cancel-outline" 
                onClick={() => setDeletingId(null)}
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

export default AdminEnquiries;

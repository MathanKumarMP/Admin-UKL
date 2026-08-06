import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import ToastNotification from './ToastNotification';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // View state: 'list' (Table) or 'form' (Add/Edit Form)
  const [currentView, setCurrentView] = useState('list');
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);

  // Table controls
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const defaultFormData = {
    name: '',
    email: '',
    phone: '',
    pin: ['', '', '', ''],
    status: 'Active',
    avatar: '',
    avatarFile: null
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [focusedPinIndex, setFocusedPinIndex] = useState(null);
  const [isPinMasked, setIsPinMasked] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch Admin Users from API / Local Storage
  const fetchUsers = async (page = currentPage, limit = entriesPerPage, search = searchTerm) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('adminToken');
      const queryParams = new URLSearchParams({ page, limit, search });
      const response = await fetch(`${API_BASE}/api/admin/users?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && data.users) {
        const startNo = ((data.page || page) - 1) * limit;
        const validUsers = data.users.filter(u => u.role !== 'superadmin' && u.email !== 'admin@uklinstruments.com' && u.phone !== '9988776655');
        const mapped = validUsers.map((item, index) => ({
          id: item._id || String(index + 1),
          sNo: startNo + index + 1,
          name: item.name || '',
          email: item.email || '',
          phone: item.phone || '',
          pin: item.pin ? String(item.pin).split('') : ['2', '0', '2', '6'],
          status: item.status || 'Active',
          avatar: item.avatar ? (item.avatar.startsWith('http') || item.avatar.startsWith('data:') ? item.avatar : `${API_BASE}${item.avatar.startsWith('/') ? '' : '/'}${item.avatar}`) : ''
        }));
        setUsers(mapped);
        setTotalEntries(data.total !== undefined ? data.total : mapped.length);
        setTotalPages(data.totalPages !== undefined ? data.totalPages : (Math.ceil((data.total || mapped.length) / limit) || 1));
      } else {
        showToast(data.message || 'Network Error', 'error');
      }
    } catch (err) {
      console.error(err);
      setUsers([]);
      setTotalEntries(0);
      setTotalPages(1);
      showToast('Network Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, entriesPerPage, searchTerm);
  }, [currentPage, entriesPerPage, searchTerm]);

  const setPersistedView = (view, editId = null) => {
    setCurrentView(view);
    const url = new URL(window.location);
    if (view === 'form') {
      sessionStorage.setItem('admin_users_view', 'form');
      url.searchParams.set('view', 'form');
      if (editId) {
        sessionStorage.setItem('admin_users_edit_id', editId);
        url.searchParams.set('editId', editId);
      } else {
        sessionStorage.removeItem('admin_users_edit_id');
        url.searchParams.delete('editId');
      }
    } else {
      sessionStorage.removeItem('admin_users_view');
      sessionStorage.removeItem('admin_users_edit_id');
      url.searchParams.delete('view');
      url.searchParams.delete('editId');
    }
    window.history.replaceState({}, '', url.pathname + url.search);
  };

  const loadEditUserById = async (userId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.user) {
        const fresh = data.user;
        const avatarPath = fresh.avatar || '';
        setEditingUser({
          ...fresh,
          id: fresh._id || fresh.id
        });
        setIsPinMasked(true);
        setFormData({
          name: fresh.name || '',
          email: fresh.email || '',
          phone: fresh.phone || '',
          pin: ['•', '•', '•', '•'],
          status: fresh.status || 'Active',
          avatar: avatarPath ? (avatarPath.startsWith('http') || avatarPath.startsWith('data:') ? avatarPath : `${API_BASE}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`) : '',
          avatarFile: null
        });
        setFormErrors({});
        setErrorMsg('');
        setCurrentView('form');
      }
    } catch (err) {
      console.error('Error loading user for edit on refresh:', err);
    }
  };

  const loadViewUserById = async (userId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.user) {
        const fresh = data.user;
        const avatarPath = fresh.avatar || '';
        setViewingUser({
          ...fresh,
          id: fresh._id || fresh.id,
          avatar: avatarPath ? (avatarPath.startsWith('http') || avatarPath.startsWith('data:') ? avatarPath : `${API_BASE}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`) : ''
        });
      }
    } catch (err) {
      console.error('Error loading user for view modal on refresh:', err);
    }
  };

  const closeViewUserModal = () => {
    setViewingUser(null);
    sessionStorage.removeItem('admin_users_view_id');
    const url = new URL(window.location);
    url.searchParams.delete('viewId');
    window.history.replaceState({}, '', url.pathname + url.search);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') || sessionStorage.getItem('admin_users_view');
    const editIdParam = params.get('editId') || sessionStorage.getItem('admin_users_edit_id');
    const viewIdParam = params.get('viewId') || sessionStorage.getItem('admin_users_view_id');

    if (viewParam === 'form') {
      if (editIdParam) {
        loadEditUserById(editIdParam);
      } else {
        handleOpenAddForm();
      }
    } else if (viewIdParam) {
      loadViewUserById(viewIdParam);
    }
  }, []);

  // Handle Avatar Image Selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        avatarFile: file,
        avatar: URL.createObjectURL(file)
      }));
      if (formErrors.avatar) {
        setFormErrors(prev => ({ ...prev, avatar: '' }));
      }
    }
  };

  // Handle 4-Digit PIN Input
  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...formData.pin];
    newPin[index] = value.slice(-1);
    setFormData(prev => ({ ...prev, pin: newPin }));

    if (formErrors.pin) {
      setFormErrors(prev => ({ ...prev, pin: '' }));
    }

    // Auto-focus next digit input box
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !formData.pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Server-Side Pagination Calculations
  const startIndex = totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * entriesPerPage, totalEntries);
  const currentSlice = users;

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

  const handleOpenAddForm = () => {
    setFormData(defaultFormData);
    setEditingUser(null);
    setIsPinMasked(false);
    setFormErrors({});
    setErrorMsg('');
    setPersistedView('form');
  };

  const handleEdit = async (user) => {
    const userId = user._id || user.id;
    setPersistedView('form', userId);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const fresh = (data.success && data.user) ? data.user : user;

      const avatarPath = fresh.avatar || '';
      setEditingUser({
        ...fresh,
        id: fresh._id || fresh.id
      });
      setIsPinMasked(true);
      setFormData({
        name: fresh.name || '',
        email: fresh.email || '',
        phone: fresh.phone || '',
        pin: ['•', '•', '•', '•'],
        status: fresh.status || 'Active',
        avatar: avatarPath ? (avatarPath.startsWith('http') || avatarPath.startsWith('data:') ? avatarPath : `${API_BASE}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`) : '',
        avatarFile: null
      });
      setFormErrors({});
      setErrorMsg('');
    } catch (err) {
      console.error('Error fetching single user details for edit:', err);
      setEditingUser(user);
      setIsPinMasked(true);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        pin: ['•', '•', '•', '•'],
        status: user.status || 'Active',
        avatar: user.avatar || '',
        avatarFile: null
      });
      setFormErrors({});
      setErrorMsg('');
    }
  };

  const handleViewUser = async (user) => {
    const userId = user._id || user.id;
    sessionStorage.setItem('admin_users_view_id', userId);
    const url = new URL(window.location);
    url.searchParams.set('viewId', userId);
    window.history.replaceState({}, '', url.pathname + url.search);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.user) {
        const fresh = data.user;
        const avatarPath = fresh.avatar || '';
        setViewingUser({
          ...fresh,
          id: fresh._id || fresh.id,
          avatar: avatarPath ? (avatarPath.startsWith('http') || avatarPath.startsWith('data:') ? avatarPath : `${API_BASE}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`) : ''
        });
      } else {
        setViewingUser(user);
      }
    } catch (err) {
      console.error('Error fetching single user details for view:', err);
      setViewingUser(user);
    }
  };

  const [deletingUserId, setDeletingUserId] = useState(null);

  const handleDelete = (id) => {
    setDeletingUserId(id);
  };

  const confirmDelete = async () => {
    if (!deletingUserId) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/users/${deletingUserId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDeletingUserId(null);
        fetchUsers();
        showToast(data.message || 'User deleted successfully', 'success');
      } else {
        showToast(data.message || 'Failed to delete user', 'error');
      }
    } catch (err) {
      console.error(err);
      setDeletingUserId(null);
      showToast('Network Error', 'error');
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic empty check so empty inputs are flagged, but let API handle validation & duplicate checks
    const errors = {};
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!formData.email || !formData.email.trim()) {
      errors.email = 'Email is required';
    }
    if (!formData.phone || !formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }

    let pinStr = formData.pin.join('');
    if (!isPinMasked && pinStr.length < 4) {
      errors.pin = '4-digit PIN is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    setFormErrors({});
    setLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('adminToken');
      const bodyFormData = new FormData();
      bodyFormData.append('name', formData.name);
      bodyFormData.append('email', formData.email);
      bodyFormData.append('phone', formData.phone);
      if (!isPinMasked && pinStr.length === 4) {
        bodyFormData.append('pin', pinStr);
      }
      bodyFormData.append('status', formData.status);
      if (formData.avatarFile) {
        bodyFormData.append('avatar', formData.avatarFile);
      }

      let url = `${API_BASE}/api/admin/users`;
      let method = 'POST';
      if (editingUser) {
        url = `${API_BASE}/api/admin/users/${editingUser.id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: bodyFormData
      });
      const data = await response.json();

      if (data.success) {
        setPersistedView('list');
        setEditingUser(null);
        setFormData(defaultFormData);
        fetchUsers();
        showToast(data.message || (editingUser ? 'User updated successfully' : 'Admin user created successfully'), 'success');
        return;
      } else {
        const backendMessage = data.message || 'Failed to save user';
        const msgLower = backendMessage.toLowerCase();
        
        const backendErrors = {};
        if (msgLower.includes('phone') || msgLower.includes('mobile') || msgLower.includes('number')) {
          backendErrors.phone = backendMessage;
        } else if (msgLower.includes('email')) {
          backendErrors.email = backendMessage;
        } else if (msgLower.includes('name')) {
          backendErrors.name = backendMessage;
        } else if (msgLower.includes('pin')) {
          backendErrors.pin = backendMessage;
        }

        setFormErrors(backendErrors);
        setErrorMsg(backendMessage);
        showToast(backendMessage, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-module-container">
      
      {/* Floating Toast Notification Popup */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* Delete Confirmation Modal Popup */}
      {deletingUserId && (
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
              border: '1px solid #fee2e2'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Delete Admin User
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>
              Are you sure you want to delete this Admin User? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-cancel-outline"
                onClick={() => setDeletingUserId(null)}
                style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', fontWeight: 700 }}
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

      {/* Top Header Bar */}
      <div className="banner-list-header-bar">
        <h2 className="banner-header-title">
          {currentView === 'list'
            ? 'Admin Users Management'
            : editingUser
            ? 'Edit Admin User'
            : 'Create Admin User'}
        </h2>
        {currentView === 'list' ? (
          <button className="btn-banner-add" onClick={handleOpenAddForm}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Admin User
          </button>
        ) : (
          <button className="btn-secondary-dark" onClick={() => { setPersistedView('list'); setEditingUser(null); }}>
            ← Back to Admin List
          </button>
        )}
      </div>

      {errorMsg && <div className="alert-banner-error">{errorMsg}</div>}

      {/* =========================================================================
          VIEW MODE 1: LIST / TABLE VIEW
         ========================================================================= */}
      {currentView === 'list' && (
        <div className="blog-post-card-container">
          {/* Table Controls */}
          <div className="table-controls-row">
            <div className="entries-selector-group">
              <label>Show</label>
              <select
                value={entriesPerPage}
                className="entries-select-dropdown"
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
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
                placeholder="Search user..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="blog-post-table-wrapper">
            <table className="blog-post-table banner-table-styled">
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center' }}>S.No</th>
                  <th style={{ textAlign: 'left' }}>User Name</th>
                  <th style={{ textAlign: 'left' }}>Email</th>
                  <th style={{ textAlign: 'left' }}>Phone Number</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Status</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentSlice.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-records-cell">No matching admin users found</td>
                  </tr>
                ) : (
                  currentSlice.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={{ textAlign: 'center', fontWeight: '600' }}>{item.sNo}</td>
                      <td style={{ textAlign: 'left', fontWeight: '700', color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {item.avatar ? (
                            <img
                              src={item.avatar}
                              alt={item.name}
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid #004dad',
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(0, 77, 173, 0.25)',
                                flexShrink: 0
                              }}
                              onClick={() => setViewingUser(item)}
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                              title="Click to view profile picture"
                            />
                          ) : (
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #004dad 0%, #002b5c 100%)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '800',
                                fontSize: '13px',
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(0, 77, 173, 0.25)',
                                flexShrink: 0
                              }}
                              onClick={() => setViewingUser(item)}
                              title="Click to view profile picture"
                            >
                              {item.name ? item.name.substring(0, 2).toUpperCase() : 'MA'}
                            </div>
                          )}
                          <span
                            style={{ cursor: 'pointer', color: '#0f172a' }}
                            onClick={() => handleViewUser(item)}
                            title="Click to view profile details"
                          >
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'left', color: '#475569' }}>{item.email}</td>
                      <td style={{ textAlign: 'left', color: '#475569' }}>{item.phone}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-pill ${item.status === 'Active' ? 'active' : 'inactive'}`}>
                           {item.status}
                        </span>
                      </td>
                      <td className="action-cell" style={{ textAlign: 'center' }}>
                        <div className="action-btns-group" style={{ justifyContent: 'center' }}>
                          <button
                            className="action-btn-circle view"
                            onClick={() => handleViewUser(item)}
                            title="View Profile Details & Picture"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          <button className="action-btn-circle edit" onClick={() => handleEdit(item)} title="Edit User">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <button className="action-btn-circle delete" onClick={() => handleDelete(item.id)} title="Delete User">
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

                {getPageNumbers().map(page => (
                  <button
                    key={page}
                    className={`page-nav-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
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
          VIEW MODE 2: INLINE CREATE / EDIT ADMIN USER FORM (Matching Screenshot)
         ========================================================================= */}
      {currentView === 'form' && (
        <div className="blog-post-card-container inline-form-container">
          <form noValidate autoComplete="off" onSubmit={handleSubmit} className="modal-form blog-post-full-form">
            <h4 className="form-subheading-title">Basic Information</h4>

            <div className="admin-user-form-layout">
              {/* Left Column: Profile Avatar Upload Box */}
              <div className="admin-user-avatar-col">
                <div className={`avatar-preview-box ${formErrors.avatar ? 'input-field-error' : ''}`}>
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="avatar-preview-img" />
                  ) : (
                    <svg className="avatar-placeholder-icon" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  )}
                </div>

                <input
                  type="file"
                  id="adminUserAvatarInput"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="adminUserAvatarInput" className="btn-choose-avatar">
                  Choose
                </label>
              </div>

              {/* Right Column: Input Fields */}
              <div className="admin-user-fields-col">
                {/* Row 1: Name * & Email * */}
                <div className="form-row-2col">
                  <div className="form-group">
                    <label style={{ marginBottom: '6px', display: 'block' }}>Name <span className="req-star">*</span></label>
                    <input
                      type="text"
                      placeholder="Enter Full Name"
                      value={formData.name}
                      autoComplete="off"
                      onChange={(e) => {
                        const alphaVal = e.target.value.replace(/[^a-zA-Z\s.\'-]/g, '');
                        setFormData({ ...formData, name: alphaVal });
                        if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                      }}
                      className={formErrors.name ? 'input-field-error' : ''}
                    />
                    {formErrors.name && <span className="field-error-text">{formErrors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label style={{ marginBottom: '6px', display: 'block' }}>Email <span className="req-star">*</span></label>
                    <input
                      type="email"
                      placeholder="Enter Email Address"
                      value={formData.email}
                      autoComplete="new-password"
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                      }}
                      className={formErrors.email ? 'input-field-error' : ''}
                    />
                    {formErrors.email && <span className="field-error-text">{formErrors.email}</span>}
                  </div>
                </div>

                {/* Row 2: Phone Number * & PIN - 4 Digits * */}
                <div className="form-row-2col">
                  <div className="form-group">
                    <label style={{ marginBottom: '6px', display: 'block' }}>Phone Number <span className="req-star">*</span></label>
                    <input
                      type="text"
                      maxLength="10"
                      placeholder="Enter Phone Number"
                      value={formData.phone}
                      autoComplete="off"
                      onChange={(e) => {
                        const numVal = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, phone: numVal });
                        if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: '' }));
                      }}
                      className={formErrors.phone ? 'input-field-error' : ''}
                    />
                    {formErrors.phone && <span className="field-error-text">{formErrors.phone}</span>}
                  </div>

                  <div className="form-group">
                    <label style={{ marginBottom: '6px', display: 'block' }}>PIN - 4 Digits <span className="req-star">*</span></label>
                    <div className="pin-inputs-flex">
                      {[0, 1, 2, 3].map(idx => {
                        const displayVal = isPinMasked ? '•' : (formData.pin[idx] || '');
                        return (
                          <input
                            key={idx}
                            id={`pin-input-${idx}`}
                            type="text"
                            maxLength="1"
                            autoComplete="off"
                            className={`pin-digit-box ${formErrors.pin ? 'input-field-error' : ''}`}
                            style={{ backgroundColor: '#ffffff', textAlign: 'center', fontSize: isPinMasked ? '18px' : '16px' }}
                            value={displayVal}
                            onChange={(e) => {
                              if (isPinMasked) {
                                setIsPinMasked(false);
                                const numVal = e.target.value.replace(/\D/g, '').slice(-1);
                                const newPin = ['', '', '', ''];
                                newPin[idx] = numVal;
                                setFormData(prev => ({ ...prev, pin: newPin }));
                                if (numVal && idx < 3) {
                                  const nextInput = document.getElementById(`pin-input-${idx + 1}`);
                                  if (nextInput) nextInput.focus();
                                }
                              } else {
                                handlePinChange(idx, e.target.value);
                              }
                            }}
                            onKeyDown={(e) => handlePinKeyDown(idx, e)}
                            onFocus={() => {
                              if (isPinMasked) {
                                setIsPinMasked(false);
                                setFormData(prev => ({ ...prev, pin: ['', '', '', ''] }));
                              }
                              setFocusedPinIndex(idx);
                            }}
                            onBlur={() => setFocusedPinIndex(null)}
                          />
                        );
                      })}
                    </div>
                    {formErrors.pin && <span className="field-error-text">{formErrors.pin}</span>}
                  </div>
                </div>

                {/* Row 3: Status */}
                <div className="form-row-2col">
                  <div className="form-group">
                    <label style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>Status</label>
                    <div className="status-pills-radio-group">
                      <div
                        className={`status-pill-option ${formData.status === 'Active' ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, status: 'Active' })}
                      >
                        <div className={`status-pill-checkbox ${formData.status === 'Active' ? '' : 'inactive'}`}>
                          {formData.status === 'Active' && '✓'}
                        </div>
                        <span>Active</span>
                      </div>

                      <div
                        className={`status-pill-option ${formData.status === 'Inactive' ? 'inactive' : ''}`}
                        onClick={() => setFormData({ ...formData, status: 'Inactive' })}
                      >
                        <div className={`status-pill-checkbox ${formData.status === 'Inactive' ? '' : 'inactive'}`}>
                          {formData.status === 'Inactive' && '✓'}
                        </div>
                        <span>Inactive</span>
                      </div>
                    </div>
                  </div>

                  <div></div>
                </div>

              </div>
            </div>

            {/* Action Buttons */}
            <div className="modal-actions banner-form-actions-right" style={{ marginTop: '36px', gap: '16px' }}>
              <button
                type="button"
                className="btn-cancel-red-outline"
                onClick={() => {
                  setFormErrors({});
                  setErrorMsg('');
                  setPersistedView('list');
                  setEditingUser(null);
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn-save-navy-filled" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* =========================================================================
          PROFILE IMAGE / USER DETAILS POP-UP MODAL
         ========================================================================= */}
      {viewingUser && (
        <div className="admin-modal-overlay" onClick={closeViewUserModal}>
          <div className="admin-modal" style={{ maxWidth: '440px', padding: '28px 24px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>User Profile Picture</h3>
              <button className="collapse-btn" onClick={closeViewUserModal}>✕</button>
            </div>

            <div style={{ padding: '6px 0' }}>
              {/* Profile Avatar Full Image Preview */}
              {viewingUser.avatar ? (
                <img
                  src={viewingUser.avatar}
                  alt={viewingUser.name}
                  style={{
                    width: '100%',
                    maxHeight: '260px',
                    borderRadius: '12px',
                    objectFit: 'contain',
                    border: '1.5px solid #e2e8f0',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                    margin: '0 auto 20px auto',
                    display: 'block',
                    backgroundColor: '#f8fafc'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #004dad 0%, #002b5c 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '36px',
                    margin: '0 auto 20px auto',
                    boxShadow: '0 8px 24px rgba(0, 77, 173, 0.25)'
                  }}
                >
                  {viewingUser.name ? viewingUser.name.substring(0, 2).toUpperCase() : 'MA'}
                </div>
              )}

              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
                {viewingUser.name}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13.5px', color: '#475569' }}>
                  <strong>Email:</strong> {viewingUser.email}
                </div>
                <div style={{ fontSize: '13.5px', color: '#475569' }}>
                  <strong>Phone:</strong> {viewingUser.phone}
                </div>
                <div style={{ fontSize: '13.5px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong>Status:</strong>
                  <span className={`status-pill ${viewingUser.status === 'Active' ? 'active' : 'inactive'}`}>
                     {viewingUser.status}
                  </span>
                </div>
              </div>
            </div>

            
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

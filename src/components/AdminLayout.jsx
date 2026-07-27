import React, { useState } from 'react';
import logo from '../assets/favicon.png';
import AdminBanners from './AdminBanners';
import AdminGallery from './AdminGallery';
import AdminNews from './AdminNews';
import AdminEnquiries from './AdminEnquiries';

const AdminLayout = ({ onLogout }) => {
  const [activeModule, setActiveModule] = useState('banners');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    {
      id: 'banners',
      label: 'Banner',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      )
    },
    {
      id: 'gallery',
      label: 'Gallery',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      )
    },
    {
      id: 'news',
      label: 'News',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      )
    },
    {
      id: 'enquiries',
      label: 'Enquiry',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      )
    }
  ];

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'gallery':
        return <AdminGallery />;
      case 'news':
        return <AdminNews />;
      case 'enquiries':
        return <AdminEnquiries />;
      case 'banners':
      default:
        return <AdminBanners />;
    }
  };

  return (
    <div className="admin-app-container">
      {/* Top Navigation Header Bar */}
      <header className="top-navbar-header">
        <div className="navbar-container">
          
          {/* Brand Logo & Title */}
          <div className="navbar-brand-section">
            <div className="brand-logo-wrapper">
              <img src={logo} alt="UKL Admin Logo" className="brand-logo-img" />
            </div>
            
          </div>

          {/* Center Horizontal Navigation Bar */}
          <nav className="horizontal-nav-menu">
            {navItems.map((item) => {
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveModule(item.id)}
                >
                  <span className="tab-icon">{item.icon}</span>
                  <span className="tab-label">{item.label}</span>
                  {item.badge && <span className="tab-badge">{item.badge}</span>}
                </button>
              );
            })}
          </nav>

          {/* Right Header Utilities & Actions */}
          <div className="navbar-utilities">
            {/* Search Input */}
            {/* <div className="navbar-search-box">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search module data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div> */}

            {/* Notification Bell Icon */}
            <div className="notification-wrapper">
              <button 
                className="icon-btn-badge"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="notification-indicator">1</span>
              </button>

              {showNotifications && (
                <div className="dropdown-panel notifications-panel">
                  <div className="panel-header">
                    <h4>Notifications</h4>
                    <span className="unread-count">1 Unread</span>
                  </div>
                  <div className="notification-list">
                    <div className="notification-item unread">
                      <div className="notif-dot"></div>
                      <div className="notif-content">
                        <p className="notif-title">New Form Enquiry Received</p>
                        <p className="notif-desc">Rajesh Kumar submitted a quote request for FRP Vessels.</p>
                        <span className="notif-time">10 mins ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Badge */}
            <div className="profile-wrapper">
              <button 
                className="profile-pill-btn"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="profile-avatar-circle">UK</div>
                <div className="profile-text-group">
                  <span className="profile-name">UKL Admin</span>
                  <span className="profile-role">Manager</span>
                </div>
                <svg className="chevron-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showProfileMenu && (
                <div className="dropdown-panel profile-menu-panel">
                  <div className="profile-menu-header">
                    <p className="user-full-name">UKL Admin Panel</p>
                    <p className="user-email">admin@uklinstruments.com</p>
                  </div>
                  <button className="menu-item-btn danger" onClick={onLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    Log Out
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* Main Workspace Body Content */}
      <main className="admin-main-workspace">
        <div className="workspace-inner">
          {renderModuleContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

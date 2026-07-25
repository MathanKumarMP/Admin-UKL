import React from 'react';

const AdminDashboard = ({ onNavigate }) => {
  const kpis = [
    { title: 'Total Enquiries', value: '148', trend: '+14% this month', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { title: 'Active Banners', value: '4', trend: 'Live Homepage Sliders', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { title: 'Gallery Items', value: '36', trend: '4 Categories', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { title: 'Published News', value: '12', trend: 'Articles Live', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' }
  ];

  const recentEnquiries = [
    { id: 'ENQ-1048', name: 'Rajesh Kumar', email: 'rajesh@watertech.com', phone: '+91 98450 12345', date: '25 Jul 2026', status: 'unread' },
    { id: 'ENQ-1047', name: 'Ananya Sharma', email: 'ananya@hydroclean.in', phone: '+91 97110 88765', date: '24 Jul 2026', status: 'replied' },
    { id: 'ENQ-1046', name: 'Michael Vance', email: 'm.vance@globalpurification.org', phone: '+1 415 555 0192', date: '23 Jul 2026', status: 'pending' },
    { id: 'ENQ-1045', name: 'Suresh Menon', email: 'suresh@chennaifilters.com', phone: '+91 94440 33210', date: '22 Jul 2026', status: 'replied' },
  ];

  return (
    <div className="dashboard-module">
      {/* 1. KPI Cards Row */}
      <div className="kpi-cards-grid">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="kpi-card">
            <div className="kpi-info">
              <h4>{kpi.title}</h4>
              <p className="kpi-value">{kpi.value}</p>
              <span className="kpi-trend positive">{kpi.trend}</span>
            </div>
            <div className="kpi-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={kpi.icon} />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Quick Action Toolbar */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Quick Management Actions</h3>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button className="btn-primary-gradient" onClick={() => onNavigate('banners')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Add New Banner
          </button>

          <button className="btn-primary-gradient" onClick={() => onNavigate('gallery')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            Upload Gallery Image
          </button>

          <button className="btn-primary-gradient" onClick={() => onNavigate('news')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Publish News Article
          </button>

          <button className="btn-secondary-dark" onClick={() => onNavigate('enquiries')}>
            View All Enquiries
          </button>
        </div>
      </div>

      {/* 3. Recent Enquiries Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Recent Customer Enquiries</h3>
          <button className="btn-secondary-dark" onClick={() => onNavigate('enquiries')}>View Table</button>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Enquiry ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentEnquiries.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.id}</strong></td>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.phone}</td>
                  <td>{row.date}</td>
                  <td>
                    <span className={`status-pill ${row.status}`}>
                      {row.status === 'unread' ? '● New Unread' : row.status === 'replied' ? '✓ Replied' : '⏱ Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

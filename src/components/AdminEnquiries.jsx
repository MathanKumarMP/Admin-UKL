import React, { useState } from 'react';

const AdminEnquiries = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  const [enquiries, setEnquiries] = useState([
    {
      id: 'ENQ-1048',
      name: 'Rajesh Kumar',
      email: 'rajesh@watertech.com',
      phone: '+91 98450 12345',
      date: '25 Jul 2026',
      source: 'Get In Touch Form',
      productInterest: '8 Housing Side Port (80SP1200)',
      message: 'We require quotation and technical datasheet for 12 units of 80SP1200 side-entry FRP pressure vessels for our upcoming industrial RO plant project in Gujarat.',
      status: 'unread',
    },
    {
      id: 'ENQ-1047',
      name: 'Ananya Sharma',
      email: 'ananya@hydroclean.in',
      phone: '+91 97110 88765',
      date: '24 Jul 2026',
      source: 'Enquire Now Button',
      productInterest: '4 Housing End Port (40EP600)',
      message: 'Please send pricing and delivery timeline for 20 pieces of 4 inch 600 PSI end entry membrane housings.',
      status: 'replied',
    },
    {
      id: 'ENQ-1046',
      name: 'Michael Vance',
      email: 'm.vance@globalpurification.org',
      phone: '+1 415 555 0192',
      date: '23 Jul 2026',
      source: 'ASME Section Brochure Download',
      productInterest: 'ASME Section X Certified Vessels',
      message: 'Interested in ASME Section X certified 8 inch vessels for seawater desalination project in UAE. Please provide ASME documentation.',
      status: 'pending',
    },
    {
      id: 'ENQ-1045',
      name: 'Suresh Menon',
      email: 'suresh@chennaifilters.com',
      phone: '+91 94440 33210',
      date: '22 Jul 2026',
      source: 'Get In Touch Form',
      productInterest: '8 Housing End Port (80EP450)',
      message: 'We need spare end plug seals and quick lock retention rings for UKL 80EP model.',
      status: 'replied',
    },
  ]);

  const filteredEnquiries = enquiries.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = (id, newStatus) => {
    setEnquiries(enquiries.map(item => item.id === id ? { ...item, status: newStatus } : item));
    if (selectedEnquiry && selectedEnquiry.id === id) {
      setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
    }
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["SNo,Date,Name,Email,Phone,Product,Status", ...enquiries.map((e, idx) => `${idx + 1},${e.date},"${e.name}",${e.email},${e.phone},"${e.productInterest}",${e.status}`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `UKL_Enquiries_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="enquiries-module">
      
      {/* Header Bar */}
      <div className="banner-list-header-bar">
        <div>
          <h2 className="banner-header-title">Customer Enquiries Management</h2>
        </div>

        <button className="btn-save-banner-filled" onClick={handleExportCSV}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Export Enquiries (CSV)
        </button>
      </div>

      {/* Filter & Search Controls Box */}
      <div className="blog-post-card-container">
        
        <div className="table-controls-row" style={{ marginBottom: '18px' }}>
          <div className="table-search-group" style={{ flex: 1, maxWidth: '360px' }}>
            <label>Search:</label>
            <input
              type="text"
              className="search-input-field"
              placeholder="Search by Name, Email or Message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

         
        </div>

        {/* Enquiries Data Table: S.No, Date, Customer Name, Email, Phone, Action (Delete only) */}
        <div className="blog-post-table-wrapper">
          <table className="blog-post-table enquiry-table-styled">
            <thead>
              <tr>
                <th style={{ width: '70px', textAlign: 'center' }}>S.No</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Date</th>
                <th style={{ textAlign: 'left' }}>Customer Name</th>
                <th style={{ textAlign: 'left' }}>Email</th>
                <th style={{ textAlign: 'center' }}>Phone</th>
                <th style={{ width: '90px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-records-cell" style={{ textAlign: 'center' }}>
                    No customer enquiries found
                  </td>
                </tr>
              ) : (
                filteredEnquiries.map((item, index) => (
                  <tr key={item.id}>
                    <td className="sno-cell" style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ textAlign: 'center', color: '#64748b' }}>{item.date}</td>
                    <td style={{ fontWeight: 700, color: '#0f172a', textAlign: 'left' }}>{item.name}</td>
                    <td style={{ textAlign: 'left', color: '#475569' }}>{item.email}</td>
                    <td style={{ textAlign: 'center', color: '#475569' }}>{item.phone}</td>
                    <td className="action-cell" style={{ textAlign: 'center' }}>
                      <div className="action-btns-group" style={{ justifyContent: 'center' }}>
                        <button 
                          className="action-btn-circle delete" 
                          onClick={() => { if (window.confirm('Delete this enquiry?')) { setEnquiries(enquiries.filter(e => e.id !== item.id)); } }}
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
      </div>

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

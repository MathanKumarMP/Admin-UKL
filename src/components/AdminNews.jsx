import React, { useState } from 'react';
import newsImg1 from '../assets/blog1.JPG';
import newsImg2 from '../assets/Explore1.png';

// Generate 108 realistic mock articles for demo matching 2nd image
const generateInitialArticles = () => {
  const baseCategories = ['Company News', 'Technical Guide', 'Certifications', 'Events & Exhibitions'];
  const baseArticles = [
    {
      title: 'UKL Expands FRP Vessel Manufacturing Capacity to Meet Growing Global RO Demand',
      slug: 'ukl-expands-frp-vessel-manufacturing-capacity',
      thumbnail: newsImg1,
      metaTitle: 'UKL Instruments - High Pressure FRP Vessel Manufacturing',
      metaDescription: 'UKL Instruments expands its FRP vessel manufacturing facility to support global industrial reverse osmosis projects.',
      metaKeyword: 'FRP Vessels, RO Plant, Desalination, UKL Instruments',
      blogDate: '2026-07-24',
      shortDescription: 'UKL Instruments expands its state-of-the-art FRP vessel manufacturing line to double monthly output.',
      blogDetails: 'UKL Instruments has officially expanded its high-pressure FRP vessel manufacturing line to meet the surging global demand for high-quality reverse osmosis membrane housings. The new automated facility integrates high-precision filament winding technology.',
      category: 'Company News',
      tags: ['FRP Vessels', 'RO Plant'],
      addMostRead: true,
      latestArticles: true,
      author: 'UKL Media Team',
      status: 'Active',
    },
    {
      title: 'Key Factors to Consider When Selecting High-Pressure FRP Membrane Housings',
      slug: 'key-factors-selecting-high-pressure-frp-membrane-housings',
      thumbnail: newsImg2,
      metaTitle: 'Selecting FRP Membrane Housings Guide | UKL Instruments',
      metaDescription: 'Technical guide on selecting 300 to 1200 PSI FRP pressure vessels for water purification and seawater desalination.',
      metaKeyword: 'Membrane Housing, PSI Rating, Desalination Guide',
      blogDate: '2026-07-18',
      shortDescription: 'A technical deep-dive into pressure ratings, end port configurations, and corrosion resistance for RO plant engineers.',
      blogDetails: 'Selecting the appropriate pressure rating for membrane housings is critical for desalination efficiency and plant safety. Engineers must consider operating pressure, feed water salinity, thermal expansion, and end-plug seal durability.',
      category: 'Technical Guide',
      tags: ['Membrane Housing', 'Water Treatment'],
      addMostRead: false,
      latestArticles: true,
      author: 'Technical Dept',
      status: 'Active',
    },
    {
      title: 'ASME Section X Compliance: Ensuring Structural Integrity in Seawater Desalination',
      slug: 'asme-section-x-compliance-structural-integrity',
      thumbnail: newsImg1,
      metaTitle: 'ASME Section X Certification Standards | UKL Instruments',
      metaDescription: 'Overview of ASME Section X standards compliance for fiber-reinforced plastic pressure vessels.',
      metaKeyword: 'ASME Section X, Burst Test, Quality Control',
      blogDate: '2026-07-10',
      shortDescription: 'Learn how ASME Section X certification ensures 6x safety margins under high hydraulic pressures.',
      blogDetails: 'ASME Section X certification guarantees structural reliability and burst test margins for composite pressure shells operating under extreme seawater RO conditions.',
      category: 'Certifications',
      tags: ['ASME', 'Desalination'],
      addMostRead: true,
      latestArticles: false,
      author: 'Quality Team',
      status: 'Inactive',
    }
  ];

  const list = [];
  for (let i = 1; i <= 108; i++) {
    const base = baseArticles[(i - 1) % baseArticles.length];
    const cat = baseCategories[(i - 1) % baseCategories.length];
    list.push({
      id: i,
      sNo: i,
      title: i > 3 ? `${base.title} (Vol #${i})` : base.title,
      slug: i > 3 ? `${base.slug}-${i}` : base.slug,
      thumbnail: i % 2 === 0 ? newsImg2 : newsImg1,
      metaTitle: base.metaTitle,
      metaDescription: base.metaDescription,
      metaKeyword: base.metaKeyword,
      blogDate: base.blogDate,
      shortDescription: base.shortDescription,
      blogDetails: base.blogDetails,
      category: cat,
      tags: base.tags,
      addMostRead: base.addMostRead,
      latestArticles: base.latestArticles,
      author: base.author,
      status: i % 3 === 0 ? 'Inactive' : 'Active',
    });
  }
  return list;
};

const AdminNews = () => {
  const [articles, setArticles] = useState(generateInitialArticles());

  // View state: 'list', 'form', 'tags', 'categories'
  const [currentView, setCurrentView] = useState('list');
  const [editingArticle, setEditingArticle] = useState(null);
  const [viewingArticle, setViewingArticle] = useState(null);

  // Pagination & Filter state for main article table
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('sNo');
  const [sortDirection, setSortDirection] = useState('asc');

  // Categories & Tags Lists
  const [categories, setCategories] = useState(['Company News', 'Technical Guide', 'Certifications', 'Events & Exhibitions']);
  const [tags, setTags] = useState(['Latest Articles', 'FRP Vessels', 'RO Plant', 'Desalination', 'ASME', 'Water Treatment', 'Membrane Housing']);
  
  // Tag / Category Management State (Inline Add & Edit without popup)
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [showTagForm, setShowTagForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [editingTagIndex, setEditingTagIndex] = useState(null);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(null);

  // Default Form State with all 14 requested fields
  const defaultFormData = {
    category: 'Company News',
    title: '',
    slug: '',
    thumbnail: newsImg1,
    thumbnailFileName: 'No file chosen',
    metaTitle: '',
    metaDescription: '',
    metaKeyword: 'FRP Vessels, RO Plant, Water Treatment',
    blogDate: new Date().toISOString().split('T')[0],
    shortDescription: '',
    blogDetails: '',
    addMostRead: false,
    tagList: ['FRP Vessels'],
    latestArticles: true,
    author: 'UKL Media Team',
    status: 'Active',
  };

  const [formData, setFormData] = useState(defaultFormData);

  // Auto-generate slug when title changes
  const handleTitleChange = (e) => {
    const titleVal = e.target.value;
    const generatedSlug = titleVal
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setFormData({
      ...formData,
      title: titleVal,
      slug: generatedSlug,
      metaTitle: titleVal.length > 0 ? `${titleVal} | UKL Instruments` : ''
    });
  };

  // Thumbnail file change handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          thumbnail: reader.result,
          thumbnailFileName: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Tag list checkbox handler
  const handleTagToggle = (tagName) => {
    const current = formData.tagList || [];
    if (current.includes(tagName)) {
      setFormData({ ...formData, tagList: current.filter(t => t !== tagName) });
    } else {
      setFormData({ ...formData, tagList: [...current, tagName] });
    }
  };

  // Sorting handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter & Search
  const filteredArticles = articles.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(term) ||
      item.slug.toLowerCase().includes(term) ||
      item.metaTitle.toLowerCase().includes(term) ||
      (item.metaDescription && item.metaDescription.toLowerCase().includes(term)) ||
      (item.author && item.author.toLowerCase().includes(term))
    );
  }).sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination Calculations for Main Article Table
  const totalEntries = filteredArticles.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * entriesPerPage, totalEntries);
  const currentSlice = filteredArticles.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

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

  // Calculate live word count
  const calculateWordCount = (text) => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  // Save new or updated article
  const handleSubmitArticle = (e) => {
    e.preventDefault();
    if (editingArticle) {
      setArticles(articles.map(a => a.id === editingArticle.id ? { ...formData, id: editingArticle.id, sNo: editingArticle.sNo } : a));
    } else {
      const newPost = {
        ...formData,
        id: Date.now(),
        sNo: articles.length + 1
      };
      setArticles([newPost, ...articles]);
    }
    setCurrentView('list');
    setEditingArticle(null);
    setFormData(defaultFormData);
  };

  const handleOpenAddForm = () => {
    setFormData(defaultFormData);
    setEditingArticle(null);
    setCurrentView('form');
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setFormData({
      ...defaultFormData,
      ...article,
      thumbnailFileName: article.thumbnailFileName || 'image_uploaded.png'
    });
    setCurrentView('form');
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this blog post?')) {
      const updated = articles.filter(a => a.id !== id).map((item, idx) => ({ ...item, sNo: idx + 1 }));
      setArticles(updated);
    }
  };

  // TAG MANAGEMENT HANDLERS (No Popup, Direct View & Form)
  const handleSaveTag = (e) => {
    e.preventDefault();
    if (!tagInput.trim()) return;
    if (editingTagIndex !== null) {
      const updated = [...tags];
      updated[editingTagIndex] = tagInput.trim();
      setTags(updated);
      setEditingTagIndex(null);
    } else {
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
    }
    setTagInput('');
    setShowTagForm(false);
  };

  const handleEditTag = (index) => {
    setEditingTagIndex(index);
    setTagInput(tags[index]);
    setShowTagForm(true);
  };

  const handleDeleteTag = (index) => {
    if (window.confirm(`Delete tag "${tags[index]}"?`)) {
      setTags(tags.filter((_, idx) => idx !== index));
    }
  };

  // CATEGORY MANAGEMENT HANDLERS (No Popup, Direct View & Form)
  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!categoryInput.trim()) return;
    if (editingCategoryIndex !== null) {
      const updated = [...categories];
      updated[editingCategoryIndex] = categoryInput.trim();
      setCategories(updated);
      setEditingCategoryIndex(null);
    } else {
      if (!categories.includes(categoryInput.trim())) {
        setCategories([...categories, categoryInput.trim()]);
      }
    }
    setCategoryInput('');
    setShowCategoryForm(false);
  };

  const handleEditCategory = (index) => {
    setEditingCategoryIndex(index);
    setCategoryInput(categories[index]);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = (index) => {
    if (window.confirm(`Delete category "${categories[index]}"?`)) {
      setCategories(categories.filter((_, idx) => idx !== index));
    }
  };

  // Filtered Tags & Categories for Search
  const filteredTagsList = tags.filter(t => t.toLowerCase().includes(tagSearchTerm.toLowerCase()));
  const filteredCategoriesList = categories.filter(c => c.toLowerCase().includes(categorySearchTerm.toLowerCase()));

  return (
    <div className="blog-post-module">
      
      {/* 1. Header Bar matching View Mode */}
      {currentView === 'list' && (
        <div className="blog-post-header-bar">
          <div className="title-section">
            <h2 className="header-main-title" style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Blog Post</h2>
          </div>

          <div className="header-action-buttons">
            <button className="btn-coral-tag" onClick={() => { setCurrentView('tags'); setShowTagForm(false); }}>
              Add Tags
            </button>
            <button className="btn-peach-category" onClick={() => { setCurrentView('categories'); setShowCategoryForm(false); }}>
              Add Category
            </button>

            <button className="btn-vibrant-add" onClick={handleOpenAddForm}>
              <span className="plus-icon">+</span> Add
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 1: TABLE LIST VIEW
         ========================================================================= */}
      {currentView === 'list' && (
        <div className="blog-post-card-container">
          
          {/* Table Controls (Show entries & Search) */}
          <div className="table-controls-row">
            <div className="entries-selector-group">
              <label>Show</label>
              <select 
                value={entriesPerPage} 
                onChange={handleEntriesChange}
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
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="blog-post-table-wrapper">
            <table className="blog-post-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('sNo')} className="sortable-th" style={{ width: '70px', textAlign: 'center' }}>
                    S.No <span className="sort-arrows">↑↓</span>
                  </th>
                  <th onClick={() => handleSort('title')} className="sortable-th" style={{ textAlign: 'left' }}>
                    Title <span className="sort-arrows">↑↓</span>
                  </th>
                  <th onClick={() => handleSort('slug')} className="sortable-th" style={{ textAlign: 'left' }}>
                    Slug <span className="sort-arrows">↑↓</span>
                  </th>
                  <th onClick={() => handleSort('thumbnail')} className="sortable-th" style={{ width: '100px', textAlign: 'center' }}>
                    Thumbnail <span className="sort-arrows">↑↓</span>
                  </th>
                  <th onClick={() => handleSort('metaTitle')} className="sortable-th" style={{ textAlign: 'left' }}>
                    Meta Title <span className="sort-arrows">↑↓</span>
                  </th>
                  <th onClick={() => handleSort('metaDescription')} className="sortable-th" style={{ textAlign: 'left' }}>
                    Meta Description <span className="sort-arrows">↑↓</span>
                  </th>
                  <th className="action-th" style={{ width: '130px', textAlign: 'center' }}>
                    Action <span className="sort-arrows">↑↓</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentSlice.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="no-records-cell">
                      No matching blog posts found
                    </td>
                  </tr>
                ) : (
                  currentSlice.map((item) => (
                    <tr key={item.id}>
                      <td className="sno-cell" style={{ textAlign: 'center' }}>{item.sNo}</td>
                      <td className="title-cell" style={{ textAlign: 'left', fontWeight: 600, color: '#0f172a' }}>{item.title}</td>
                      <td className="slug-cell" style={{ textAlign: 'left' }}>{item.slug}</td>
                      <td className="thumbnail-cell" style={{ textAlign: 'center' }}>
                        <img src={item.thumbnail} alt={item.title} className="table-thumb-img" style={{ width: '48px', height: '38px', borderRadius: '6px', objectFit: 'cover' }} />
                      </td>
                      <td className="meta-title-cell" style={{ textAlign: 'left' }}>{item.metaTitle}</td>
                      <td className="meta-desc-cell" style={{ textAlign: 'left' }}>{item.metaDescription}</td>
                      <td className="action-cell" style={{ textAlign: 'center' }}>
                        <div className="action-btns-group" style={{ justifyContent: 'center' }}>
                          <button 
                            className="action-btn-circle view" 
                            onClick={() => setViewingArticle(item)}
                            title="View Post Details"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          <button 
                            className="action-btn-circle edit" 
                            onClick={() => handleEdit(item)}
                            title="Edit Post"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <button 
                            className="action-btn-circle delete" 
                            onClick={() => handleDelete(item.id)}
                            title="Delete Post"
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

          {/* Table Footer Pagination Row */}
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
      )}

      {/* =========================================================================
          VIEW MODE 2: INLINE ADD / EDIT ARTICLE FORM VIEW
         ========================================================================= */}
      {currentView === 'form' && (
        <div className="blog-post-card-container inline-form-container">
          
          <div className="inline-form-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="form-title-heading">
              {editingArticle ? `Edit Blog Post (#${editingArticle.sNo})` : 'Add New Blog Post'}
            </h3>
            <button className="btn-dark-navy-back" onClick={() => setCurrentView('list')}>
              Back
            </button>
          </div>

          <form onSubmit={handleSubmitArticle} className="modal-form blog-post-full-form">
            
            {/* Row 1: Category & Author */}
            <div className="form-row-2col">
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Author *</label>
                <input
                  type="text"
                  placeholder="e.g. UKL Media Team"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Row 2: Title */}
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                placeholder="Enter blog post title..."
                value={formData.title}
                onChange={handleTitleChange}
                required
              />
            </div>

            {/* Row 3: Slug & Blog Date */}
            <div className="form-row-2col">
              <div className="form-group">
                <label>Slug *</label>
                <input
                  type="text"
                  placeholder="e.g. ukl-expands-frp-vessel-capacity"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Blog Date (dd-mm-yyyy) *</label>
                <input
                  type="date"
                  value={formData.blogDate}
                  onChange={(e) => setFormData({ ...formData, blogDate: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Row 4: Thumbnail File Input */}
            <div className="form-group">
              <label>Thumbnail *</label>
              <div className="custom-file-upload-box">
                <input
                  type="file"
                  id="inlineThumbnailFileInput"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden-file-input"
                />
                <label htmlFor="inlineThumbnailFileInput" className="btn-choose-file">
                  Choose File
                </label>
                <span className="file-name-label">{formData.thumbnailFileName}</span>
                {formData.thumbnail && (
                  <img src={formData.thumbnail} alt="Preview" className="file-thumb-preview" />
                )}
              </div>
            </div>

            {/* Row 5: Meta Title & Meta Keyword */}
            <div className="form-row-2col">
              <div className="form-group">
                <label>Meta Title *</label>
                <input
                  type="text"
                  placeholder="SEO Meta Title..."
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Meta Keyword *</label>
                <input
                  type="text"
                  placeholder="e.g. FRP Vessels, RO Plant, Water Treatment"
                  value={formData.metaKeyword}
                  onChange={(e) => setFormData({ ...formData, metaKeyword: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Row 6: Meta Description */}
            <div className="form-group">
              <label>Meta Description *</label>
              <textarea
                rows="2"
                placeholder="Enter SEO meta description summary..."
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                required
              />
            </div>

            {/* Row 7: Blog Short Description */}
            <div className="form-group">
              <label>Blog Short Description *</label>
              <textarea
                rows="2"
                placeholder="Enter a short excerpt for list views..."
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                required
              />
            </div>

            {/* Row 8: Blog Details */}
            <div className="form-group">
              <label>Blog Details *</label>
              <div className="wysiwyg-editor-box">
                <div className="wysiwyg-menubar">
                  <span>File</span>
                  <span>Edit</span>
                  <span>Insert</span>
                  <span>View</span>
                  <span>Format</span>
                  <span>Table</span>
                  <span>Tools</span>
                </div>

                <div className="wysiwyg-toolbar">
                  <button type="button" className="toolbar-btn bold" title="Bold">B</button>
                  <button type="button" className="toolbar-btn italic" title="Italic">I</button>
                  <button type="button" className="toolbar-btn underline" title="Underline">U</button>
                  <div className="toolbar-separator"></div>
                  <span className="toolbar-dropdown-label">Formats ▾</span>
                  <div className="toolbar-separator"></div>
                  <button type="button" className="toolbar-btn" title="Align Left">≡</button>
                  <button type="button" className="toolbar-btn" title="Link">🔗</button>
                  <button type="button" className="toolbar-btn" title="Insert Image">📷</button>
                  <button type="button" className="toolbar-btn" title="Table">⊞</button>
                </div>

                <textarea
                  rows="7"
                  placeholder="Write your full blog post content here..."
                  className="wysiwyg-textarea"
                  value={formData.blogDetails}
                  onChange={(e) => setFormData({ ...formData, blogDetails: e.target.value })}
                  required
                />

                <div className="wysiwyg-footer-statusbar">
                  <span className="word-count-text">pWords: {calculateWordCount(formData.blogDetails)}</span>
                </div>
              </div>
            </div>

            {/* Row 9: Tag List */}
            <div className="form-group">
              <label>Tag List</label>
              <div className="tag-checkboxes-grid">
                {tags.map(tag => {
                  const isChecked = (formData.tagList || []).includes(tag);
                  return (
                    <label key={tag} className={`tag-checkbox-pill ${isChecked ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTagToggle(tag)}
                      />
                      <span>#{tag}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Row 10: Toggles */}
            <div className="form-row-2col toggle-switches-row">
              <div className="checkbox-toggle-card">
                <input
                  type="checkbox"
                  id="addMostReadCheckInline"
                  checked={formData.addMostRead}
                  onChange={(e) => setFormData({ ...formData, addMostRead: e.target.checked })}
                />
                <label htmlFor="addMostReadCheckInline">Add Most Read?</label>
              </div>

              <div className="checkbox-toggle-card">
                <input
                  type="checkbox"
                  id="latestArticlesCheckInline"
                  checked={formData.latestArticles}
                  onChange={(e) => setFormData({ ...formData, latestArticles: e.target.checked })}
                />
                <label htmlFor="latestArticlesCheckInline">Latest Articles</label>
              </div>
            </div>

            {/* Form Action Buttons */}
            <div className="modal-actions form-bottom-actions">
              <button type="button" className="btn-dark-navy-back" onClick={() => setCurrentView('list')}>
                Back
              </button>
              <button type="submit" className="btn-vibrant-add">
                {editingArticle ? 'Update Blog Post' : '+ Save Blog Post'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 3: TAGS MANAGEMENT PAGE VIEW (MATCHING EXACT USER SCREENSHOT)
         ========================================================================= */}
      {currentView === 'tags' && (
        <div>
          {/* Header Bar matching User Screenshot */}
          <div className="blog-post-header-bar" style={{ marginBottom: '18px' }}>
            <div className="title-section">
              <h2 className="header-main-title" style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Tags Add</h2>
            </div>

            <div className="header-action-buttons">
              <button 
                className="btn-green-add-tag" 
                onClick={() => {
                  setEditingTagIndex(null);
                  setTagInput('');
                  setShowTagForm(true);
                }}
              >
                Add New Tag
              </button>

              <button className="btn-dark-navy-back" onClick={() => setCurrentView('list')}>
                Back
              </button>
            </div>
          </div>

          {/* Inline Add / Edit Tag Form Card */}
          {showTagForm && (
            <div className="blog-post-card-container inline-form-container" style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 14px 0', color: '#0f172a', fontWeight: 800 }}>
                {editingTagIndex !== null ? 'Edit Tag' : 'Create New Tag'}
              </h4>
              <form onSubmit={handleSaveTag} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="text"
                  className="search-input-field"
                  placeholder="Enter tag name (e.g. Latest Articles)..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  style={{ flex: 1, height: '42px', fontSize: '14px' }}
                  required
                />
                <button type="button" className="btn-cancel-outline" onClick={() => setShowTagForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-green-add-tag">
                  {editingTagIndex !== null ? 'Update Tag' : 'Save Tag'}
                </button>
              </form>
            </div>
          )}

          {/* Tags Table Container Box (Matching Screenshot) */}
          <div className="blog-post-card-container">
            
            {/* Table Controls (Show entries & Search) */}
            <div className="table-controls-row">
              <div className="entries-selector-group">
                <label>Show</label>
                <select className="entries-select-dropdown">
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
                  value={tagSearchTerm}
                  onChange={(e) => setTagSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Tags Data Table */}
            <div className="blog-post-table-wrapper">
              <table className="blog-post-table tags-table-styled">
                <thead>
                  <tr>
                    <th style={{ width: '80px', textAlign: 'center' }}>
                      S.No <span className="sort-arrows">↑↓</span>
                    </th>
                    <th style={{ textAlign: 'left' }}>
                      Tag <span className="sort-arrows">↑↓</span>
                    </th>
                    <th style={{ width: '130px', textAlign: 'center' }}>
                      Action <span className="sort-arrows">↑↓</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTagsList.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="no-records-cell" style={{ textAlign: 'center' }}>
                        No tags found
                      </td>
                    </tr>
                  ) : (
                    filteredTagsList.map((tag, idx) => (
                      <tr key={tag}>
                        <td className="sno-cell" style={{ textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ textAlign: 'left', fontWeight: 600, color: '#0f172a' }}>{tag}</td>
                        <td className="action-cell" style={{ textAlign: 'center' }}>
                          <div className="action-btns-group" style={{ justifyContent: 'center' }}>
                            <button 
                              className="action-btn-circle edit" 
                              onClick={() => handleEditTag(tags.indexOf(tag))}
                              title="Edit Tag"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                            <button 
                              className="action-btn-circle delete" 
                              onClick={() => handleDeleteTag(tags.indexOf(tag))}
                              title="Delete Tag"
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

            {/* Table Footer Pagination Row */}
            <div className="table-footer-pagination-row">
              <div className="pagination-info-text">
                Showing 1 to {filteredTagsList.length} of {filteredTagsList.length} entries
              </div>

              <div className="pagination-controls-box">
                <button className="page-nav-btn" disabled>
                  Prev
                </button>

                <button className="page-nav-btn red-active">
                  1
                </button>

                <button className="page-nav-btn" disabled>
                  Next
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 4: CATEGORY MANAGEMENT PAGE VIEW (NO POPUP)
         ========================================================================= */}
      {currentView === 'categories' && (
        <div>
          {/* Header Bar */}
          <div className="blog-post-header-bar" style={{ marginBottom: '18px' }}>
            <div className="title-section">
              <h2 className="header-main-title" style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Category Add</h2>
            </div>

            <div className="header-action-buttons">
              <button 
                className="btn-green-add-tag" 
                onClick={() => {
                  setEditingCategoryIndex(null);
                  setCategoryInput('');
                  setShowCategoryForm(true);
                }}
              >
                Add New Category
              </button>

              <button className="btn-dark-navy-back" onClick={() => setCurrentView('list')}>
                Back
              </button>
            </div>
          </div>

          {/* Inline Add / Edit Category Form Card */}
          {showCategoryForm && (
            <div className="blog-post-card-container inline-form-container" style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 14px 0', color: '#0f172a', fontWeight: 800 }}>
                {editingCategoryIndex !== null ? 'Edit Category' : 'Create New Category'}
              </h4>
              <form onSubmit={handleSaveCategory} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="text"
                  className="search-input-field"
                  placeholder="Enter category name (e.g. Product Announcements)..."
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  style={{ flex: 1, height: '42px', fontSize: '14px' }}
                  required
                />
                <button type="button" className="btn-cancel-outline" onClick={() => setShowCategoryForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-green-add-tag">
                  {editingCategoryIndex !== null ? 'Update Category' : 'Save Category'}
                </button>
              </form>
            </div>
          )}

          {/* Categories Table Container Box */}
          <div className="blog-post-card-container">
            
            {/* Table Controls */}
            <div className="table-controls-row">
              <div className="entries-selector-group">
                <label>Show</label>
                <select className="entries-select-dropdown">
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
                  value={categorySearchTerm}
                  onChange={(e) => setCategorySearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Categories Data Table */}
            <div className="blog-post-table-wrapper">
              <table className="blog-post-table tags-table-styled">
                <thead>
                  <tr>
                    <th style={{ width: '80px', textAlign: 'center' }}>
                      S.No <span className="sort-arrows">↑↓</span>
                    </th>
                    <th style={{ textAlign: 'left' }}>
                      Category <span className="sort-arrows">↑↓</span>
                    </th>
                    <th style={{ width: '130px', textAlign: 'center' }}>
                      Action <span className="sort-arrows">↑↓</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategoriesList.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="no-records-cell" style={{ textAlign: 'center' }}>
                        No categories found
                      </td>
                    </tr>
                  ) : (
                    filteredCategoriesList.map((cat, idx) => (
                      <tr key={cat}>
                        <td className="sno-cell" style={{ textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ textAlign: 'left', fontWeight: 600, color: '#0f172a' }}>{cat}</td>
                        <td className="action-cell" style={{ textAlign: 'center' }}>
                          <div className="action-btns-group" style={{ justifyContent: 'center' }}>
                            <button 
                              className="action-btn-circle edit" 
                              onClick={() => handleEditCategory(categories.indexOf(cat))}
                              title="Edit Category"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                            <button 
                              className="action-btn-circle delete" 
                              onClick={() => handleDeleteCategory(categories.indexOf(cat))}
                              title="Delete Category"
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
                Showing 1 to {filteredCategoriesList.length} of {filteredCategoriesList.length} entries
              </div>

              <div className="pagination-controls-box">
                <button className="page-nav-btn" disabled>
                  Prev
                </button>

                <button className="page-nav-btn red-active">
                  1
                </button>

                <button className="page-nav-btn" disabled>
                  Next
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          READ-ONLY VIEW ARTICLE MODAL (Triggered by Eye 👁️ button)
         ========================================================================= */}
      {viewingArticle && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>Blog Post Details</h3>
              <button className="collapse-btn" onClick={() => setViewingArticle(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <img 
                src={viewingArticle.thumbnail} 
                alt={viewingArticle.title} 
                style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }} 
              />

              <div>
                <span className="category-pill-item">{viewingArticle.category}</span>
                <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '10px' }}>By {viewingArticle.author} on {viewingArticle.blogDate}</span>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Title:</span>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{viewingArticle.title}</h4>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Slug:</span>
                <p style={{ fontSize: '13px', color: '#004dad', fontFamily: 'monospace', marginTop: '2px' }}>{viewingArticle.slug}</p>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Meta Title:</span>
                <p style={{ fontSize: '13.5px', color: '#334155', marginTop: '2px' }}>{viewingArticle.metaTitle}</p>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Meta Description:</span>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', lineHeight: 1.5 }}>{viewingArticle.metaDescription}</p>
              </div>

              <div className="modal-actions" style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="btn-dark-navy-back" onClick={() => setViewingArticle(null)}>
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn-vibrant-add"
                  onClick={() => {
                    handleEdit(viewingArticle);
                    setViewingArticle(null);
                  }}
                >
                  Edit Article
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

export default AdminNews;

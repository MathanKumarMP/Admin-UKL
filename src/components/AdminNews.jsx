import React, { useState, useRef, useEffect } from 'react';
import { API_BASE } from '../config';
import newsImg1 from '../assets/blog1.JPG';
import newsImg2 from '../assets/Explore1.png';

const AdminNews = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
  
  // Tag / Category Management State
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [showTagForm, setShowTagForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [editingTagIndex, setEditingTagIndex] = useState(null);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(null);

  // Store raw uploaded file
  const [selectedFile, setSelectedFile] = useState(null);

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

  // Fetch articles from backend API
  const fetchArticles = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/news?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const mapped = data.articles.map((item, index) => ({
          id: item._id,
          sNo: index + 1,
          title: item.title,
          slug: item.slug,
          thumbnail: item.thumbnail ? (item.thumbnail.startsWith('http') ? item.thumbnail : `${API_BASE}${item.thumbnail}`) : newsImg1,
          metaTitle: item.metaTitle || '',
          metaDescription: item.metaDescription || '',
          metaKeyword: item.metaKeyword || '',
          blogDate: item.blogDate ? new Date(item.blogDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          shortDescription: item.shortDescription || '',
          blogDetails: item.blogDetails || '',
          category: item.category || 'Company News',
          tagList: item.tagList || ['FRP Vessels'],
          addMostRead: item.addMostRead || false,
          latestArticles: item.latestArticles !== undefined ? item.latestArticles : true,
          author: item.author || 'UKL Media Team',
          status: item.status || 'Active'
        }));
        setArticles(mapped);
      } else {
        setErrorMsg(data.message || 'Failed to fetch news articles.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

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
      setSelectedFile(file);
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
      (item.title && item.title.toLowerCase().includes(term)) ||
      (item.slug && item.slug.toLowerCase().includes(term)) ||
      (item.metaTitle && item.metaTitle.toLowerCase().includes(term)) ||
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

  // Pagination Calculations
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

  const editorRef = useRef(null);

  const handleExecCommand = (command, value = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    setFormData(prev => ({ ...prev, blogDetails: editorRef.current.innerHTML }));
  };

  useEffect(() => {
    if (currentView === 'form' && editorRef.current) {
      if (editorRef.current.innerHTML !== formData.blogDetails) {
        editorRef.current.innerHTML = formData.blogDetails || '';
      }
    }
  }, [currentView, editingArticle]);

  // Calculate live word count
  const calculateWordCount = (text) => {
    if (!text || !text.trim()) return 0;
    const cleanText = text.replace(/<[^>]*>?/gm, '');
    return cleanText.trim().split(/\s+/).filter(Boolean).length;
  };

  // Save new or updated article
  const handleSubmitArticle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('adminToken');
      const bodyFormData = new FormData();
      bodyFormData.append('category', formData.category);
      bodyFormData.append('title', formData.title);
      bodyFormData.append('slug', formData.slug.toLowerCase());
      bodyFormData.append('metaTitle', formData.metaTitle);
      bodyFormData.append('metaDescription', formData.metaDescription);
      bodyFormData.append('metaKeyword', formData.metaKeyword);
      bodyFormData.append('blogDate', formData.blogDate);
      bodyFormData.append('shortDescription', formData.shortDescription);
      bodyFormData.append('blogDetails', formData.blogDetails);
      bodyFormData.append('addMostRead', formData.addMostRead ? 'true' : 'false');
      bodyFormData.append('latestArticles', formData.latestArticles ? 'true' : 'false');
      bodyFormData.append('author', formData.author);
      bodyFormData.append('status', formData.status);

      if (selectedFile) {
        bodyFormData.append('thumbnail', selectedFile);
      }

      let url = `${API_BASE}/api/admin/news`;
      let method = 'POST';

      if (editingArticle) {
        url = `${API_BASE}/api/admin/news/${editingArticle.id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: bodyFormData
      });

      const data = await response.json();
      if (data.success) {
        setCurrentView('list');
        setEditingArticle(null);
        setSelectedFile(null);
        setFormData(defaultFormData);
        fetchArticles();
      } else {
        setErrorMsg(data.message || 'Failed to save news article.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to connect to backend server during save.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddForm = () => {
    setFormData(defaultFormData);
    setSelectedFile(null);
    setEditingArticle(null);
    setCurrentView('form');
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setSelectedFile(null);
    setFormData({
      ...defaultFormData,
      ...article,
      thumbnailFileName: 'Current Stored Thumbnail'
    });
    setCurrentView('form');
  };

  const [deletingArticleId, setDeletingArticleId] = useState(null);
  const [deletingTagIdx, setDeletingTagIdx] = useState(null);
  const [deletingCatIdx, setDeletingCatIdx] = useState(null);

  const handleDelete = (id) => {
    setDeletingArticleId(id);
  };

  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/news/${deletingArticleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setDeletingArticleId(null);
        fetchArticles();
      } else {
        alert(data.message || 'Failed to delete news article.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server for deletion.');
    }
  };

  // TAG MANAGEMENT HANDLERS (Local State)
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
    setDeletingTagIdx(index);
  };

  // CATEGORY MANAGEMENT HANDLERS (Local State)
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
    setDeletingCatIdx(index);
  };

  // Filtered Tags & Categories for Search
  const filteredTagsList = tags.filter(t => t.toLowerCase().includes(tagSearchTerm.toLowerCase()));
  const filteredCategoriesList = categories.filter(c => c.toLowerCase().includes(categorySearchTerm.toLowerCase()));

  return (
    <div className="blog-post-module">
      
      {/* Header Bar matching View Mode */}
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

      {errorMsg && <div className="login-error-alert" style={{ margin: '15px 0' }}>{errorMsg}</div>}

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
                {loading && articles.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="no-records-cell">
                      Loading news articles from database...
                    </td>
                  </tr>
                ) : currentSlice.length === 0 ? (
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
          VIEW MODE 2: INLINE ADD / EDIT FULL FORM VIEW
         ========================================================================= */}
      {currentView === 'form' && (
        <div className="blog-post-card-container inline-form-container">
          <div className="inline-form-header">
            <h3 className="form-title-heading">
              {editingArticle ? 'Edit News Article' : 'Create News Article'}
            </h3>
            <button className="btn-secondary-dark" onClick={() => setCurrentView('list')}>
              ← Back to List
            </button>
          </div>

          <form onSubmit={handleSubmitArticle} className="modal-form blog-post-full-form">
            <div className="form-fields-main-layout">
              {/* Left Column: Form Fields */}
              <div className="form-main-fields-col">
                
                {/* Title */}
                <div className="form-group">
                  <label>Title <span className="req-star">*</span></label>
                  <input 
                    type="text"
                    placeholder="Enter blog post title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    required
                  />
                </div>

                {/* Slug */}
                <div className="form-group">
                  <label>Slug <span className="req-star">*</span></label>
                  <input 
                    type="text"
                    placeholder="auto-generated-slug-path"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>

                {/* Word Processor Toolbar for blog details */}
                <div className="form-group">
                  <label>Description / Details <span className="req-star">*</span></label>
                  <div className="text-editor-rich-toolbar">
                    <button type="button" onClick={() => handleExecCommand('bold')} title="Bold"><b>B</b></button>
                    <button type="button" onClick={() => handleExecCommand('italic')} title="Italic"><i>I</i></button>
                    <button type="button" onClick={() => handleExecCommand('underline')} title="Underline"><u>U</u></button>
                    <button type="button" onClick={() => handleExecCommand('justifyLeft')} title="Align Left">←</button>
                    <button type="button" onClick={() => handleExecCommand('justifyCenter')} title="Align Center">↔</button>
                    <button type="button" onClick={() => handleExecCommand('justifyRight')} title="Align Right">→</button>
                    <button type="button" onClick={() => handleExecCommand('insertOrderedList')} title="Numbered List">1.</button>
                    <button type="button" onClick={() => handleExecCommand('insertUnorderedList')} title="Bullet List">•</button>
                    <button type="button" onClick={() => {
                      const link = prompt('Enter URL:');
                      if (link) handleExecCommand('createLink', link);
                    }} title="Insert Link">🔗</button>
                  </div>
                  
                  {/* Rich Text Editor Container */}
                  <div 
                    ref={editorRef}
                    className="content-editable-rich-editor"
                    contentEditable
                    placeholder="Write article details here..."
                    onInput={(e) => setFormData({ ...formData, blogDetails: e.currentTarget.innerHTML })}
                    style={{ minHeight: '220px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#fff', outline: 'none' }}
                  ></div>
                  
                  <div className="editor-word-count-bar">
                    Word Count: {calculateWordCount(formData.blogDetails)} words
                  </div>
                </div>

                {/* Meta Settings (Seo Optimization fields) */}
                <fieldset className="seo-meta-fieldset">
                  <legend>SEO Settings</legend>
                  
                  <div className="form-group">
                    <label>Meta Title</label>
                    <input 
                      type="text"
                      placeholder="SEO optimized browser title"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Meta Keywords</label>
                    <input 
                      type="text"
                      placeholder="Comma-separated keywords"
                      value={formData.metaKeyword}
                      onChange={(e) => setFormData({ ...formData, metaKeyword: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Meta Description</label>
                    <textarea 
                      placeholder="Brief search engine description (150-160 characters)"
                      rows="3"
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    ></textarea>
                  </div>
                </fieldset>

              </div>

              {/* Right Column: Meta Settings (Date, Category, Tag list, Status, Thumbnail) */}
              <div className="form-meta-settings-col">
                
                {/* Thumbnail upload box */}
                <div className="form-group">
                  <label>Thumbnail Image <span className="req-star">*</span></label>
                  <div className="thumbnail-upload-dropzone">
                    <div className="dropzone-media-preview-container">
                      <img src={formData.thumbnail} alt="Upload preview" className="dropzone-preview-img" />
                    </div>
                    <div className="dropzone-controls">
                      <input 
                        type="file" 
                        id="newsThumbnailFile" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden-file-input"
                      />
                      <label htmlFor="newsThumbnailFile" className="btn-choose-file-tag">
                        Upload Thumbnail
                      </label>
                      <span className="file-name-indicator-span">{formData.thumbnailFileName}</span>
                    </div>
                  </div>
                </div>

                {/* Short Description */}
                <div className="form-group">
                  <label>Short Summary / Hook <span className="req-star">*</span></label>
                  <textarea 
                    placeholder="Short description displayed on card"
                    rows="3"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    required
                  ></textarea>
                </div>

                {/* Date & Author */}
                <div className="form-group">
                  <label>Publish Date</label>
                  <input 
                    type="date"
                    value={formData.blogDate}
                    onChange={(e) => setFormData({ ...formData, blogDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Author</label>
                  <input 
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  />
                </div>

                {/* Category selection */}
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Tags checkbox selection */}
                <div className="form-group">
                  <label>Tags Selection</label>
                  <div className="tags-checkbox-multi-grid">
                    {tags.map((tag, idx) => {
                      const isChecked = formData.tagList ? formData.tagList.includes(tag) : false;
                      return (
                        <label key={idx} className="checkbox-pill-label">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTagToggle(tag)}
                          />
                          <span>{tag}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Switches / Checkboxes */}
                <div className="form-group inline-switches-group">
                  <label className="switch-container-label">
                    <input 
                      type="checkbox"
                      checked={formData.addMostRead}
                      onChange={(e) => setFormData({ ...formData, addMostRead: e.target.checked })}
                    />
                    <span className="slider-switch-span"></span>
                    <span className="switch-text-label">Pin to "Most Read"</span>
                  </label>

                  <label className="switch-container-label">
                    <input 
                      type="checkbox"
                      checked={formData.latestArticles}
                      onChange={(e) => setFormData({ ...formData, latestArticles: e.target.checked })}
                    />
                    <span className="slider-switch-span"></span>
                    <span className="switch-text-label">Mark as "Latest Article"</span>
                  </label>
                </div>

                {/* Status selection */}
                <div className="form-group">
                  <label>Publish Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active / Published</option>
                    <option value="Inactive">Inactive / Draft</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Save / Cancel buttons bar */}
            <div className="modal-actions form-actions-sticky-bar">
              <button type="button" className="btn-cancel-outline" onClick={() => setCurrentView('list')} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn-save-banner-filled" disabled={loading}>
                {loading ? 'Saving Article...' : 'Publish Article'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 3: TAGS MANAGEMENT SCREEN
         ========================================================================= */}
      {currentView === 'tags' && (
        <div className="blog-post-card-container inline-form-container tags-categories-box-card">
          <div className="inline-form-header">
            <h3 className="form-title-heading">Manage Tags</h3>
            <button className="btn-secondary-dark" onClick={() => setCurrentView('list')}>
              ← Back to List
            </button>
          </div>

          {/* Inline Add / Edit tag form */}
          <div className="quick-add-item-bar" style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <form onSubmit={handleSaveTag} style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                className="search-input-field" 
                placeholder="Enter tag name (e.g. RO Vessels)" 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                style={{ flex: 1, margin: 0 }}
                required
              />
              <button type="submit" className="btn-vibrant-add" style={{ padding: '8px 24px', fontSize: '13px' }}>
                {editingTagIndex !== null ? 'Update Tag' : 'Add Tag'}
              </button>
              {showTagForm && (
                <button type="button" className="btn-cancel-outline" onClick={() => { setTagInput(''); setEditingTagIndex(null); setShowTagForm(false); }} style={{ padding: '8px 16px', margin: 0 }}>
                  Cancel
                </button>
              )}
            </form>
          </div>

          {/* Search bar inside Tag Management */}
          <div className="table-controls-row" style={{ marginBottom: '16px' }}>
            <div className="table-search-group" style={{ width: '100%' }}>
              <label>Search Tags:</label>
              <input 
                type="text" 
                className="search-input-field" 
                placeholder="Filter tag name..."
                value={tagSearchTerm}
                onChange={(e) => setTagSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Tags Table */}
          <div className="blog-post-table-wrapper">
            <table className="blog-post-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>S.No</th>
                  <th style={{ textAlign: 'left' }}>Tag Name</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTagsList.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="no-records-cell" style={{ textAlign: 'center' }}>
                      No tags found.
                    </td>
                  </tr>
                ) : (
                  filteredTagsList.map((tag, index) => {
                    const originalIdx = tags.indexOf(tag);
                    return (
                      <tr key={index}>
                        <td style={{ textAlign: 'center' }}>{index + 1}</td>
                        <td style={{ textAlign: 'left', fontWeight: 'bold', color: '#0f172a' }}>{tag}</td>
                        <td className="action-cell" style={{ textAlign: 'center' }}>
                          <div className="action-btns-group" style={{ justifyContent: 'center' }}>
                            <button className="action-btn-circle edit" onClick={() => handleEditTag(originalIdx)} title="Edit Tag">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                            <button className="action-btn-circle delete" onClick={() => handleDeleteTag(originalIdx)} title="Delete Tag">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2" /></svg>
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
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 4: CATEGORIES MANAGEMENT SCREEN
         ========================================================================= */}
      {currentView === 'categories' && (
        <div className="blog-post-card-container inline-form-container tags-categories-box-card">
          <div className="inline-form-header">
            <h3 className="form-title-heading">Manage Categories</h3>
            <button className="btn-secondary-dark" onClick={() => setCurrentView('list')}>
              ← Back to List
            </button>
          </div>

          {/* Inline Add / Edit Category Form */}
          <div className="quick-add-item-bar" style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <form onSubmit={handleSaveCategory} style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                className="search-input-field" 
                placeholder="Enter category name (e.g. Press Release)" 
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                style={{ flex: 1, margin: 0 }}
                required
              />
              <button type="submit" className="btn-vibrant-add" style={{ padding: '8px 24px', fontSize: '13px' }}>
                {editingCategoryIndex !== null ? 'Update Category' : 'Add Category'}
              </button>
              {showCategoryForm && (
                <button type="button" className="btn-cancel-outline" onClick={() => { setCategoryInput(''); setEditingCategoryIndex(null); setShowCategoryForm(false); }} style={{ padding: '8px 16px', margin: 0 }}>
                  Cancel
                </button>
              )}
            </form>
          </div>

          {/* Search bar inside category management */}
          <div className="table-controls-row" style={{ marginBottom: '16px' }}>
            <div className="table-search-group" style={{ width: '100%' }}>
              <label>Search Categories:</label>
              <input 
                type="text" 
                className="search-input-field" 
                placeholder="Filter category name..."
                value={categorySearchTerm}
                onChange={(e) => setCategorySearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Categories Table */}
          <div className="blog-post-table-wrapper">
            <table className="blog-post-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>S.No</th>
                  <th style={{ textAlign: 'left' }}>Category Name</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategoriesList.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="no-records-cell" style={{ textAlign: 'center' }}>
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  filteredCategoriesList.map((cat, index) => {
                    const originalIdx = categories.indexOf(cat);
                    return (
                      <tr key={index}>
                        <td style={{ textAlign: 'center' }}>{index + 1}</td>
                        <td style={{ textAlign: 'left', fontWeight: 'bold', color: '#0f172a' }}>{cat}</td>
                        <td className="action-cell" style={{ textAlign: 'center' }}>
                          <div className="action-btns-group" style={{ justifyContent: 'center' }}>
                            <button className="action-btn-circle edit" onClick={() => handleEditCategory(originalIdx)} title="Edit Category">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                            <button className="action-btn-circle delete" onClick={() => handleDeleteCategory(originalIdx)} title="Delete Category">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2" /></svg>
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
        </div>
      )}

      {/* =========================================================================
          VIEW ARTICLE DETAILS POPUP MODAL
         ========================================================================= */}
      {viewingArticle && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>Blog Post Details</h3>
              <button className="collapse-btn" onClick={() => setViewingArticle(null)}>✕</button>
            </div>

            <div className="slideshow-giant-window" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', height: '240px', marginBottom: '16px' }}>
              <img src={viewingArticle.thumbnail} alt={viewingArticle.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Publish Date:</span>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{viewingArticle.blogDate}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Category:</span>
                  <div style={{ fontWeight: 700, color: '#004dad' }}>{viewingArticle.category}</div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Title:</span>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0' }}>{viewingArticle.title}</h4>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Short Description:</span>
                <p style={{ color: '#475569', lineHeight: 1.5, margin: '2px 0 0 0' }}>{viewingArticle.shortDescription}</p>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>HTML Content preview:</span>
                <div 
                  style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155', height: '150px', overflowY: 'auto', lineHeight: '1.6', margin: '2px 0 0 0' }}
                  dangerouslySetInnerHTML={{ __html: viewingArticle.blogDetails }}
                ></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Author:</span>
                  <div style={{ fontWeight: 700 }}>{viewingArticle.author}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Publish Status:</span>
                  <div style={{ marginTop: '2px' }}>
                    <span className={`status-pill ${viewingArticle.status === 'Active' ? 'published' : 'inactive'}`}>
                      {viewingArticle.status === 'Active' ? '● Active' : '○ Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9', marginTop: '16px' }}>
              <button type="button" className="btn-secondary-dark" onClick={() => setViewingArticle(null)}>
                Close
              </button>
              <button 
                type="button" 
                className="btn-save-banner-filled"
                onClick={() => {
                  handleEdit(viewingArticle);
                  setViewingArticle(null);
                }}
              >
                Edit Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION POPUP MODAL (ARTICLES) */}
      {deletingArticleId && (
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
              Are you sure you want to delete this blog post? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn-cancel-outline" 
                onClick={() => setDeletingArticleId(null)}
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

      {/* CUSTOM DELETE CONFIRMATION POPUP MODAL (TAGS) */}
      {deletingTagIdx !== null && (
        <div className="admin-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="admin-modal" style={{ maxWidth: '420px', padding: '28px 24px', textAlign: 'center', borderRadius: '16px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', border: '1px solid #fee2e2' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Delete Tag</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Are you sure you want to delete tag "{tags[deletingTagIdx]}"?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" className="btn-cancel-outline" onClick={() => setDeletingTagIdx(null)} style={{ flex: 1, padding: '10px 16px' }}>Cancel</button>
              <button type="button" onClick={() => { setTags(tags.filter((_, idx) => idx !== deletingTagIdx)); setDeletingTagIdx(null); }} style={{ flex: 1, padding: '10px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700 }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION POPUP MODAL (CATEGORIES) */}
      {deletingCatIdx !== null && (
        <div className="admin-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="admin-modal" style={{ maxWidth: '420px', padding: '28px 24px', textAlign: 'center', borderRadius: '16px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', border: '1px solid #fee2e2' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Delete Category</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Are you sure you want to delete category "{categories[deletingCatIdx]}"?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" className="btn-cancel-outline" onClick={() => setDeletingCatIdx(null)} style={{ flex: 1, padding: '10px 16px' }}>Cancel</button>
              <button type="button" onClick={() => { setCategories(categories.filter((_, idx) => idx !== deletingCatIdx)); setDeletingCatIdx(null); }} style={{ flex: 1, padding: '10px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700 }}>Delete</button>
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

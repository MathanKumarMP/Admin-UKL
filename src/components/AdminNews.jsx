import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { API_BASE } from '../config';
import ToastNotification from './ToastNotification';
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
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  
  // Tag / Category Management State
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [showTagForm, setShowTagForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [editingTagIndex, setEditingTagIndex] = useState(null);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState(null);
  const [deletingTagIdx, setDeletingTagIdx] = useState(null);
  const [deletingCatIdx, setDeletingCatIdx] = useState(null);

  // Store raw uploaded file
  const [selectedFile, setSelectedFile] = useState(null);

  // Default Form State with all requested fields (empty defaults)
  const defaultFormData = {
    category: '',
    title: '',
    slug: '',
    thumbnail: '',
    thumbnailFileName: 'No file chosen',
    metaTitle: '',
    metaDescription: '',
    metaKeyword: '',
    blogDate: new Date().toISOString().split('T')[0],
    shortDescription: '',
    blogDetails: '',
    addMostRead: false,
    tagList: [],
    latestArticles: false,
    author: '',
    status: 'Active',
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

  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch articles from backend API with pagination & search
  const fetchArticles = async (page = currentPage, limit = entriesPerPage, search = searchTerm) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('adminToken');
      const queryParams = new URLSearchParams({
        page: page,
        limit: limit,
        search: search
      });
      const response = await fetch(`${API_BASE}/api/admin/news?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.articles)) {
        const startNo = ((data.page || page) - 1) * limit;
        const mapped = data.articles.map((item, index) => ({
          id: item._id || String(index + 1),
          sNo: startNo + index + 1,
          title: item.title || '',
          slug: item.slug || '',
          thumbnail: item.thumbnail ? (item.thumbnail.startsWith('http') || item.thumbnail.startsWith('data:') ? item.thumbnail : `${API_BASE}${item.thumbnail.startsWith('/') ? '' : '/'}${item.thumbnail}`) : newsImg1,
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
        setTotalEntries(data.total !== undefined ? data.total : mapped.length);
        setTotalPages(data.totalPages !== undefined ? data.totalPages : (Math.ceil((data.total || mapped.length) / limit) || 1));
      } else {
        setArticles([]);
        setTotalEntries(0);
        setTotalPages(1);
        showToast(data?.message || 'Network Error', 'error');
      }
    } catch (err) {
      console.error(err);
      setArticles([]);
      showToast('Network Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Tags from Backend API with search support (?search=)
  const fetchTags = async (search = tagSearchTerm) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/tags?search=${encodeURIComponent(search)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.tags)) {
        setTags(data.tags);
      }
    } catch (err) {
      console.log('Error fetching tags from API, using fallback');
    }
  };

  // Fetch Categories from Backend API with search support (?search=)
  const fetchCategories = async (search = categorySearchTerm) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/admin/categories?search=${encodeURIComponent(search)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.log('Error fetching categories from API, using fallback');
    }
  };

  useEffect(() => {
    fetchArticles(currentPage, entriesPerPage, searchTerm);
  }, [currentPage, entriesPerPage, searchTerm]);

  const setPersistedView = (view, editId = null) => {
    setCurrentView(view);
    const url = new URL(window.location);
    if (view === 'form') {
      sessionStorage.setItem('admin_news_view', 'form');
      url.searchParams.set('view', 'form');
      if (editId) {
        sessionStorage.setItem('admin_news_edit_id', editId);
        url.searchParams.set('editId', editId);
      } else {
        sessionStorage.removeItem('admin_news_edit_id');
        url.searchParams.delete('editId');
      }
    } else {
      sessionStorage.removeItem('admin_news_view');
      sessionStorage.removeItem('admin_news_edit_id');
      url.searchParams.delete('view');
      url.searchParams.delete('editId');
    }
    // Use pushState so Chrome Back Button (<-) navigates from Form/View page back to List page
    window.history.pushState({}, '', url.pathname + url.search);
  };

  const loadEditArticleById = async (articleId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/api/admin/news/${articleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.article) {
        const fresh = data.article;
        const thumbnailPath = fresh.thumbnail || '';
        const mappedArticle = {
          ...defaultFormData,
          ...fresh,
          id: fresh._id || fresh.id,
          thumbnail: thumbnailPath ? (thumbnailPath.startsWith('http') || thumbnailPath.startsWith('data:') ? thumbnailPath : `${API_BASE}${thumbnailPath.startsWith('/') ? '' : '/'}${thumbnailPath}`) : '',
          thumbnailFileName: thumbnailPath ? thumbnailPath.split('/').pop() : 'No file chosen'
        };

        setEditingArticle(mappedArticle);
        setSelectedFile(null);
        setFormErrors({});
        setErrorMsg('');
        setFormData(mappedArticle);
        setCurrentView('form');
      }
    } catch (err) {
      console.error('Error loading article for edit on refresh:', err);
    }
  };

  const loadViewArticleById = async (articleId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/api/admin/news/${articleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.article) {
        const fresh = data.article;
        const thumbnailPath = fresh.thumbnail || '';
        setViewingArticle({
          ...fresh,
          id: fresh._id || fresh.id,
          thumbnail: thumbnailPath ? (thumbnailPath.startsWith('http') || thumbnailPath.startsWith('data:') ? thumbnailPath : `${API_BASE}${thumbnailPath.startsWith('/') ? '' : '/'}${thumbnailPath}`) : newsImg1
        });
        setCurrentView('view');
      }
    } catch (err) {
      console.error('Error loading article for view page on refresh:', err);
    }
  };

  const closeViewArticleModal = () => {
    setViewingArticle(null);
    setCurrentView('list');
    sessionStorage.removeItem('admin_news_view_id');
    sessionStorage.removeItem('admin_news_view');
    const url = new URL(window.location);
    url.searchParams.delete('viewId');
    url.searchParams.delete('view');
    window.history.pushState({}, '', url.pathname + url.search);
  };

  useEffect(() => {
    const syncViewStateFromURL = () => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const editIdParam = params.get('editId');
      const viewIdParam = params.get('viewId');

      if (viewParam === 'form') {
        if (editIdParam) {
          loadEditArticleById(editIdParam);
        } else {
          setEditingArticle(null);
          setFormData(defaultFormData);
          setSelectedFile(null);
          setCurrentView('form');
        }
      } else if (viewParam === 'view' || viewIdParam) {
        if (viewIdParam) {
          loadViewArticleById(viewIdParam);
        }
      } else {
        setCurrentView('list');
        setEditingArticle(null);
        setViewingArticle(null);
        sessionStorage.removeItem('admin_news_view');
        sessionStorage.removeItem('admin_news_edit_id');
        sessionStorage.removeItem('admin_news_view_id');
      }
    };

    syncViewStateFromURL();

    window.addEventListener('popstate', syncViewStateFromURL);
    return () => window.removeEventListener('popstate', syncViewStateFromURL);
  }, []);

  useEffect(() => {
    fetchTags(tagSearchTerm);
  }, [tagSearchTerm]);

  useEffect(() => {
    fetchCategories(categorySearchTerm);
  }, [categorySearchTerm]);

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
    if (formErrors.title) {
      setFormErrors(prev => ({ ...prev, title: '' }));
    }
    if (formErrors.slug) {
      setFormErrors(prev => ({ ...prev, slug: '' }));
    }
  };

  // Thumbnail file change handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast(`Image file "${file.name}" exceeds 5 MB limit. Please select an image under 5 MB.`, 'error');
        setFormErrors(prev => ({ ...prev, thumbnail: 'Image size must be less than 5 MB' }));
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          thumbnail: reader.result,
          thumbnailFileName: file.name
        });
        if (formErrors.thumbnail) {
          setFormErrors(prev => ({ ...prev, thumbnail: '' }));
        }
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

  // Server-Side Pagination Calculations
  const startIndex = totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * entriesPerPage, totalEntries);
  const currentSlice = articles;

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
    if (currentView === 'form') {
      if (editorRef.current) {
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

    const errors = {};
    if (!formData.title || !formData.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!formData.slug || !formData.slug.trim()) {
      errors.slug = 'Slug is required';
    }
    if (!selectedFile && (!formData.thumbnail || !formData.thumbnail.trim())) {
      errors.thumbnail = 'Thumbnail image is required';
    }
    if (!formData.shortDescription || !formData.shortDescription.trim()) {
      errors.shortDescription = 'Short description is required';
    }
    if (!formData.blogDetails || !formData.blogDetails.trim()) {
      errors.blogDetails = 'Details description is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setTimeout(() => {
        const firstErrorEl = document.querySelector('.input-field-error, .field-error-text');
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const container = firstErrorEl.closest('.form-group') || firstErrorEl.parentElement;
          const targetInput = container ? container.querySelector('input, textarea, select') : null;
          if (targetInput && typeof targetInput.focus === 'function') {
            targetInput.focus();
          }
        }
      }, 60);
      return;
    }

    setFormErrors({});
    setLoading(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('adminToken');
      const bodyFormData = new FormData();
      bodyFormData.append('category', formData.category || 'General');
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
        const successMsg = data.message || (editingArticle ? 'News article updated successfully' : 'News article created successfully');
        setPersistedView('list');
        setEditingArticle(null);
        setSelectedFile(null);
        setFormData(defaultFormData);
        fetchArticles();
        showToast(successMsg, 'success');
      } else {
        setErrorMsg(data.message || 'Failed to save news article.');
        showToast(data.message || 'Failed to save news article.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddForm = () => {
    setFormData(defaultFormData);
    setSelectedFile(null);
    setEditingArticle(null);
    setFormErrors({});
    setErrorMsg('');
    setPersistedView('form');
  };

  const handleEditArticle = async (article) => {
    const articleId = article._id || article.id;
    setPersistedView('form', articleId);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/api/admin/news/${articleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      const fresh = (data.success && data.article) ? data.article : article;

      const thumbnailPath = fresh.thumbnail || '';
      const mappedArticle = {
        ...defaultFormData,
        ...fresh,
        id: fresh._id || fresh.id,
        thumbnail: thumbnailPath ? (thumbnailPath.startsWith('http') || thumbnailPath.startsWith('data:') ? thumbnailPath : `${API_BASE}${thumbnailPath.startsWith('/') ? '' : '/'}${thumbnailPath}`) : '',
        thumbnailFileName: thumbnailPath ? thumbnailPath.split('/').pop() : 'No file chosen'
      };

      setEditingArticle(mappedArticle);
      setSelectedFile(null);
      setFormErrors({});
      setErrorMsg('');
      setFormData(mappedArticle);
    } catch (err) {
      console.error('Error fetching single article details for edit:', err);
      setEditingArticle(article);
      setSelectedFile(null);
      setFormErrors({});
      setErrorMsg('');
      setFormData({
        ...defaultFormData,
        ...article,
        thumbnailFileName: article.thumbnail ? article.thumbnail.split('/').pop() : 'No file chosen'
      });
    }
  };

  const handleViewArticle = async (article) => {
    const articleId = article._id || article.id;
    sessionStorage.setItem('admin_news_view_id', articleId);
    sessionStorage.setItem('admin_news_view', 'view');
    const url = new URL(window.location);
    url.searchParams.set('view', 'view');
    url.searchParams.set('viewId', articleId);
    window.history.replaceState({}, '', url.pathname + url.search);
    setCurrentView('view');

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/api/admin/news/${articleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.article) {
        const fresh = data.article;
        const thumbnailPath = fresh.thumbnail || '';
        setViewingArticle({
          ...fresh,
          id: fresh._id || fresh.id,
          thumbnail: thumbnailPath ? (thumbnailPath.startsWith('http') || thumbnailPath.startsWith('data:') ? thumbnailPath : `${API_BASE}${thumbnailPath.startsWith('/') ? '' : '/'}${thumbnailPath}`) : newsImg1
        });
      } else {
        setViewingArticle(article);
      }
    } catch (err) {
      console.error('Error fetching single article details for view:', err);
      setViewingArticle(article);
    }
  };

  const [deletingArticleId, setDeletingArticleId] = useState(null);

  const handleDeleteArticle = (id) => {
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
        showToast(data.message || 'News article deleted successfully', 'success');
      } else {
        showToast(data.message || 'Failed to delete news article.', 'error');
      }
    } catch (err) {
      console.error(err);
      setDeletingArticleId(null);
      showToast('Network Error', 'error');
    }
  };

  // TAG MANAGEMENT HANDLERS (Backend API + Local Fallback)
  const handleSaveTag = async (e) => {
    e.preventDefault();
    if (!tagInput.trim()) return;

    try {
      const token = localStorage.getItem('adminToken');
      let url = `${API_BASE}/api/admin/tags`;
      let method = 'POST';

      if (editingTagIndex !== null && tags[editingTagIndex]?._id) {
        url = `${API_BASE}/api/admin/tags/${tags[editingTagIndex]._id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: tagInput.trim() })
      });
      const data = await response.json();
      if (data.success) {
        showToast(data.message || 'Tag saved successfully', 'success');
        fetchTags(tagSearchTerm);
      } else {
        showToast(data.message || 'Failed to save tag', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network Error', 'error');
    }

    setTagInput('');
    setEditingTagIndex(null);
    setShowTagForm(false);
  };

  const handleEditTag = (index) => {
    setEditingTagIndex(index);
    const item = tags[index];
    setTagInput(typeof item === 'object' ? item.name : item);
    setShowTagForm(true);
  };

  const handleDeleteTag = (index) => {
    setDeletingTagIdx(index);
  };

  const confirmDeleteTag = async () => {
    if (deletingTagIdx === null) return;
    const tagObj = tags[deletingTagIdx];
    try {
      const token = localStorage.getItem('adminToken');
      if (tagObj && tagObj._id) {
        await fetch(`${API_BASE}/api/admin/tags/${tagObj._id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      showToast('Tag deleted successfully', 'success');
      fetchTags(tagSearchTerm);
    } catch (err) {
      console.error(err);
      showToast('Network Error', 'error');
    }
    setDeletingTagIdx(null);
  };

  // CATEGORY MANAGEMENT HANDLERS (Backend API)
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryInput.trim()) return;

    try {
      const token = localStorage.getItem('adminToken');
      let url = `${API_BASE}/api/admin/categories`;
      let method = 'POST';

      if (editingCategoryIndex !== null && categories[editingCategoryIndex]?._id) {
        url = `${API_BASE}/api/admin/categories/${categories[editingCategoryIndex]._id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: categoryInput.trim() })
      });
      const data = await response.json();
      if (data.success) {
        showToast(data.message || 'Category saved successfully', 'success');
        fetchCategories(categorySearchTerm);
      } else {
        showToast(data.message || 'Failed to save category', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network Error', 'error');
    }

    setCategoryInput('');
    setEditingCategoryIndex(null);
    setShowCategoryForm(false);
  };

  const handleEditCategory = (index) => {
    setEditingCategoryIndex(index);
    const item = categories[index];
    setCategoryInput(typeof item === 'object' ? item.name : item);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = (index) => {
    setDeletingCatIdx(index);
  };

  const confirmDeleteCategory = async () => {
    if (deletingCatIdx === null) return;
    const catObj = categories[deletingCatIdx];
    try {
      const token = localStorage.getItem('adminToken');
      if (catObj && catObj._id) {
        await fetch(`${API_BASE}/api/admin/categories/${catObj._id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      showToast('Category deleted successfully', 'success');
      fetchCategories(categorySearchTerm);
    } catch (err) {
      console.error(err);
      showToast('Network Error', 'error');
    }
    setDeletingCatIdx(null);
  };

  // Filtered Tags & Categories for Search
  const filteredTagsList = Array.isArray(tags) ? tags.filter(t => {
    const name = typeof t === 'object' ? t.name : t;
    return (name || '').toLowerCase().includes((tagSearchTerm || '').toLowerCase());
  }) : [];

  const filteredCategoriesList = Array.isArray(categories) ? categories.filter(c => {
    const name = typeof c === 'object' ? c.name : c;
    return (name || '').toLowerCase().includes((categorySearchTerm || '').toLowerCase());
  }) : [];

  return (
    <div className="blog-post-module">
      
      {/* Floating Toast Notification Popup */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* Header Bar matching View Mode */}
      {currentView === 'list' && (
        <div className="blog-post-header-bar">
          <div className="title-section">
            <h2 className="header-main-title" style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Blog Post</h2>
          </div>

          <div className="header-action-buttons">
            {/* <button className="btn-coral-tag" onClick={() => { setCurrentView('tags'); setShowTagForm(false); }}>
              Add Tags
            </button>
            <button className="btn-peach-category" onClick={() => { setCurrentView('categories'); setShowCategoryForm(false); }}>
              Add Category
            </button> */}

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
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="blog-post-table-wrapper">
            <table className="blog-post-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('sNo')} className="sortable-th" style={{ width: '70px', textAlign: 'center' }}>
                    S.No
                  </th>
                  <th onClick={() => handleSort('title')} className="sortable-th" style={{ textAlign: 'left' }}>
                    Title
                  </th>
                  <th onClick={() => handleSort('slug')} className="sortable-th" style={{ textAlign: 'left' }}>
                    Slug
                  </th>
                  <th onClick={() => handleSort('thumbnail')} className="sortable-th" style={{ width: '100px', textAlign: 'center' }}>
                    Thumbnail
                  </th>
                  <th onClick={() => handleSort('metaTitle')} className="sortable-th" style={{ textAlign: 'left' }}>
                    Meta Title
                  </th>
                  <th onClick={() => handleSort('metaDescription')} className="sortable-th" style={{ textAlign: 'left' }}>
                    Meta Description
                  </th>
                  <th className="action-th" style={{ width: '130px', textAlign: 'center' }}>
                    Action
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
                        <img 
                          src={item.thumbnail} 
                          alt={item.title} 
                          className="table-thumb-img" 
                          style={{ width: '48px', height: '38px', borderRadius: '6px', objectFit: 'cover' }} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = newsImg1;
                          }}
                        />
                      </td>
                      <td className="meta-title-cell" style={{ textAlign: 'left' }}>{item.metaTitle}</td>
                      <td className="meta-desc-cell" style={{ textAlign: 'left' }}>{item.metaDescription}</td>
                      <td className="action-cell" style={{ textAlign: 'center' }}>
                        <div className="action-btns-group" style={{ justifyContent: 'center' }}>
                          <button 
                            className="action-btn-circle view" 
                            onClick={() => handleViewArticle(item)}
                            title="View Post Details"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          <button 
                            className="action-btn-circle edit" 
                            onClick={() => handleEditArticle(item)}
                            title="Edit Post"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <button 
                            className="action-btn-circle delete" 
                            onClick={() => handleDeleteArticle(item.id)}
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
          VIEW MODE 2: INLINE ADD / EDIT FULL FORM VIEW
         ========================================================================= */}
      {currentView === 'form' && (
        <div className="blog-post-card-container inline-form-container">
          <div className="inline-form-header">
            <h3 className="form-title-heading">
              {editingArticle ? 'Edit News Article' : 'Create News Article'}
            </h3>
            <button className="btn-secondary-dark" onClick={() => { setPersistedView('list'); setEditingArticle(null); }}>
              ← Back to List
            </button>
          </div>

          <form noValidate onSubmit={handleSubmitArticle} className="modal-form blog-post-full-form">
            <div className="form-fields-main-layout">
              {/* Left Column: Form Fields */}
              <div className="form-main-fields-col">
                
                {/* Title */}
                <div className="form-group">
                  <label style={{ marginBottom: '6px', display: 'block' }}>Title <span className="req-star">*</span></label>
                  <input 
                    type="text"
                    placeholder="Enter blog post title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    className={formErrors.title ? 'input-field-error' : ''}
                  />
                  {formErrors.title && <span className="field-error-text">{formErrors.title}</span>}
                </div>

                {/* Slug */}
                <div className="form-group">
                  <label style={{ marginBottom: '6px', display: 'block' }}>Slug <span className="req-star">*</span></label>
                  <input 
                    type="text"
                    placeholder="auto-generated-slug-path"
                    value={formData.slug}
                    onChange={(e) => {
                      setFormData({ ...formData, slug: e.target.value });
                      if (formErrors.slug) setFormErrors(prev => ({ ...prev, slug: '' }));
                    }}
                    className={formErrors.slug ? 'input-field-error' : ''}
                  />
                  {formErrors.slug && <span className="field-error-text">{formErrors.slug}</span>}
                </div>

                {/* TinyMCE Rich Text Editor matching reference screenshot */}
                <div className="form-group">
                  <label style={{ marginBottom: '6px', display: 'block' }}>Description / Details <span className="req-star">*</span></label>
                  <div className={`tinymce-editor-wrapper ${formErrors.blogDetails ? 'input-field-error' : ''}`}>
                    <Editor
                      tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.2/tinymce.min.js"
                      value={formData.blogDetails}
                      onEditorChange={(content) => {
                        setFormData(prev => ({ ...prev, blogDetails: content }));
                        if (formErrors.blogDetails) setFormErrors(prev => ({ ...prev, blogDetails: '' }));
                      }}
                      init={{
                        height: 380,
                        menubar: 'file edit insert view format table tools',
                        plugins: [
                          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount', 'emoticons'
                        ],
                        toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | image media link print preview | forecolor backcolor emoticons',
                        content_style: 'body { font-family: "Plus Jakarta Sans", Inter, Helvetica, Arial, sans-serif; font-size: 14px; color: #0f172a; line-height: 1.6; word-break: break-word; overflow-wrap: break-word; word-wrap: break-word; white-space: pre-wrap; max-width: 100%; min-height: 300px; cursor: text; } ul, ol { padding-left: 24px; } p { margin-bottom: 8px; }',
                        branding: false,
                        promotion: false,
                        resize: true,
                        statusbar: true,
                        setup: (editor) => {
                          const dismissTinyMCEPopups = () => {
                            try {
                              // 1. Dispatch ESC key inside iframe window & parent window to close floating menus
                              const escEvent = new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, which: 27, bubbles: true });
                              if (editor.getWin()) editor.getWin().dispatchEvent(escEvent);
                              document.dispatchEvent(escEvent);
                            } catch (e) {}

                            // 2. Toggle active open toolbar button (e.g. More... button)
                            const container = editor.getContainer();
                            if (container) {
                              const activeBtns = container.querySelectorAll('.tox-tbtn[aria-expanded="true"], .tox-tbtn--enabled');
                              activeBtns.forEach(btn => {
                                try { btn.click(); } catch (e) {}
                              });
                            }

                            // 3. Hide floating overflow drawers and menus from DOM
                            const popups = document.querySelectorAll('.tox-pop, .tox-toolbar__overflow, .tox-selected-menu, .tox-menu');
                            popups.forEach(pop => {
                              pop.style.display = 'none';
                            });
                          };

                          editor.on('init', () => {
                            const doc = editor.getDoc();
                            const body = editor.getBody();
                            if (doc) {
                              doc.addEventListener('mousedown', dismissTinyMCEPopups, true);
                              doc.addEventListener('click', dismissTinyMCEPopups, true);
                            }
                            if (body) {
                              body.addEventListener('mousedown', dismissTinyMCEPopups, true);
                              body.addEventListener('click', dismissTinyMCEPopups, true);
                            }
                          });

                          editor.on('click mousedown focus ExecCommand NodeChange', dismissTinyMCEPopups);
                        }
                      }}
                    />
                  </div>
                  {formErrors.blogDetails && <span className="field-error-text">{formErrors.blogDetails}</span>}
                </div>

                {/* Meta Settings (Seo Optimization fields) */}
                <fieldset className="seo-meta-fieldset">
                  <legend>SEO Settings</legend>
                  
                  <div className="form-group">
                    <label style={{ marginBottom: '6px', display: 'block' }}>Meta Title</label>
                    <input 
                      type="text"
                      placeholder="SEO optimized browser title"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ marginBottom: '6px', display: 'block' }}>Meta Keywords</label>
                    <input 
                      type="text"
                      placeholder="Comma-separated keywords"
                      value={formData.metaKeyword}
                      onChange={(e) => setFormData({ ...formData, metaKeyword: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ marginBottom: '6px', display: 'block' }}>Meta Description</label>
                    <textarea 
                      placeholder="Brief search engine description (150-160 characters)"
                      rows="3"
                      style={{ resize: 'vertical', width: '100%', maxWidth: '100%' }}
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
                  <label style={{ marginBottom: '6px', display: 'block' }}>Thumbnail Image <span className="req-star">*</span></label>
                  <div className={`thumbnail-upload-dropzone ${formErrors.thumbnail ? 'input-field-error' : ''}`}>
                    <div className="dropzone-media-preview-container">
                      {formData.thumbnail ? (
                        <img src={formData.thumbnail} alt="Upload preview" className="dropzone-preview-img" />
                      ) : (
                        <div className="dropzone-preview-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '100%', color: '#94a3b8' }}>
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21 15 16 10 5 21"/>
                          </svg>
                          <span style={{ fontSize: '13px', fontWeight: '500' }}>Upload preview</span>
                        </div>
                      )}
                    </div>
                    <div className="dropzone-controls">
                      <input 
                        type="file" 
                        id="newsThumbnailFile" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden-file-input"
                      />
                      <label style={{ color: 'white' }} htmlFor="newsThumbnailFile" className="btn-choose-file-tag">
                        Upload Thumbnail
                      </label>
                      <span className="file-name-indicator-span">{formData.thumbnailFileName}</span>
                    </div>
                  </div>
                  {formErrors.thumbnail && <span className="field-error-text">{formErrors.thumbnail}</span>}
                </div>

                {/* Short Description */}
                <div className="form-group">
                  <label style={{ marginBottom: '6px', display: 'block' }}>Short Summary / Hook <span className="req-star">*</span></label>
                  <textarea 
                    placeholder="Short description displayed on card"
                    rows="3"
                    style={{ resize: 'vertical', width: '100%', maxWidth: '100%' }}
                    value={formData.shortDescription}
                    onChange={(e) => {
                      setFormData({ ...formData, shortDescription: e.target.value });
                      if (formErrors.shortDescription) setFormErrors(prev => ({ ...prev, shortDescription: '' }));
                    }}
                    className={formErrors.shortDescription ? 'input-field-error' : ''}
                  ></textarea>
                  {formErrors.shortDescription && <span className="field-error-text">{formErrors.shortDescription}</span>}
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

                {/* Author Name */}
                <div className="form-group">
                  <label>Author Name</label>
                  <input 
                    type="text"
                    placeholder="Enter Author Name (e.g. UKL Team)"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  />
                </div>

                {/* Category selection - Hidden as requested */}
                {/* <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat, idx) => {
                      const catName = typeof cat === 'object' ? cat.name : cat;
                      return (
                        <option key={idx} value={catName}>{catName}</option>
                      );
                    })}
                  </select>
                </div> */}

                {/* Tags checkbox selection - Hidden as requested */}
                {/* <div className="form-group">
                  <label>Tags Selection</label>
                  <div className="tags-checkbox-multi-grid">
                    {tags.map((tag, idx) => {
                      const tagName = typeof tag === 'object' ? tag.name : tag;
                      const isChecked = formData.tagList ? formData.tagList.includes(tagName) : false;
                      return (
                        <label key={idx} className="checkbox-pill-label">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTagToggle(tagName)}
                          />
                          <span>{tagName}</span>
                        </label>
                      );
                    })}
                  </div>
                </div> */}

                {/* Switches / Checkboxes - Hidden as requested */}
                {/* <div className="form-group inline-switches-group">
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
                </div> */}

                {/* Status selection - Hidden as requested */}
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
              <button type="button" className="btn-cancel-outline" onClick={() => { setPersistedView('list'); setEditingArticle(null); }} disabled={loading}>
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
                    const tagName = typeof tag === 'object' ? tag.name : tag;
                    return (
                      <tr key={tag._id || index}>
                        <td style={{ textAlign: 'center' }}>{index + 1}</td>
                        <td style={{ textAlign: 'left', fontWeight: 'bold', color: '#0f172a' }}>{tagName}</td>
                        <td className="action-cell" style={{ textAlign: 'center' }}>
                          <div className="action-btns-group" style={{ justifyContent: 'center' }}>
                            <button className="action-btn-circle edit" onClick={() => handleEditTag(originalIdx)} title="Edit Tag">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                            <button className="action-btn-circle delete" onClick={() => handleDeleteTag(originalIdx)} title="Delete Tag">
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
                    const catName = typeof cat === 'object' ? cat.name : cat;
                    return (
                      <tr key={cat._id || index}>
                        <td style={{ textAlign: 'center' }}>{index + 1}</td>
                        <td style={{ textAlign: 'left', fontWeight: 'bold', color: '#0f172a' }}>{catName}</td>
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
          VIEW MODE 5: FULL INLINE PAGE - VIEW BLOG POST DETAILS
         ========================================================================= */}
      {currentView === 'view' && viewingArticle && (
        <div className="blog-post-card-container inline-form-container">
          {/* Header Bar with Action Buttons */}
          <div className="inline-form-header">
            <div>
              <h3 className="form-title-heading" style={{ marginBottom: '4px' }}>
                Blog Post Details
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn-secondary-dark" onClick={closeViewArticleModal}>
                ← Back to List
              </button>
            </div>
          </div>

          <div className="view-article-full-page-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '20px' }}>
            
            {/* Top Showcase Banner Image */}
            {viewingArticle.thumbnail && (
              <div style={{
                width: '100%',
                maxHeight: '340px',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}>
                <img 
                  src={viewingArticle.thumbnail} 
                  alt={viewingArticle.title} 
                  style={{ width: '100%', height: '100%', maxHeight: '340px', objectFit: 'cover', borderRadius: '8px' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = newsImg1;
                  }}
                />
              </div>
            )}

            {/* Article Metadata Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              padding: '16px 20px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div>
                <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Publish Date</span>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', marginTop: '2px' }}>{viewingArticle.blogDate}</div>
              </div>
              <div>
                <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</span>
                <div style={{ fontWeight: 700, color: '#004dad', fontSize: '14px', marginTop: '2px' }}>{viewingArticle.category || 'Company News'}</div>
              </div>
              <div>
                <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Author Name</span>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', marginTop: '2px' }}>{viewingArticle.author || 'UKL Team'}</div>
              </div>
              <div>
                <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Publish Status</span>
                <div style={{ marginTop: '4px' }}>
                  <span className={`status-pill ${viewingArticle.status === 'Active' ? 'published' : 'inactive'}`}>
                    {viewingArticle.status === 'Active' ? 'Active / Published' : 'Inactive / Draft'}
                  </span>
                </div>
              </div>
            </div>

            {/* Article Title */}
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Article Title</span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0', lineHeight: 1.3 }}>{viewingArticle.title}</h2>
            </div>

            {/* Short Description */}
            {viewingArticle.shortDescription && (
              <div style={{ padding: '16px 20px', background: '#f1f5f9', borderRadius: '10px', borderLeft: '4px solid #004dad' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>Short Summary</span>
                <p style={{ color: '#334155', fontSize: '14px', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{viewingArticle.shortDescription}</p>
              </div>
            )}

            {/* Full HTML Content Preview Box */}
            <div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>Full Article HTML Content Preview</span>
              <div 
                className="view-article-full-page-body"
                style={{
                  background: '#ffffff',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  color: '#1e293b',
                  minHeight: '260px',
                  lineHeight: '1.7',
                  fontSize: '14.5px',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  wordWrap: 'break-word',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)'
                }}
                dangerouslySetInnerHTML={{ __html: viewingArticle.blogDetails }}
              ></div>
            </div>

            {/* Bottom Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', marginTop: '12px' }}>
              <button type="button" className="btn-secondary-dark" onClick={closeViewArticleModal}>
                ← Back to List
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
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
              Are you sure you want to delete tag "{typeof tags[deletingTagIdx] === 'object' ? tags[deletingTagIdx]?.name : tags[deletingTagIdx]}"?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" className="btn-cancel-outline" onClick={() => setDeletingTagIdx(null)} style={{ flex: 1, padding: '10px 16px' }}>Cancel</button>
              <button type="button" onClick={confirmDeleteTag} style={{ flex: 1, padding: '10px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700 }}>Delete</button>
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
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
              Are you sure you want to delete category "{typeof categories[deletingCatIdx] === 'object' ? categories[deletingCatIdx]?.name : categories[deletingCatIdx]}"?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" className="btn-cancel-outline" onClick={() => setDeletingCatIdx(null)} style={{ flex: 1, padding: '10px 16px' }}>Cancel</button>
              <button type="button" onClick={confirmDeleteCategory} style={{ flex: 1, padding: '10px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700 }}>Delete</button>
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

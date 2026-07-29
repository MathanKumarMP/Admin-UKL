import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from './components/AdminLayout';
import AdminLogin from './components/AdminLogin';
import './styles/Admin.css';

function App() {
  const getStoredToken = () => {
    return sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || sessionStorage.getItem('userToken') || localStorage.getItem('userToken');
  };

  const getStoredUser = () => {
    try {
      const raw = sessionStorage.getItem('adminUser') || localStorage.getItem('adminUser');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  const getStoredSessionId = () => {
    return sessionStorage.getItem('adminSessionId') || localStorage.getItem('adminSessionId');
  };

  // Synchronously initialize auth state from sessionStorage / localStorage so refreshing (F5) retains login
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = getStoredToken();
    return Boolean(token && token !== 'null' && token !== 'undefined');
  });

  const [loading, setLoading] = useState(false);
  const tabSessionIdRef = useRef(getStoredSessionId());

  useEffect(() => {
    const token = getStoredToken();
    const sessionId = getStoredSessionId();

    if (token && token !== 'null' && token !== 'undefined') {
      setIsAuthenticated(true);
      tabSessionIdRef.current = sessionId;
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Enforce same-user single-session logout across browser tabs
  useEffect(() => {
    let authChannel;
    try {
      authChannel = new BroadcastChannel('ukl_admin_session');
      authChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'NEW_LOGIN' && event.data.sessionId) {
          const currentUser = getStoredUser();
          const currentUserId = currentUser?._id || currentUser?.phone || currentUser?.email || '';
          const newUserId = event.data.userId;

          // ONLY log out if the SAME user account logged in again in another tab
          if (currentUserId && newUserId && String(currentUserId) === String(newUserId)) {
            if (tabSessionIdRef.current && tabSessionIdRef.current !== event.data.sessionId) {
              handleLogout();
            }
          }
        }
      };
    } catch (e) {
      console.log('BroadcastChannel not supported');
    }

    return () => {
      if (authChannel) authChannel.close();
    };
  }, []);

  const handleLoginSuccess = (user, sessionId) => {
    tabSessionIdRef.current = sessionId || getStoredSessionId();
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');
    sessionStorage.removeItem('adminSessionId');
    sessionStorage.removeItem('userToken');

    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminSessionId');
    localStorage.removeItem('userToken');

    tabSessionIdRef.current = null;
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a', color: '#ffffff' }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="admin-standalone-app">
      {!isAuthenticated ? (
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      ) : (
        <AdminLayout onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;

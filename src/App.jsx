import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from './components/AdminLayout';
import AdminLogin from './components/AdminLogin';
import './styles/Admin.css';

function App() {
  // Synchronously initialize auth state from localStorage so refreshing (F5) retains login
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
    return Boolean(token && token !== 'null' && token !== 'undefined');
  });

  const [loading, setLoading] = useState(false);
  const tabSessionIdRef = useRef(localStorage.getItem('adminSessionId'));

  useEffect(() => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
    const sessionId = localStorage.getItem('adminSessionId');

    if (token && token !== 'null' && token !== 'undefined') {
      setIsAuthenticated(true);
      tabSessionIdRef.current = sessionId;
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Enforce single active tab session across browser tabs
  useEffect(() => {
    let authChannel;
    try {
      authChannel = new BroadcastChannel('ukl_admin_session');
      authChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'NEW_LOGIN' && event.data.sessionId) {
          // If a new login occurred in another tab, log out this previous tab
          if (tabSessionIdRef.current && tabSessionIdRef.current !== event.data.sessionId) {
            handleLogout();
          }
        }
      };
    } catch (e) {
      console.log('BroadcastChannel not supported');
    }

    const handleStorageChange = (e) => {
      if (e.key === 'adminSessionId' && e.newValue) {
        if (tabSessionIdRef.current && tabSessionIdRef.current !== e.newValue) {
          handleLogout();
        }
      }
      if (e.key === 'adminToken' && !e.newValue) {
        handleLogout();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (authChannel) authChannel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLoginSuccess = (user, sessionId) => {
    tabSessionIdRef.current = sessionId || localStorage.getItem('adminSessionId');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
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

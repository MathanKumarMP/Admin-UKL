import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from './components/AdminLayout';
import AdminLogin from './components/AdminLogin';
import './styles/Admin.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const tabSessionIdRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const sessionId = localStorage.getItem('adminSessionId');
    if (token) {
      setIsAuthenticated(true);
      tabSessionIdRef.current = sessionId;
    }
    setLoading(false);
  }, []);

  // Enforce single active tab session across browser tabs
  useEffect(() => {
    let authChannel;
    try {
      authChannel = new BroadcastChannel('ukl_admin_session');
      authChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'NEW_LOGIN') {
          // If a new login occurred in another tab, log out this previous tab
          if (tabSessionIdRef.current !== event.data.sessionId) {
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
    tabSessionIdRef.current = null;
    setIsAuthenticated(false);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a', color: '#ffffff' }}>Loading...</div>;
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

import React, { useState } from 'react';
import logo from '../assets/favicon.png';
import { API_BASE } from '../config';

const AdminLogin = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        // Save JWT Token & User Info in LocalStorage
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        
        setIsLoading(false);
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
      } else {
        setIsLoading(false);
        setErrorMessage(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      console.error('[Login API Error]:', err);
      setIsLoading(false);
      setErrorMessage('Cannot connect to the server. Ensure the backend is running.');
    }
  };

  return (
    <div className="admin-login-fullscreen">
      
      {/* Background Industrial Overlay */}
      <div className="login-bg-overlay"></div>

      {/* Floating Card Container (Matching User Screenshot UI) */}
      <div className="login-card-box">
        
        {/* UKL Brand Badge & Header */}
        <div className="login-header-section">
          <div className="login-logo-badge">
            <img src={logo} alt="UKL Instruments Logo" className="login-logo-img" />
          </div>
          <h1 className="login-brand-title">UKL Instruments</h1>
          <h2 className="login-main-heading">Sign In</h2>
          <p className="login-subtitle">Enter your credentials to access the dashboard</p>
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="login-error-alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleLogin} className="login-form">
          
          {/* Email / Username Field */}
          <div className="login-field-group">
            <label htmlFor="loginEmail">Email Address or Username</label>
            <div className="login-input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#004dad" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                id="loginEmail"
                type="email"
                placeholder="Enter email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input-field"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="login-field-group">
            <label htmlFor="loginPassword">Password / PIN</label>
            <div className="login-input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#004dad" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="loginPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input-field"
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            
            {/* Forgot Password Link */}
            <div className="forgot-password-row">
              <button type="button" className="forgot-password-btn" onClick={() => alert('Please contact system administrator to reset password.')}>
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Sign In Submit Button */}
          <button type="submit" className="login-submit-btn" disabled={isLoading}>
            {isLoading ? (
              <span className="login-spinner-text">Authenticating...</span>
            ) : (
              <span>Sign In</span>
            )}
          </button>

        </form>

        {/* Footer Credit Matching Screenshot */}
        <div className="login-footer-credits">
          Powered by UKL Instruments
        </div>

      </div>

    </div>
  );
};

export default AdminLogin;

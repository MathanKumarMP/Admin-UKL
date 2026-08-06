import React, { useState } from 'react';
import logo from '../assets/favicon.png';
import { API_BASE } from '../config';
import ToastNotification from './ToastNotification';

const AdminLogin = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Handle Phone Number Input (Only digits, max 10 characters)
  const handlePhoneChange = (e) => {
    const numericVal = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(numericVal);
    if (formErrors.phone) {
      setFormErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  // Handle PIN Digit Changes
  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    if (formErrors.pin) {
      setFormErrors(prev => ({ ...prev, pin: '' }));
    }

    // Auto-focus next input box
    if (value && index < 3) {
      const nextInput = document.getElementById(`login-pin-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`login-pin-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = {};
    const pinStr = pin.join('');
    
    // Strict Field Validation
    if (!phone || !phone.trim()) {
      errors.phone = 'Please enter Phone Number';
    } else if (phone.length !== 10) {
      errors.phone = 'Must be 10 digits';
    }

    if (!pinStr || pinStr.length < 4) {
      errors.pin = 'Enter 4-digit PIN';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone, pin: pinStr })
      });

      const data = await response.json();

      if (data.success) {
        const newSessionId = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 9);
        const userId = data.user?._id || data.user?.phone || data.user?.email || '';

        sessionStorage.setItem('adminToken', data.token);
        sessionStorage.setItem('adminUser', JSON.stringify(data.user));
        sessionStorage.setItem('adminSessionId', newSessionId);

        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        localStorage.setItem('adminSessionId', newSessionId);

        try {
          const authChannel = new BroadcastChannel('ukl_admin_session');
          authChannel.postMessage({ type: 'NEW_LOGIN', userId: userId, sessionId: newSessionId });
          authChannel.close();
        } catch (e) {
          console.log(e);
        }

        setIsLoading(false);
        showToast(data.message, 'success');
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(data.user, newSessionId);
          }
        }, 1000);
      } else {
        setIsLoading(false);
        showToast(data.message, 'error');
      }
    } catch (err) {
      console.error('[Login API Error]:', err);
      setIsLoading(false);
      showToast('Network Error', 'error');
    }
  };

  return (
    <div className="admin-login-fullscreen">
      {/* Floating Toast Notification Popup */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      <div className="login-card-box">
        {/* UKL Brand Logo */}
        <div className="login-header-section">
          <div className="login-logo-badge">
            <img src={logo} alt="UKL Instruments Logo" className="login-logo-img" />
          </div>
          <h2 className="login-main-heading">Sign In</h2>
          <p className="login-subtitle">Enter Your Phone Number and PIN to Continue</p>
        </div>

        {/* Sign In Form with noValidate & autoComplete=off to block Chrome password autofill */}
        <form noValidate autoComplete="off" onSubmit={handleLogin} className="login-form">
          {/* Hidden dummy inputs to absorb Chrome password manager autofill */}
          <input type="text" name="fake_username" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" />
          <input type="password" name="fake_password" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" />

          {/* Phone Number Field (Strict 10 Digits Only) */}
          <div className="login-field-group">
            <label htmlFor="loginPhone" style={{ marginBottom: '8px', display: 'block' }}>Phone Number</label>
            <div className={`login-input-wrapper ${formErrors.phone ? 'input-field-error' : ''}`}>
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </span>
              <input
                id="loginPhone"
                name="admin_phone_number"
                type="text"
                maxLength="10"
                placeholder="Enter Phone Number"
                value={phone}
                onChange={handlePhoneChange}
                autoComplete="new-password"
                className="login-input-field"
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  padding: 0,
                  margin: 0,
                  boxShadow: 'none',
                  width: '100%',
                  height: '100%',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#0f172a'
                }}
              />
            </div>
            {formErrors.phone && (
              <span style={{ color: '#ef4444', fontSize: '12.5px', fontWeight: '600', marginTop: '6px', display: 'block' }}>
                {formErrors.phone}
              </span>
            )}
          </div>

          {/* PIN Field (4 Individual Digit Boxes + Toggle Eye Icon) */}
          <div className="login-field-group">
            <label htmlFor="loginPin" style={{ marginBottom: '8px', display: 'block' }}>PIN</label>
            <div className="login-pin-row-flex">
              <div className="login-pin-boxes-container">
                {[0, 1, 2, 3].map(idx => (
                  <input
                    key={idx}
                    id={`login-pin-${idx}`}
                    name={`admin_pin_box_${idx}`}
                    type={showPin ? 'text' : 'password'}
                    maxLength="1"
                    autoComplete="new-password"
                    className={`login-pin-digit-input ${formErrors.pin ? 'input-field-error' : ''}`}
                    value={pin[idx] || ''}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(idx, e)}
                  />
                ))}
              </div>

              <button
                type="button"
                className="login-pin-toggle-btn"
                onClick={() => setShowPin(!showPin)}
                title={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {formErrors.pin && (
              <span style={{ color: '#ef4444', fontSize: '12.5px', fontWeight: '600', marginTop: '6px', display: 'block' }}>
                {formErrors.pin}
              </span>
            )}
          </div>

          {/* Sign In Submit Button */}
          <button type="submit" className="login-submit-btn navy-btn" disabled={isLoading}>
            {isLoading ? (
              <span className="login-spinner-text">Authenticating...</span>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Footer Credit */}
        <div className="login-footer-credits">
          Powered by UKL Instruments
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

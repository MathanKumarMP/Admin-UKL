import React from 'react';

const ToastNotification = ({ toast, onClose }) => {
  if (!toast) return null;

  return (
    <div className="toast-notification-container">
      <div className={`toast-popup-card ${toast.type}`}>
        <div className="toast-popup-icon-box">
          {toast.type === 'success' ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.8" strokeLinecap="round">
              <line x1="12" y1="4" x2="12" y2="13" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          )}
        </div>
        <span className="toast-popup-text">{toast.message}</span>
        <button className="toast-popup-close-btn" onClick={onClose} aria-label="Close notification">✕</button>
        <div className="toast-progress-track">
          <div className="toast-progress-fill" />
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;

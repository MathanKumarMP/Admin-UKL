import React from 'react';

const AdminNotFound = ({ onNavigate }) => {
  const currentPath = window.location.pathname;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 20px',
      textAlign: 'center',
      minHeight: '65vh'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '50px 40px',
        maxWidth: '560px',
        width: '100%',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          fontSize: '84px',
          fontWeight: '900',
          lineHeight: '1',
          background: 'linear-gradient(135deg, #004dad 0%, #4BAD49 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '16px',
          letterSpacing: '-2px'
        }}>
          404
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
          Admin Route Not Found
        </h2>

        <p style={{ fontSize: '14.5px', color: '#64748b', lineHeight: '1.6', marginBottom: '24px' }}>
          The requested path <code style={{ background: '#f1f5f9', color: '#dc2626', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>{currentPath}</code> is not a valid route in Admin UKL.
        </p>

        <button
          onClick={() => onNavigate('banners')}
          style={{
            background: 'linear-gradient(135deg, #004dad 0%, #00367a 100%)',
            color: '#ffffff',
            padding: '12px 28px',
            borderRadius: '10px',
            fontSize: '14.5px',
            fontWeight: '700',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 77, 173, 0.25)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
        >
          ← Go to Banners Management
        </button>
      </div>
    </div>
  );
};

export default AdminNotFound;

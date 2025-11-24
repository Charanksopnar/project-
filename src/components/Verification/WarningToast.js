import React from 'react';

export default function WarningToast({ message }) {
  if (!message) return null;
  const style = {
    position: 'fixed',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#f9c74f',
    color: '#000',
    padding: '12px 16px',
    borderRadius: 8,
    zIndex: 9999,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
  };

  return <div style={style} role="status" aria-live="polite">{message}</div>;
}

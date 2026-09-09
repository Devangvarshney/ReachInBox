import React from 'react';
import { useEmail } from '../../context/EmailContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useEmail();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '380px',
      width: '100%',
      pointerEvents: 'none'
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="animate-slide-in"
          style={{
            pointerEvents: 'auto',
            background: '#ffffff',
            borderRadius: '10px',
            padding: '14px 16px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          {toast.type === 'success' && (
            <CheckCircle2 size={20} color="#00a84e" style={{ flexShrink: 0, marginTop: '2px' }} />
          )}
          {toast.type === 'error' && (
            <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
          )}
          {toast.type === 'info' && (
            <Info size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#111827', marginBottom: '2px' }}>
              {toast.title}
            </div>
            <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.4' }}>
              {toast.message}
            </div>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            style={{
              color: '#9ca3af',
              padding: '2px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

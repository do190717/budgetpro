'use client';

import { useEffect } from 'react';

interface Props {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'אישור',
  cancelText = 'ביטול',
  danger = true,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        direction: 'rtl',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '320px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ fontSize: '17px', fontWeight: '500', color: '#1F2937', marginBottom: message ? '8px' : '20px', textAlign: 'right' }}>
          {title}
        </div>

        {message && (
          <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '20px', textAlign: 'right', lineHeight: '1.5' }}>
            {message}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: '10px',
              border: 'none',
              background: danger ? '#EF4444' : '#2563EB',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              background: '#F9FAFB',
              color: '#374151',
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

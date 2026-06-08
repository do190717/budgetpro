'use client';

import { useEffect } from 'react';
import { colors } from '@/lib/theme';

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
        background: colors.overlay,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        direction: 'rtl',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: colors.white,
          borderRadius: '16px',
          padding: '24px',
          width: '100%',
          maxWidth: '320px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ fontSize: '17px', fontWeight: '500', color: colors.gray900, marginBottom: message ? '8px' : '20px', textAlign: 'right' }}>
          {title}
        </div>

        {message && (
          <div style={{ fontSize: '14px', color: colors.gray500, marginBottom: '20px', textAlign: 'right', lineHeight: '1.5' }}>
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
              background: danger ? colors.redStrong : colors.blue,
              color: colors.white,
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
              border: `1px solid ${colors.gray200}`,
              background: colors.gray50,
              color: colors.gray700,
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

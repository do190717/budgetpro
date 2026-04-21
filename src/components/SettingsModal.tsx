'use client';

import { useState, useEffect } from 'react';
import { AppState } from '@/lib/types';
import { saveBusinessInfoToDB } from '@/lib/db';
import { supabase } from '@/lib/supabase';

interface Props {
  isOpen: boolean;
  state: AppState;
  onClose: () => void;
  onSave: (businessName: string, businessSubtitle: string) => void;
}

export default function SettingsModal({ isOpen, state, onClose, onSave }: Props) {
  const [businessName, setBusinessName] = useState(state.businessName);
  const [businessSubtitle, setBusinessSubtitle] = useState(state.businessSubtitle);
  const [userEmail, setUserEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBusinessName(state.businessName);
      setBusinessSubtitle(state.businessSubtitle);
      supabase.auth.getUser().then(({ data }) => {
        setUserEmail(data.user?.email || '');
      });
    }
  }, [isOpen, state.businessName, state.businessSubtitle]);

  const handleSave = async () => {
    setSaving(true);
    await saveBusinessInfoToDB(businessName.trim(), businessSubtitle.trim());
    onSave(businessName.trim(), businessSubtitle.trim());
    setSaving(false);
    onClose();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', direction: 'rtl' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ background: '#1E3A5F', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#fff', fontSize: '16px', fontWeight: '500' }}>הגדרות</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* פרטי עסק */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#6B7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>פרטי עסק</div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>שם עסק / שם מלא</label>
              <input
                type="text"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="לדוגמה: ד.א. עבודות פלדה"
                autoFocus
                style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', direction: 'rtl', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>כותרת משנה (אופציונלי)</label>
              <input
                type="text"
                value={businessSubtitle}
                onChange={e => setBusinessSubtitle(e.target.value)}
                placeholder="לדוגמה: קבלן בניה"
                style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '9px 12px', fontSize: '14px', direction: 'rtl', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* פרטי חשבון */}
          <div style={{ marginBottom: '20px', padding: '12px', background: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '12px', fontWeight: '500', color: '#6B7280', marginBottom: '6px' }}>חשבון</div>
            <div style={{ fontSize: '14px', color: '#374151', direction: 'ltr', textAlign: 'right' }}>{userEmail}</div>
          </div>

          {/* כפתורים */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ flex: 1, background: saving ? '#93C5FD' : '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: '500', cursor: saving ? 'default' : 'pointer' }}
            >
              {saving ? 'שומר...' : 'שמור'}
            </button>
            <button
              onClick={onClose}
              style={{ flex: 1, background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '14px', cursor: 'pointer' }}
            >
              ביטול
            </button>
          </div>

          {/* יציאה */}
          <button
            onClick={handleSignOut}
            style={{ width: '100%', background: 'none', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '9px', fontSize: '13px', color: '#DC2626', cursor: 'pointer' }}
          >
            יציאה מהחשבון
          </button>
        </div>
      </div>
    </div>
  );
}

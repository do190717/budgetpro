'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#F3F4F6', direction: 'rtl', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 16px' }}>

      <div style={{ background: '#1E3A5F', borderRadius: '16px', padding: '32px 24px', marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ color: '#fff', fontSize: '24px', fontWeight: '500', marginBottom: '6px' }}>ניהול פרויקטים</div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px' }}>ד.א. עבודות פלדה</div>
      </div>

      {!sent ? (
        <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '16px', fontWeight: '500', color: '#1F2937', marginBottom: '6px' }}>כניסה לאפליקציה</div>
          <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>הכנס אימייל — נשלח לך קישור כניסה</div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '6px' }}>כתובת אימייל</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="your@email.com"
              autoFocus
              style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', direction: 'ltr', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {error && <div style={{ fontSize: '12px', color: '#DC2626', marginBottom: '10px' }}>{error}</div>}

          <button
            onClick={handleSend}
            disabled={loading || !email.trim()}
            style={{ width: '100%', background: loading ? '#93C5FD' : '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '15px', fontWeight: '500', cursor: loading ? 'default' : 'pointer' }}
          >
            {loading ? 'שולח...' : 'שלח קישור כניסה'}
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', border: '1px solid #E5E7EB', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📧</div>
          <div style={{ fontSize: '16px', fontWeight: '500', color: '#1F2937', marginBottom: '8px' }}>בדוק את האימייל שלך</div>
          <div style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6' }}>
            שלחנו קישור כניסה ל-<br />
            <span style={{ fontWeight: '500', color: '#1F2937', direction: 'ltr', display: 'inline-block' }}>{email}</span>
          </div>
          <button
            onClick={() => setSent(false)}
            style={{ marginTop: '20px', background: 'none', border: 'none', color: '#2563EB', fontSize: '13px', cursor: 'pointer' }}
          >
            שלח שוב
          </button>
        </div>
      )}
    </div>
  );
}

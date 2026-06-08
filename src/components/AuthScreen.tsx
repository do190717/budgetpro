'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  const handleSend = async () => {
    if (!email.trim() || !agreedToPrivacy) return;
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
    <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: colors.gray100, direction: 'rtl', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 16px' }}>

      <div style={{ background: colors.navy, borderRadius: '16px', padding: '32px 24px', marginBottom: '24px', textAlign: 'center' }}>
        <div style={{ color: colors.white, fontSize: '24px', fontWeight: '500', marginBottom: '6px' }}>BudgetPro</div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px' }}>ניהול תקציב פרויקטים</div>
      </div>

      {!sent ? (
        <div style={{ background: colors.white, borderRadius: '14px', padding: '24px', border: `1px solid ${colors.gray200}` }}>
          <div style={{ fontSize: '16px', fontWeight: '500', color: colors.gray900, marginBottom: '6px' }}>כניסה לאפליקציה</div>
          <div style={{ fontSize: '13px', color: colors.gray500, marginBottom: '20px' }}>הכנס אימייל — נשלח לך קישור כניסה</div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: colors.gray500, display: 'block', marginBottom: '6px' }}>כתובת אימייל</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="your@email.com"
              autoFocus
              style={{ width: '100%', border: `1px solid ${colors.gray300}`, borderRadius: '8px', padding: '10px 12px', fontSize: '14px', direction: 'ltr', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px', padding: '12px', background: colors.gray50, borderRadius: '8px', border: `1px solid ${colors.gray200}` }}>
            <input
              type="checkbox"
              id="privacy"
              checked={agreedToPrivacy}
              onChange={e => setAgreedToPrivacy(e.target.checked)}
              style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: colors.blue, cursor: 'pointer', flexShrink: 0 }}
            />
            <label htmlFor="privacy" style={{ fontSize: '12px', color: colors.gray600, lineHeight: '1.5', cursor: 'pointer' }}>
              קראתי ואני מסכים/ה ל
              <a href="/privacy-policy" target="_blank" style={{ color: colors.blue, textDecoration: 'none', marginRight: '3px' }}>
                מדיניות הפרטיות
              </a>
            </label>
          </div>

          {error && <div style={{ fontSize: '12px', color: colors.red, marginBottom: '10px' }}>{error}</div>}

          <button
            onClick={handleSend}
            disabled={loading || !email.trim() || !agreedToPrivacy}
            style={{
              width: '100%',
              background: loading || !agreedToPrivacy ? colors.blueDisabled : colors.blue,
              color: colors.white, border: 'none', borderRadius: '8px', padding: '12px',
              fontSize: '15px', fontWeight: '500',
              cursor: loading || !agreedToPrivacy ? 'default' : 'pointer',
            }}
          >
            {loading ? 'שולח...' : 'שלח קישור כניסה'}
          </button>
        </div>
      ) : (
        <div style={{ background: colors.white, borderRadius: '14px', padding: '24px', border: `1px solid ${colors.gray200}`, textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📧</div>
          <div style={{ fontSize: '16px', fontWeight: '500', color: colors.gray900, marginBottom: '8px' }}>בדוק את האימייל שלך</div>
          <div style={{ fontSize: '13px', color: colors.gray500, lineHeight: '1.6' }}>
            שלחנו קישור כניסה ל-<br />
            <span style={{ fontWeight: '500', color: colors.gray900, direction: 'ltr', display: 'inline-block' }}>{email}</span>
          </div>
          <button
            onClick={() => setSent(false)}
            style={{ marginTop: '20px', background: 'none', border: 'none', color: colors.blue, fontSize: '13px', cursor: 'pointer' }}
          >
            שלח שוב
          </button>
        </div>
      )}
    </div>
  );
}

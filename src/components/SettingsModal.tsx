'use client';

import { useState, useEffect } from 'react';
import { AppState } from '@/lib/types';
import { saveBusinessInfoToDB } from '@/lib/db';
import { supabase } from '@/lib/supabase';

interface Props {
  state: AppState;
  onClose: () => void;
  onSave: (businessName: string, businessSubtitle: string) => void;
}

type Section = 'main' | 'business' | 'contact' | 'privacy' | 'about';

export default function SettingsModal({ state, onClose, onSave }: Props) {
  const [section, setSection] = useState<Section>('main');
  const [businessName, setBusinessName] = useState(state.businessName);
  const [businessSubtitle, setBusinessSubtitle] = useState(state.businessSubtitle);
  const [userEmail, setUserEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // המודאל מרונדר רק כשהוא פתוח (mount טרי) — אתחול הטופס מתבצע
  // דרך ערכי ההתחלה של useState, וכאן רק שליפת האימייל מהשרת.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email || ''));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await saveBusinessInfoToDB(businessName.trim(), businessSubtitle.trim());
    onSave(businessName.trim(), businessSubtitle.trim());
    setSaving(false);
    setSection('main');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };


  const rowStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '13px 16px', borderBottom: '1px solid #F3F4F6', cursor: 'pointer', background: '#fff',
  };
  const labelStyle: React.CSSProperties = { fontSize: '14px', color: '#1F2937' };
  const subStyle: React.CSSProperties = { fontSize: '12px', color: '#9CA3AF', marginTop: '2px' };
  const chevron = <span style={{ color: '#D1D5DB', fontSize: '18px' }}>‹</span>;

  const sectionHeader = (title: string) => (
    <div style={{ background: '#1E3A5F', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <button onClick={() => setSection('main')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>›</button>
      <span style={{ color: '#fff', fontSize: '15px', fontWeight: '500' }}>{title}</span>
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', direction: 'rtl' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#F3F4F6', borderRadius: '16px', width: '100%', maxWidth: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', maxHeight: '85vh', overflowY: 'auto' }}>

        {section === 'main' && (<>
          <div style={{ background: '#1E3A5F', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: '500' }}>הגדרות</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </div>

          <div style={{ padding: '10px 16px 4px', fontSize: '11px', color: '#9CA3AF', fontWeight: '500', letterSpacing: '0.05em' }}>חשבון</div>
          <div style={{ background: '#fff', borderRadius: '10px', margin: '0 8px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>מחובר כ</div>
              <div style={{ fontSize: '14px', color: '#1F2937', direction: 'ltr', textAlign: 'right', marginTop: '2px' }}>{userEmail}</div>
            </div>
            <div onClick={() => setSection('business')} style={rowStyle}>
              <div>
                <div style={labelStyle}>פרטי עסק</div>
                <div style={subStyle}>{state.businessName || 'לא הוגדר'}</div>
              </div>
              {chevron}
            </div>
          </div>

          <div style={{ padding: '14px 16px 4px', fontSize: '11px', color: '#9CA3AF', fontWeight: '500', letterSpacing: '0.05em' }}>מידע ותמיכה</div>
          <div style={{ background: '#fff', borderRadius: '10px', margin: '0 8px', overflow: 'hidden' }}>
            <div onClick={() => setSection('contact')} style={rowStyle}>
              <div style={labelStyle}>יצירת קשר ותמיכה</div>
              {chevron}
            </div>
            <div onClick={() => setSection('privacy')} style={rowStyle}>
              <div style={labelStyle}>מדיניות פרטיות</div>
              {chevron}
            </div>
            <div onClick={() => setSection('about')} style={{ ...rowStyle, borderBottom: 'none' }}>
              <div style={labelStyle}>אודות BudgetPro</div>
              {chevron}
            </div>
          </div>

          <div style={{ padding: '14px 16px 4px', fontSize: '11px', color: '#9CA3AF', fontWeight: '500', letterSpacing: '0.05em' }}>בקרוב</div>
          <div style={{ background: '#fff', borderRadius: '10px', margin: '0 8px', overflow: 'hidden' }}>
            {[
              { label: 'מצב לילה', sub: 'Dark Mode' },
              { label: 'שפה', sub: 'עברית / English' },
              { label: 'ייצוא נתונים', sub: 'Excel / PDF' },
              { label: 'התראות', sub: 'תזכורות חודשיות' },
              { label: 'מטבע', sub: '₪ / $ / €' },
            ].map((item, i, arr) => (
              <div key={item.label} style={{ ...rowStyle, borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none', cursor: 'default', opacity: 0.5 }}>
                <div>
                  <div style={labelStyle}>{item.label}</div>
                  <div style={subStyle}>{item.sub}</div>
                </div>
                <span style={{ fontSize: '10px', background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '999px' }}>בקרוב</span>
              </div>
            ))}
          </div>

          <div style={{ padding: '12px 8px 16px' }}>
            <button onClick={handleSignOut} style={{ width: '100%', background: '#fff', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '12px', fontSize: '14px', color: '#DC2626', cursor: 'pointer' }}>
              יציאה מהחשבון
            </button>
          </div>
        </>)}

        {section === 'business' && (<>
          {sectionHeader('פרטי עסק')}
          <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>שם עסק / שם מלא</label>
              <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="לדוגמה: ד.א. עבודות פלדה" autoFocus
                style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', direction: 'rtl', outline: 'none', boxSizing: 'border-box', background: '#fff' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>כותרת משנה (אופציונלי)</label>
              <input type="text" value={businessSubtitle} onChange={e => setBusinessSubtitle(e.target.value)} placeholder="לדוגמה: קבלן בניה"
                style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', direction: 'rtl', outline: 'none', boxSizing: 'border-box', background: '#fff' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, background: saving ? '#93C5FD' : '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '14px', fontWeight: '500', cursor: saving ? 'default' : 'pointer' }}>
                {saving ? 'שומר...' : 'שמור'}
              </button>
              <button onClick={() => setSection('main')} style={{ flex: 1, background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '14px', cursor: 'pointer' }}>ביטול</button>
            </div>
          </div>
        </>)}

        {section === 'contact' && (<>
          {sectionHeader('יצירת קשר ותמיכה')}
          <div style={{ padding: '12px 8px' }}>
            <div style={{ background: '#fff', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
              {[
                { icon: '📧', label: 'אימייל', value: 'do190717@gmail.com', action: () => window.open('mailto:do190717@gmail.com') },
                { icon: '📱', label: 'טלפון / WhatsApp', value: '050-4190717', action: () => window.open('https://wa.me/972504190717') },
                { icon: '🌐', label: 'אתר האפליקציה', value: 'app-budgetpro.co.il', action: () => window.open('https://app-budgetpro.co.il', '_blank') },
              ].map((item, i, arr) => (
                <div key={item.label} onClick={item.action} style={{ ...rowStyle, borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    <div>
                      <div style={labelStyle}>{item.label}</div>
                      <div style={{ ...subStyle, direction: 'ltr', textAlign: 'right' }}>{item.value}</div>
                    </div>
                  </div>
                  {chevron}
                </div>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center' }}>נשתדל להשיב תוך 72 שעות בימי עסקים</p>
          </div>
        </>)}

        {section === 'privacy' && (<>
          {sectionHeader('מדיניות פרטיות')}
          <div style={{ padding: '16px 12px' }}>
            <div style={{ background: '#fff', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
              <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: '1.7', marginBottom: '12px' }}>
                BudgetPro מחויבת להגנה על פרטיותך. אנו אוספים רק את המידע הנדרש להפעלת האפליקציה ולא מוכרים אותו לצדדים שלישיים.
              </p>
              <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: '1.7' }}>
                הנתונים שלך מאוחסנים בצורה מוצפנת ומאובטחת. כל משתמש רואה אך ורק את הנתונים שלו.
              </p>
            </div>
            <button onClick={() => window.open('https://app-budgetpro.co.il/privacy-policy', '_blank')}
              style={{ width: '100%', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '10px', padding: '12px', fontSize: '14px', color: '#2563EB', cursor: 'pointer' }}>
              קרא את מדיניות הפרטיות המלאה ↗
            </button>
          </div>
        </>)}

        {section === 'about' && (<>
          {sectionHeader('אודות BudgetPro')}
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ width: '72px', height: '72px', background: '#1E3A5F', borderRadius: '18px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: '700', color: '#fff' }}>DA</div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: '#1F2937', marginBottom: '4px' }}>BudgetPro</div>
            <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '20px' }}>גרסה 1.0.0</div>
            <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.7', marginBottom: '8px' }}>
              אפליקציה לניהול תקציב פרויקטים, מעקב הכנסות והוצאות, ניכויי מס וחישוב מעשרות.
            </p>
            <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.7', marginBottom: '20px' }}>
              פותחה עבור בעלי עסקים וקבלנים עצמאיים בישראל.
            </p>
            <div style={{ fontSize: '12px', color: '#D1D5DB' }}>© 2026 ד.א. עבודות פלדה. כל הזכויות שמורות.</div>
          </div>
        </>)}

      </div>
    </div>
  );
}

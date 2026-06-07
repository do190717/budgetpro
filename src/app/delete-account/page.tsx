'use client';

export default function DeleteAccount() {
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 20px', direction: 'rtl', fontFamily: 'sans-serif', color: '#1F2937', lineHeight: '1.7' }}>
      <div style={{ background: '#1E3A5F', borderRadius: '12px', padding: '24px', marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ color: '#fff', fontSize: '22px', fontWeight: '500' }}>BudgetPro</div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '4px' }}>מחיקת חשבון ונתונים</div>
      </div>

      <h1 style={{ fontSize: '22px', fontWeight: '500', marginBottom: '16px' }}>בקשה למחיקת חשבון</h1>

      <p style={{ marginBottom: '24px', color: '#4B5563' }}>
        אם ברצונך למחוק את חשבונך ב-BudgetPro ואת כל הנתונים המשויכים אליו, פעל לפי השלבים הבאים:
      </p>

      <div style={{ background: '#F3F4F6', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>שלבים למחיקת החשבון</h2>
        <ol style={{ paddingRight: '20px', color: '#374151' }}>
          <li style={{ marginBottom: '12px' }}>פתח את האפליקציה והתחבר לחשבונך</li>
          <li style={{ marginBottom: '12px' }}>לחץ על כפתור ⚙️ הגדרות בפינה העליונה</li>
          <li style={{ marginBottom: '12px' }}>גלול למטה ולחץ על <strong>יציאה מהחשבון</strong></li>
          <li style={{ marginBottom: '12px' }}>לאחר מכן שלח בקשת מחיקה באימייל: <a href="mailto:do190717@gmail.com" style={{ color: '#2563EB' }}>do190717@gmail.com</a></li>
          <li>ציין את כתובת האימייל הרשומה — נמחק את החשבון תוך 7 ימי עסקים</li>
        </ol>
      </div>

      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '12px', color: '#991B1B' }}>מה נמחק?</h2>
        <ul style={{ paddingRight: '20px', color: '#7F1D1D' }}>
          <li style={{ marginBottom: '8px' }}>פרטי החשבון (כתובת אימייל)</li>
          <li style={{ marginBottom: '8px' }}>כל הפרויקטים, ההכנסות וההוצאות שנרשמו</li>
          <li style={{ marginBottom: '8px' }}>נתוני מעשרות והפרשות</li>
          <li style={{ marginBottom: '8px' }}>הגדרות עסק ופרטים אישיים</li>
          <li>כל שאר הנתונים המשויכים לחשבון</li>
        </ul>
      </div>

      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '12px', color: '#92400E' }}>מה נשמר?</h2>
        <p style={{ color: '#78350F' }}>
          לא נשמר שום מידע לאחר המחיקה. כל הנתונים נמחקים לצמיתות תוך 7 ימי עסקים מקבלת הבקשה.
        </p>
      </div>

      <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '20px', fontSize: '13px', color: '#9CA3AF', textAlign: 'center' }}>
        לשאלות נוספות: <a href="mailto:do190717@gmail.com" style={{ color: '#2563EB' }}>do190717@gmail.com</a> | 050-4190717
      </div>
    </div>
  );
}

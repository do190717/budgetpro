import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "מדיניות פרטיות — BudgetPro",
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans Hebrew", sans-serif',
      background: "#F9FAFB",
      color: "#1F2937",
      lineHeight: 1.8,
      padding: "24px 16px",
      minHeight: "100vh",
    }}>
      <div style={{
        maxWidth: 800,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 16,
        padding: "40px 36px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
      }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1E3A5F", marginBottom: 6 }}>מדיניות פרטיות</h1>
        <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 32 }}>BudgetPro — אפליקציית ניהול תקציב פרויקטים | עדכון אחרון: אפריל 2026</div>

        <div style={{ background: "#EFF6FF", borderRight: "4px solid #2563EB", padding: "14px 16px", borderRadius: "0 8px 8px 0", margin: "16px 0" }}>
          <p style={{ margin: 0, color: "#1D4ED8", fontSize: 14 }}>מדיניות פרטיות זו מסבירה כיצד BudgetPro (&quot;האפליקציה&quot;, &quot;אנחנו&quot;, &quot;שירות&quot;) אוספת, משתמשת ומגנה על המידע האישי שלך. אנא קרא בעיון לפני השימוש באפליקציה.</p>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1E3A5F", marginTop: 32, marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #E5E7EB" }}>1. מי אנחנו</h2>
        <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 12 }}>BudgetPro היא אפליקציית ניהול תקציב פרויקטים פותחה ומופעלת על ידי דוד אורטנר, ד.א. עבודות פלדה, ישראל. לפרטי יצירת קשר ראה סעיף 11.</p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1E3A5F", marginTop: 32, marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #E5E7EB" }}>2. המידע שאנו אוספים</h2>

        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginTop: 18, marginBottom: 8 }}>א. מידע שאתה מספק ישירות</h3>
        <ul style={{ paddingRight: 20, marginBottom: 12 }}>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>כתובת אימייל</strong> — לצורך הרשמה וכניסה לחשבון (Magic Link)</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>נתוני פרויקטים</strong> — שמות פרויקטים, הכנסות, הוצאות, תאריכים</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>נתונים פיננסיים</strong> — ניכויים, הפרשות מעשר, הכנסות והוצאות כלליות</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>הערות וטקסט חופשי</strong> — כל תוכן שתכניס לשדות ההערות</li>
        </ul>

        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginTop: 18, marginBottom: 8 }}>ב. מידע הנאסף אוטומטית</h3>
        <ul style={{ paddingRight: 20, marginBottom: 12 }}>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>נתוני שימוש</strong> — זמני כניסה, פעולות בתוך האפליקציה</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>מידע טכני</strong> — סוג מכשיר, מערכת הפעלה, גרסת דפדפן</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>כתובת IP</strong> — לצורכי אבטחה ומניעת הונאה</li>
        </ul>

        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginTop: 18, marginBottom: 8 }}>ג. מידע שאיננו אוספים</h3>
        <ul style={{ paddingRight: 20, marginBottom: 12 }}>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>אנו <strong>לא</strong> אוספים מיקום GPS</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>אנו <strong>לא</strong> ניגשים לאנשי קשר, מצלמה או מיקרופון</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>אנו <strong>לא</strong> אוספים מידע ביומטרי</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>אנו <strong>לא</strong> עוקבים אחר פעילותך מחוץ לאפליקציה</li>
        </ul>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1E3A5F", marginTop: 32, marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #E5E7EB" }}>3. כיצד אנו משתמשים במידע</h2>
        <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 12 }}>אנו משתמשים במידע שנאסף אך ורק למטרות הבאות:</p>
        <ul style={{ paddingRight: 20, marginBottom: 12 }}>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>אימות זהות וניהול חשבון המשתמש</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>אחסון ושמירה של נתוני הפרויקטים שלך</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>סנכרון נתונים בין מכשירים שונים</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>שיפור ביצועים ואיתור תקלות</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>אבטחת החשבון ומניעת גישה בלתי מורשית</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>תגובה לפניות תמיכה</li>
        </ul>
        <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 12 }}>אנו <strong>לא</strong> משתמשים במידע שלך לפרסום ממוקד, מכירה לצדדים שלישיים, או כל מטרה שאינה מפורטת לעיל.</p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1E3A5F", marginTop: 32, marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #E5E7EB" }}>4. שיתוף מידע עם צדדים שלישיים</h2>
        <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 12 }}>אנו משתמשים בספקי שירות מהימנים לצורך הפעלת האפליקציה:</p>

        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginTop: 18, marginBottom: 8 }}>Supabase (אחסון נתונים ואימות)</h3>
        <ul style={{ paddingRight: 20, marginBottom: 12 }}>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>ספק: Supabase Inc., ארה&quot;ב</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>מטרה: אחסון נתוני המשתמש ואימות זהות</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>מדיניות פרטיות: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">supabase.com/privacy</a></li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>הנתונים מאוחסנים בשרתים באיחוד האירופי (EU West)</li>
        </ul>

        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginTop: 18, marginBottom: 8 }}>Vercel (אירוח האפליקציה)</h3>
        <ul style={{ paddingRight: 20, marginBottom: 12 }}>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>ספק: Vercel Inc., ארה&quot;ב</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>מטרה: אירוח ופרסום האפליקציה</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>מדיניות פרטיות: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">vercel.com/legal/privacy-policy</a></li>
        </ul>

        <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 12 }}>אנו <strong>לא</strong> מוכרים, משכירים או מעבירים את המידע האישי שלך לכל גורם אחר, למעט במקרים הבאים:</p>
        <ul style={{ paddingRight: 20, marginBottom: 12 }}>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>כאשר נדרש על פי חוק או צו שיפוטי</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>להגנה על זכויות, רכוש או בטיחות של משתמשים או הציבור</li>
        </ul>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1E3A5F", marginTop: 32, marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #E5E7EB" }}>5. אבטחת מידע</h2>
        <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 12 }}>אנו נוקטים באמצעי אבטחה מתקדמים להגנה על המידע שלך:</p>
        <ul style={{ paddingRight: 20, marginBottom: 12 }}>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>הצפנה</strong> — כל התקשורת מוצפנת באמצעות HTTPS/TLS</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>Row Level Security (RLS)</strong> — כל משתמש יכול לגשת אך ורק לנתונים שלו</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>Magic Link</strong> — כניסה ללא סיסמה, מפחית סיכון גניבת סיסמאות</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>אימות דו-שלבי</strong> — ניתן להפעיל בהגדרות</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>ניטור רציף</strong> — מעקב אחר פעילות חשודה</li>
        </ul>
        <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 12 }}>למרות כל האמצעים הנ&quot;ל, אין אבטחה מוחלטת באינטרנט. אנו ממליצים לשמור על תחנת הכניסה שלך מאובטחת.</p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1E3A5F", marginTop: 32, marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #E5E7EB" }}>6. שמירת נתונים</h2>
        <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 12 }}>אנו שומרים את הנתונים שלך כל עוד חשבונך פעיל. עם מחיקת החשבון:</p>
        <ul style={{ paddingRight: 20, marginBottom: 12 }}>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>כל הנתונים האישיים יימחקו תוך 30 יום</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>נתוני גיבוי יימחקו תוך 90 יום</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}>נתונים הנדרשים לצרכים חוקיים יישמרו בהתאם לדרישות החוק הישראלי</li>
        </ul>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1E3A5F", marginTop: 32, marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #E5E7EB" }}>7. זכויות המשתמש</h2>
        <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 12 }}>בהתאם לחוק הגנת הפרטיות הישראלי, GDPR ותקנות אחרות, יש לך את הזכויות הבאות:</p>
        <ul style={{ paddingRight: 20, marginBottom: 12 }}>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>זכות עיון</strong> — לקבל עותק של כל המידע שנאסף עליך</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>זכות תיקון</strong> — לתקן מידע שגוי</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>זכות מחיקה</strong> — לבקש מחיקת כל המידע שלך (&quot;הזכות להישכח&quot;)</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>זכות הגבלת עיבוד</strong> — להגביל את השימוש במידע שלך</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>זכות ניידות נתונים</strong> — לקבל את נתוניך בפורמט מובנה</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>זכות התנגדות</strong> — להתנגד לעיבוד מסוים של המידע שלך</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>זכות מחיקת חשבון</strong> — בהתאם לדרישות Google Play, ניתן למחוק את החשבון בכל עת דרך הגדרות האפליקציה או בפנייה אלינו</li>
        </ul>
        <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 12 }}>לממש זכויות אלה, פנה אלינו בכתובת המפורטת בסעיף 11.</p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1E3A5F", marginTop: 32, marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #E5E7EB" }}>8. קבצי Cookie וטכנולוגיות מעקב</h2>
        <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 12 }}>האפליקציה משתמשת ב:</p>
        <ul style={{ paddingRight: 20, marginBottom: 12 }}>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>Session cookies</strong> — לשמירת מצב הכניסה</li>
          <li style={{ fontSize: 14, color: "#4B5563", marginBottom: 6 }}><strong>Local Storage</strong> — לשמירת העדפות מקומיות</li>
        </ul>
        <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 12 }}>אנו <strong>לא</strong> משתמשים ב-cookies לצרכי פרסום או מעקב, וב-Google Analytics או כלי ניתוח מידע של צד שלישי.</p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1E3A5F", marginTop: 32, marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #E5E7EB" }}>9. ילדים</h2>
        <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 12 }}>האפליקציה מיועדת למשתמשים מגיל 18 ומעלה. אנו לא אוספים ביודעין מידע מקטינים. אם גילית שקטין סיפק לנו מידע, אנא צור קשר מיידית ונמחק את המידע.</p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1E3A5F", marginTop: 32, marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #E5E7EB" }}>10. עדכונים למדיניות</h2>
        <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 12 }}>אנו עשויים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יגררו הודעה באפליקציה או באימייל לפחות 30 יום מראש. המשך השימוש באפליקציה לאחר קבלת ההודעה מהווה הסכמה לתנאים המעודכנים.</p>
        <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 12 }}>תאריך עדכון אחרון: אפריל 2026. גרסה: 1.0</p>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1E3A5F", marginTop: 32, marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #E5E7EB" }}>11. יצירת קשר</h2>
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "16px 20px", marginTop: 24 }}>
          <p style={{ margin: "4px 0", color: "#065F46", fontSize: 14 }}><strong>דוד אורטנר — ד.א. עבודות פלדה</strong></p>
          <p style={{ margin: "4px 0", color: "#065F46", fontSize: 14 }}>אימייל: <a href="mailto:do190717@gmail.com" style={{ color: "#2563EB" }}>do190717@gmail.com</a></p>
          <p style={{ margin: "4px 0", color: "#065F46", fontSize: 14 }}>טלפון: 050-4190717</p>
          <p style={{ margin: "4px 0", color: "#065F46", fontSize: 14 }}>אתר האפליקציה: <a href="https://budgetpro-sepia.vercel.app" target="_blank" rel="noopener noreferrer" style={{ color: "#2563EB" }}>budgetpro-sepia.vercel.app</a></p>
          <p style={{ marginTop: 8, fontSize: 13, color: "#047857" }}>אנו נשתדל להשיב לכל פנייה תוך 72 שעות בימי עסקים.</p>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1E3A5F", marginTop: 32, marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #E5E7EB" }}>12. חוק חל וסמכות שיפוט</h2>
        <p style={{ fontSize: 14, color: "#4B5563", marginBottom: 12 }}>מדיניות פרטיות זו כפופה לחוק הגנת הפרטיות התשמ&quot;א-1981 ותקנותיו, וכן לתקנות הגנת הפרטיות (אבטחת מידע) התשע&quot;ז-2017. לצדדים ממדינות האיחוד האירופי חלה גם תקנת ה-GDPR. סמכות שיפוט בלעדית נתונה לבתי המשפט המוסמכים בישראל.</p>

        <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 32, textAlign: "center" }}>&copy; 2026 BudgetPro — ד.א. עבודות פלדה. כל הזכויות שמורות.</div>
      </div>
    </div>
  );
}

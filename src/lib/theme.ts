// מקור אמת יחיד לעיצוב — צבעים, רדיוסים ומרווחים.
// אין להשתמש בערכי hex גולמיים בקומפוננטות; להשתמש בטוקנים האלה בלבד.

export const colors = {
  // מותג
  navy: '#1E3A5F',        // רקע header ראשי
  blue: '#2563EB',        // פעולה ראשית
  blueDisabled: '#93C5FD', // כפתור כחול מושבת
  blueDark: '#1D4ED8',
  blueBright: '#60A5FA',  // קו טאב פעיל
  blueBg: '#EFF6FF',
  blueBorder: '#DBEAFE',
  blueBorderSoft: '#BFDBFE',
  cardZebraA: '#F0F7FF',  // רקע כרטיס פרויקט (זוגי)
  cardZebraB: '#F8FBFF',  // רקע כרטיס פרויקט (אי-זוגי)

  // הכנסות / חיובי (ירוק)
  green: '#1D9E75',       // header הכנסות
  greenText: '#059669',
  greenDeep: '#065F46',
  greenLabel: '#27500A',
  greenBg: '#EAF3DE',
  greenChip: '#D1FAE5',   // רקע צ'יפ "מע"מ"
  greenBgSoft: '#F0FDF4', // רקע רווח עסקי חיובי
  mintKpi: '#9FE1CB',     // צבע KPI חיובי על רקע navy

  // הוצאות / שלילי
  orange: '#D85A30',      // header הוצאות
  peachKpi: '#F5C4B3',    // צבע KPI שלילי על רקע navy
  orangeBg: '#FAECE7',
  orangeText: '#712B13',
  red: '#DC2626',
  redBorder: '#FCA5A5',
  redStrong: '#EF4444',
  redDeep: '#991B1B',
  redText: '#A32D2D',     // טקסט יתרת חוב
  redBg: '#FEF2F2',
  redBgSoft: '#FCEBEB',   // רקע יתרת חוב

  // ביתי (סגול)
  purple: '#7C3AED',
  purpleDeep: '#4C1D95',
  purpleBg: '#EDE9FE',
  purpleBgSoft: '#F5F3FF', // רקע יתרה לבית חיובית
  zebraHome: '#FAF8FF',    // פס זברה לטבלת הוצאות ביתיות

  // מעשר / ענבר
  yellow: '#FCD34D',      // אזהרת תאריך סיום חסר
  amber: '#B45309',
  amberText: '#92400E',
  amberBg: '#FEF9E7',
  amberBgDeep: '#FAEEDA', // רקע סה"כ חייב במעשר
  amberChip: '#FEF3C7',

  // אפורים (סקאלה)
  gray900: '#1F2937',
  gray700: '#374151',
  gray600: '#4B5563',
  gray500: '#6B7280',
  gray400: '#9CA3AF',
  gray300: '#D1D5DB',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
  gray50: '#F9FAFB',
  offWhite: '#FAFAFA',    // רקע שורת ניכוי

  // רקעים מיוחדים
  cream: '#F1EFE8',       // שורת הערה
  noteText: '#555',       // טקסט הערה
  zebraIncome: '#F8FFF8', // פס זברה לטבלת הכנסות
  zebraExpense: '#FFF8F8',// פס זברה לטבלת הוצאות
  focusBg: '#EEF4FF',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.45)', // רקע כהה של מודאלים
} as const;

export const radius = {
  sm: '6px',
  md: '8px',
  lg: '10px',
  xl: '12px',
  pill: '999px',
} as const;

export const space = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
} as const;

// רוחב מקסימלי של מסך (מובייל ממורכז)
export const APP_MAX_WIDTH = '480px';

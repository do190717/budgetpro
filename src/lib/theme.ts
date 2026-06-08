// מקור אמת יחיד לעיצוב — צבעים, רדיוסים ומרווחים.
// אין להשתמש בערכי hex גולמיים בקומפוננטות; להשתמש בטוקנים האלה בלבד.

export const colors = {
  // מותג
  navy: '#1E3A5F',        // רקע header ראשי
  blue: '#2563EB',        // פעולה ראשית
  blueDisabled: '#93C5FD', // כפתור כחול מושבת
  blueDark: '#1D4ED8',
  blueBg: '#EFF6FF',
  blueBorder: '#DBEAFE',
  blueBorderSoft: '#BFDBFE',

  // הכנסות / חיובי (ירוק)
  green: '#1D9E75',       // header הכנסות
  greenText: '#059669',
  greenDeep: '#065F46',
  greenLabel: '#27500A',
  greenBg: '#EAF3DE',

  // הוצאות / שלילי
  orange: '#D85A30',      // header הוצאות
  orangeBg: '#FAECE7',
  orangeText: '#712B13',
  red: '#DC2626',
  redBorder: '#FCA5A5',
  redStrong: '#EF4444',
  redDeep: '#991B1B',
  redBg: '#FEF2F2',

  // ביתי (סגול)
  purple: '#7C3AED',
  purpleDeep: '#4C1D95',
  purpleBg: '#EDE9FE',

  // מעשר / ענבר
  amber: '#B45309',
  amberText: '#92400E',
  amberBg: '#FEF9E7',
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

  // רקעים מיוחדים
  cream: '#F1EFE8',       // שורת הערה
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

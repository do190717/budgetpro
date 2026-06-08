-- מיגרציה: הוספת שדה "חייב במע"מ" לשורות
-- יש להריץ ב-Supabase → SQL Editor לפני בדיקת שמירה של פרויקטים בענף feature/vat-separation.
-- בלי העמודה הזו, שמירת פרויקט תיכשל (העמודה vatable נשלחת ב-upsert).

-- שורה חייבת במע"מ כברירת מחדל; false = פטור/0%.
ALTER TABLE line_items
  ADD COLUMN IF NOT EXISTS vatable boolean NOT NULL DEFAULT true;

-- טבלת הגיבוי מקבלת עותק מלא של line_items, לכן צריכה גם היא את העמודה.
ALTER TABLE line_items_backup
  ADD COLUMN IF NOT EXISTS vatable boolean;

-- שורות בטאב "כללי" (הכנסות / הוצאות עסקיות) — לחישוב מע"מ של כל העסק.
ALTER TABLE general_items
  ADD COLUMN IF NOT EXISTS vatable boolean NOT NULL DEFAULT true;

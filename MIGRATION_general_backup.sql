-- מיגרציה: טבלת גיבוי לפריטים כלליים (general_items)
-- חובה להריץ ב-Supabase → SQL Editor כדי שהגיבוי החדש יעבוד.
-- בלי זה, הקוד פשוט ידלג על הגיבוי (לא ייכשל), אבל לא תהיה רשת ביטחון.

create table if not exists general_items_backup (
  id text,
  user_id uuid,
  type text,
  expense_category text,
  description text,
  amount numeric,
  note text,
  date text,
  sort_order integer,
  vatable boolean,
  backed_up_at timestamptz,
  backed_up_by uuid
);

alter table general_items_backup enable row level security;

-- בעל החשבון יכול להכניס ולקרוא רק את הגיבויים שלו
drop policy if exists gi_backup_insert on general_items_backup;
create policy gi_backup_insert on general_items_backup
  for insert to authenticated
  with check (auth.uid() = backed_up_by);

drop policy if exists gi_backup_select on general_items_backup;
create policy gi_backup_select on general_items_backup
  for select to authenticated
  using (auth.uid() = backed_up_by);

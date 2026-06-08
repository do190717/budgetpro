import { supabase } from './supabase';
import { AppState, Project, LineItem, Deduction, MaasarPayment, RecurringPayment, RecurringGeneralItem } from './types';

const defaultDeductions: Deduction[] = [
  { id: '1', name: 'מס הכנסה', pct: 25, enabled: false },
  { id: '2', name: 'ביטוח לאומי', pct: 12, enabled: false },
  { id: '3', name: 'מע"מ', pct: 18, enabled: false },
];

const emptyState: AppState = {
  projects: [],
  deductions: defaultDeductions,
  maasarPct: 10,
  maasarPayments: [],
  recurringPayments: [],
  generalIncome: [],
  generalExpenseWork: [],
  generalExpenseHome: [],
  recurringGeneralItems: [],
  businessName: '',
  businessSubtitle: '',
};

export async function loadStateFromDB(): Promise<AppState> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return emptyState;

    const [
      { data: projects },
      { data: lineItems },
      { data: deductions },
      { data: settings },
      { data: maasarPayments },
      { data: recurringPayments },
      { data: generalItems },
      { data: recurringGeneralItems },
    ] = await Promise.all([
      supabase.from('projects').select('*').order('created_at'),
      supabase.from('line_items').select('*').order('sort_order'),
      supabase.from('deductions').select('*').order('sort_order'),
      supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
      supabase.from('maasar_payments').select('*'),
      supabase.from('recurring_payments').select('*'),
      supabase.from('general_items').select('*').order('sort_order'),
      supabase.from('recurring_general_items').select('*'),
    ]);

    const builtProjects: Project[] = (projects || []).map(p => ({
      id: p.id,
      name: p.name,
      startDate: p.start_date || '',
      endDate: p.end_date || '',
      income: (lineItems || [])
        .filter(li => li.project_id === p.id && li.type === 'income')
        .map(li => ({ id: li.id, desc: li.description, amount: li.amount, note: li.note, date: li.date, vatable: li.vatable ?? true })),
      expense: (lineItems || [])
        .filter(li => li.project_id === p.id && li.type === 'expense')
        .map(li => ({ id: li.id, desc: li.description, amount: li.amount, note: li.note, date: li.date, vatable: li.vatable ?? true })),
    }));

    return {
      projects: builtProjects,
      deductions: (deductions || []).length > 0
        ? (deductions || []).map(d => ({ id: d.id, name: d.name, pct: d.pct, enabled: d.enabled }))
        : defaultDeductions,
      maasarPct: settings?.maasar_pct ?? 10,
      businessName: settings?.business_name || '',
      businessSubtitle: settings?.business_subtitle || '',
      maasarPayments: (maasarPayments || []).map(p => ({ id: p.id, date: p.date, desc: p.description, amount: p.amount })),
      recurringPayments: (recurringPayments || []).map(r => ({ id: r.id, desc: r.description, amount: r.amount, dayOfMonth: r.day_of_month, lastRegistered: r.last_registered, enabled: r.enabled })),
      generalIncome: (generalItems || []).filter(g => g.type === 'income').map(g => ({ id: g.id, desc: g.description, amount: g.amount, note: g.note, date: g.date, vatable: g.vatable ?? true })),
      generalExpenseWork: (generalItems || []).filter(g => g.type === 'expense' && (g.expense_category === 'work' || !g.expense_category)).map(g => ({ id: g.id, desc: g.description, amount: g.amount, note: g.note, date: g.date, vatable: g.vatable ?? true })),
      generalExpenseHome: (generalItems || []).filter(g => g.type === 'expense' && g.expense_category === 'home').map(g => ({ id: g.id, desc: g.description, amount: g.amount, note: g.note, date: g.date, vatable: g.vatable ?? true })),
      recurringGeneralItems: (recurringGeneralItems || []).map(r => ({ id: r.id, type: r.type, desc: r.description, amount: r.amount, dayOfMonth: r.day_of_month, lastRegistered: r.last_registered, enabled: r.enabled })),
    };
  } catch {
    return emptyState;
  }
}

export async function saveProjectToDB(project: Project): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // שכבה 1 — הגנה מפני מחיקה בטעות
  const hasItems = project.income.length > 0 || project.expense.length > 0;

  await supabase.from('projects').upsert({
    id: project.id,
    user_id: user.id,
    name: project.name,
    start_date: project.startDate,
    end_date: project.endDate,
  });

  if (!hasItems) {
    // בדוק כמה שורות יש ב-DB
    const { data: existing } = await supabase
      .from('line_items')
      .select('id')
      .eq('project_id', project.id);

    // אם יש יותר מ-1 שורה ב-DB אבל אין במצב — כנראה טעינה חלקית/שגויה, אל תמחק
    if (existing && existing.length > 1) return;

    // ריקון לגיטימי (0 או 1 שורה) — גבה ומחק את כל שורות הפרויקט
    await backupLineItems(project.id);
    await supabase.from('line_items').delete().eq('project_id', project.id);
    return;
  }

  // יש שורות — שמור (עם גיבוי)
  await backupLineItems(project.id);

  const allItems = [
    ...project.income.map((li, i) => ({
      id: li.id, project_id: project.id, type: 'income',
      description: li.desc, amount: li.amount, note: li.note, date: li.date || '', sort_order: i,
      vatable: li.vatable ?? true,
    })),
    ...project.expense.map((li, i) => ({
      id: li.id, project_id: project.id, type: 'expense',
      description: li.desc, amount: li.amount, note: li.note, date: li.date || '', sort_order: i,
      vatable: li.vatable ?? true,
    })),
  ];

  // upsert השורות הקיימות
  const { error: upsertError } = await supabase.from('line_items').upsert(allItems);

  // ⛔ אם השמירה נכשלה — לא ממשיכים למחיקה, כדי לא לאבד נתונים קיימים
  if (upsertError) {
    console.error('שמירת שורות נכשלה — מדלגים על המחיקה כדי לא לאבד נתונים:', upsertError);
    return;
  }

  // מחק שורות שנמחקו על ידי המשתמש
  const currentIds = allItems.map(i => i.id);
  await supabase.from('line_items')
    .delete()
    .eq('project_id', project.id)
    .not('id', 'in', `(${currentIds.map(id => `'${id}'`).join(',')})`);

}

// שכבה 2 — גיבוי לפני מחיקה
async function backupLineItems(projectId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: items } = await supabase
      .from('line_items')
      .select('*')
      .eq('project_id', projectId);

    if (!items || items.length === 0) return;

    await supabase.from('line_items_backup').insert(
      items.map(item => ({
        ...item,
        backed_up_at: new Date().toISOString(),
        backed_up_by: user.id,
      }))
    );
  } catch {
    // גיבוי נכשל — ממשיכים בכל מקרה
  }
}

export async function deleteProjectFromDB(projectId: string): Promise<void> {
  // גיבוי לפני מחיקת פרויקט
  await backupLineItems(projectId);
  await supabase.from('projects').delete().eq('id', projectId);
}

export async function saveDeductionsToDB(deductions: Deduction[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('deductions').delete().eq('user_id', user.id);
  if (deductions.length > 0) {
    await supabase.from('deductions').insert(
      deductions.map((d, i) => ({ id: d.id, user_id: user.id, name: d.name, pct: d.pct, enabled: d.enabled, sort_order: i }))
    );
  }
}

export async function saveMaasarPctToDB(pct: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('user_settings').upsert({ user_id: user.id, maasar_pct: pct });
}

export async function saveMaasarPaymentToDB(payment: MaasarPayment): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('maasar_payments').upsert({
    id: payment.id, user_id: user.id, date: payment.date,
    description: payment.desc, amount: payment.amount,
  });
}

export async function deleteMaasarPaymentFromDB(id: string): Promise<void> {
  await supabase.from('maasar_payments').delete().eq('id', id);
}

export async function saveRecurringPaymentToDB(rp: RecurringPayment): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('recurring_payments').upsert({
    id: rp.id, user_id: user.id, description: rp.desc,
    amount: rp.amount, day_of_month: rp.dayOfMonth,
    last_registered: rp.lastRegistered, enabled: rp.enabled,
  });
}

export async function deleteRecurringPaymentFromDB(id: string): Promise<void> {
  await supabase.from('recurring_payments').delete().eq('id', id);
}

export async function saveGeneralItemsToDB(items: LineItem[], type: 'income' | 'expenseWork' | 'expenseHome'): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const dbType = type === 'income' ? 'income' : 'expense';
  const dbCategory = type === 'expenseWork' ? 'work' : type === 'expenseHome' ? 'home' : null;

  const rows = items.map((li, i) => ({
    id: li.id, user_id: user.id, type: dbType,
    expense_category: dbCategory,
    description: li.desc, amount: li.amount,
    note: li.note, date: li.date || '', sort_order: i,
    vatable: li.vatable ?? true,
  }));

  // שומרים קודם (upsert) — ואם נכשל, לא ממשיכים למחיקה כדי לא לאבד נתונים
  if (rows.length > 0) {
    const { error } = await supabase.from('general_items').upsert(rows);
    if (error) {
      console.error('שמירת פריטים כלליים נכשלה — מדלגים על המחיקה:', error);
      return;
    }
  }

  // מחיקת שורות ישנות מאותו סוג/קטגוריה שכבר אינן במצב הנוכחי
  let del = supabase.from('general_items').delete().eq('user_id', user.id).eq('type', dbType);
  if (dbCategory !== null) del = del.eq('expense_category', dbCategory);
  const currentIds = rows.map(r => r.id);
  if (currentIds.length > 0) {
    del = del.not('id', 'in', `(${currentIds.map(id => `'${id}'`).join(',')})`);
  }
  await del;
}

export async function saveRecurringGeneralItemToDB(item: RecurringGeneralItem): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('recurring_general_items').upsert({
    id: item.id, user_id: user.id, type: item.type,
    description: item.desc, amount: item.amount,
    day_of_month: item.dayOfMonth, last_registered: item.lastRegistered, enabled: item.enabled,
  });
}

export async function deleteRecurringGeneralItemFromDB(id: string): Promise<void> {
  await supabase.from('recurring_general_items').delete().eq('id', id);
}

export async function saveAllDeductionsAndSettings(deductions: Deduction[], maasarPct: number): Promise<void> {
  await Promise.all([saveDeductionsToDB(deductions), saveMaasarPctToDB(maasarPct)]);
}

export async function saveBusinessInfoToDB(businessName: string, businessSubtitle: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('user_settings').upsert({
    user_id: user.id,
    business_name: businessName,
    business_subtitle: businessSubtitle,
  });
}

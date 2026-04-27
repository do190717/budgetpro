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
        .map(li => ({ id: li.id, desc: li.description, amount: li.amount, note: li.note, date: li.date })),
      expense: (lineItems || [])
        .filter(li => li.project_id === p.id && li.type === 'expense')
        .map(li => ({ id: li.id, desc: li.description, amount: li.amount, note: li.note, date: li.date })),
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
      generalIncome: (generalItems || []).filter(g => g.type === 'income').map(g => ({ id: g.id, desc: g.description, amount: g.amount, note: g.note, date: g.date })),
      generalExpenseWork: (generalItems || []).filter(g => g.type === 'expense' && (g.expense_category === 'work' || !g.expense_category)).map(g => ({ id: g.id, desc: g.description, amount: g.amount, note: g.note, date: g.date })),
      generalExpenseHome: (generalItems || []).filter(g => g.type === 'expense' && g.expense_category === 'home').map(g => ({ id: g.id, desc: g.description, amount: g.amount, note: g.note, date: g.date })),
      recurringGeneralItems: (recurringGeneralItems || []).map(r => ({ id: r.id, type: r.type, desc: r.description, amount: r.amount, dayOfMonth: r.day_of_month, lastRegistered: r.last_registered, enabled: r.enabled })),
    };
  } catch {
    return emptyState;
  }
}

export async function saveProjectToDB(project: Project): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('projects').upsert({ id: project.id, user_id: user.id, name: project.name, start_date: project.startDate, end_date: project.endDate });
  const allItems = [
    ...project.income.map((li, i) => ({ id: li.id, project_id: project.id, type: 'income', description: li.desc, amount: li.amount, note: li.note, date: li.date || '', sort_order: i })),
    ...project.expense.map((li, i) => ({ id: li.id, project_id: project.id, type: 'expense', description: li.desc, amount: li.amount, note: li.note, date: li.date || '', sort_order: i })),
  ];
  await supabase.from('line_items').delete().eq('project_id', project.id);
  if (allItems.length > 0) await supabase.from('line_items').insert(allItems);
}

export async function deleteProjectFromDB(projectId: string): Promise<void> {
  await supabase.from('projects').delete().eq('id', projectId);
}

export async function saveDeductionsToDB(deductions: Deduction[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('deductions').delete().eq('user_id', user.id);
  if (deductions.length > 0) {
    await supabase.from('deductions').insert(deductions.map((d, i) => ({ id: d.id, user_id: user.id, name: d.name, pct: d.pct, enabled: d.enabled, sort_order: i })));
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
  await supabase.from('maasar_payments').upsert({ id: payment.id, user_id: user.id, date: payment.date, description: payment.desc, amount: payment.amount });
}

export async function deleteMaasarPaymentFromDB(id: string): Promise<void> {
  await supabase.from('maasar_payments').delete().eq('id', id);
}

export async function saveRecurringPaymentToDB(rp: RecurringPayment): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('recurring_payments').upsert({ id: rp.id, user_id: user.id, description: rp.desc, amount: rp.amount, day_of_month: rp.dayOfMonth, last_registered: rp.lastRegistered, enabled: rp.enabled });
}

export async function deleteRecurringPaymentFromDB(id: string): Promise<void> {
  await supabase.from('recurring_payments').delete().eq('id', id);
}

export async function saveGeneralItemsToDB(items: LineItem[], type: 'income' | 'expenseWork' | 'expenseHome'): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const dbType = type === 'income' ? 'income' : 'expense';
  const dbCategory = type === 'expenseWork' ? 'work' : type === 'expenseHome' ? 'home' : null;

  // מחיקה לפי type ו-category בנפרד
  let deleteQuery = supabase.from('general_items').delete().eq('user_id', user.id).eq('type', dbType);
  if (dbCategory !== null) {
    deleteQuery = deleteQuery.eq('expense_category', dbCategory);
  }
  await deleteQuery;

  if (items.length > 0) {
    await supabase.from('general_items').insert(
      items.map((li, i) => ({
        id: li.id,
        user_id: user.id,
        type: dbType,
        expense_category: dbCategory,
        description: li.desc,
        amount: li.amount,
        note: li.note,
        date: li.date || '',
        sort_order: i,
      }))
    );
  }
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
  await supabase.from('user_settings').upsert({ user_id: user.id, business_name: businessName, business_subtitle: businessSubtitle });
}
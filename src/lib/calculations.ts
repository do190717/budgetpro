import { Project, Deduction, AppState, MaasarPayment, LineItem } from './types';

export function calcProjectIncome(project: Project): number {
  return project.income.reduce((sum, item) => sum + item.amount, 0);
}

export function calcProjectExpense(project: Project): number {
  return project.expense.reduce((sum, item) => sum + item.amount, 0);
}

export function calcProjectProfit(project: Project): number {
  return calcProjectIncome(project) - calcProjectExpense(project);
}

// שורה נחשבת חייבת במע"מ אלא אם סומנה במפורש כפטורה
export function isVatable(item: LineItem): boolean {
  return item.vatable !== false;
}

// רכיב המע"מ בתוך סכום שנרשם כולל מע"מ (למשל 1180 ב-18% => 180)
export function vatComponent(amountInclVat: number, rate: number): number {
  if (rate <= 0) return 0;
  return Math.round(amountInclVat * (rate / (100 + rate)));
}

// בסיס המע"מ של פרויקט — רק שורות הכנסה חייבות (כולל מע"מ)
export function calcProjectVatableIncome(project: Project): number {
  return project.income.filter(isVatable).reduce((sum, item) => sum + item.amount, 0);
}

// מע"מ עסקאות (פלט) — מתוך ההכנסות החייבות
export function calcProjectOutputVat(project: Project, rate: number): number {
  return vatComponent(calcProjectVatableIncome(project), rate);
}

// מע"מ תשומות (קלט) — מתוך ההוצאות החייבות
export function calcProjectInputVat(project: Project, rate: number): number {
  const vatableExpense = project.expense.filter(isVatable).reduce((sum, item) => sum + item.amount, 0);
  return vatComponent(vatableExpense, rate);
}

// מע"מ לתשלום של הפרויקט = עסקאות פחות תשומות
export function calcProjectNetVat(project: Project, rate: number): number {
  return calcProjectOutputVat(project, rate) - calcProjectInputVat(project, rate);
}

// שיעור המע"מ המוגדר ע"י המשתמש (מתוך הניכוי "מעמ"), ברירת מחדל 18
export function getVatRate(deductions: Deduction[]): number {
  const vatDeduction = deductions.find(d => d.name.includes('מע'));
  return vatDeduction ? vatDeduction.pct : 18;
}

export function calcTotalIncome(projects: Project[]): number {
  return projects.reduce((sum, p) => sum + calcProjectIncome(p), 0);
}

export function calcTotalExpense(projects: Project[]): number {
  return projects.reduce((sum, p) => sum + calcProjectExpense(p), 0);
}

export function calcTotalProfit(projects: Project[]): number {
  return projects.reduce((sum, p) => sum + calcProjectProfit(p), 0);
}

export function calcGeneralIncome(items: LineItem[]): number {
  return (items || []).reduce((sum, item) => sum + item.amount, 0);
}

export function calcGeneralExpense(items: LineItem[]): number {
  return (items || []).reduce((sum, item) => sum + item.amount, 0);
}

// רווח עסקי כללי = הכנסות - הוצאות עסקיות (נכנס לבסיס מעשר)
export function calcGeneralBusinessProfit(state: AppState): number {
  return calcGeneralIncome(state.generalIncome || []) - calcGeneralExpense(state.generalExpenseWork || []);
}

// יתרה לבית = רווח עסקי - הוצאות ביתיות
export function calcGeneralHomeBalance(state: AppState): number {
  return calcGeneralBusinessProfit(state) - calcGeneralExpense(state.generalExpenseHome || []);
}

// בסיס מעשר = רווח פרויקטים + רווח עסקי כללי (הכנסות - הוצאות עסקיות)
export function calcGrandTotalProfit(state: AppState): number {
  return calcTotalProfit(state.projects) + calcGeneralBusinessProfit(state);
}

// לKPI בheader — הכנסות כולל כל ההכנסות
export function calcGrandTotalIncome(state: AppState): number {
  return calcTotalIncome(state.projects) + calcGeneralIncome(state.generalIncome || []);
}

// לKPI בheader — הוצאות כולל כל ההוצאות
export function calcGrandTotalExpense(state: AppState): number {
  return calcTotalExpense(state.projects) + calcGeneralExpense(state.generalExpenseWork || []) + calcGeneralExpense(state.generalExpenseHome || []);
}

// ===== מע"מ ברמת כל העסק (פרויקטים + כללי) =====

// סך הכנסות חייבות מע"מ (כולל מע"מ) — הכנסות פרויקטים + הכנסות כלליות
export function calcStateVatableIncome(state: AppState): number {
  const all = [...state.projects.flatMap(p => p.income), ...(state.generalIncome || [])];
  return all.filter(isVatable).reduce((s, i) => s + i.amount, 0);
}

// סך הוצאות עסקיות חייבות מע"מ (כולל מע"מ) — הוצאות פרויקטים + הוצאות עסקיות כלליות (ללא ביתיות)
export function calcStateVatableExpense(state: AppState): number {
  const all = [...state.projects.flatMap(p => p.expense), ...(state.generalExpenseWork || [])];
  return all.filter(isVatable).reduce((s, i) => s + i.amount, 0);
}

// מע"מ עסקאות (פלט) של כל העסק
export function calcStateOutputVat(state: AppState, rate: number): number {
  return vatComponent(calcStateVatableIncome(state), rate);
}

// מע"מ תשומות (קלט) של כל העסק
export function calcStateInputVat(state: AppState, rate: number): number {
  return vatComponent(calcStateVatableExpense(state), rate);
}

// מע"מ נטו לתשלום = עסקאות פחות תשומות
export function calcStateNetVat(state: AppState, rate: number): number {
  return calcStateOutputVat(state, rate) - calcStateInputVat(state, rate);
}

// רווח אחרי מע"מ = רווח ברוטו פחות מע"מ נטו (זהו בסיס המעשר)
export function calcProfitAfterVat(state: AppState): number {
  const rate = getVatRate(state.deductions);
  return calcGrandTotalProfit(state) - calcStateNetVat(state, rate);
}

// הכנסות בלי מע"מ — לכל ההכנסות, בניכוי רכיב המע"מ מהחייבות
export function calcGrandTotalIncomeExVat(state: AppState): number {
  const rate = getVatRate(state.deductions);
  return calcGrandTotalIncome(state) - calcStateOutputVat(state, rate);
}

// ניכויי מס שאינם מע"מ (מע"מ מטופל כשכבה אמיתית נפרדת)
export function nonVatDeductions(deductions: Deduction[]): Deduction[] {
  return deductions.filter(d => !d.name.includes('מע'));
}

export function calcDeductionAmount(profit: number, deduction: Deduction): number {
  if (!deduction.enabled) return 0;
  return Math.round(profit * (deduction.pct / 100));
}

export function calcTotalDeductions(profit: number, deductions: Deduction[]): number {
  return deductions.reduce((sum, d) => sum + calcDeductionAmount(profit, d), 0);
}

export function calcNetProfit(profit: number, deductions: Deduction[]): number {
  return profit - calcTotalDeductions(profit, deductions);
}

export function calcMaasarOwed(state: AppState): number {
  const maasarRequired = calcMaasarRequired(state);
  const maasarPaid = calcMaasarPaid(state.maasarPayments);
  return Math.max(0, maasarRequired - maasarPaid);
}

export function calcMaasarRequired(state: AppState): number {
  // בסיס: רווח אחרי מע"מ, ואז ניכויי מס (ללא מע"מ), ואז מעשר
  const profitAfterVat = calcProfitAfterVat(state);
  const netProfit = calcNetProfit(profitAfterVat, nonVatDeductions(state.deductions));
  return Math.round(netProfit * (state.maasarPct / 100));
}

export function calcMaasarPaid(payments: MaasarPayment[]): number {
  return payments.reduce((sum, p) => sum + p.amount, 0);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('he-IL');
}

// קיבוץ שורות לפי חודש
export function groupByMonth(items: LineItem[]): { key: string; label: string; items: LineItem[] }[] {
  const map = new Map<string, LineItem[]>();
  for (const item of items) {
    if (!item.date) continue;
    const [year, month] = item.date.split('-');
    const key = `${year}-${month}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  const months = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, items]) => {
      const [year, month] = key.split('-');
      return { key, label: `${months[parseInt(month) - 1]} ${year}`, items };
    });
}

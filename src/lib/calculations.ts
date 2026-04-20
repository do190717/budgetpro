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

export function calcGrandTotalIncome(state: AppState): number {
  return calcTotalIncome(state.projects) + calcGeneralIncome(state.generalIncome || []);
}

export function calcGrandTotalExpense(state: AppState): number {
  return calcTotalExpense(state.projects) + calcGeneralExpense(state.generalExpense || []);
}

export function calcGrandTotalProfit(state: AppState): number {
  return calcGrandTotalIncome(state) - calcGrandTotalExpense(state);
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
  const totalProfit = calcGrandTotalProfit(state);
  const netProfit = calcNetProfit(totalProfit, state.deductions);
  const maasarRequired = Math.round(netProfit * (state.maasarPct / 100));
  const maasarPaid = calcMaasarPaid(state.maasarPayments);
  return Math.max(0, maasarRequired - maasarPaid);
}

export function calcMaasarRequired(state: AppState): number {
  const totalProfit = calcGrandTotalProfit(state);
  const netProfit = calcNetProfit(totalProfit, state.deductions);
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

export interface LineItem {
  id: string;
  desc: string;
  amount: number;
  note: string;
  date: string;
  expenseCategory?: 'work' | 'home';
}

export interface Project {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  income: LineItem[];
  expense: LineItem[];
}

export interface Deduction {
  id: string;
  name: string;
  pct: number;
  enabled: boolean;
}

export interface MaasarPayment {
  id: string;
  date: string;
  desc: string;
  amount: number;
}

export interface RecurringPayment {
  id: string;
  desc: string;
  amount: number;
  dayOfMonth: number;
  lastRegistered: string;
  enabled: boolean;
}

export interface RecurringGeneralItem {
  id: string;
  type: 'income' | 'expenseWork' | 'expenseHome';
  desc: string;
  amount: number;
  dayOfMonth: number;
  lastRegistered: string;
  enabled: boolean;
}

export interface AppState {
  projects: Project[];
  deductions: Deduction[];
  maasarPct: number;
  maasarPayments: MaasarPayment[];
  recurringPayments: RecurringPayment[];
  generalIncome: LineItem[];
  generalExpenseWork: LineItem[];
  generalExpenseHome: LineItem[];
  recurringGeneralItems: RecurringGeneralItem[];
  businessName: string;
  businessSubtitle: string;
}

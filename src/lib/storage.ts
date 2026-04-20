import { AppState, Project, Deduction, MaasarPayment, RecurringPayment } from './types';

const STORAGE_KEY = 'budgetpro_state';

const defaultDeductions: Deduction[] = [
  { id: '1', name: 'מס הכנסה', pct: 25, enabled: true },
  { id: '2', name: 'ביטוח לאומי', pct: 12, enabled: true },
  { id: '3', name: 'מע"מ', pct: 17, enabled: true },
];

const defaultState: AppState = {
  projects: [],
  deductions: defaultDeductions,
  maasarPct: 10,
  maasarPayments: [],
  recurringPayments: [],
  generalIncome: [],
  generalExpense: [],
  recurringGeneralItems: [],
};

export function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultState;

    const parsed = JSON.parse(stored);
    return { ...defaultState, ...parsed };
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.error('Failed to save state');
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function addProject(state: AppState, project: Project): AppState {
  return { ...state, projects: [...state.projects, project] };
}

export function updateProject(state: AppState, project: Project): AppState {
  return {
    ...state,
    projects: state.projects.map(p => p.id === project.id ? project : p),
  };
}

export function deleteProject(state: AppState, projectId: string): AppState {
  return {
    ...state,
    projects: state.projects.filter(p => p.id !== projectId),
  };
}

export function updateDeductions(state: AppState, deductions: Deduction[]): AppState {
  return { ...state, deductions };
}

export function updateMaasarPct(state: AppState, pct: number): AppState {
  return { ...state, maasarPct: pct };
}

export function addMaasarPayment(state: AppState, payment: MaasarPayment): AppState {
  return { ...state, maasarPayments: [...state.maasarPayments, payment] };
}

export function deleteMaasarPayment(state: AppState, paymentId: string): AppState {
  return {
    ...state,
    maasarPayments: state.maasarPayments.filter(p => p.id !== paymentId),
  };
}

export function addRecurringPayment(state: AppState, payment: RecurringPayment): AppState {
  return { ...state, recurringPayments: [...state.recurringPayments, payment] };
}

export function updateRecurringPayment(state: AppState, payment: RecurringPayment): AppState {
  return {
    ...state,
    recurringPayments: state.recurringPayments.map(p => p.id === payment.id ? payment : p),
  };
}

export function deleteRecurringPayment(state: AppState, paymentId: string): AppState {
  return {
    ...state,
    recurringPayments: state.recurringPayments.filter(p => p.id !== paymentId),
  };
}

import { AppState, Project, Deduction, MaasarPayment, RecurringPayment } from './types';

// פונקציות עזר בלבד — השמירה מתבצעת דרך db.ts עם Supabase

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

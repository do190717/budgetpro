'use client';

import { useState, useEffect, useRef } from 'react';
import { AppState, RecurringPayment, MaasarPayment, LineItem, RecurringGeneralItem } from '@/lib/types';
import { generateId } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import {
  loadStateFromDB,
  saveProjectToDB,
  deleteProjectFromDB,
  saveDeductionsToDB,
  saveMaasarPctToDB,
  saveMaasarPaymentToDB,
  deleteMaasarPaymentFromDB,
  saveRecurringPaymentToDB,
  deleteRecurringPaymentFromDB,
  saveGeneralItemsToDB,
  saveRecurringGeneralItemToDB,
  deleteRecurringGeneralItemFromDB,
  saveBusinessInfoToDB,
} from '@/lib/db';
import Dashboard from '@/components/Dashboard';
import AuthScreen from '@/components/AuthScreen';
import { User } from '@supabase/supabase-js';

function getMonthsToCheck(dayOfMonth: number, lastRegistered: string): { year: number; month: number }[] {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const months: { year: number; month: number }[] = [];
  const lastReg = lastRegistered ? new Date(lastRegistered) : null;

  if (!lastReg) {
    if (todayDay >= dayOfMonth) months.push({ year: todayYear, month: todayMonth });
  } else {
    let y = lastReg.getFullYear(), m = lastReg.getMonth();
    m++; if (m > 11) { m = 0; y++; }
    while (y < todayYear || (y === todayYear && m <= todayMonth)) {
      const isCurrentMonth = y === todayYear && m === todayMonth;
      if (!isCurrentMonth || todayDay >= dayOfMonth) months.push({ year: y, month: m });
      m++; if (m > 11) { m = 0; y++; }
    }
  }
  return months;
}

function makeDate(year: number, month: number, day: number): string {
  const d = Math.min(day, new Date(year, month + 1, 0).getDate());
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function checkRecurringPayments(state: AppState): { state: AppState; notifications: string[] } {
  let updatedState = { ...state };
  const notifications: string[] = [];
  const updatedRecurring: RecurringPayment[] = [];

  for (const rp of (state.recurringPayments || [])) {
    if (!rp.enabled) { updatedRecurring.push(rp); continue; }
    const months = getMonthsToCheck(rp.dayOfMonth, rp.lastRegistered);
    if (months.length === 0) { updatedRecurring.push(rp); continue; }

    const fmt = (n: number) => '₪' + Math.round(n).toLocaleString('he-IL');
    const confirmed = window.confirm(`הפרשה קבועה ממתינה:\n"${rp.desc}" — ${fmt(rp.amount)}${months.length > 1 ? `\n(${months.length} חודשים)` : ''}\n\nלאשר ולרשום?`);
    if (!confirmed) { updatedRecurring.push(rp); continue; }

    const newPayments: MaasarPayment[] = months.map(({ year, month }) => {
      const dateStr = makeDate(year, month, rp.dayOfMonth);
      notifications.push(`הפרשה: ${rp.desc} — ${fmt(rp.amount)} (${dateStr.split('-').reverse().join('/')})`);
      return { id: generateId(), date: dateStr, desc: rp.desc, amount: rp.amount };
    });

    newPayments.forEach(p => saveMaasarPaymentToDB(p));
    updatedState = { ...updatedState, maasarPayments: [...updatedState.maasarPayments, ...newPayments] };
    const last = months[months.length - 1];
    const updated = { ...rp, lastRegistered: makeDate(last.year, last.month, rp.dayOfMonth) };
    saveRecurringPaymentToDB(updated);
    updatedRecurring.push(updated);
  }

  return { state: { ...updatedState, recurringPayments: updatedRecurring }, notifications };
}

function checkRecurringGeneralItems(state: AppState): { state: AppState; notifications: string[] } {
  let updatedState = { ...state };
  const notifications: string[] = [];
  const updatedItems: RecurringGeneralItem[] = [];

  for (const rg of (state.recurringGeneralItems || [])) {
    if (!rg.enabled) { updatedItems.push(rg); continue; }
    const months = getMonthsToCheck(rg.dayOfMonth, rg.lastRegistered);
    if (months.length === 0) { updatedItems.push(rg); continue; }

    const fmt = (n: number) => '₪' + Math.round(n).toLocaleString('he-IL');
    const typeLabel = rg.type === 'income' ? 'הכנסה' : 'הוצאה';
    const confirmed = window.confirm(`${typeLabel} קבועה ממתינה:\n"${rg.desc}" — ${fmt(rg.amount)}${months.length > 1 ? `\n(${months.length} חודשים)` : ''}\n\nלאשר ולרשום?`);
    if (!confirmed) { updatedItems.push(rg); continue; }

    const newItems: LineItem[] = months.map(({ year, month }) => {
      const dateStr = makeDate(year, month, rg.dayOfMonth);
      notifications.push(`${typeLabel}: ${rg.desc} — ${fmt(rg.amount)} (${dateStr.split('-').reverse().join('/')})`);
      return { id: generateId(), desc: rg.desc, amount: rg.amount, note: '', date: dateStr };
    });

    const field = rg.type === 'income' ? 'generalIncome' : 'generalExpense';
    const updatedList = [...(updatedState[field] || []), ...newItems];
    updatedState = { ...updatedState, [field]: updatedList };
    saveGeneralItemsToDB(updatedList, rg.type);

    const last = months[months.length - 1];
    const updated = { ...rg, lastRegistered: makeDate(last.year, last.month, rg.dayOfMonth) };
    saveRecurringGeneralItemToDB(updated);
    updatedItems.push(updated);
  }

  return { state: { ...updatedState, recurringGeneralItems: updatedItems }, notifications };
}

export default function Home() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [state, setState] = useState<AppState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    loadStateFromDB().then(loaded => {
      let current = loaded;
      const allNotifications: string[] = [];

      if ((current.recurringPayments || []).some(r => r.enabled)) {
        const { state: s, notifications: n } = checkRecurringPayments(current);
        current = s; allNotifications.push(...n);
      }
      if ((current.recurringGeneralItems || []).some(r => r.enabled)) {
        const { state: s, notifications: n } = checkRecurringGeneralItems(current);
        current = s; allNotifications.push(...n);
      }

      setState(current);
      if (allNotifications.length > 0) {
        setToast(allNotifications.join('\n'));
        setTimeout(() => setToast(null), 6000);
      }
    });
  }, [user]);

  const handleStateChange = (newState: AppState) => {
    if (!state) return;
    setState(newState);

    const prevProjects = new Map(state.projects.map(p => [p.id, p]));
    const newProjects = new Map(newState.projects.map(p => [p.id, p]));
    for (const [id, project] of newProjects) {
      const prev = prevProjects.get(id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(project)) {
        if (saveTimers.current.has(id)) clearTimeout(saveTimers.current.get(id)!);
        saveTimers.current.set(id, setTimeout(() => saveProjectToDB(project), 800));
      }
    }
    for (const [id] of prevProjects) { if (!newProjects.has(id)) deleteProjectFromDB(id); }

    if (JSON.stringify(state.deductions) !== JSON.stringify(newState.deductions)) saveDeductionsToDB(newState.deductions);
    if (state.maasarPct !== newState.maasarPct) saveMaasarPctToDB(newState.maasarPct);

    const prevPayments = new Map(state.maasarPayments.map(p => [p.id, p]));
    const newPayments = new Map(newState.maasarPayments.map(p => [p.id, p]));
    for (const [id, p] of newPayments) { if (!prevPayments.has(id)) saveMaasarPaymentToDB(p); }
    for (const [id] of prevPayments) { if (!newPayments.has(id)) deleteMaasarPaymentFromDB(id); }

    const prevRecurring = new Map((state.recurringPayments || []).map(r => [r.id, r]));
    const newRecurring = new Map((newState.recurringPayments || []).map(r => [r.id, r]));
    for (const [id, r] of newRecurring) {
      const prev = prevRecurring.get(id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(r)) saveRecurringPaymentToDB(r);
    }
    for (const [id] of prevRecurring) { if (!newRecurring.has(id)) deleteRecurringPaymentFromDB(id); }

    if (JSON.stringify(state.generalIncome) !== JSON.stringify(newState.generalIncome)) {
      if (saveTimers.current.has('gi')) clearTimeout(saveTimers.current.get('gi')!);
      saveTimers.current.set('gi', setTimeout(() => saveGeneralItemsToDB(newState.generalIncome, 'income'), 800));
    }
    if (JSON.stringify(state.generalExpense) !== JSON.stringify(newState.generalExpense)) {
      if (saveTimers.current.has('ge')) clearTimeout(saveTimers.current.get('ge')!);
      saveTimers.current.set('ge', setTimeout(() => saveGeneralItemsToDB(newState.generalExpense, 'expense'), 800));
    }

    const prevRG = new Map((state.recurringGeneralItems || []).map(r => [r.id, r]));
    const newRG = new Map((newState.recurringGeneralItems || []).map(r => [r.id, r]));
    for (const [id, r] of newRG) {
      const prev = prevRG.get(id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(r)) saveRecurringGeneralItemToDB(r);
    }
    for (const [id] of prevRG) { if (!newRG.has(id)) deleteRecurringGeneralItemFromDB(id); }

    if (state.businessName !== newState.businessName || state.businessSubtitle !== newState.businessSubtitle) {
      saveBusinessInfoToDB(newState.businessName, newState.businessSubtitle);
    }
  };

  if (user === undefined) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}><div style={{ color: '#9CA3AF' }}>טוען...</div></div>;
  if (!user) return <AuthScreen />;
  if (!state) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}><div style={{ color: '#9CA3AF' }}>טוען נתונים...</div></div>;

  return (
    <>
      <Dashboard state={state} onStateChange={handleStateChange} />
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '16px', left: '16px', maxWidth: '440px', margin: '0 auto', background: '#1E3A5F', color: '#fff', padding: '14px 18px', borderRadius: '12px', fontSize: '14px', lineHeight: '1.8', direction: 'rtl', zIndex: 9999, whiteSpace: 'pre-line' }}>
          <div style={{ fontWeight: '500', marginBottom: '4px' }}>✓ פריטים נרשמו אוטומטית</div>
          <div style={{ fontSize: '13px', opacity: 0.85 }}>{toast}</div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState } from 'react';
import { AppState, Deduction, MaasarPayment, RecurringPayment } from '@/lib/types';
import { generateId, updateDeductions, updateMaasarPct, addMaasarPayment, deleteMaasarPayment, addRecurringPayment, updateRecurringPayment, deleteRecurringPayment } from '@/lib/storage';
import {
  calcTotalProfit,
  calcDeductionAmount,
  calcTotalDeductions,
  calcNetProfit,
  calcMaasarRequired,
  calcMaasarPaid,
  calcMaasarOwed,
  formatCurrency,
  formatDate,
} from '@/lib/calculations';
import ConfirmModal from './ConfirmModal';

interface FinanceTabProps {
  state: AppState;
  onStateChange: (state: AppState) => void;
}

type AddMode = null | 'choose' | 'single' | 'recurring';

export default function FinanceTab({ state, onStateChange }: FinanceTabProps) {
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentDesc, setPaymentDesc] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isEditingDeduction, setIsEditingDeduction] = useState<string | null>(null);
  const [isDeductionsOpen, setIsDeductionsOpen] = useState(false);
  const [focusedDeductionId, setFocusedDeductionId] = useState<string | null>(null);
  // --- תוספת: הפרשות חוזרות ---
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [recurringDesc, setRecurringDesc] = useState('');
  const [recurringAmount, setRecurringAmount] = useState('');
  const [recurringDay, setRecurringDay] = useState('1');
  const [confirmState, setConfirmState] = useState<{open: boolean, title: string, onConfirm: () => void}>({open: false, title: '', onConfirm: () => {}});

  const totalProfit = calcTotalProfit(state.projects);
  const totalDeductions = calcTotalDeductions(totalProfit, state.deductions);
  const netProfit = calcNetProfit(totalProfit, state.deductions);
  const maasarRequired = calcMaasarRequired(state);
  const maasarPaid = calcMaasarPaid(state.maasarPayments);
  const maasarOwed = calcMaasarOwed(state);
  const hasSurplus = maasarPaid > maasarRequired;
  const balance = hasSurplus ? maasarPaid - maasarRequired : maasarOwed;
  const recurringPayments: RecurringPayment[] = state.recurringPayments ?? [];

  const handleToggleDeduction = (deductionId: string) => {
    const updated = state.deductions.map(d =>
      d.id === deductionId ? { ...d, enabled: !d.enabled } : d
    );
    onStateChange(updateDeductions(state, updated));
  };

  const handleUpdateDeductionPct = (deductionId: string, pct: number) => {
    const updated = state.deductions.map(d =>
      d.id === deductionId ? { ...d, pct } : d
    );
    onStateChange(updateDeductions(state, updated));
    setIsEditingDeduction(null);
  };

  const handleUpdateMaasarPct = (pct: number) => {
    onStateChange(updateMaasarPct(state, pct));
  };

  const handleAddPayment = () => {
    if (!paymentDesc.trim() || !paymentAmount) return;

    const payment: MaasarPayment = {
      id: generateId(),
      date: paymentDate,
      desc: paymentDesc.trim(),
      amount: parseFloat(paymentAmount),
    };

    onStateChange(addMaasarPayment(state, payment));
    setPaymentDesc('');
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setIsAddingPayment(false);
    setAddMode(null);
  };

  const handleDeletePayment = (paymentId: string) => {
    setConfirmState({
      open: true,
      title: 'האם למחוק את ההפרשה?',
      onConfirm: () => {
        onStateChange(deleteMaasarPayment(state, paymentId));
      }
    });
  };

  const addNewDeduction = () => {
    const newDeduction: Deduction = {
      id: generateId(),
      name: 'ניכוי חדש',
      pct: 0,
      enabled: true,
    };
    onStateChange(updateDeductions(state, [...state.deductions, newDeduction]));
    setIsEditingDeduction(newDeduction.id);
  };

  const deleteDeduction = (deductionId: string) => {
    setConfirmState({
      open: true,
      title: 'האם למחוק את הניכוי?',
      onConfirm: () => {
        const updated = state.deductions.filter(d => d.id !== deductionId);
        onStateChange(updateDeductions(state, updated));
      }
    });
  };

  const updateDeductionName = (deductionId: string, name: string) => {
    const updated = state.deductions.map(d =>
      d.id === deductionId ? { ...d, name } : d
    );
    onStateChange(updateDeductions(state, updated));
  };

  // --- תוספת: פונקציות הפרשות חוזרות ---
  const handleAddRecurring = () => {
    if (!recurringDesc.trim() || !recurringAmount) return;
    const day = Math.min(Math.max(parseInt(recurringDay) || 1, 1), 28);
    const rp: RecurringPayment = {
      id: generateId(),
      desc: recurringDesc.trim(),
      amount: parseFloat(recurringAmount),
      dayOfMonth: day,
      lastRegistered: '',
      enabled: true,
    };
    onStateChange(addRecurringPayment(state, rp));
    setRecurringDesc(''); setRecurringAmount(''); setRecurringDay('1');
    setAddMode(null);
    setIsRecurringOpen(true);
  };

  const handleToggleRecurring = (id: string) => {
    const rp = recurringPayments.find((r: RecurringPayment) => r.id === id);
    if (rp) onStateChange(updateRecurringPayment(state, { ...rp, enabled: !rp.enabled }));
  };

  const handleDeleteRecurring = (id: string) => {
    setConfirmState({
      open: true,
      title: 'האם למחוק את ההפרשה הקבועה?',
      onConfirm: () => {
        onStateChange(deleteRecurringPayment(state, id));
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* בלוק 1 — ניכויים (Accordion) */}
      <section>
        <h3 className="text-sm font-medium text-gray-500 mb-2">ניכויי מס</h3>
        <div className="border border-gray-300 rounded-xl overflow-hidden bg-white">
          {/* Accordion Header */}
          <button
            onClick={() => setIsDeductionsOpen(!isDeductionsOpen)}
            className="w-full px-4 py-3 bg-gray-100 border-b border-gray-300 flex justify-between items-center cursor-pointer hover:bg-gray-150 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span
                className="text-gray-500 transition-transform duration-250"
                style={{
                  display: 'inline-block',
                  transform: isDeductionsOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                }}
              >
                ▶
              </span>
              <h2 className="font-semibold text-gray-700">ניכויים</h2>
            </div>
            <span
              onClick={(e) => {
                e.stopPropagation();
                addNewDeduction();
                setIsDeductionsOpen(true);
              }}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              + הוסף ניכוי
            </span>
          </button>

          {/* Summary when closed */}
          {!isDeductionsOpen && (
            <div className="px-4 py-3 flex justify-between items-center text-sm" style={{ backgroundColor: '#F1EFE8' }}>
              <span className="text-gray-600">
                רווח: <span className="font-medium text-gray-800">{formatCurrency(totalProfit)}</span>
              </span>
              <span className="text-gray-600">
                ניכויים: <span className="font-medium text-gray-800">{formatCurrency(totalDeductions)}</span>
              </span>
            </div>
          )}

          {/* Accordion Content */}
          <div
            style={{
              maxHeight: isDeductionsOpen ? '1000px' : '0px',
              overflow: 'hidden',
              transition: 'max-height 0.25s ease',
            }}
          >
            {/* Deductions List */}
            <div className="divide-y divide-gray-200">
              {/* שורה קבועה - רווח לפני ניכויים */}
              <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#F1EFE8' }}>
                <span className="font-medium text-gray-800">רווח לפני ניכויים</span>
                <span className="font-medium text-gray-800">{formatCurrency(totalProfit)}</span>
              </div>

              {state.deductions.map(deduction => (
                <div
                  key={deduction.id}
                  className="flex items-center transition-colors"
                  style={{
                    backgroundColor: focusedDeductionId === deduction.id ? '#EEF4FF' : '#FAFAFA',
                    padding: '0',
                  }}
                  onFocus={() => setFocusedDeductionId(deduction.id)}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setFocusedDeductionId(null);
                    }
                  }}
                >
                  <div className="flex-shrink-0 px-2 sm:px-3">
                    <input
                      type="checkbox"
                      checked={deduction.enabled}
                      onChange={() => handleToggleDeduction(deduction.id)}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-400 text-gray-600 focus:ring-gray-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={deduction.name}
                      onChange={e => updateDeductionName(deduction.id, e.target.value)}
                      className={`w-full ${!deduction.enabled ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                      style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', padding: '7px 8px', direction: 'rtl' }}
                    />
                  </div>
                  <div className="flex-shrink-0 flex items-center">
                    <input
                      type="number"
                      value={deduction.pct}
                      onChange={e => handleUpdateDeductionPct(deduction.id, parseFloat(e.target.value) || 0)}
                      className="text-gray-700 text-center"
                      style={{ width: '45px', border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', padding: '7px 4px' }}
                      min="0" max="100"
                    />
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                  <div
                    className={`flex-shrink-0 text-left font-medium ${deduction.enabled ? 'text-gray-700' : 'text-gray-400'}`}
                    style={{ fontSize: '13px', padding: '7px 8px', minWidth: '70px' }}
                  >
                    {formatCurrency(calcDeductionAmount(totalProfit, deduction))}
                  </div>
                  <button onClick={() => deleteDeduction(deduction.id)} className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors px-2 sm:px-3 py-2" title="מחק">✕</button>
                </div>
              ))}
            </div>

            <div className="px-4 py-4 bg-gray-200 flex justify-between items-center">
              <span className="font-bold text-gray-700 text-lg">סה״כ ניכויים</span>
              <span className="font-bold text-gray-800 text-lg">{formatCurrency(totalDeductions)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* בלוק 2 — מעשר */}
      <section>
        <h3 className="text-sm font-medium text-gray-500 mb-2">חישוב מעשר</h3>
        <div className="border border-amber-300 rounded-xl overflow-hidden bg-white">
          <div className="px-4 py-4 flex items-center justify-between border-b border-amber-200 bg-amber-50/50">
            <span className="font-medium text-amber-800">יתרה לאחר ניכויים</span>
            <span className="font-bold text-amber-900 text-lg">{formatCurrency(netProfit)}</span>
          </div>
          <div className="px-4 py-4 flex items-center justify-between border-b border-amber-200" style={{ backgroundColor: '#FEF9E7' }}>
            <span className="font-medium text-amber-800">אחוז מעשר</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={state.maasarPct}
                  onChange={e => handleUpdateMaasarPct(parseFloat(e.target.value) || 0)}
                  className="w-14 px-2 py-1 border border-amber-300 rounded text-center bg-white text-amber-800 font-medium"
                  min="0" max="100"
                />
                <span className="text-amber-700">%</span>
              </div>
              <span className="text-amber-700 font-medium">= {formatCurrency(maasarRequired)}</span>
            </div>
          </div>
          <div className="px-4 py-5 flex justify-between items-center" style={{ backgroundColor: '#FAEEDA' }}>
            <span className="font-bold text-lg" style={{ color: '#B45309' }}>סה״כ חייב במעשר</span>
            <span className="font-bold text-xl" style={{ color: '#B45309' }}>{formatCurrency(maasarRequired)}</span>
          </div>
        </div>
      </section>

      {/* בלוק 3 — הפרשות */}
      <section>
        <h3 className="text-sm font-medium text-gray-500 mb-2">הפרשות מעשר</h3>
        <div className="border border-gray-300 rounded-xl overflow-hidden bg-white">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-100 border-b border-gray-300 flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">הפרשות שבוצעו</h2>
            {!addMode && !isAddingPayment && (
              <button
                onClick={() => setAddMode('choose')}
                className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700"
              >
                + הפרשה חדשה
              </button>
            )}
          </div>

          {/* --- תוספת: בחירת סוג --- */}
          {addMode === 'choose' && (
            <div className="p-4 bg-green-50 border-b border-green-200">
              <div className="text-sm font-medium text-gray-700 mb-3 text-right">בחר סוג הפרשה:</div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setAddMode('single'); setIsAddingPayment(true); }}
                  style={{ flex: 1, background: '#fff', border: '2px solid #1D9E75', borderRadius: '10px', padding: '14px 8px', cursor: 'pointer', textAlign: 'center' }}
                >
                  <div style={{ fontSize: '22px', marginBottom: '6px' }}>💸</div>
                  <div style={{ fontWeight: '500', color: '#1D9E75', fontSize: '14px' }}>חד פעמית</div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>הפרשה בתאריך מסוים</div>
                </button>
                <button
                  onClick={() => setAddMode('recurring')}
                  style={{ flex: 1, background: '#fff', border: '2px solid #2563EB', borderRadius: '10px', padding: '14px 8px', cursor: 'pointer', textAlign: 'center' }}
                >
                  <div style={{ fontSize: '22px', marginBottom: '6px' }}>🔁</div>
                  <div style={{ fontWeight: '500', color: '#2563EB', fontSize: '14px' }}>קבועה חוזרת</div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>נרשמת כל חודש אוטומטית</div>
                </button>
              </div>
              <button onClick={() => setAddMode(null)} style={{ marginTop: '10px', background: 'none', border: 'none', color: '#6B7280', fontSize: '13px', cursor: 'pointer', width: '100%', textAlign: 'center' }}>ביטול</button>
            </div>
          )}

          {/* טופס חד פעמית — זהה לטופס המקורי */}
          {addMode === 'single' && isAddingPayment && (
            <div className="p-4 bg-green-50 border-b border-green-200">
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
                    <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">תיאור</label>
                    <input type="text" value={paymentDesc} onChange={e => setPaymentDesc(e.target.value)} placeholder="לדוגמה: תרומה לעמותה" className="w-full px-3 py-2 border border-gray-300 rounded-lg" autoFocus />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">סכום (₪)</label>
                    <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddPayment} className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700">הוסף</button>
                  <button onClick={() => { setIsAddingPayment(false); setPaymentDesc(''); setPaymentAmount(''); setAddMode(null); }} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300">ביטול</button>
                </div>
              </div>
            </div>
          )}

          {/* --- תוספת: טופס הפרשה חוזרת --- */}
          {addMode === 'recurring' && (
            <div className="p-4 border-b" style={{ background: '#EFF6FF' }}>
              <div className="text-sm font-medium text-blue-700 mb-3 text-right">הפרשה קבועה חוזרת</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1 text-right">סכום ₪</label>
                  <input type="number" value={recurringAmount} onChange={e => setRecurringAmount(e.target.value)} placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" autoFocus />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1 text-right">יום בחודש (1-28)</label>
                  <input type="number" value={recurringDay} onChange={e => setRecurringDay(e.target.value)} min="1" max="28" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1 text-right">תיאור</label>
                <input type="text" value={recurringDesc} onChange={e => setRecurringDesc(e.target.value)} placeholder="לדוגמה: הפרשה חודשית קבועה" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddRecurring} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ background: '#2563EB' }}>הוסף</button>
                <button onClick={() => { setRecurringDesc(''); setRecurringAmount(''); setRecurringDay('1'); setAddMode(null); }} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm">ביטול</button>
              </div>
            </div>
          )}

          {/* Payments Table — זהה למקורי */}
          {state.maasarPayments.length === 0 ? (
            <div className="p-8 text-center text-gray-400">אין הפרשות עדיין</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm">
                    <th className="px-4 py-3 text-right font-medium" style={{ width: '25%' }}>תאריך</th>
                    <th className="px-4 py-3 text-right font-medium" style={{ width: '40%' }}>תיאור</th>
                    <th className="px-4 py-3 text-right font-medium" style={{ width: '25%' }}>סכום</th>
                    <th className="px-4 py-3 text-center font-medium" style={{ width: '10%' }}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {state.maasarPayments.map(payment => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{formatDate(payment.date)}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium truncate">{payment.desc}</td>
                      <td className="px-4 py-3 text-gray-800 font-medium">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleDeletePayment(payment.id)} className="text-gray-400 hover:text-red-500" title="מחק">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-4 py-4 bg-green-100 border-t border-green-200 flex justify-between items-center">
            <span className="font-bold text-green-800 text-lg">סה״כ הופרש</span>
            <span className="font-bold text-green-700 text-lg">{formatCurrency(maasarPaid)}</span>
          </div>

          <div
            className="px-6 py-6 flex justify-between items-center"
            style={{ backgroundColor: hasSurplus || balance === 0 ? '#EAF3DE' : '#FCEBEB', color: hasSurplus || balance === 0 ? '#27500A' : '#A32D2D' }}
          >
            <span className="font-bold text-xl">{hasSurplus ? 'עודף' : balance > 0 ? 'יתרת חוב' : 'מאוזן'}</span>
            <span className="font-bold text-2xl">{formatCurrency(balance)}</span>
          </div>

          {/* --- תוספת: accordion הפרשות קבועות --- */}
          <div className="border-t border-gray-200">
            <button onClick={() => setIsRecurringOpen(!isRecurringOpen)} className="w-full px-4 py-3 bg-gray-50 flex justify-between items-center text-sm">
              <span style={{ display: 'inline-block', transform: isRecurringOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#6B7280' }}>▶</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600">הפרשות קבועות</span>
                {recurringPayments.length > 0 && (
                  <span style={{ background: '#DBEAFE', color: '#1D4ED8', fontSize: '11px', padding: '1px 8px', borderRadius: '999px' }}>{recurringPayments.length}</span>
                )}
              </div>
            </button>
            <div style={{ maxHeight: isRecurringOpen ? '500px' : '0', overflow: 'hidden', transition: 'max-height 0.25s ease' }}>
              {recurringPayments.length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-400 text-sm">אין הפרשות קבועות עדיין</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recurringPayments.map((rp: RecurringPayment) => (
                    <div key={rp.id} className="flex items-center px-4 py-3 gap-3" style={{ background: rp.enabled ? '#F8FBFF' : '#F9FAFB' }}>
                      <button onClick={() => handleDeleteRecurring(rp.id)} className="text-gray-300 hover:text-red-500 text-sm flex-shrink-0">✕</button>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: rp.enabled ? '#1F2937' : '#9CA3AF', textDecoration: rp.enabled ? 'none' : 'line-through' }}>{rp.desc}</div>
                        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>יום {rp.dayOfMonth} לחודש · {formatCurrency(rp.amount)}</div>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flexShrink: 0 }}>
                        <span style={{ fontSize: '12px', color: rp.enabled ? '#059669' : '#9CA3AF' }}>{rp.enabled ? 'פעיל' : 'כבוי'}</span>
                        <input type="checkbox" checked={rp.enabled} onChange={() => handleToggleRecurring(rp.id)} style={{ width: '16px', height: '16px', accentColor: '#2563EB', cursor: 'pointer' }} />
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      <ConfirmModal
        isOpen={confirmState.open}
        title={confirmState.title}
        onConfirm={() => { confirmState.onConfirm(); setConfirmState(s => ({...s, open: false})); }}
        onCancel={() => setConfirmState(s => ({...s, open: false}))}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { AppState, LineItem, RecurringGeneralItem } from '@/lib/types';
import { generateId } from '@/lib/storage';
import { deleteGeneralItemFromDB } from '@/lib/db';
import { colors } from '@/lib/theme';
import { calcGeneralIncome, calcGeneralExpense, calcGeneralBusinessProfit, calcGeneralHomeBalance, fmt } from '@/lib/calculations';
import ConfirmModal from './ConfirmModal';

const todayStr = () => new Date().toISOString().split('T')[0];
const fmtShortDate = (d: string) => {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y.slice(2)}`;
};

const MONTHS_HE = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

const inputStyle: React.CSSProperties = {
  width: '100%', border: 'none', background: 'transparent', outline: 'none',
  padding: '8px', direction: 'rtl', fontSize: '14px',
};

interface Props {
  state: AppState;
  onStateChange: (state: AppState) => void;
}

type TableType = 'generalIncome' | 'generalExpenseWork' | 'generalExpenseHome';
type AddMode = null | `choose-${TableType}` | `single-${TableType}` | `recurring-${TableType}`;

const TABLE_CONFIG = {
  generalIncome: {
    label: 'הכנסות', sub: 'כולן נכנסות לחישוב המעשר',
    headerBg: colors.green, summaryBg: colors.greenBg, summaryColor: colors.greenLabel,
    zebraColor: colors.zebraIncome, recurringType: 'income' as RecurringGeneralItem['type'],
  },
  generalExpenseWork: {
    label: 'הוצאות עסקיות', sub: 'מתקזזות מהרווח ומפחיתות את המעשר',
    headerBg: colors.orange, summaryBg: colors.orangeBg, summaryColor: colors.orangeText,
    zebraColor: colors.zebraExpense, recurringType: 'expenseWork' as RecurringGeneralItem['type'],
  },
  generalExpenseHome: {
    label: 'הוצאות ביתיות', sub: 'לא מתקזזות מהמעשר',
    headerBg: colors.purple, summaryBg: colors.purpleBg, summaryColor: colors.purpleDeep,
    zebraColor: colors.zebraHome, recurringType: 'expenseHome' as RecurringGeneralItem['type'],
  },
};

function groupByYearMonth(items: LineItem[]): Map<string, Map<string, LineItem[]>> {
  const byYear = new Map<string, Map<string, LineItem[]>>();
  for (const item of items) {
    if (!item.date) continue;
    const [year, month] = item.date.split('-');
    if (!byYear.has(year)) byYear.set(year, new Map());
    const byMonth = byYear.get(year)!;
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(item);
  }
  return byYear;
}

function getCurrentYearMonth() {
  const now = new Date();
  return { year: String(now.getFullYear()), month: String(now.getMonth() + 1).padStart(2, '0') };
}

export default function GeneralTab({ state, onStateChange }: Props) {
  const { year: curYear, month: curMonth } = getCurrentYearMonth();

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; onConfirm: () => void }>({ open: false, title: '', onConfirm: () => {} });

  // ניווט שנה/חודש per-table
  const [selectedYear, setSelectedYear] = useState<Record<TableType, string>>({ generalIncome: curYear, generalExpenseWork: curYear, generalExpenseHome: curYear });
  const [selectedMonth, setSelectedMonth] = useState<Record<TableType, string>>({ generalIncome: curMonth, generalExpenseWork: curMonth, generalExpenseHome: curMonth });
  const [showYearPicker, setShowYearPicker] = useState<TableType | null>(null);

  const [singleDesc, setSingleDesc] = useState('');
  const [singleAmount, setSingleAmount] = useState('');
  const [singleDate, setSingleDate] = useState(todayStr());
  const [recurringDesc, setRecurringDesc] = useState('');
  const [recurringAmount, setRecurringAmount] = useState('');
  const [recurringDay, setRecurringDay] = useState('1');

  const generalIncome = state.generalIncome || [];
  const generalExpenseWork = state.generalExpenseWork || [];
  const generalExpenseHome = state.generalExpenseHome || [];
  const recurringItems = state.recurringGeneralItems || [];

  const totalIncome = calcGeneralIncome(generalIncome);
  const totalExpenseWork = calcGeneralExpense(generalExpenseWork);
  const totalExpenseHome = calcGeneralExpense(generalExpenseHome);
  const businessProfit = calcGeneralBusinessProfit(state);
  const homeBalance = calcGeneralHomeBalance(state);

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  };

  const updateItem = (field: TableType, itemId: string, key: keyof LineItem, value: string | number) => {
    onStateChange({ ...state, [field]: (state[field] as LineItem[]).map((item: LineItem) => item.id === itemId ? { ...item, [key]: value } : item) });
  };

  const toggleVat = (field: TableType, itemId: string) => {
    onStateChange({ ...state, [field]: (state[field] as LineItem[]).map((item: LineItem) => item.id === itemId ? { ...item, vatable: item.vatable === false } : item) });
  };

  const deleteRow = (field: TableType, itemId: string) => {
    onStateChange({ ...state, [field]: (state[field] as LineItem[]).filter((item: LineItem) => item.id !== itemId) });
    setExpandedRows(prev => { const s = new Set(prev); s.delete(itemId); return s; });
    // מחיקה ממוקדת ב-DB — רק השורה הזו, לעולם לא יותר
    deleteGeneralItemFromDB(itemId);
  };

  const handleAddSingle = (field: TableType) => {
    if (!singleDesc.trim() || !singleAmount || !singleDate) return;
    const newItem: LineItem = { id: generateId(), desc: singleDesc.trim(), amount: parseFloat(singleAmount), note: '', date: singleDate };
    onStateChange({ ...state, [field]: [...((state[field] as LineItem[]) || []), newItem] });
    const [y, m] = singleDate.split('-');
    setSelectedYear(prev => ({ ...prev, [field]: y }));
    setSelectedMonth(prev => ({ ...prev, [field]: m }));
    setSingleDesc(''); setSingleAmount(''); setSingleDate(todayStr());
    setAddMode(null);
  };

  const handleAddRecurring = (type: RecurringGeneralItem['type']) => {
    if (!recurringDesc.trim() || !recurringAmount) return;
    const day = Math.min(Math.max(parseInt(recurringDay) || 1, 1), 28);
    const rg: RecurringGeneralItem = { id: generateId(), type, desc: recurringDesc.trim(), amount: parseFloat(recurringAmount), dayOfMonth: day, lastRegistered: '', enabled: true };
    onStateChange({ ...state, recurringGeneralItems: [...recurringItems, rg] });
    setRecurringDesc(''); setRecurringAmount(''); setRecurringDay('1');
    setAddMode(null); setIsRecurringOpen(true);
  };

  const handleToggleRecurring = (id: string) => {
    onStateChange({ ...state, recurringGeneralItems: recurringItems.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r) });
  };

  const handleDeleteRecurring = (id: string) => {
    setConfirmState({ open: true, title: 'למחוק את הפריט הקבוע?', onConfirm: () => onStateChange({ ...state, recurringGeneralItems: recurringItems.filter(r => r.id !== id) }) });
  };

  const navigateMonth = (field: TableType, dir: 1 | -1, allYears: string[]) => {
    let y = parseInt(selectedYear[field]);
    let m = parseInt(selectedMonth[field]) + dir;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    const ys = String(y);
    if (!allYears.includes(ys)) return;
    setSelectedYear(prev => ({ ...prev, [field]: ys }));
    setSelectedMonth(prev => ({ ...prev, [field]: String(m).padStart(2, '0') }));
  };

  const choosePanel = (field: TableType) => {
    const cfg = TABLE_CONFIG[field];
    return (
      <div style={{ padding: '14px', background: colors.gray50, borderBottom: `1px solid ${colors.gray200}` }}>
        <div style={{ fontSize: '13px', color: colors.gray500, marginBottom: '10px', textAlign: 'right' }}>סוג רשומה:</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setAddMode(`single-${field}` as AddMode)} style={{ flex: 1, background: colors.white, border: `2px solid ${cfg.headerBg}`, borderRadius: '10px', padding: '10px 6px', cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', marginBottom: '3px' }}>💸</div>
            <div style={{ fontWeight: '500', color: cfg.headerBg, fontSize: '12px' }}>חד פעמית</div>
          </button>
          <button onClick={() => setAddMode(`recurring-${field}` as AddMode)} style={{ flex: 1, background: colors.white, border: `2px solid ${colors.blue}`, borderRadius: '10px', padding: '10px 6px', cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', marginBottom: '3px' }}>🔁</div>
            <div style={{ fontWeight: '500', color: colors.blue, fontSize: '12px' }}>קבועה חוזרת</div>
          </button>
        </div>
        <button onClick={() => setAddMode(null)} style={{ marginTop: '8px', background: 'none', border: 'none', color: colors.gray400, fontSize: '12px', cursor: 'pointer', width: '100%' }}>ביטול</button>
      </div>
    );
  };

  const singleForm = (field: TableType) => {
    const cfg = TABLE_CONFIG[field];
    return (
      <div style={{ padding: '14px', background: colors.gray50, borderBottom: `1px solid ${colors.gray200}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <div>
            <label style={{ fontSize: '11px', color: colors.gray500, display: 'block', marginBottom: '3px', textAlign: 'right' }}>תאריך</label>
            <input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} required style={{ width: '100%', border: `1px solid ${colors.gray300}`, borderRadius: '6px', padding: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: colors.gray500, display: 'block', marginBottom: '3px', textAlign: 'right' }}>סכום ₪</label>
            <input type="number" value={singleAmount} onChange={e => setSingleAmount(e.target.value)} placeholder="0" autoFocus style={{ width: '100%', border: `1px solid ${colors.gray300}`, borderRadius: '6px', padding: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '11px', color: colors.gray500, display: 'block', marginBottom: '3px', textAlign: 'right' }}>תיאור</label>
          <input type="text" value={singleDesc} onChange={e => setSingleDesc(e.target.value)} placeholder="תיאור..." style={{ width: '100%', border: `1px solid ${colors.gray300}`, borderRadius: '6px', padding: '8px', fontSize: '13px', direction: 'rtl', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => handleAddSingle(field)} style={{ background: cfg.headerBg, color: colors.white, border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>הוסף</button>
          <button onClick={() => { setSingleDesc(''); setSingleAmount(''); setAddMode(null); }} style={{ background: colors.gray100, color: colors.gray500, border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' }}>ביטול</button>
        </div>
      </div>
    );
  };

  const recurringForm = (field: TableType) => {
    const cfg = TABLE_CONFIG[field];
    return (
      <div style={{ padding: '14px', background: colors.blueBg, borderBottom: `1px solid ${colors.gray200}` }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: colors.blue, marginBottom: '10px', textAlign: 'right' }}>{cfg.label} — קבועה חוזרת</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <div>
            <label style={{ fontSize: '11px', color: colors.gray500, display: 'block', marginBottom: '3px', textAlign: 'right' }}>סכום ₪</label>
            <input type="number" value={recurringAmount} onChange={e => setRecurringAmount(e.target.value)} placeholder="0" autoFocus style={{ width: '100%', border: `1px solid ${colors.gray300}`, borderRadius: '6px', padding: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: colors.gray500, display: 'block', marginBottom: '3px', textAlign: 'right' }}>יום (1-28)</label>
            <input type="number" value={recurringDay} onChange={e => setRecurringDay(e.target.value)} min="1" max="28" style={{ width: '100%', border: `1px solid ${colors.gray300}`, borderRadius: '6px', padding: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '11px', color: colors.gray500, display: 'block', marginBottom: '3px', textAlign: 'right' }}>תיאור</label>
          <input type="text" value={recurringDesc} onChange={e => setRecurringDesc(e.target.value)} placeholder="תיאור..." style={{ width: '100%', border: `1px solid ${colors.gray300}`, borderRadius: '6px', padding: '8px', fontSize: '13px', direction: 'rtl', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => handleAddRecurring(cfg.recurringType)} style={{ background: colors.blue, color: colors.white, border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>הוסף</button>
          <button onClick={() => { setRecurringDesc(''); setRecurringAmount(''); setAddMode(null); }} style={{ background: colors.gray100, color: colors.gray500, border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' }}>ביטול</button>
        </div>
      </div>
    );
  };

  const renderTable = (field: TableType) => {
    const cfg = TABLE_CONFIG[field];
    const allItems = (state[field] as LineItem[]) || [];
    const total = allItems.reduce((s, i) => s + i.amount, 0);
    const byYearMonth = groupByYearMonth(allItems);
    const allYears = Array.from(byYearMonth.keys()).sort((a, b) => b.localeCompare(a));
    const curSelYear = selectedYear[field];
    const curSelMonth = selectedMonth[field];
    const items = byYearMonth.get(curSelYear)?.get(curSelMonth) || [];
    const monthTotal = items.reduce((s, i) => s + i.amount, 0);
    const isCurrentPeriod = curSelYear === curYear && curSelMonth === curMonth;
    const chooseMode = `choose-${field}` as AddMode;
    const singleMode = `single-${field}` as AddMode;
    const recurringMode = `recurring-${field}` as AddMode;

    // חישוב שניתן לנווט קדימה/אחורה
    const canGoBack = (() => {
      let m = parseInt(curSelMonth) - 1; let y = parseInt(curSelYear);
      if (m < 1) { m = 12; y--; }
      return allYears.includes(String(y)) && (byYearMonth.get(String(y))?.has(String(m).padStart(2, '0')) ?? false);
    })();
    const canGoForward = (() => {
      let m = parseInt(curSelMonth) + 1; let y = parseInt(curSelYear);
      if (m > 12) { m = 1; y++; }
      return allYears.includes(String(y)) && (byYearMonth.get(String(y))?.has(String(m).padStart(2, '0')) ?? false);
    })();

    return (
      <section style={{ marginBottom: '12px' }}>
        <div style={{ border: `1px solid ${colors.gray200}`, overflow: 'hidden' }}>

          {/* כותרת + ניווט בשורה אחת */}
          <div style={{ background: cfg.headerBg, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* שם */}
            <span style={{ color: colors.white, fontWeight: '500', fontSize: '13px', flexShrink: 0 }}>{cfg.label}</span>

            {/* ניווט חודש/שנה */}
            {allItems.length > 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                {/* חץ חודש קודם */}
                <button onClick={() => navigateMonth(field, -1, allYears)} disabled={!canGoBack}
                  style={{ background: 'none', border: 'none', color: canGoBack ? colors.white : 'rgba(255,255,255,0.25)', fontSize: '16px', cursor: canGoBack ? 'pointer' : 'default', padding: '0 2px', lineHeight: 1 }}>‹</button>

                {/* חודש נוכחי */}
                <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '4px', color: colors.white, fontSize: '11px', padding: '2px 8px', fontWeight: '500', minWidth: '40px', textAlign: 'center' }}>
                  {MONTHS_HE[parseInt(curSelMonth) - 1]}
                </span>

                {/* חץ חודש הבא */}
                <button onClick={() => navigateMonth(field, 1, allYears)} disabled={!canGoForward}
                  style={{ background: 'none', border: 'none', color: canGoForward ? colors.white : 'rgba(255,255,255,0.25)', fontSize: '16px', cursor: canGoForward ? 'pointer' : 'default', padding: '0 2px', lineHeight: 1 }}>›</button>

                {/* בורר שנה */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowYearPicker(showYearPicker === field ? null : field); }}
                    style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '4px', color: colors.white, fontSize: '11px', padding: '2px 6px', cursor: 'pointer' }}>
                    {curSelYear} ▾
                  </button>
                  {showYearPicker === field && (
                    <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 'calc(100% + 4px)', left: '50%', transform: 'translateX(-50%)', background: colors.white, borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 999, minWidth: '80px', overflow: 'hidden' }}>
                      {allYears.map(y => (
                        <button key={y} onClick={() => {
                          setSelectedYear(prev => ({ ...prev, [field]: y }));
                          const months = Array.from(byYearMonth.get(y)?.keys() || []).sort((a, b) => b.localeCompare(a));
                          if (!months.includes(curSelMonth)) {
                            setSelectedMonth(prev => ({ ...prev, [field]: months[0] || curMonth }));
                          }
                          setShowYearPicker(null);
                        }}
                          style={{ display: 'block', width: '100%', padding: '8px 14px', border: 'none', background: y === curSelYear ? colors.blueBg : colors.white, color: y === curSelYear ? colors.blue : colors.gray900, fontSize: '13px', fontWeight: y === curSelYear ? '600' : '400', cursor: 'pointer', textAlign: 'center' }}>
                          {y}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isCurrentPeriod && <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.25)', color: colors.white, padding: '1px 5px', borderRadius: '999px', flexShrink: 0 }}>נוכחי</span>}
              </div>
            )}
            {allItems.length === 0 && <div style={{ flex: 1 }} />}

            {/* כפתור הוסף */}
            {!addMode && (
              <button onClick={() => setAddMode(chooseMode)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '4px', color: colors.white, fontSize: '11px', padding: '4px 8px', cursor: 'pointer', flexShrink: 0 }}>+ הוסף</button>
            )}
          </div>

          {addMode === chooseMode && choosePanel(field)}
          {addMode === singleMode && singleForm(field)}
          {addMode === recurringMode && recurringForm(field)}

          {/* כותרות עמודות */}
          <div style={{ display: 'flex', background: colors.gray50, fontSize: '11px', color: colors.gray500, borderBottom: `1px solid ${colors.gray200}` }}>
            <div style={{ width: '14%', padding: '6px 4px', textAlign: 'center', flexShrink: 0 }}>תאריך</div>
            <div style={{ flex: 1, padding: '6px 8px', textAlign: 'right' }}>תיאור</div>
            <div style={{ width: '22%', padding: '6px 8px', textAlign: 'right', flexShrink: 0 }}>סכום ₪</div>
            <div style={{ width: '9%', padding: '6px', textAlign: 'center', flexShrink: 0 }}>הע׳</div>
            <div style={{ width: '8%', flexShrink: 0 }}></div>
          </div>

          {/* שורות */}
          {allItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: colors.gray400, padding: '20px', fontSize: '13px' }}>אין {cfg.label} עדיין</div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', color: colors.gray400, padding: '20px', fontSize: '13px' }}>
              אין {cfg.label} ב{MONTHS_HE[parseInt(curSelMonth) - 1]} {curSelYear}
            </div>
          ) : items.map((item, index) => {
            const isExpanded = expandedRows.has(item.id);
            const hasNote = !!item.note;
            let pressTimer: ReturnType<typeof setTimeout> | null = null;
            const handlePressStart = () => {
              pressTimer = setTimeout(() => setConfirmState({ open: true, title: `למחוק "${item.desc || 'שורה'}"?`, onConfirm: () => deleteRow(field, item.id) }), 600);
            };
            const handlePressEnd = () => { if (pressTimer) clearTimeout(pressTimer); };

            return (
              <div key={item.id}>
                <div style={{ display: 'flex', backgroundColor: focusedRowId === item.id ? colors.focusBg : index % 2 === 0 ? colors.white : cfg.zebraColor, userSelect: 'none', width: '100%' }}
                  onFocus={() => setFocusedRowId(item.id)}
                  onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusedRowId(null); }}
                  onMouseEnter={() => setHoveredRowId(item.id)}
                  onMouseLeave={() => { setHoveredRowId(null); handlePressEnd(); }}
                  onMouseDown={handlePressStart} onMouseUp={handlePressEnd}
                  onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}
                >
                  {/* תאריך קומפקטי */}
                  <div style={{ width: '14%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <span style={{ fontSize: '10px', color: colors.gray500, pointerEvents: 'none', position: 'absolute', zIndex: 1 }}>{fmtShortDate(item.date)}</span>
                    <input type="date" value={item.date || ''} onChange={e => updateItem(field, item.id, 'date', e.target.value)}
                      onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}
                      style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '10px', color: 'transparent', direction: 'ltr', width: '100%', cursor: 'pointer', padding: '8px 0', opacity: 0, position: 'absolute', inset: 0 }} />
                  </div>
                  {/* תיאור */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {field !== 'generalExpenseHome' && (
                      <button onClick={() => toggleVat(field, item.id)} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}
                        title={item.vatable === false ? 'פטור ממע"מ — לחץ לסמן כחייב' : 'חייב במע"מ — לחץ לסמן כפטור'}
                        style={{ flexShrink: 0, cursor: 'pointer', border: 'none', borderRadius: '999px', fontSize: '9px', fontWeight: 600, padding: '2px 5px', whiteSpace: 'nowrap', lineHeight: 1.3,
                          background: item.vatable === false ? colors.amberChip : colors.greenChip, color: item.vatable === false ? colors.amberText : colors.greenDeep }}>
                        {item.vatable === false ? 'פטור' : 'מע"מ'}
                      </button>
                    )}
                    <input type="text" value={item.desc} onChange={e => updateItem(field, item.id, 'desc', e.target.value)} placeholder="תיאור..."
                      style={inputStyle} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} />
                  </div>
                  {/* סכום */}
                  <div style={{ width: '22%', flexShrink: 0 }}>
                    <input type="number" value={item.amount || ''} onChange={e => updateItem(field, item.id, 'amount', parseFloat(e.target.value) || 0)} placeholder="0"
                      style={{ ...inputStyle, direction: 'ltr', textAlign: 'right', fontSize: '13px' }} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} />
                  </div>
                  {/* הערה */}
                  <div style={{ width: '9%', flexShrink: 0, textAlign: 'center' }}>
                    <button onClick={() => toggleExpand(item.id)} onMouseDown={e => e.stopPropagation()}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: hasNote ? colors.blue : colors.gray400, padding: '8px 4px' }}>
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>
                  {/* מחיקה */}
                  <div style={{ width: '8%', flexShrink: 0, textAlign: 'center' }}>
                    {hoveredRowId === item.id && (
                      <button onClick={() => setConfirmState({ open: true, title: `למחוק "${item.desc || 'שורה'}"?`, onConfirm: () => deleteRow(field, item.id) })}
                        onMouseDown={e => e.stopPropagation()}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.redStrong, padding: '6px 4px', fontSize: '13px' }}>✕</button>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div style={{ backgroundColor: colors.cream }}>
                    <input type="text" value={item.note} onChange={e => updateItem(field, item.id, 'note', e.target.value)} placeholder="הערה חופשית..."
                      style={{ ...inputStyle, padding: '10px 14px', fontSize: '13px', color: colors.noteText }} />
                  </div>
                )}
              </div>
            );
          })}

          {/* סיכום חודש + סה"כ */}
          {allItems.length > 0 && items.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'rgba(0,0,0,0.04)', fontSize: '12px', color: colors.gray500, borderTop: `1px solid ${colors.gray200}` }}>
              <span>{MONTHS_HE[parseInt(curSelMonth) - 1]}</span>
              <span>{fmt(monthTotal)}</span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px 14px', backgroundColor: cfg.summaryBg, color: cfg.summaryColor, fontWeight: 'bold' }}>
            <span style={{ textAlign: 'right' }}>סה״כ {cfg.label}</span>
            <span style={{ textAlign: 'left' }}>{fmt(total)}</span>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div style={{ direction: 'rtl', margin: '0 -12px' }}>
      {renderTable('generalIncome')}
      {renderTable('generalExpenseWork')}
      {renderTable('generalExpenseHome')}

      {/* סיכום כולל */}
      <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '12px', border: `1px solid ${colors.gray200}` }}>
        <div style={{ background: colors.navy, padding: '10px 14px', fontSize: '13px', fontWeight: '500', color: colors.white }}>סיכום</div>
        <div style={{ background: colors.white }}>
          {[
            { label: 'הכנסות', value: totalIncome, color: colors.greenText, border: true },
            { label: 'הוצאות עסקיות', value: `− ${fmt(totalExpenseWork)}`, color: colors.red, border: true, raw: true },
          ].map(({ label, value, color, border, raw }) => (
            <div key={label} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px 14px', borderBottom: border ? `1px solid ${colors.gray100}` : 'none' }}>
              <span style={{ fontSize: '13px', color: colors.gray700 }}>{label}</span>
              <span style={{ fontSize: '13px', textAlign: 'left', color, fontWeight: '500' }}>{raw ? value : fmt(value as number)}</span>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '11px 14px', borderBottom: `2px solid ${colors.gray200}`, background: businessProfit >= 0 ? colors.greenBgSoft : colors.redBg }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: '600', color: businessProfit >= 0 ? colors.greenDeep : colors.redDeep }}>רווח עסקי</span>
              <div style={{ fontSize: '10px', color: colors.gray400, marginTop: '1px' }}>בסיס לחישוב מעשר</div>
            </div>
            <span style={{ fontSize: '16px', textAlign: 'left', fontWeight: '600', color: businessProfit >= 0 ? colors.greenText : colors.red }}>{fmt(businessProfit)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px 14px', borderBottom: `1px solid ${colors.gray100}` }}>
            <span style={{ fontSize: '13px', color: colors.gray700 }}>הוצאות ביתיות</span>
            <span style={{ fontSize: '13px', textAlign: 'left', color: colors.purple, fontWeight: '500' }}>− {fmt(totalExpenseHome)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '11px 14px', background: homeBalance >= 0 ? colors.purpleBgSoft : colors.redBg }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: '600', color: homeBalance >= 0 ? colors.purpleDeep : colors.redDeep }}>יתרה לבית</span>
              <div style={{ fontSize: '10px', color: colors.gray400, marginTop: '1px' }}>לאחר הוצאות ביתיות</div>
            </div>
            <span style={{ fontSize: '16px', textAlign: 'left', fontWeight: '600', color: homeBalance >= 0 ? colors.purple : colors.red }}>{fmt(homeBalance)}</span>
          </div>
        </div>
      </div>

      {/* פריטים קבועים */}
      <div style={{ border: `1px solid ${colors.gray200}`, borderRadius: '12px', overflow: 'hidden', background: colors.white }}>
        <button onClick={() => setIsRecurringOpen(!isRecurringOpen)} style={{ width: '100%', background: colors.gray50, border: 'none', padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'inline-block', transform: isRecurringOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: colors.gray500 }}>▶</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: colors.gray700 }}>פריטים קבועים</span>
            {recurringItems.length > 0 && <span style={{ background: colors.blueBorder, color: colors.blueDark, fontSize: '11px', padding: '1px 8px', borderRadius: '999px' }}>{recurringItems.length}</span>}
          </div>
        </button>
        <div style={{ maxHeight: isRecurringOpen ? '600px' : '0', overflow: 'hidden', transition: 'max-height 0.25s ease' }}>
          {recurringItems.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: colors.gray400, fontSize: '13px' }}>אין פריטים קבועים</div>
          ) : recurringItems.map(rg => {
            const typeLabel = rg.type === 'income' ? 'הכנסה' : rg.type === 'expenseWork' ? 'עסקית' : 'ביתית';
            const typeColor = rg.type === 'income' ? { bg: colors.greenBg, color: colors.greenLabel } : rg.type === 'expenseWork' ? { bg: colors.orangeBg, color: colors.orangeText } : { bg: colors.purpleBg, color: colors.purpleDeep };
            return (
              <div key={rg.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: '10px', borderBottom: `1px solid ${colors.gray100}`, background: rg.enabled ? colors.cardZebraB : colors.gray50 }}>
                <button onClick={() => handleDeleteRecurring(rg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.gray300, fontSize: '13px', flexShrink: 0 }}
                  onMouseOver={e => (e.currentTarget.style.color = colors.redStrong)} onMouseOut={e => (e.currentTarget.style.color = colors.gray300)}>✕</button>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '999px', background: typeColor.bg, color: typeColor.color }}>{typeLabel}</span>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: rg.enabled ? colors.gray900 : colors.gray400, textDecoration: rg.enabled ? 'none' : 'line-through' }}>{rg.desc}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: colors.gray500, marginTop: '2px' }}>יום {rg.dayOfMonth} לחודש · {fmt(rg.amount)}</div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', color: rg.enabled ? colors.greenText : colors.gray400 }}>{rg.enabled ? 'פעיל' : 'כבוי'}</span>
                  <input type="checkbox" checked={rg.enabled} onChange={() => handleToggleRecurring(rg.id)} style={{ width: '15px', height: '15px', accentColor: colors.blue, cursor: 'pointer' }} />
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmState.open}
        title={confirmState.title}
        onConfirm={() => { confirmState.onConfirm(); setConfirmState(s => ({ ...s, open: false })); }}
        onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
      />
    </div>
  );
}

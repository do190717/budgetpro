'use client';

import { useState } from 'react';
import { AppState, LineItem, RecurringGeneralItem } from '@/lib/types';
import { generateId } from '@/lib/storage';
import { calcGeneralIncome, calcGeneralExpense, calcGeneralBusinessProfit, calcGeneralHomeBalance, groupByMonth } from '@/lib/calculations';
import ConfirmModal from './ConfirmModal';

const fmt = (n: number) => '₪' + Math.round(n).toLocaleString('he-IL');
const today = () => new Date().toISOString().split('T')[0];
const currentMonthKey = () => new Date().toISOString().slice(0, 7);

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
    label: 'הכנסות',
    sub: 'כולן נכנסות לחישוב המעשר',
    headerBg: '#1D9E75',
    summaryBg: '#EAF3DE',
    summaryColor: '#27500A',
    zebraColor: '#F8FFF8',
    recurringType: 'income' as RecurringGeneralItem['type'],
  },
  generalExpenseWork: {
    label: 'הוצאות עסקיות',
    sub: 'מתקזזות מהרווח ומפחיתות את המעשר',
    headerBg: '#D85A30',
    summaryBg: '#FAECE7',
    summaryColor: '#712B13',
    zebraColor: '#FFF8F8',
    recurringType: 'expenseWork' as RecurringGeneralItem['type'],
  },
  generalExpenseHome: {
    label: 'הוצאות ביתיות',
    sub: 'לא מתקזזות מהמעשר',
    headerBg: '#7C3AED',
    summaryBg: '#EDE9FE',
    summaryColor: '#4C1D95',
    zebraColor: '#FAF8FF',
    recurringType: 'expenseHome' as RecurringGeneralItem['type'],
  },
};

export default function GeneralTab({ state, onStateChange }: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [sortedTypes, setSortedTypes] = useState<Set<string>>(new Set());
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set([currentMonthKey()]));
  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; onConfirm: () => void }>({ open: false, title: '', onConfirm: () => {} });

  const [singleDesc, setSingleDesc] = useState('');
  const [singleAmount, setSingleAmount] = useState('');
  const [singleDate, setSingleDate] = useState(today());
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

  const toggleMonth = (key: string) => {
    setOpenMonths(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });
  };

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const updateItem = (field: TableType, itemId: string, key: keyof LineItem, value: string | number) => {
    onStateChange({ ...state, [field]: (state[field] as LineItem[]).map((item: LineItem) => item.id === itemId ? { ...item, [key]: value } : item) });
  };

  const deleteRow = (field: TableType, itemId: string) => {
    onStateChange({ ...state, [field]: (state[field] as LineItem[]).filter((item: LineItem) => item.id !== itemId) });
    setExpandedRows(prev => { const s = new Set(prev); s.delete(itemId); return s; });
  };

  const handleAddSingle = (field: TableType) => {
    if (!singleDesc.trim() || !singleAmount || !singleDate) return;
    const newItem: LineItem = { id: generateId(), desc: singleDesc.trim(), amount: parseFloat(singleAmount), note: '', date: singleDate };
    onStateChange({ ...state, [field]: [...((state[field] as LineItem[]) || []), newItem] });
    setSingleDesc(''); setSingleAmount(''); setSingleDate(today());
    setAddMode(null);
    // פתיחת החודש הנוכחי
    const monthKey = singleDate.slice(0, 7);
    setOpenMonths(prev => new Set([...prev, monthKey]));
  };

  const handleAddRecurring = (type: RecurringGeneralItem['type']) => {
    if (!recurringDesc.trim() || !recurringAmount) return;
    const day = Math.min(Math.max(parseInt(recurringDay) || 1, 1), 28);
    const rg: RecurringGeneralItem = { id: generateId(), type, desc: recurringDesc.trim(), amount: parseFloat(recurringAmount), dayOfMonth: day, lastRegistered: '', enabled: true };
    onStateChange({ ...state, recurringGeneralItems: [...recurringItems, rg] });
    setRecurringDesc(''); setRecurringAmount(''); setRecurringDay('1');
    setAddMode(null);
    setIsRecurringOpen(true);
  };

  const handleToggleRecurring = (id: string) => {
    onStateChange({ ...state, recurringGeneralItems: recurringItems.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r) });
  };

  const handleDeleteRecurring = (id: string) => {
    setConfirmState({ open: true, title: 'למחוק את הפריט הקבוע?', onConfirm: () => onStateChange({ ...state, recurringGeneralItems: recurringItems.filter(r => r.id !== id) }) });
  };

  const choosePanel = (field: TableType) => {
    const cfg = TABLE_CONFIG[field];
    return (
      <div style={{ padding: '14px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '10px', textAlign: 'right' }}>סוג רשומה:</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setAddMode(`single-${field}` as AddMode)}
            style={{ flex: 1, background: '#fff', border: `2px solid ${cfg.headerBg}`, borderRadius: '10px', padding: '10px 6px', cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', marginBottom: '3px' }}>💸</div>
            <div style={{ fontWeight: '500', color: cfg.headerBg, fontSize: '12px' }}>חד פעמית</div>
          </button>
          <button onClick={() => setAddMode(`recurring-${field}` as AddMode)}
            style={{ flex: 1, background: '#fff', border: '2px solid #2563EB', borderRadius: '10px', padding: '10px 6px', cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', marginBottom: '3px' }}>🔁</div>
            <div style={{ fontWeight: '500', color: '#2563EB', fontSize: '12px' }}>קבועה חוזרת</div>
          </button>
        </div>
        <button onClick={() => setAddMode(null)} style={{ marginTop: '8px', background: 'none', border: 'none', color: '#9CA3AF', fontSize: '12px', cursor: 'pointer', width: '100%' }}>ביטול</button>
      </div>
    );
  };

  const singleForm = (field: TableType) => {
    const cfg = TABLE_CONFIG[field];
    return (
      <div style={{ padding: '14px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: cfg.headerBg, marginBottom: '10px', textAlign: 'right' }}>{cfg.label} — רשומה חד פעמית</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '3px', textAlign: 'right' }}>תאריך</label>
            <input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} required style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '8px', fontSize: '13px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '3px', textAlign: 'right' }}>סכום ₪</label>
            <input type="number" value={singleAmount} onChange={e => setSingleAmount(e.target.value)} placeholder="0" autoFocus style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '8px', fontSize: '13px', outline: 'none' }} />
          </div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '3px', textAlign: 'right' }}>תיאור</label>
          <input type="text" value={singleDesc} onChange={e => setSingleDesc(e.target.value)} placeholder="תיאור..." style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '8px', fontSize: '13px', direction: 'rtl', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => handleAddSingle(field)} style={{ background: cfg.headerBg, color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>הוסף</button>
          <button onClick={() => { setSingleDesc(''); setSingleAmount(''); setAddMode(null); }} style={{ background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' }}>ביטול</button>
        </div>
      </div>
    );
  };

  const recurringForm = (field: TableType) => {
    const cfg = TABLE_CONFIG[field];
    return (
      <div style={{ padding: '14px', background: '#EFF6FF', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#2563EB', marginBottom: '10px', textAlign: 'right' }}>{cfg.label} — קבועה חוזרת</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '3px', textAlign: 'right' }}>סכום ₪</label>
            <input type="number" value={recurringAmount} onChange={e => setRecurringAmount(e.target.value)} placeholder="0" autoFocus style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '8px', fontSize: '13px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '3px', textAlign: 'right' }}>יום בחודש (1-28)</label>
            <input type="number" value={recurringDay} onChange={e => setRecurringDay(e.target.value)} min="1" max="28" style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '8px', fontSize: '13px', outline: 'none' }} />
          </div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '3px', textAlign: 'right' }}>תיאור</label>
          <input type="text" value={recurringDesc} onChange={e => setRecurringDesc(e.target.value)} placeholder="תיאור..." style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '8px', fontSize: '13px', direction: 'rtl', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => handleAddRecurring(cfg.recurringType)} style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>הוסף</button>
          <button onClick={() => { setRecurringDesc(''); setRecurringAmount(''); setAddMode(null); }} style={{ background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' }}>ביטול</button>
        </div>
      </div>
    );
  };

  const renderMonthGroup = (group: { key: string; label: string; items: LineItem[] }, field: TableType, zebraColor: string) => {
    const isCurrentMonth = group.key === currentMonthKey();
    const isOpen = openMonths.has(group.key);
    const groupTotal = group.items.reduce((s, i) => s + i.amount, 0);

    return (
      <div key={group.key}>
        <button
          onClick={() => toggleMonth(group.key)}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: isCurrentMonth ? '#F0F9FF' : '#FAFAFA', border: 'none', borderBottom: '1px solid #E5E7EB', cursor: 'pointer', direction: 'rtl' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#9CA3AF', fontSize: '12px' }}>▶</span>
            <span style={{ fontSize: '13px', fontWeight: isCurrentMonth ? '600' : '400', color: isCurrentMonth ? '#1E3A5F' : '#6B7280' }}>{group.label}</span>
            {isCurrentMonth && <span style={{ fontSize: '10px', background: '#DBEAFE', color: '#1D4ED8', padding: '1px 6px', borderRadius: '999px' }}>נוכחי</span>}
          </div>
          <span style={{ fontSize: '13px', color: '#6B7280' }}>{fmt(groupTotal)}</span>
        </button>

        {isOpen && group.items.map((item, index) => {
          const isExpanded = expandedRows.has(item.id);
          const hasNote = !!item.note;
          let pressTimer: ReturnType<typeof setTimeout> | null = null;
          const handlePressStart = () => {
            pressTimer = setTimeout(() => {
              setConfirmState({ open: true, title: `למחוק "${item.desc || 'שורה'}"?`, onConfirm: () => deleteRow(field, item.id) });
            }, 600);
          };
          const handlePressEnd = () => { if (pressTimer) clearTimeout(pressTimer); };

          return (
            <div key={item.id}>
              <div
                style={{ display: 'flex', backgroundColor: focusedRowId === item.id ? '#EEF4FF' : index % 2 === 0 ? '#FFFFFF' : zebraColor, userSelect: 'none' }}
                onFocus={() => setFocusedRowId(item.id)}
                onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusedRowId(null); }}
                onMouseEnter={() => setHoveredRowId(item.id)}
                onMouseLeave={() => { setHoveredRowId(null); handlePressEnd(); }}
                onMouseDown={handlePressStart} onMouseUp={handlePressEnd}
                onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}
              >
                {/* תאריך */}
                <div style={{ width: '18%', textAlign: 'center', verticalAlign: 'middle', flexShrink: 0 }}>
                  <input type="date" value={item.date || ''} onChange={e => updateItem(field, item.id, 'date', e.target.value)}
                    onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '11px', color: item.date ? '#374151' : '#9CA3AF', direction: 'ltr', width: '100%', cursor: 'pointer', padding: '4px 2px' }} />
                </div>
                {/* תיאור */}
                <div style={{ flex: 1 }}>
                  <input type="text" value={item.desc} onChange={e => updateItem(field, item.id, 'desc', e.target.value)} placeholder="תיאור..."
                    style={inputStyle} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} />
                </div>
                {/* סכום */}
                <div style={{ width: '22%', flexShrink: 0 }}>
                  <input type="number" value={item.amount || ''} onChange={e => updateItem(field, item.id, 'amount', parseFloat(e.target.value) || 0)} placeholder="0"
                    style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} />
                </div>
                {/* הערה */}
                <div style={{ width: '10%', textAlign: 'center', flexShrink: 0 }}>
                  <button onClick={() => toggleExpand(item.id)} onMouseDown={e => e.stopPropagation()}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: hasNote ? '#2563EB' : '#9CA3AF', padding: '8px' }}>
                    {isExpanded ? '▲' : '▼'}
                  </button>
                </div>
                {/* מחיקה */}
                <div style={{ width: '8%', textAlign: 'center', flexShrink: 0 }}>
                  {hoveredRowId === item.id && (
                    <button onClick={() => setConfirmState({ open: true, title: `למחוק "${item.desc || 'שורה'}"?`, onConfirm: () => deleteRow(field, item.id) })}
                      onMouseDown={e => e.stopPropagation()}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '6px', fontSize: '14px' }}>✕</button>
                  )}
                </div>
              </div>
              {isExpanded && (
                <div style={{ backgroundColor: '#F1EFE8' }}>
                  <input type="text" value={item.note} onChange={e => updateItem(field, item.id, 'note', e.target.value)} placeholder="הערה חופשית..."
                    style={{ ...inputStyle, padding: '10px 14px', fontSize: '13px', color: '#555' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTable = (field: TableType) => {
    const cfg = TABLE_CONFIG[field];
    const items = (state[field] as LineItem[]) || [];
    const total = items.reduce((s, i) => s + i.amount, 0);
    const grouped = groupByMonth(items);
    const chooseMode = `choose-${field}` as AddMode;
    const singleMode = `single-${field}` as AddMode;
    const recurringMode = `recurring-${field}` as AddMode;
    const isSorted = sortedTypes.has(field);

    return (
      <section style={{ marginBottom: '12px' }}>
        <div style={{ borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', overflow: 'hidden' }}>
          {/* כותרת */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: cfg.headerBg, padding: '10px 12px' }}>
            <div>
              <span style={{ color: '#fff', fontWeight: '500', fontSize: '14px' }}>{cfg.label}</span>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '10px', marginTop: '1px' }}>{cfg.sub}</div>
            </div>
            {!addMode && (
              <button onClick={() => setAddMode(chooseMode)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '12px', padding: '4px 10px', cursor: 'pointer' }}>+ הוסף</button>
            )}
          </div>

          {addMode === chooseMode && choosePanel(field)}
          {addMode === singleMode && singleForm(field)}
          {addMode === recurringMode && recurringForm(field)}

          {/* כותרות עמודות */}
          <div style={{ display: 'flex', background: '#F9FAFB', fontSize: '12px', color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ width: '18%', padding: '7px 4px', textAlign: 'center' }}>תאריך</div>
            <div style={{ flex: 1, padding: '7px 8px', textAlign: 'right' }}>תיאור</div>
            <div style={{ width: '22%', padding: '7px 8px', textAlign: 'right' }}>סכום ₪</div>
            <div style={{ width: '10%', padding: '7px', textAlign: 'center' }}>הערה</div>
            <div style={{ width: '8%' }}></div>
          </div>

          {/* שורות לפי חודש */}
          {grouped.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>אין {cfg.label} עדיין</div>
          ) : (
            grouped.map(group => renderMonthGroup(group, field, cfg.zebraColor))
          )}

          {/* סיכום */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px 14px', backgroundColor: cfg.summaryBg, color: cfg.summaryColor, fontWeight: 'bold' }}>
            <span style={{ textAlign: 'right' }}>סה״כ {cfg.label}</span>
            <span style={{ textAlign: 'left' }}>{fmt(total)}</span>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div>
      <style>{`
        @media (max-width: 400px) {
          .date-col { width: 32px !important; }
        }
      `}</style>

      {renderTable('generalIncome')}
      {renderTable('generalExpenseWork')}
      {renderTable('generalExpenseHome')}

      {/* סיכום כולל */}
      <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '12px', border: '1px solid #E5E7EB' }}>
        <div style={{ background: '#1E3A5F', padding: '10px 14px', fontSize: '13px', fontWeight: '500', color: '#fff' }}>סיכום</div>
        <div style={{ background: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px 14px', borderBottom: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: '13px', color: '#374151' }}>הכנסות</span>
            <span style={{ fontSize: '13px', textAlign: 'left', color: '#059669', fontWeight: '500' }}>{fmt(totalIncome)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px 14px', borderBottom: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: '13px', color: '#374151' }}>הוצאות עסקיות</span>
            <span style={{ fontSize: '13px', textAlign: 'left', color: '#DC2626', fontWeight: '500' }}>− {fmt(totalExpenseWork)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '11px 14px', borderBottom: '2px solid #E5E7EB', background: businessProfit >= 0 ? '#F0FDF4' : '#FEF2F2' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: '600', color: businessProfit >= 0 ? '#065F46' : '#991B1B' }}>רווח עסקי</span>
              <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '1px' }}>בסיס לחישוב מעשר</div>
            </div>
            <span style={{ fontSize: '16px', textAlign: 'left', fontWeight: '600', color: businessProfit >= 0 ? '#059669' : '#DC2626' }}>{fmt(businessProfit)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px 14px', borderBottom: '1px solid #F3F4F6' }}>
            <span style={{ fontSize: '13px', color: '#374151' }}>הוצאות ביתיות</span>
            <span style={{ fontSize: '13px', textAlign: 'left', color: '#7C3AED', fontWeight: '500' }}>− {fmt(totalExpenseHome)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '11px 14px', background: homeBalance >= 0 ? '#F5F3FF' : '#FEF2F2' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: '600', color: homeBalance >= 0 ? '#4C1D95' : '#991B1B' }}>יתרה לבית</span>
              <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '1px' }}>לאחר הוצאות ביתיות</div>
            </div>
            <span style={{ fontSize: '16px', textAlign: 'left', fontWeight: '600', color: homeBalance >= 0 ? '#7C3AED' : '#DC2626' }}>{fmt(homeBalance)}</span>
          </div>
        </div>
      </div>

      {/* פריטים קבועים */}
      <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
        <button onClick={() => setIsRecurringOpen(!isRecurringOpen)} style={{ width: '100%', background: '#F9FAFB', border: 'none', padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'inline-block', transform: isRecurringOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#6B7280' }}>▶</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>פריטים קבועים</span>
            {recurringItems.length > 0 && <span style={{ background: '#DBEAFE', color: '#1D4ED8', fontSize: '11px', padding: '1px 8px', borderRadius: '999px' }}>{recurringItems.length}</span>}
          </div>
        </button>
        <div style={{ maxHeight: isRecurringOpen ? '600px' : '0', overflow: 'hidden', transition: 'max-height 0.25s ease' }}>
          {recurringItems.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>אין פריטים קבועים</div>
          ) : recurringItems.map(rg => {
            const typeLabel = rg.type === 'income' ? 'הכנסה' : rg.type === 'expenseWork' ? 'עסקית' : 'ביתית';
            const typeColor = rg.type === 'income' ? { bg: '#EAF3DE', color: '#27500A' } : rg.type === 'expenseWork' ? { bg: '#FAECE7', color: '#712B13' } : { bg: '#EDE9FE', color: '#4C1D95' };
            return (
              <div key={rg.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: '10px', borderBottom: '1px solid #F3F4F6', background: rg.enabled ? '#F8FBFF' : '#F9FAFB' }}>
                <button onClick={() => handleDeleteRecurring(rg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: '13px', flexShrink: 0 }}
                  onMouseOver={e => (e.currentTarget.style.color = '#EF4444')} onMouseOut={e => (e.currentTarget.style.color = '#D1D5DB')}>✕</button>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '999px', background: typeColor.bg, color: typeColor.color }}>{typeLabel}</span>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: rg.enabled ? '#1F2937' : '#9CA3AF', textDecoration: rg.enabled ? 'none' : 'line-through' }}>{rg.desc}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>יום {rg.dayOfMonth} לחודש · {fmt(rg.amount)}</div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', color: rg.enabled ? '#059669' : '#9CA3AF' }}>{rg.enabled ? 'פעיל' : 'כבוי'}</span>
                  <input type="checkbox" checked={rg.enabled} onChange={() => handleToggleRecurring(rg.id)} style={{ width: '15px', height: '15px', accentColor: '#2563EB', cursor: 'pointer' }} />
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

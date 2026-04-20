'use client';

import { useState } from 'react';
import { AppState, LineItem, RecurringGeneralItem } from '@/lib/types';
import { generateId } from '@/lib/storage';
import { calcGeneralIncome, calcGeneralExpense } from '@/lib/calculations';

const fmt = (n: number) => '₪' + Math.round(n).toLocaleString('he-IL');

const inputStyle: React.CSSProperties = {
  width: '100%', border: 'none', background: 'transparent', outline: 'none',
  padding: '8px', direction: 'rtl', fontSize: '14px',
};

interface Props {
  state: AppState;
  onStateChange: (state: AppState) => void;
}

type AddMode = null | 'choose-income' | 'choose-expense' | 'single-income' | 'single-expense' | 'recurring-income' | 'recurring-expense';

export default function GeneralTab({ state, onStateChange }: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [sortedTypes, setSortedTypes] = useState<Set<string>>(new Set());

  const toggleSort = (type: string) => {
    setSortedTypes(prev => { const s = new Set(prev); s.has(type) ? s.delete(type) : s.add(type); return s; });
  };

  const getSortedItems = (items: LineItem[], type: string) => {
    if (!sortedTypes.has(type)) return items;
    return [...items].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  };

  const [singleDesc, setSingleDesc] = useState('');
  const [singleAmount, setSingleAmount] = useState('');
  const [singleDate, setSingleDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurringDesc, setRecurringDesc] = useState('');
  const [recurringAmount, setRecurringAmount] = useState('');
  const [recurringDay, setRecurringDay] = useState('1');

  const generalIncome = state.generalIncome || [];
  const generalExpense = state.generalExpense || [];
  const recurringItems = state.recurringGeneralItems || [];
  const totalIncome = calcGeneralIncome(generalIncome);
  const totalExpense = calcGeneralExpense(generalExpense);
  const profit = totalIncome - totalExpense;

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const updateItem = (type: 'generalIncome' | 'generalExpense', itemId: string, field: keyof LineItem, value: string | number) => {
    onStateChange({ ...state, [type]: state[type].map((item: LineItem) => item.id === itemId ? { ...item, [field]: value } : item) });
  };

  const deleteRow = (type: 'generalIncome' | 'generalExpense', itemId: string) => {
    onStateChange({ ...state, [type]: state[type].filter((item: LineItem) => item.id !== itemId) });
    setExpandedRows(prev => { const s = new Set(prev); s.delete(itemId); return s; });
  };

  const handleAddSingle = (type: 'income' | 'expense') => {
    if (!singleDesc.trim() || !singleAmount) return;
    const newItem: LineItem = { id: generateId(), desc: singleDesc.trim(), amount: parseFloat(singleAmount), note: '', date: singleDate };
    const field = type === 'income' ? 'generalIncome' : 'generalExpense';
    onStateChange({ ...state, [field]: [...(state[field] || []), newItem] });
    setSingleDesc(''); setSingleAmount(''); setSingleDate(new Date().toISOString().split('T')[0]);
    setAddMode(null);
  };

  const handleAddRecurring = (type: 'income' | 'expense') => {
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
    if (confirm('למחוק את הפריט הקבוע?')) {
      onStateChange({ ...state, recurringGeneralItems: recurringItems.filter(r => r.id !== id) });
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none';

  const choosePanel = (type: 'income' | 'expense') => {
    const isIncome = type === 'income';
    const color = isIncome ? '#1D9E75' : '#D85A30';
    const label = isIncome ? 'הכנסה' : 'הוצאה';
    return (
      <div className="p-4 border-b" style={{ background: isIncome ? '#F0FDF4' : '#FFF5F0' }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color, marginBottom: '12px', textAlign: 'right' }}>סוג {label}:</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setAddMode(`single-${type}` as AddMode)}
            style={{ flex: 1, background: '#fff', border: `2px solid ${color}`, borderRadius: '10px', padding: '12px 8px', cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>💸</div>
            <div style={{ fontWeight: '500', color, fontSize: '13px' }}>חד פעמית</div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>הוספה בתאריך מסוים</div>
          </button>
          <button onClick={() => setAddMode(`recurring-${type}` as AddMode)}
            style={{ flex: 1, background: '#fff', border: '2px solid #2563EB', borderRadius: '10px', padding: '12px 8px', cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>🔁</div>
            <div style={{ fontWeight: '500', color: '#2563EB', fontSize: '13px' }}>קבועה חוזרת</div>
            <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>נרשמת כל חודש</div>
          </button>
        </div>
        <button onClick={() => setAddMode(null)} style={{ marginTop: '10px', background: 'none', border: 'none', color: '#6B7280', fontSize: '13px', cursor: 'pointer', width: '100%', textAlign: 'center' }}>ביטול</button>
      </div>
    );
  };

  const singleForm = (type: 'income' | 'expense') => {
    const isIncome = type === 'income';
    const color = isIncome ? '#1D9E75' : '#D85A30';
    const label = isIncome ? 'הכנסה' : 'הוצאה';
    return (
      <div className="p-4 border-b" style={{ background: isIncome ? '#F0FDF4' : '#FFF5F0' }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color, marginBottom: '10px', textAlign: 'right' }}>{label} חד פעמית</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <div><label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '3px', textAlign: 'right' }}>תאריך</label>
            <input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} className={inputCls} /></div>
          <div><label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '3px', textAlign: 'right' }}>סכום ₪</label>
            <input type="number" value={singleAmount} onChange={e => setSingleAmount(e.target.value)} placeholder="0" className={inputCls} autoFocus /></div>
        </div>
        <div style={{ marginBottom: '10px' }}><label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '3px', textAlign: 'right' }}>תיאור</label>
          <input type="text" value={singleDesc} onChange={e => setSingleDesc(e.target.value)} placeholder="תיאור..." className={inputCls} /></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => handleAddSingle(type)} style={{ background: color, color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>הוסף</button>
          <button onClick={() => { setSingleDesc(''); setSingleAmount(''); setAddMode(null); }} style={{ background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>ביטול</button>
        </div>
      </div>
    );
  };

  const recurringForm = (type: 'income' | 'expense') => {
    const isIncome = type === 'income';
    const label = isIncome ? 'הכנסה' : 'הוצאה';
    return (
      <div className="p-4 border-b" style={{ background: '#EFF6FF' }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#2563EB', marginBottom: '10px', textAlign: 'right' }}>{label} קבועה חוזרת</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <div><label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '3px', textAlign: 'right' }}>סכום ₪</label>
            <input type="number" value={recurringAmount} onChange={e => setRecurringAmount(e.target.value)} placeholder="0" className={inputCls} autoFocus /></div>
          <div><label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '3px', textAlign: 'right' }}>יום בחודש (1-28)</label>
            <input type="number" value={recurringDay} onChange={e => setRecurringDay(e.target.value)} min="1" max="28" className={inputCls} /></div>
        </div>
        <div style={{ marginBottom: '10px' }}><label style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '3px', textAlign: 'right' }}>תיאור</label>
          <input type="text" value={recurringDesc} onChange={e => setRecurringDesc(e.target.value)} placeholder="לדוגמה: משכורת" className={inputCls} /></div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => handleAddRecurring(type)} style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>הוסף</button>
          <button onClick={() => { setRecurringDesc(''); setRecurringAmount(''); setAddMode(null); }} style={{ background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer' }}>ביטול</button>
        </div>
      </div>
    );
  };

  const renderTable = (items: LineItem[], type: 'generalIncome' | 'generalExpense') => {
    const isIncome = type === 'generalIncome';
    const itemType = isIncome ? 'income' : 'expense';
    const headerBg = isIncome ? '#1D9E75' : '#D85A30';
    const summaryBg = isIncome ? '#EAF3DE' : '#FAECE7';
    const summaryColor = isIncome ? '#27500A' : '#712B13';
    const zebraColor = isIncome ? '#F8FFF8' : '#FFF8F8';
    const label = isIncome ? 'הכנסות' : 'הוצאות';
    const total = isIncome ? totalIncome : totalExpense;
    const chooseMode = `choose-${itemType}` as AddMode;
    const singleMode = `single-${itemType}` as AddMode;
    const recurringMode = `recurring-${itemType}` as AddMode;
    const isSorted = sortedTypes.has(type);
    const displayItems = getSortedItems(items, type);

    return (
      <section style={{ marginBottom: '12px' }}>
        <div style={{ borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: headerBg, padding: '10px 12px' }}>
            <span style={{ color: '#fff', fontWeight: '500', fontSize: '15px' }}>{label}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => toggleSort(type)} style={{ background: isSorted ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '11px', padding: '4px 8px', cursor: 'pointer' }}>
                {isSorted ? '↑ תאריך' : '⇅ מיין'}
              </button>
              {!addMode && (
                <button onClick={() => setAddMode(chooseMode)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '12px', padding: '4px 10px', cursor: 'pointer' }}>+ הוסף</button>
              )}
            </div>
          </div>

          {addMode === chooseMode && choosePanel(itemType)}
          {addMode === singleMode && singleForm(itemType)}
          {addMode === recurringMode && recurringForm(itemType)}

          <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', fontSize: '12px', color: '#6B7280' }}>
                <th className="date-col" style={{ width: '18%', padding: '8px 4px', textAlign: 'center', fontWeight: 500 }}>תאריך</th>
                <th style={{ width: '42%', padding: '8px', textAlign: 'right', fontWeight: 500 }}>תיאור</th>
                <th style={{ width: '22%', padding: '8px', textAlign: 'right', fontWeight: 500 }}>סכום ₪</th>
                <th style={{ width: '10%', padding: '8px', textAlign: 'center', fontWeight: 500 }}>הערה</th>
                <th style={{ width: '8%' }}></th>
              </tr>
            </thead>
            <tbody>
              {displayItems.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px' }}>אין {label} עדיין</td></tr>
              ) : displayItems.flatMap((item, index) => {
                const isExpanded = expandedRows.has(item.id);
                const hasNote = !!item.note;
                let pressTimer: ReturnType<typeof setTimeout> | null = null;
                const handlePressStart = () => { pressTimer = setTimeout(() => { if (confirm(`למחוק "${item.desc || 'שורה'}"?`)) deleteRow(type, item.id); }, 600); };
                const handlePressEnd = () => { if (pressTimer) clearTimeout(pressTimer); };

                const rows = [
                  <tr key={item.id}
                    style={{ backgroundColor: focusedRowId === item.id ? '#EEF4FF' : index % 2 === 0 ? '#FFFFFF' : zebraColor, userSelect: 'none' }}
                    onFocus={() => setFocusedRowId(item.id)}
                    onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusedRowId(null); }}
                    onMouseEnter={() => setHoveredRowId(item.id)}
                    onMouseLeave={() => { setHoveredRowId(null); handlePressEnd(); }}
                    onMouseDown={handlePressStart} onMouseUp={handlePressEnd}
                    onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}
                  >
                    <td className="date-col" style={{ width: '18%', textAlign: 'center', verticalAlign: 'middle' }}>
                      <input type="date" value={item.date || ''} onChange={e => updateItem(type, item.id, 'date', e.target.value)} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '11px', color: item.date ? '#374151' : '#9CA3AF', direction: 'ltr', width: '100%', cursor: 'pointer', padding: '4px 2px' }} />
                    </td>
                    <td style={{ width: '42%' }}><input type="text" value={item.desc} onChange={e => updateItem(type, item.id, 'desc', e.target.value)} placeholder="תיאור..." style={inputStyle} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} /></td>
                    <td style={{ width: '22%' }}><input type="number" value={item.amount || ''} onChange={e => updateItem(type, item.id, 'amount', parseFloat(e.target.value) || 0)} placeholder="0" style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} /></td>
                    <td style={{ width: '10%', textAlign: 'center' }}>
                      <button onClick={() => toggleExpand(item.id)} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: hasNote ? '#2563EB' : '#9CA3AF', padding: '8px' }}>{isExpanded ? '▲' : '▼'}</button>
                    </td>
                    <td style={{ width: '8%', textAlign: 'center' }}>
                      {hoveredRowId === item.id && (<button onClick={() => { if (confirm(`למחוק "${item.desc || 'שורה'}"?`)) deleteRow(type, item.id); }} onMouseDown={e => e.stopPropagation()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '6px', fontSize: '14px' }}>✕</button>)}
                    </td>
                  </tr>
                ];

                if (isExpanded) {
                  rows.push(
                    <tr key={`${item.id}-note`} style={{ backgroundColor: '#F1EFE8' }}>
                      <td colSpan={5} style={{ padding: '0' }}>
                        <input type="text" value={item.note} onChange={e => updateItem(type, item.id, 'note', e.target.value)} placeholder="הערה חופשית..." style={{ ...inputStyle, padding: '10px 14px', fontSize: '13px', color: '#555' }} />
                      </td>
                    </tr>
                  );
                }
                return rows;
              })}
            </tbody>
          </table>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px 14px', backgroundColor: summaryBg, color: summaryColor, fontWeight: 'bold' }}>
            <span style={{ textAlign: 'right' }}>סה״כ {label}</span>
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
          .date-col { width: 32px !important; padding: 0 !important; }
          .date-col input[type="date"] { width: 28px; font-size: 0; color: transparent; }
          .date-col input[type="date"]::-webkit-calendar-picker-indicator { margin: 0; padding: 4px; opacity: 0.5; }
        }
      `}</style>

      {renderTable(generalIncome, 'generalIncome')}
      {renderTable(generalExpense, 'generalExpense')}

      <div style={{ background: profit >= 0 ? '#E6F1FB' : '#FAECE7', borderRadius: '10px', padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', border: `1px solid ${profit >= 0 ? '#B5D4F4' : '#F5C4B3'}`, marginBottom: '12px' }}>
        <span style={{ textAlign: 'right', fontWeight: '500', color: profit >= 0 ? '#0C447C' : '#712B13', fontSize: '14px' }}>רווח כללי</span>
        <span style={{ textAlign: 'left', fontWeight: '500', color: profit >= 0 ? '#185FA5' : '#D85A30', fontSize: '18px' }}>{fmt(profit)}</span>
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
            <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>אין פריטים קבועים עדיין</div>
          ) : (
            <div>
              {recurringItems.map(rg => (
                <div key={rg.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: '10px', borderBottom: '1px solid #F3F4F6', background: rg.enabled ? '#F8FBFF' : '#F9FAFB' }}>
                  <button onClick={() => handleDeleteRecurring(rg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D1D5DB', fontSize: '13px', flexShrink: 0 }} onMouseOver={e => (e.currentTarget.style.color = '#EF4444')} onMouseOut={e => (e.currentTarget.style.color = '#D1D5DB')}>✕</button>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '999px', background: rg.type === 'income' ? '#EAF3DE' : '#FAECE7', color: rg.type === 'income' ? '#27500A' : '#712B13' }}>{rg.type === 'income' ? 'הכנסה' : 'הוצאה'}</span>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: rg.enabled ? '#1F2937' : '#9CA3AF', textDecoration: rg.enabled ? 'none' : 'line-through' }}>{rg.desc}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>יום {rg.dayOfMonth} לחודש · {fmt(rg.amount)}</div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', color: rg.enabled ? '#059669' : '#9CA3AF' }}>{rg.enabled ? 'פעיל' : 'כבוי'}</span>
                    <input type="checkbox" checked={rg.enabled} onChange={() => handleToggleRecurring(rg.id)} style={{ width: '15px', height: '15px', accentColor: '#2563EB', cursor: 'pointer' }} />
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

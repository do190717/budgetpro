'use client';

import { useState } from 'react';
import { Project, LineItem } from '@/lib/types';
import { generateId } from '@/lib/storage';
import { deleteLineItemFromDB } from '@/lib/db';
import { colors } from '@/lib/theme';
import {
  calcProjectIncome,
  calcProjectExpense,
  calcProjectProfit,
  calcProjectVatableIncome,
  calcProjectOutputVat,
  calcProjectInputVat,
  calcProjectNetVat,
  fmt,
} from '@/lib/calculations';
import ConfirmModal from './ConfirmModal';

interface Props {
  project: Project;
  vatRate: number;
  onBack: () => void;
  onUpdate: (project: Project) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: 'none',
  background: 'transparent',
  outline: 'none',
  padding: '8px',
  direction: 'rtl',
  fontSize: '14px',
};

export default function ProjectDetail({ project, vatRate, onBack, onUpdate }: Props) {
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(project.name);
  const [sortedTypes, setSortedTypes] = useState<Set<string>>(new Set());
  const [confirmState, setConfirmState] = useState<{open: boolean, title: string, onConfirm: () => void}>({open: false, title: '', onConfirm: () => {}});

  const toggleSort = (type: string) => {
    setSortedTypes(prev => { const s = new Set(prev); if (s.has(type)) s.delete(type); else s.add(type); return s; });
  };

  const getSortedItems = (items: LineItem[], type: string) => {
    if (!sortedTypes.has(type)) return items;
    return [...items].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  };

  const income = calcProjectIncome(project);
  const expense = calcProjectExpense(project);
  const profit = calcProjectProfit(project);

  // מע"מ
  const vatableIncome = calcProjectVatableIncome(project);
  const outputVat = calcProjectOutputVat(project, vatRate);
  const inputVat = calcProjectInputVat(project, vatRate);
  const netVat = calcProjectNetVat(project, vatRate);

  const toggleExpand = (itemId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      return newSet;
    });
  };

  const updateItem = (type: 'income' | 'expense', itemId: string, field: keyof LineItem, value: string | number) => {
    onUpdate({
      ...project,
      [type]: project[type].map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    });
  };

  const toggleVat = (type: 'income' | 'expense', itemId: string) => {
    onUpdate({
      ...project,
      [type]: project[type].map(item =>
        item.id === itemId ? { ...item, vatable: item.vatable === false } : item
      ),
    });
  };

  const today = new Date().toISOString().split('T')[0];

  const addRow = (type: 'income' | 'expense') => {
    const newItem: LineItem = { id: generateId(), desc: '', amount: 0, note: '', date: today, vatable: true };
    onUpdate({ ...project, [type]: [...project[type], newItem] });
  };

  const deleteRow = (type: 'income' | 'expense', itemId: string) => {
    onUpdate({ ...project, [type]: project[type].filter(item => item.id !== itemId) });
    setExpandedRows(prev => { const s = new Set(prev); s.delete(itemId); return s; });
    // מחיקה ממוקדת ב-DB — רק השורה הזו, לעולם לא יותר
    deleteLineItemFromDB(itemId);
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onUpdate({ ...project, [field]: value });
  };

  const fmtShort = (d: string) => { if (!d) return ''; const p = d.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; };

  const renderTableRows = (items: LineItem[], type: 'income' | 'expense', zebraColor: string) => {
    if (items.length === 0) {
      return (
        <tr>
          <td colSpan={5} style={{ textAlign: 'center', color: colors.gray400, padding: '24px' }}>
            אין {type === 'income' ? 'הכנסות' : 'הוצאות'} עדיין
          </td>
        </tr>
      );
    }

    return items.flatMap((item, index) => {
      const isExpanded = expandedRows.has(item.id);
      const hasNote = !!item.note;

      let pressTimer: ReturnType<typeof setTimeout> | null = null;

      const handlePressStart = () => {
        pressTimer = setTimeout(() => {
          setConfirmState({
            open: true,
            title: `למחוק את השורה "${item.desc || 'ללא תיאור'}"?\nפעולה זו תשנה את החישובים.`,
            onConfirm: () => {
              deleteRow(type, item.id);
            }
          });
        }, 3000);
      };

      const handlePressEnd = () => {
        if (pressTimer) clearTimeout(pressTimer);
      };

      const rows = [
        <tr
          key={item.id}
          style={{
            backgroundColor: focusedRowId === item.id ? colors.focusBg : index % 2 === 0 ? colors.white : zebraColor,
            userSelect: 'none',
          }}
          onFocus={() => setFocusedRowId(item.id)}
          onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusedRowId(null); }}
          onMouseEnter={() => setHoveredRowId(item.id)}
          onMouseLeave={() => { setHoveredRowId(null); handlePressEnd(); }}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
        >
          <td className="date-col" style={{ width: '18%', textAlign: 'center', verticalAlign: 'middle' }}>
            <input
              type="date"
              value={item.date || ''}
              onChange={e => updateItem(type, item.id, 'date', e.target.value)}
              onMouseDown={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '11px', color: item.date ? colors.gray700 : colors.gray400, direction: 'ltr', width: '100%', cursor: 'pointer', padding: '4px 2px' }}
              title={item.date ? fmtShort(item.date) : 'בחר תאריך'}
            />
          </td>
          <td style={{ width: '42%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => toggleVat(type, item.id)}
                onMouseDown={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
                title={item.vatable === false ? 'פטור ממע"מ — לחץ כדי לסמן כחייב' : 'חייב במע"מ — לחץ כדי לסמן כפטור'}
                style={{
                  flexShrink: 0, cursor: 'pointer', border: 'none', borderRadius: '999px',
                  fontSize: '9px', fontWeight: 600, padding: '2px 6px', whiteSpace: 'nowrap', lineHeight: 1.4,
                  background: item.vatable === false ? colors.amberChip : colors.greenChip,
                  color: item.vatable === false ? colors.amberText : colors.greenDeep,
                }}
              >
                {item.vatable === false ? 'פטור' : 'מע"מ'}
              </button>
              <input
                type="text"
                value={item.desc}
                onChange={(e) => updateItem(type, item.id, 'desc', e.target.value)}
                placeholder="תיאור..."
                style={inputStyle}
                onMouseDown={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
              />
            </div>
          </td>
          <td style={{ width: '22%' }}>
            <input
              type="number"
              value={item.amount || ''}
              onChange={(e) => updateItem(type, item.id, 'amount', parseFloat(e.target.value) || 0)}
              placeholder="0"
              style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
              onMouseDown={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
            />
          </td>
          <td style={{ width: '10%', textAlign: 'center' }}>
            <button
              onClick={() => toggleExpand(item.id)}
              onMouseDown={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: hasNote ? colors.blue : colors.gray400, padding: '8px' }}
            >
              {isExpanded ? '▲' : '▼'}
            </button>
          </td>
          <td style={{ width: '8%', textAlign: 'center' }}>
            {hoveredRowId === item.id && (
              <button
                onClick={() => {
                  setConfirmState({
                    open: true,
                    title: `למחוק "${item.desc || 'שורה'}"?\nפעולה זו תשנה את החישובים.`,
                    onConfirm: () => {
                      deleteRow(type, item.id);
                    }
                  });
                }}
                onMouseDown={e => e.stopPropagation()}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.redStrong, padding: '6px', fontSize: '14px' }}
              >
                ✕
              </button>
            )}
          </td>
        </tr>
      ];

      if (isExpanded) {
        rows.push(
          <tr key={`${item.id}-note`} style={{ backgroundColor: colors.cream }}>
            <td colSpan={5} style={{ padding: '8px 14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: colors.noteText, marginBottom: '6px' }}>
                <input
                  type="checkbox"
                  checked={item.vatable !== false}
                  onChange={() => toggleVat(type, item.id)}
                  style={{ width: '15px', height: '15px', accentColor: colors.green, cursor: 'pointer', flexShrink: 0 }}
                />
                חייב במע&quot;מ <span style={{ color: colors.gray400 }}>{item.vatable === false ? '(פטור — נרשם ללא מע"מ)' : '(נרשם כולל מע"מ)'}</span>
              </label>
              <input
                type="text"
                value={item.note}
                onChange={(e) => updateItem(type, item.id, 'note', e.target.value)}
                placeholder="הערה חופשית..."
                style={{ ...inputStyle, padding: '6px 0', fontSize: '13px', color: colors.noteText }}
              />
            </td>
          </tr>
        );
      }

      return rows;
    });
  };

  const tableSection = (type: 'income' | 'expense') => {
    const isIncome = type === 'income';
    const rawItems = isIncome ? project.income : project.expense;
    const items = getSortedItems(rawItems, type);
    const isSorted = sortedTypes.has(type);
    const total = isIncome ? income : expense;
    const headerBg = isIncome ? colors.green : colors.orange;
    const summaryBg = isIncome ? colors.greenBg : colors.orangeBg;
    const summaryColor = isIncome ? colors.greenLabel : colors.orangeText;
    const zebraColor = isIncome ? colors.zebraIncome : colors.zebraExpense;
    const label = isIncome ? 'הכנסות' : 'הוצאות';

    return (
      <section style={{ marginBottom: '12px' }}>
        <div style={{ borderTop: `1px solid ${colors.gray200}`, borderBottom: `1px solid ${colors.gray200}`, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: headerBg, padding: '10px 12px' }}>
            <span style={{ color: colors.white, fontWeight: '500', fontSize: '15px' }}>{label}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => toggleSort(type)}
                style={{ background: isSorted ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '4px', color: colors.white, fontSize: '11px', padding: '4px 8px', cursor: 'pointer' }}
                title="מיין לפי תאריך"
              >
                {isSorted ? '↑ תאריך' : '⇅ מיין'}
              </button>
              <button
                onClick={() => addRow(type)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '4px', color: colors.white, fontSize: '12px', padding: '4px 10px', cursor: 'pointer' }}
              >
                + הוסף
              </button>
            </div>
          </div>

          <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: colors.gray50, fontSize: '12px', color: colors.gray500 }}>
                <th className="date-col" style={{ width: '18%', padding: '8px 4px', textAlign: 'center', fontWeight: 500 }}>תאריך</th>
                <th style={{ width: '42%', padding: '8px', textAlign: 'right', fontWeight: 500 }}>תיאור</th>
                <th style={{ width: '22%', padding: '8px', textAlign: 'right', fontWeight: 500 }}>סכום ₪</th>
                <th style={{ width: '10%', padding: '8px', textAlign: 'center', fontWeight: 500 }}>הערה</th>
                <th style={{ width: '8%' }}></th>
              </tr>
            </thead>
            <tbody>
              {renderTableRows(items, type, zebraColor)}
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
    <div style={{ maxWidth: '480px', margin: '0 auto', direction: 'rtl', minHeight: '100vh', background: colors.gray50 }}>
      <style>{`
        @media (max-width: 400px) {
          .date-col { width: 32px !important; padding: 0 !important; }
          .date-col input[type="date"] { width: 28px; font-size: 0; color: transparent; }
          .date-col input[type="date"]::-webkit-calendar-picker-indicator { margin: 0; padding: 4px; opacity: 0.5; }
          .date-col th { font-size: 0; }
          .date-col th::after { content: '📅'; font-size: 12px; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: colors.navy, padding: '14px 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            {editingName ? (
              <input
                type="text"
                value={nameValue}
                autoFocus
                onChange={e => setNameValue(e.target.value)}
                onBlur={() => { if (nameValue.trim()) onUpdate({ ...project, name: nameValue.trim() }); setEditingName(false); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') { if (nameValue.trim()) onUpdate({ ...project, name: nameValue.trim() }); setEditingName(false); }
                  if (e.key === 'Escape') { setNameValue(project.name); setEditingName(false); }
                }}
                style={{ background: 'transparent', border: 'none', borderBottom: '2px solid rgba(255,255,255,0.5)', color: colors.white, fontSize: '17px', fontWeight: '500', outline: 'none', direction: 'rtl', width: '100%' }}
              />
            ) : (
              <div
                onClick={() => { setEditingName(true); setNameValue(project.name); }}
                style={{ color: colors.white, fontSize: '17px', fontWeight: '500', cursor: 'text' }}
                title="לחץ לעריכת שם"
              >
                {project.name} <span style={{ fontSize: '11px', opacity: 0.4 }}>✎</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center', justifyContent: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>התחלה</span>
                <input
                  type="date"
                  value={project.startDate || ''}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '11px', direction: 'ltr', cursor: 'pointer', outline: 'none' }}
                />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>—</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>סיום</span>
                <input
                  type="date"
                  value={project.endDate || ''}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: project.endDate ? 'rgba(255,255,255,0.8)' : colors.yellow, fontSize: '11px', direction: 'ltr', cursor: 'pointer', outline: 'none' }}
                />
              </div>
            </div>
          </div>
          <button
            onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '6px', color: colors.white, padding: '6px 12px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            ← חזור
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px' }}>
          {[
            { label: 'הכנסות', value: income, color: colors.mintKpi },
            { label: 'הוצאות', value: expense, color: colors.peachKpi },
            { label: 'רווח', value: profit, color: profit >= 0 ? colors.mintKpi : colors.peachKpi },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '10px', marginBottom: '3px' }}>{label}</div>
              <div style={{ color, fontSize: '20px', fontWeight: '500' }}>{fmt(value)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '12px 0' }}>
        {tableSection('income')}
        {tableSection('expense')}

        {/* סיכום מע"מ */}
        <section style={{ margin: '0 12px 12px' }}>
          <div style={{ border: `1px solid ${colors.gray200}`, borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ background: colors.navy, padding: '9px 12px', color: colors.white, fontSize: '13px', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
              <span>מע&quot;מ</span>
              <span style={{ opacity: 0.7, fontSize: '12px' }}>{vatRate}%</span>
            </div>
            <div style={{ background: colors.white }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', fontSize: '13px', color: colors.gray700, borderBottom: `1px solid ${colors.gray100}` }}>
                <span>הכנסות חייבות מע&quot;מ</span><span style={{ fontWeight: 500 }}>{fmt(vatableIncome)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', fontSize: '13px', color: colors.gray700, borderBottom: `1px solid ${colors.gray100}` }}>
                <span>מע&quot;מ עסקאות (פלט)</span><span style={{ fontWeight: 500 }}>{fmt(outputVat)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', fontSize: '13px', color: colors.gray700, borderBottom: `1px solid ${colors.gray100}` }}>
                <span>מע&quot;מ תשומות (קלט)</span><span style={{ fontWeight: 500, color: colors.greenText }}>− {fmt(inputVat)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', background: netVat >= 0 ? colors.amberBg : colors.greenBg }}>
                <span style={{ fontWeight: 700, color: netVat >= 0 ? colors.amber : colors.greenLabel }}>{netVat >= 0 ? 'מע"מ לתשלום' : 'החזר מע"מ'}</span>
                <span style={{ fontWeight: 700, fontSize: '16px', color: netVat >= 0 ? colors.amber : colors.greenLabel }}>{fmt(Math.abs(netVat))}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <ConfirmModal
        isOpen={confirmState.open}
        title={confirmState.title}
        onConfirm={() => { confirmState.onConfirm(); setConfirmState(s => ({...s, open: false})); }}
        onCancel={() => setConfirmState(s => ({...s, open: false}))}
      />
    </div>
  );
}

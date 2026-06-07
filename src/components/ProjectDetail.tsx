'use client';

import { useState } from 'react';
import { Project, LineItem } from '@/lib/types';
import { generateId } from '@/lib/storage';
import {
  calcProjectIncome,
  calcProjectExpense,
  calcProjectProfit,
} from '@/lib/calculations';
import ConfirmModal from './ConfirmModal';

const fmt = (n: number) => '₪' + Math.round(n).toLocaleString('he-IL');

interface Props {
  project: Project;
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

export default function ProjectDetail({ project, onBack, onUpdate }: Props) {
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

  const today = new Date().toISOString().split('T')[0];

  const addRow = (type: 'income' | 'expense') => {
    const newItem: LineItem = { id: generateId(), desc: '', amount: 0, note: '', date: today };
    onUpdate({ ...project, [type]: [...project[type], newItem] });
  };

  const deleteRow = (type: 'income' | 'expense', itemId: string) => {
    onUpdate({ ...project, [type]: project[type].filter(item => item.id !== itemId) });
    setExpandedRows(prev => { const s = new Set(prev); s.delete(itemId); return s; });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onUpdate({ ...project, [field]: value });
  };

  const fmtShort = (d: string) => { if (!d) return ''; const p = d.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; };

  const renderTableRows = (items: LineItem[], type: 'income' | 'expense', zebraColor: string) => {
    if (items.length === 0) {
      return (
        <tr>
          <td colSpan={5} style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px' }}>
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
            backgroundColor: focusedRowId === item.id ? '#EEF4FF' : index % 2 === 0 ? '#FFFFFF' : zebraColor,
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
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '11px', color: item.date ? '#374151' : '#9CA3AF', direction: 'ltr', width: '100%', cursor: 'pointer', padding: '4px 2px' }}
              title={item.date ? fmtShort(item.date) : 'בחר תאריך'}
            />
          </td>
          <td style={{ width: '42%' }}>
            <input
              type="text"
              value={item.desc}
              onChange={(e) => updateItem(type, item.id, 'desc', e.target.value)}
              placeholder="תיאור..."
              style={inputStyle}
              onMouseDown={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
            />
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
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: hasNote ? '#2563EB' : '#9CA3AF', padding: '8px' }}
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
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '6px', fontSize: '14px' }}
              >
                ✕
              </button>
            )}
          </td>
        </tr>
      ];

      if (isExpanded) {
        rows.push(
          <tr key={`${item.id}-note`} style={{ backgroundColor: '#F1EFE8' }}>
            <td colSpan={5} style={{ padding: '0' }}>
              <input
                type="text"
                value={item.note}
                onChange={(e) => updateItem(type, item.id, 'note', e.target.value)}
                placeholder="הערה חופשית..."
                style={{ ...inputStyle, padding: '10px 14px', fontSize: '13px', color: '#555' }}
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
    const headerBg = isIncome ? '#1D9E75' : '#D85A30';
    const summaryBg = isIncome ? '#EAF3DE' : '#FAECE7';
    const summaryColor = isIncome ? '#27500A' : '#712B13';
    const zebraColor = isIncome ? '#F8FFF8' : '#FFF8F8';
    const label = isIncome ? 'הכנסות' : 'הוצאות';

    return (
      <section style={{ marginBottom: '12px' }}>
        <div style={{ borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: headerBg, padding: '10px 12px' }}>
            <span style={{ color: '#fff', fontWeight: '500', fontSize: '15px' }}>{label}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => toggleSort(type)}
                style={{ background: isSorted ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '11px', padding: '4px 8px', cursor: 'pointer' }}
                title="מיין לפי תאריך"
              >
                {isSorted ? '↑ תאריך' : '⇅ מיין'}
              </button>
              <button
                onClick={() => addRow(type)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '12px', padding: '4px 10px', cursor: 'pointer' }}
              >
                + הוסף
              </button>
            </div>
          </div>

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
    <div style={{ maxWidth: '480px', margin: '0 auto', direction: 'rtl', minHeight: '100vh', background: '#F9FAFB' }}>
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
      <div style={{ background: '#1E3A5F', padding: '14px 16px 12px' }}>
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
                style={{ background: 'transparent', border: 'none', borderBottom: '2px solid rgba(255,255,255,0.5)', color: '#fff', fontSize: '17px', fontWeight: '500', outline: 'none', direction: 'rtl', width: '100%' }}
              />
            ) : (
              <div
                onClick={() => { setEditingName(true); setNameValue(project.name); }}
                style={{ color: '#fff', fontSize: '17px', fontWeight: '500', cursor: 'text' }}
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
                  style={{ background: 'transparent', border: 'none', color: project.endDate ? 'rgba(255,255,255,0.8)' : '#FCD34D', fontSize: '11px', direction: 'ltr', cursor: 'pointer', outline: 'none' }}
                />
              </div>
            </div>
          </div>
          <button
            onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '6px', color: '#fff', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            ← חזור
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px' }}>
          {[
            { label: 'הכנסות', value: income, color: '#9FE1CB' },
            { label: 'הוצאות', value: expense, color: '#F5C4B3' },
            { label: 'רווח', value: profit, color: profit >= 0 ? '#9FE1CB' : '#F5C4B3' },
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

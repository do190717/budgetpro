'use client';

import { useState, useRef } from 'react';
import { AppState, Project } from '@/lib/types';
import { generateId, addProject, deleteProject } from '@/lib/storage';
import { saveProjectToDB } from '@/lib/db';
import {
  calcProjectIncome,
  calcProjectExpense,
  calcProjectProfit,
  calcTotalIncome,
  calcTotalExpense,
  calcTotalProfit,
  calcGrandTotalIncome,
  calcGrandTotalExpense,
  calcGrandTotalProfit,
  getVatRate,
} from '@/lib/calculations';
import ProjectDetail from './ProjectDetail';
import FinanceTab from './FinanceTab';
import GeneralTab from './GeneralTab';
import ConfirmModal from './ConfirmModal';
import SettingsModal from './SettingsModal';

interface DashboardProps {
  state: AppState;
  onStateChange: (state: AppState) => void;
}

type Tab = 'projects' | 'general' | 'finance';

const fmt = (n: number) => '₪' + Math.round(n).toLocaleString('he-IL');

export default function Dashboard({ state, onStateChange }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const [confirmState, setConfirmState] = useState<{open: boolean, title: string, onConfirm: () => void}>({open: false, title: '', onConfirm: () => {}});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    const newProject: Project = {
      id: generateId(),
      name: newProjectName.trim(),
      startDate: newProjectDeadline || new Date().toISOString().split('T')[0],
      endDate: '',
      income: [],
      expense: [],
    };
    onStateChange(addProject(state, newProject));
    setNewProjectName('');
    setNewProjectDeadline('');
    setIsCreating(false);
  };

  const handleDeleteProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmState({
      open: true,
      title: 'האם למחוק את הפרויקט?',
      onConfirm: () => { onStateChange(deleteProject(state, projectId)); }
    });
  };

  const handleProjectUpdate = (project: Project) => {
    onStateChange({ ...state, projects: state.projects.map(p => p.id === project.id ? project : p) });
    // debounce שמירה
    if (saveTimers.current.has(project.id)) clearTimeout(saveTimers.current.get(project.id)!);
    saveTimers.current.set(project.id, setTimeout(() => saveProjectToDB(project), 1500));
  };

  const handleBack = () => {
    // שמירה מיידית לפני יציאה
    if (selectedProject) {
      const current = state.projects.find(p => p.id === selectedProject.id);
      if (current) {
        if (saveTimers.current.has(current.id)) {
          clearTimeout(saveTimers.current.get(current.id)!);
          saveTimers.current.delete(current.id);
        }
        saveProjectToDB(current);
      }
    }
    setSelectedProject(null);
  };

  if (selectedProject) {
    const current = state.projects.find(p => p.id === selectedProject.id);
    if (current) {
      return (
        <ProjectDetail
          project={current}
          vatRate={getVatRate(state.deductions)}
          onBack={handleBack}
          onUpdate={handleProjectUpdate}
        />
      );
    }
  }

  const grandIncome = calcGrandTotalIncome(state);
  const grandExpense = calcGrandTotalExpense(state);
  const grandProfit = calcGrandTotalProfit(state);
  const projIncome = calcTotalIncome(state.projects);
  const projExpense = calcTotalExpense(state.projects);
  const projProfit = calcTotalProfit(state.projects);

  const tabs = [
    { id: 'projects', label: 'פרויקטים' },
    { id: 'general', label: 'כללי' },
    { id: 'finance', label: 'ניכויים' },
  ];

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', direction: 'rtl', minHeight: '100vh', background: '#F3F4F6' }}>
      <div style={{ background: '#1E3A5F', padding: '16px 16px 0' }}>
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: '#fff', fontSize: '18px', fontWeight: '500' }}>
              {state.businessName || 'ניהול פרויקטים'}
            </div>
            {state.businessSubtitle && (
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', marginTop: '2px' }}>{state.businessSubtitle}</div>
            )}
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', color: 'rgba(255,255,255,0.8)', fontSize: '18px', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >⚙️</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', marginBottom: '14px' }}>
          {[
            { label: 'הכנסות', grand: grandIncome, proj: projIncome, color: '#9FE1CB' },
            { label: 'הוצאות', grand: grandExpense, proj: projExpense, color: '#F5C4B3' },
            { label: 'רווח', grand: grandProfit, proj: projProfit, color: grandProfit >= 0 ? '#9FE1CB' : '#F5C4B3' },
          ].map(({ label, grand, proj, color }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '10px', marginBottom: '3px' }}>{label}</div>
              <div style={{ color, fontSize: '20px', fontWeight: '500' }}>{fmt(grand)}</div>
              {grand !== proj && (
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', marginTop: '3px' }}>פרויקטים {fmt(proj)}</div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)}
              style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: activeTab === tab.id ? '500' : '400', color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.55)', background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #60A5FA' : '2px solid transparent', cursor: 'pointer' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px' }}>
        {activeTab === 'general' && <GeneralTab state={state} onStateChange={onStateChange} />}
        {activeTab === 'finance' && <FinanceTab state={state} onStateChange={onStateChange} />}
        {activeTab === 'projects' && (
          <>
            {isCreating ? (
              <div style={{ background: '#fff', borderRadius: '12px', padding: '14px', marginBottom: '10px', border: '1px solid #E5E7EB' }}>
                <div style={{ fontWeight: '500', marginBottom: '10px', color: '#1F2937' }}>פרויקט חדש</div>
                <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="שם הפרויקט..." autoFocus onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
                  style={{ width: '100%', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '8px 10px', fontSize: '14px', direction: 'rtl', outline: 'none', marginBottom: '8px', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '12px', color: '#6B7280', whiteSpace: 'nowrap' }}>תאריך התחלה:</label>
                  <input type="date" value={newProjectDeadline} onChange={e => setNewProjectDeadline(e.target.value)}
                    style={{ flex: 1, border: '1px solid #D1D5DB', borderRadius: '8px', padding: '7px 10px', fontSize: '13px', direction: 'ltr', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleCreateProject} style={{ flex: 1, background: '#2563EB', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}>צור פרויקט</button>
                  <button onClick={() => { setIsCreating(false); setNewProjectName(''); setNewProjectDeadline(''); }} style={{ flex: 1, background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: '8px', padding: '9px', fontSize: '14px', cursor: 'pointer' }}>ביטול</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsCreating(true)} style={{ width: '100%', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginBottom: '10px' }}>
                + פרויקט חדש
              </button>
            )}

            {state.projects.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', color: '#9CA3AF', border: '1px solid #E5E7EB' }}>
                אין פרויקטים עדיין. לחץ על &quot;פרויקט חדש&quot; להתחלה.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {state.projects.map((project, idx) => {
                  const income = calcProjectIncome(project);
                  const expense = calcProjectExpense(project);
                  const profit = calcProjectProfit(project);
                  const cardBg = idx % 2 === 0 ? '#F0F7FF' : '#F8FBFF';
                  let pressTimer: ReturnType<typeof setTimeout> | null = null;
                  const handlePressStart = () => {
                    pressTimer = setTimeout(() => {
                      setConfirmState({ open: true, title: `למחוק את הפרויקט "${project.name}"?`, onConfirm: () => { onStateChange(deleteProject(state, project.id)); } });
                    }, 600);
                  };
                  const handlePressEnd = () => { if (pressTimer) clearTimeout(pressTimer); };

                  return (
                    <div key={project.id}
                      onClick={() => editingNameId !== project.id && setSelectedProject(project)}
                      onMouseEnter={() => setHoveredCardId(project.id)}
                      onMouseLeave={() => { setHoveredCardId(null); handlePressEnd(); }}
                      onMouseDown={handlePressStart} onMouseUp={handlePressEnd}
                      onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}
                      style={{ background: cardBg, borderRadius: '12px', border: '1px solid #DBEAFE', overflow: 'hidden', cursor: 'pointer', userSelect: 'none' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: '11px 14px 8px', direction: 'rtl' }}>
                        {editingNameId === project.id ? (
                          <input type="text" value={editingNameValue} autoFocus onChange={e => setEditingNameValue(e.target.value)}
                            onBlur={() => { if (editingNameValue.trim()) handleProjectUpdate({ ...project, name: editingNameValue.trim() }); setEditingNameId(null); }}
                            onKeyDown={e => { if (e.key === 'Enter') { if (editingNameValue.trim()) handleProjectUpdate({ ...project, name: editingNameValue.trim() }); setEditingNameId(null); } if (e.key === 'Escape') setEditingNameId(null); }}
                            onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}
                            style={{ fontSize: '15px', fontWeight: '500', color: '#1F2937', border: 'none', borderBottom: '2px solid #2563EB', background: 'transparent', outline: 'none', direction: 'rtl', width: '100%' }} />
                        ) : (
                          <div style={{ fontSize: '15px', fontWeight: '500', color: '#1F2937' }}
                            onDoubleClick={e => { e.stopPropagation(); setEditingNameId(project.id); setEditingNameValue(project.name); }}>
                            {project.name}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }} onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
                          <input type="date" value={project.startDate || ''} onChange={e => handleProjectUpdate({ ...project, startDate: e.target.value })} style={{ border: 'none', background: 'transparent', fontSize: '11px', color: '#9CA3AF', direction: 'ltr', outline: 'none', width: '100px', cursor: 'pointer' }} />
                          <span style={{ fontSize: '11px', color: '#D1D5DB' }}>—</span>
                          <input type="date" value={project.endDate || ''} onChange={e => handleProjectUpdate({ ...project, endDate: e.target.value })} style={{ border: 'none', background: 'transparent', fontSize: '11px', color: '#9CA3AF', direction: 'ltr', outline: 'none', width: '100px', cursor: 'pointer' }} />
                          {hoveredCardId === project.id && (
                            <button onClick={(e) => handleDeleteProject(project.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '14px', padding: '2px 4px', lineHeight: 1 }}>✕</button>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: '1px solid #F3F4F6' }}>
                        {[
                          { label: 'הכנסות', value: income, color: '#059669' },
                          { label: 'הוצאות', value: expense, color: '#DC2626' },
                          { label: 'רווח', value: profit, color: profit >= 0 ? '#2563EB' : '#DC2626' },
                        ].map(({ label, value, color }, i) => (
                          <div key={label} style={{ padding: '8px 10px', textAlign: 'center', borderRight: i < 2 ? '1px solid #F3F4F6' : 'none' }}>
                            <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '2px' }}>{label}</div>
                            <div style={{ fontSize: '15px', fontWeight: '500', color }}>{fmt(value)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal isOpen={confirmState.open} title={confirmState.title}
        onConfirm={() => { confirmState.onConfirm(); setConfirmState(s => ({...s, open: false})); }}
        onCancel={() => setConfirmState(s => ({...s, open: false}))} />

      {settingsOpen && (
        <SettingsModal state={state} onClose={() => setSettingsOpen(false)}
          onSave={(name, subtitle) => onStateChange({ ...state, businessName: name, businessSubtitle: subtitle })} />
      )}
    </div>
  );
}

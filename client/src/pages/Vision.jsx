import React, { useState, useCallback, useMemo } from 'react';
import api from '../lib/axios';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { TaskSections, TaskForm } from '../components/TaskList';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDots, Calendar, CalendarBlank, Crown } from '@phosphor-icons/react';
import clsx from 'clsx';

const SCOPES = [
  { key: 'weekly',    label: 'Weekly',    icon: CalendarDots },
  { key: 'monthly',   label: 'Monthly',   icon: Calendar },
  { key: 'quarterly', label: 'Quarterly', icon: CalendarBlank },
  { key: 'yearly',    label: 'Yearly',    icon: Crown },
];

const getPeriodRange = (scope, date) => {
  switch (scope) {
    case 'weekly': return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) };
    case 'monthly': return { start: startOfMonth(date), end: endOfMonth(date) };
    case 'quarterly': return { start: startOfQuarter(date), end: endOfQuarter(date) };
    case 'yearly': return { start: startOfYear(date), end: endOfYear(date) };
    default: return { start: date, end: date };
  }
};

const formatPeriodLabel = (scope, range) => {
  switch (scope) {
    case 'weekly': return `${format(range.start, 'MMM d')} — ${format(range.end, 'MMM d')}`;
    case 'monthly': return format(range.start, 'MMMM yyyy');
    case 'quarterly': return `Q${Math.ceil((range.start.getMonth() + 1) / 3)} ${format(range.start, 'yyyy')}`;
    case 'yearly': return format(range.start, 'yyyy');
    default: return '';
  }
};

const Vision = () => {
  const [scope, setScope] = useState('weekly');
  const [tasks, setTasks] = useState([]);
  const [date] = useState(new Date());

  const periodRange = useMemo(() => getPeriodRange(scope, date), [scope, date]);
  const periodLabel = useMemo(() => formatPeriodLabel(scope, periodRange), [scope, periodRange]);

  const fetchTasks = useCallback(async () => {
    try {
      const params = { scope };
      if (scope === 'weekly') params.periodStart = format(periodRange.start, 'yyyy-MM-dd');
      else if (scope === 'monthly') params.periodStart = format(periodRange.start, 'yyyy-MM-dd');
      else if (scope === 'quarterly') params.periodStart = format(periodRange.start, 'yyyy-MM-dd');
      else if (scope === 'yearly') params.periodStart = format(periodRange.start, 'yyyy-MM-dd');
      const res = await api.get('/tasks', { params });
      setTasks(res.data);
    } catch (e) { console.error(e); }
  }, [scope, periodRange]);

  useAutoRefresh(fetchTasks, [scope, periodRange]);

  const addTask = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api.post('/tasks', { 
        title: fd.get('title'), 
        section: fd.get('section'), 
        priority: fd.get('priority') || 'medium',
        scope,
        periodStart: format(periodRange.start, 'yyyy-MM-dd')
      });
      e.target.reset();
      fetchTasks();
    } catch (err) { alert(err.response?.data?.message || "Failed"); }
  };

  const toggleTask = async (task) => {
    try { await api.put(`/tasks/${task._id}`, { completed: !task.completed, version: task.version }); fetchTasks(); } catch { alert("Failed"); }
  };

  const deleteTask = async (id) => {
    if (!confirm("Delete?")) return;
    try { await api.delete(`/tasks/${id}`); fetchTasks(); } catch { alert("Failed"); }
  };

  const moveTask = async (task, dir) => {
    const newRank = task.priorityRank + (dir === -1 ? 1 : -1);
    if (newRank < 0) return;
    try { await api.patch(`/tasks/${task._id}/reorder`, { priorityRank: newRank, version: task.version }); fetchTasks(); } catch (e) { alert(e.response?.data?.message || "Failed"); }
  };

  const handleReorder = async (task, newSection, newRank) => {
    try {
      await api.patch(`/tasks/${task._id}/reorder`, { 
        section: newSection, 
        priorityRank: newRank,
        version: task.version 
      });
      fetchTasks();
    } catch (e) {
      alert(e.response?.data?.message || "Reorder failed");
      fetchTasks();
    }
  };

  const handleUpdateTask = async (task, updates) => {
    try {
      await api.put(`/tasks/${task._id}`, { ...updates, version: task.version });
      fetchTasks();
    } catch (e) {
      alert(e.response?.data?.message || "Update failed");
      fetchTasks();
    }
  };

  const handleChangeScope = async (task, newScope) => {
    try {
      let updateData = { scope: newScope, version: task.version, section: 'should' };
      const now = new Date();
      if (newScope === 'daily') {
        updateData.date = format(now, 'yyyy-MM-dd');
        updateData.periodStart = undefined;
      } else {
        updateData.date = undefined;
        const range = getPeriodRange(newScope, now);
        updateData.periodStart = format(range.start, 'yyyy-MM-dd');
      }
      await api.patch(`/tasks/${task._id}/reorder`, updateData);
      fetchTasks();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to move task");
    }
  };

  const handleQuickAdd = async ({ title, section, priority }) => {
    try {
      await api.post('/tasks', {
        title, section, priority,
        scope,
        periodStart: format(periodRange.start, 'yyyy-MM-dd')
      });
      fetchTasks();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to add task");
    }
  };

  // Stats
  const completed = useMemo(() => tasks.filter(t => t.completed).length, [tasks]);
  const total = tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const ScopeIcon = SCOPES.find(s => s.key === scope)?.icon || CalendarDots;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-3xl mx-auto pb-24 relative"
    >
      {/* Editorial Header */}
      <header className="mb-10 pt-6">
        <div className="flex justify-between items-end mb-5">
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="flex items-center gap-2 text-primary/60 mb-3"
            >
              <ScopeIcon size={14} weight="duotone" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Vision Board</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-foreground leading-none">
              {SCOPES.find(s => s.key === scope)?.label}
            </h1>
          </div>

          <div className="text-right">
            <AnimatePresence mode="wait">
              <motion.div
                key={scope}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                <div className="text-2xl font-serif font-light text-muted-foreground/60">{periodLabel}</div>
                {total > 0 && (
                  <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground/40 mt-0.5">
                    {completed} of {total} complete
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Scope Tabs — Pill selector with animated indicator */}
        <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-2xl w-fit mb-5">
          {SCOPES.map(s => (
            <button
              key={s.key}
              onClick={() => setScope(s.key)}
              className={clsx(
                "relative px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-colors duration-200",
                scope === s.key
                  ? "text-primary-foreground"
                  : "text-muted-foreground/60 hover:text-foreground"
              )}
            >
              {scope === s.key && (
                <motion.div
                  layoutId="scope-pill"
                  className="absolute inset-0 bg-primary rounded-xl shadow-md shadow-primary/15"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <s.icon size={13} weight={scope === s.key ? "fill" : "regular"} />
                {s.label}
              </span>
            </button>
          ))}
        </div>

        {/* Completion progress */}
        {total > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3"
          >
            <div className="flex-1 h-[3px] rounded-full bg-muted/30 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground/50 tabular-nums">
              {pct}%
            </span>
          </motion.div>
        )}

        <div className="h-px w-full bg-gradient-to-r from-border/60 via-border/30 to-transparent mt-5" />
      </header>

      {/* Task Form */}
      <div className="mb-6">
        <TaskForm 
          onSubmit={addTask} 
          label="Add Goal" 
          placeholder={`Define a ${scope} goal…`} 
        />
      </div>

      {/* Task Sections */}
      <AnimatePresence mode="wait">
        <motion.div
          key={scope}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
        >
          <TaskSections
            tasks={tasks}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onMove={moveTask}
            onMoveScope={handleChangeScope}
            onReorder={handleReorder}
            onUpdate={handleUpdateTask}
            onAdd={handleQuickAdd}
          />
        </motion.div>
      </AnimatePresence>

      {/* Summary footer */}
      {total > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 pt-6 border-t border-border/20 flex justify-between items-center"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30">
            {scope} vision
          </span>
          <span className="text-xs text-muted-foreground/40 font-mono tabular-nums">
            {pct}% toward completion
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Vision;

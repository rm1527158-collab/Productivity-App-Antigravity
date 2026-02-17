import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import api from '../lib/axios';
import { Leaf } from 'lucide-react';
import { format, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';
import { TaskSections, TaskForm } from '../components/TaskList';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { motion } from 'framer-motion';

const DailyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [date] = useState(new Date());
  const [rolloverCount, setRolloverCount] = useState(0);
  const hasRolledOver = useRef(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get('/tasks', { params: { scope: 'daily', date: format(date, 'yyyy-MM-dd') } });
      setTasks(res.data);
    } catch (e) { console.error(e); }
  }, [date]);

  // Auto-rollover on mount
  useEffect(() => {
    if (hasRolledOver.current) return;
    hasRolledOver.current = true;
    const doRollover = async () => {
      try {
        const { data } = await api.post('/tasks/rollover', { date: format(new Date(), 'yyyy-MM-dd') });
        if (data.count > 0) {
          setRolloverCount(data.count);
          fetchTasks();
        }
      } catch (err) {
        console.error('Rollover failed:', err);
      }
    };
    doRollover();
  }, [fetchTasks]);

  useAutoRefresh(fetchTasks, [date]);

  const addTask = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api.post('/tasks', { 
        title: fd.get('title'), 
        section: fd.get('section'), 
        priority: fd.get('priority') || 'medium',
        scope: 'daily', 
        date: format(date, 'yyyy-MM-dd') 
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
        if (newScope === 'weekly') updateData.periodStart = startOfWeek(now, { weekStartsOn: 1 });
        else if (newScope === 'monthly') updateData.periodStart = startOfMonth(now);
        else if (newScope === 'quarterly') updateData.periodStart = startOfQuarter(now);
        else if (newScope === 'yearly') updateData.periodStart = startOfYear(now);
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
        scope: 'daily', 
        date: format(date, 'yyyy-MM-dd')
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-3xl mx-auto pb-24 relative"
    >
      {/* Rollover notification */}
      {rolloverCount > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 overflow-hidden"
        >
          <div className="px-4 py-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30 flex items-center gap-2.5 text-sm">
            <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 text-xs font-bold">{rolloverCount}</span>
            <span className="text-amber-700 dark:text-amber-400 font-medium text-xs">
              task{rolloverCount > 1 ? 's' : ''} rolled over from previous days
            </span>
          </div>
        </motion.div>
      )}

      {/* Editorial Header */}
      <header className="mb-10 pt-6 relative">
        <div className="flex justify-between items-end mb-5">
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="flex items-center gap-2 text-primary/60 mb-3"
            >
              <Leaf size={14} />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em]">Daily Manifest</span>
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold tracking-tight text-foreground leading-none">
              {format(date, 'EEEE')}
            </h1>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-serif font-light text-muted-foreground/60">{format(date, 'MMMM d')}</div>
            <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground/40 mt-0.5">{format(date, 'yyyy')}</div>
          </div>
        </div>
        
        {/* Completion progress */}
        {total > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 mt-4"
          >
            <div className="flex-1 h-[3px] rounded-full bg-muted/30 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground/50 tabular-nums whitespace-nowrap">
              {completed}/{total} done
            </span>
          </motion.div>
        )}

        <div className="h-px w-full bg-gradient-to-r from-border/60 via-border/30 to-transparent mt-5" />
      </header>
      
      {/* Task Form */}
      <div className="mb-6">
        <TaskForm onSubmit={addTask} label="Add Task" placeholder="What needs your attention today?" />
      </div>

      {/* Task Sections */}
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

      {/* Summary footer */}
      {total > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 pt-6 border-t border-border/20 flex justify-between items-center"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/30">
            End of manifest
          </span>
          <span className="text-xs text-muted-foreground/40 font-mono tabular-nums">
            {pct}% complete
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DailyTasks;

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../lib/axios';
import { Plus, X, ChevronsRight, Info, Trash2 } from 'lucide-react';
import { Fire, Check, Heartbeat, CalendarBlank, Repeat, Lightning } from '@phosphor-icons/react';
import clsx from 'clsx';
import { format, subDays, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, addDays, differenceInCalendarDays, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import IconPicker, { ICONS } from '../components/IconPicker';
import Modal from '../components/Modal';
import useAutoRefresh from '../hooks/useAutoRefresh';

const FREQUENCIES = [
  { id: 'daily', label: 'Daily', icon: Lightning },
  { id: 'weekly', label: 'Weekly', icon: CalendarBlank },
  { id: 'monthly', label: 'Monthly', icon: CalendarBlank },
  { id: 'custom', label: 'Custom', icon: Repeat },
];

const HabitIcon = ({ iconName, className }) => {
  const Icon = ICONS[iconName] || Heartbeat;
  return <Icon className={className} weight="duotone" />;
};

// --- Tracker Components ---

const DailyTracker = ({ habit, occurrences, onToggle, today }) => {
  const start = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start, end: endOfWeek(today, { weekStartsOn: 1 }) });

  return (
    <div className="flex justify-between items-center mt-6 pt-4 border-t border-border/40">
      {weekDays.map((date, i) => {
          const isToday = isSameDay(date, today);
          const isDone = occurrences.some(o => o.habitId === habit._id && isSameDay(new Date(o.dateUTC), date));
          const isFuture = date > today;
          
          return (
              <button 
                  key={i} 
                  disabled={isFuture}
                  onClick={() => onToggle(habit._id, date)}
                  className="flex flex-col items-center gap-1.5 group disabled:opacity-30 disabled:cursor-not-allowed transition-all relative"
              >
                  <span className={clsx("text-[9px] font-bold uppercase tracking-wider", isToday ? "text-primary" : "text-muted-foreground/70")}>
                      {format(date, 'EEEEE')}
                  </span>
                  <div className={clsx(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 relative overflow-hidden",
                      isDone 
                         ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                         : "bg-muted/30 border border-transparent hover:border-primary/30 text-transparent",
                      isToday && !isDone && "ring-2 ring-primary/20 ring-offset-1 bg-white"
                  )}>
                      <AnimatePresence>
                        {isDone && (
                          <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                          >
                             <Check size={14} weight="bold" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                  </div>
              </button>
          )
      })}
    </div>
  );
};

// Logic for Custom "Every X Days"
const CustomTracker = ({ habit, occurrences, onToggle, today }) => {
    const interval = habit.intervalDays || 1;
    const startDate = new Date(habit.startDate);
    
    // Calculate if simple fixed schedule
    const diffDays = differenceInCalendarDays(today, startDate);
    const isDueToday = diffDays >= 0 && (diffDays % interval === 0);
    
    // For custom, checking if "Done Today" is enough for the toggle state
    const isDoneToday = occurrences.some(o => o.habitId === habit._id && isSameDay(new Date(o.dateUTC), today));
    
    // Find last completion to show streak or last done
    const lastCompletion = occurrences
        .filter(o => o.habitId === habit._id)
        .sort((a, b) => new Date(b.dateUTC) - new Date(a.dateUTC))[0];

    const lastDoneDate = lastCompletion ? new Date(lastCompletion.dateUTC) : null;

    return (
        <div className="mt-6 pt-4 border-t border-border/40">
            <div className="flex justify-between items-center mb-3">
                 <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <Repeat size={14} className="text-primary" />
                    Every {interval} days
                 </div>
                 {isDueToday && !isDoneToday && (
                     <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full animate-pulse">
                         Due Today
                     </span>
                 )}
            </div>

            <button 
                onClick={() => onToggle(habit._id, today)}
                className={clsx(
                    "w-full py-2.5 rounded-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all duration-300",
                    isDoneToday 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                        : isDueToday
                            ? "bg-primary/5 text-primary border-2 border-primary hover:bg-primary hover:text-white"
                            : "bg-muted/10 text-muted-foreground hover:bg-muted/30"
                )}
            >
                {isDoneToday ? (
                    <>Done <Check weight="bold" /></>
                ) : (
                    <>Mark Done</>
                )}
            </button>
            
            {lastDoneDate && !isDoneToday && (
                <p className="text-[10px] text-center text-muted-foreground mt-2">
                    Last done: {format(lastDoneDate, "MMM do")}
                </p>
            )}
        </div>
    );
}

const PeriodTracker = ({ habit, periodStart, label, occurrences, onToggle }) => {
    const isDone = occurrences.some(o => o.habitId === habit._id && isSameDay(new Date(o.dateUTC), periodStart));
    
    return (
        <div className="mt-6 pt-4 border-t border-border/40">
            <button 
              onClick={() => onToggle(habit._id, periodStart)}
              className={clsx(
                  "w-full py-2.5 rounded-full flex items-center justify-center gap-2 transition-all font-bold uppercase text-xs tracking-wider border",
                  isDone 
                      ? "bg-primary text-primary-foreground border-primary shadow-md" 
                      : "bg-white text-muted-foreground border-border hover:border-primary/50 hover:text-primary hover:bg-primary/5"
              )}
            >
                {isDone && <Check size={14} weight="bold" />}
                <span>{isDone ? `${label} Complete` : `Mark ${label} Done`}</span>
            </button>
        </div>
    )
};

const Routine = () => {
  const [habits, setHabits] = useState([]);
  const [occurrences, setOccurrences] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [newHabit, setNewHabit] = useState({ title: '', frequency: 'daily', icon: 'Activity', intervalDays: 2 });
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  // Ensure today date updates on re-renders (triggered by auto-refresh) to handle midnight crossovers
  const today = new Date();
  
  // Track toggling state to prevent double-clicks/race conditions
  const [toggling, setToggling] = React.useState(new Set());

  const fetchData = useCallback(async () => {
    try {
      const [h, o, s] = await Promise.all([api.get('/habits'), api.get('/habits/occurrences'), api.get('/habits/streaks')]);
      setHabits(h.data);
      setOccurrences(o.data);
      setStreaks(s.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  // Enable auto-refresh every 5 seconds
  useAutoRefresh(fetchData);

  const handleAddHabit = async (e) => {
    e.preventDefault();
    try { 
        await api.post('/habits', { 
            title: newHabit.title, 
            frequency: newHabit.frequency,
            icon: newHabit.icon,
            intervalDays: newHabit.frequency === 'custom' ? parseInt(newHabit.intervalDays) : undefined
        }); 
        setNewHabit({ title: '', frequency: 'daily', icon: 'Activity', intervalDays: 2 });
        setIsFormOpen(false);
        fetchData(); 
    } catch { alert("Failed to add habit"); }
  };

  const toggleHabit = async (habitId, date) => {
    // Prevent race conditions
    if (toggling.has(habitId + date.toString())) return;

    const start = new Date(date);
    start.setHours(0,0,0,0);
    const dateISO = start.toISOString();
    
    // Add to toggling set
    setToggling(prev => new Set(prev).add(habitId + date.toString()));
    
    const existing = occurrences.find(o => o.habitId === habitId && isSameDay(new Date(o.dateUTC), date));
    
    // Optimistic Update
    const tempId = 'temp-' + Date.now();
    if (existing) {
        setOccurrences(prev => prev.filter(o => o._id !== existing._id));
    } else {
         setOccurrences(prev => [...prev, { habitId, dateUTC: dateISO, _id: tempId }]);
    }

    try { 
        await api.post(`/habits/${habitId}/mark`, { date: dateISO, completed: !existing }); 
        fetchData(); 
    } catch { 
        alert("Failed to update");
        fetchData(); // Rollback is handled by fetching fresh data
    } finally {
        // Remove from toggling set
        setToggling(prev => {
            const next = new Set(prev);
            next.delete(habitId + date.toString());
            return next;
        });
    }
  };

  const handleDeleteHabit = async (habitId) => {
    if (!window.confirm("Are you sure you want to delete this habit? All progress will be lost.")) return;
    
    try {
        await api.delete(`/habits/${habitId}`);
        fetchData();
    } catch {
        alert("Failed to delete habit");
    }
  };

  // Heatmap Logic
  const heatmapDays = useMemo(() => Array.from({ length: 364 }, (_, i) => subDays(today, 363 - i)), [today]);
  const getIntensity = (date) => {
    const count = occurrences.filter(o => isSameDay(new Date(o.dateUTC), date)).length;
    if (count === 0) return 'bg-muted/20'; 
    if (count <= 1) return 'bg-primary/30';
    if (count <= 3) return 'bg-primary/60';
    return 'bg-primary';
  };

  return (
    <div className="space-y-10 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-end border-b border-border/40 pb-8 gap-6"
      >
        <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-gradient-to-r from-primary/20 to-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
                    {format(today, "MMMM do, yyyy")}
                </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-light tracking-tight text-foreground flex items-center gap-4">
              Biomarker Routine
              <div className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
              </div>
            </h1>
            <p className="text-muted-foreground mt-3 text-lg font-light max-w-2xl">
                Consistency is the bridge between goals and accomplishment.
            </p>
        </div>
        
        <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="group flex items-center gap-2.5 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-8 py-3.5 rounded-full font-bold uppercase tracking-wider text-sm hover:shadow-2xl hover:shadow-primary/30 hover:scale-105 transition-all duration-300"
        >
            {isFormOpen ? <X size={20} weight="bold" /> : <Plus size={20} weight="bold" />}
            {isFormOpen ? "Close" : "New Habit"}
        </button>
      </motion.div>

      {/* Add Habit Form - Animate Height */}
      <AnimatePresence>
        {isFormOpen && (
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
            >
                <div className="bg-gradient-to-br from-card/80 via-card/60 to-card/80 backdrop-blur-2xl border border-border/60 p-8 rounded-3xl shadow-2xl mb-10">
                    <form onSubmit={handleAddHabit} className="space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase text-muted-foreground ml-1 tracking-wider">Habit Title</label>
                                <input 
                                    value={newHabit.title}
                                    onChange={e => setNewHabit({...newHabit, title: e.target.value})}
                                    required 
                                    placeholder="e.g. Morning 5k Run" 
                                    className="w-full text-xl font-medium bg-background/80 backdrop-blur border border-border/60 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all shadow-sm" 
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase text-muted-foreground ml-1 tracking-wider">Frequency</label>
                                <div className="flex bg-muted/30 p-1.5 rounded-2xl shadow-inner">
                                    {FREQUENCIES.map(f => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => setNewHabit({...newHabit, frequency: f.id})}
                                            className={clsx(
                                                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all",
                                                newHabit.frequency === f.id 
                                                    ? "bg-white shadow text-primary" 
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <f.icon weight={newHabit.frequency === f.id ? "fill" : "regular"} />
                                            <span className="hidden sm:inline">{f.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Custom Interval Input */}
                        <AnimatePresence>
                            {newHabit.frequency === 'custom' && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-primary/5 p-4 rounded-xl border border-primary/10"
                                >
                                    <label className="flex items-center gap-2 text-sm font-medium text-primary">
                                        <Info size={16} />
                                        Repeat every 
                                        <input 
                                            type="number" 
                                            min="2" 
                                            max="365"
                                            value={newHabit.intervalDays}
                                            onChange={e => setNewHabit({...newHabit, intervalDays: e.target.value})}
                                            className="w-16 bg-white border border-border rounded-md px-2 py-1 text-center font-bold outline-none focus:border-primary"
                                        />
                                        days
                                    </label>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Icon Picker Trigger */}
                        <div className="space-y-3">
                             <label className="text-xs font-bold uppercase text-muted-foreground ml-1 tracking-wider">Icon Representation</label>
                             <div className="relative">
                                <button 
                                    type="button"
                                    onClick={() => setIsIconPickerOpen(true)}
                                    className="flex items-center gap-4 w-full bg-background/80 backdrop-blur border border-border/60 rounded-2xl px-5 py-4 text-left hover:border-primary/50 hover:shadow-lg transition-all outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
                                >
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <HabitIcon iconName={newHabit.icon} className="text-xl" />
                                    </div>
                                    <span className="flex-1 font-medium">{newHabit.icon}</span>
                                    <ChevronsRight className="text-muted-foreground" />
                                </button>
                                
                                <Modal
                                    isOpen={isIconPickerOpen}
                                    onClose={() => setIsIconPickerOpen(false)}
                                    title="Choose a Habit Icon"
                                >
                                    <IconPicker 
                                        selected={newHabit.icon} 
                                        onSelect={(i) => { 
                                            setNewHabit({...newHabit, icon: i}); 
                                            setIsIconPickerOpen(false); 
                                        }} 
                                    />
                                </Modal>
                             </div>
                        </div>

                        <div className="flex justify-end pt-6">
                            <button type="submit" className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-10 py-4 rounded-2xl font-bold uppercase tracking-widest hover:shadow-2xl hover:shadow-primary/30 hover:scale-105 transition-all shadow-lg">
                                Create Routine
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Habits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnimatePresence mode="popLayout">
            {habits.map(h => (
                <motion.div 
                    key={h._id}
                    layout
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-gradient-to-br from-card/90 via-card/70 to-card/90 backdrop-blur-xl text-card-foreground p-7 rounded-3xl border border-border/50 shadow-lg hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between"
                >
                    <div>
                        <div className="flex items-start justify-between mb-5">
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 text-primary group-hover:from-primary group-hover:to-primary/90 group-hover:text-primary-foreground transition-all duration-500 shadow-md group-hover:shadow-xl group-hover:shadow-primary/20">
                                <HabitIcon iconName={h.icon} className="text-3xl" />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <button 
                                    onClick={() => handleDeleteHabit(h._id)}
                                    className="p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete Habit"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <span className={clsx(
                                    "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border",
                                    h.frequency === 'daily' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                    h.frequency === 'weekly' ? "bg-purple-50 text-purple-600 border-purple-100" :
                                    h.frequency === 'monthly' ? "bg-orange-50 text-orange-600 border-orange-100" :
                                    "bg-emerald-50 text-emerald-600 border-emerald-100"
                                )}>
                                    {h.frequency === 'custom' ? `${h.intervalDays}d` : h.frequency}
                                </span>
                            </div>
                        </div>
                        
                        <h3 className="text-xl font-bold text-foreground mb-1 leading-tight">{h.title}</h3>
                        {streaks[h._id] > 0 && (
                            <div className="flex items-center gap-1 text-xs font-bold text-amber-600 mt-1">
                                <Fire size={14} weight="fill" className="text-amber-500" />
                                <span>{streaks[h._id]} day streak</span>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground/80 font-medium line-clamp-2 mt-1">
                             Consistency is key.
                        </p>
                    </div>

                    {/* Tracker Logic Injection */}
                    {h.frequency === 'daily' && <DailyTracker habit={h} occurrences={occurrences} onToggle={toggleHabit} today={today} />}
                    
                    {h.frequency === 'custom' && <CustomTracker habit={h} occurrences={occurrences} onToggle={toggleHabit} today={today} />}
                    
                    {(h.frequency === 'weekly' || h.frequency === 'monthly') && (
                         <PeriodTracker 
                            habit={h} 
                            occurrences={occurrences} 
                            onToggle={toggleHabit} 
                            periodStart={h.frequency === 'weekly' ? startOfWeek(today, {weekStartsOn:1}) : startOfMonth(today)}
                            label={h.frequency === 'weekly' ? 'This Week' : 'This Month'}
                         />
                    )}
                </motion.div>
            ))}
        </AnimatePresence>
        
        {/* Empty State */}
        {habits.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center opacity-50">
                <p>No routines established yet. Start small.</p>
            </div>
        )}
      </div>

       {/* Heatmap Section - Moved to bottom for balance */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.2 }}
        className="mt-12 bg-gradient-to-br from-card/80 via-card/60 to-card/80 backdrop-blur-xl border border-border/60 rounded-3xl p-8 relative overflow-hidden group shadow-xl"
      >
        <div className="flex justify-between items-center mb-6 relative z-10">
             <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/20">
                  <Fire weight="fill" className="text-orange-500" size={24} />
                </div>
                <h3 className="text-base font-bold tracking-widest uppercase text-foreground">Global Consistency</h3>
             </div>
             <span className="text-[10px] font-mono bg-background/70 border border-border/50 px-3 py-1.5 rounded-lg text-muted-foreground shadow-sm">Last 365 Days</span>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none relative opacity-80 group-hover:opacity-100 transition-opacity">
           <div className="grid grid-rows-7 grid-flow-col gap-[2px] w-full min-w-max">
               {heatmapDays.map((d, i) => (
                   <div key={i} className={clsx("w-3 h-3 rounded-[1px] transition-colors", getIntensity(d))} title={format(d, 'MMM do')} />
               ))}
           </div>
        </div>
      </motion.div>

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-50">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

export default Routine;

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowRight, TrendUp, Warning, CheckCircle } from '@phosphor-icons/react';

import GoalProgress from '../components/dashboard/GoalProgress';
import WeeklyProgressChart from '../components/dashboard/WeeklyProgressChart';
import CategoryFocusChart from '../components/dashboard/CategoryFocusChart';
import UpcomingTasks from '../components/dashboard/UpcomingTasks';
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap';
import DashboardCard from '../components/dashboard/DashboardCard';
import YearProgressBar from '../components/dashboard/YearProgressBar';
import MonthProgressBar from '../components/dashboard/MonthProgressBar';
import WeekProgressBar from '../components/dashboard/WeekProgressBar';
import QuoteWidget from '../components/dashboard/QuoteWidget';
import useAutoRefresh from '../hooks/useAutoRefresh';
import clsx from 'clsx';

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const localDate = format(new Date(), 'yyyy-MM-dd');
      const summaryRes = await api.get('/dashboard/summary', { params: { date: localDate } });
      setData(summaryRes.data);
    } catch (err) {
      console.error("Using mock data as fallback", err);
      // Fallback mock data
      setData({ 
        daily: { completed: 0, total: 0 }, 
        habitsToday: 0, 
        activityHeatmap: [], 
        weeklyProgress: [], 
        categoryFocus: [],
        highPriorityCount: 0,
        pendingTasks: [],
        habitsToCompleteCount: 0,
        habitsToCompleteList: [],
        focusScore: 0
      });
    } finally {
        setLoading(false);
    }
  }, []);

  useAutoRefresh(fetchData);

  const hasRolledOver = useRef(false);
  useEffect(() => {
      if (hasRolledOver.current) return;
      hasRolledOver.current = true;
      
      const performRollover = async () => {
          try {
              const localDate = format(new Date(), 'yyyy-MM-dd');
              await api.post('/tasks/rollover', { date: localDate });
              fetchData(); // Refresh data after potential rollover
          } catch (err) {
              console.error("Rollover check failed", err);
          }
      };
      
      performRollover();
  }, [fetchData]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  if (loading) return null;

  return (
    <motion.div 
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
    >
      <YearProgressBar />

      {/* Month & Week Progress */}
      <motion.div variants={itemVariants} className="flex gap-6">
        <MonthProgressBar />
        <WeekProgressBar />
      </motion.div>
      
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-end">
        <div>
            <h1 className="text-5xl font-serif font-medium text-primary tracking-tight mb-2">Today's Overview</h1>
            <p className="text-muted-foreground text-lg">Hello, User! You have <span className="text-foreground font-semibold">{data?.highPriorityCount || 0} high-priority tasks</span> today.</p>
        </div>
        <div className="flex gap-3">
             <button 
               onClick={() => navigate('/daily')} 
               className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer"
             >
                <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-[10px]">{data?.highPriorityCount || 0}</span>
                PRIORITY ALERTS
             </button>
             <button 
               onClick={() => navigate('/daily')} 
               className="bg-sage-200 text-foreground px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-sage-300 transition-colors cursor-pointer"
             >
                <span className="w-5 h-5 bg-black/10 rounded-full flex items-center justify-center text-[10px]">{data?.daily?.total - data?.daily?.completed || 0}</span>
                REMINDERS
             </button>
        </div>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto">
        
        {/* Row 1: Quick Actions & Key Metrics */}
        {/* Quick Actions - Dark Card */}
        <motion.div variants={itemVariants} className="col-span-12 md:col-span-4 lg:col-span-3">
            <div className="bg-forest-800 text-cream-100 rounded-3xl p-6 h-full flex flex-col justify-between relative overflow-hidden group">
                <div className="z-10">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">QUICK ACTIONS</h3>
                    <div className="w-8 h-0.5 bg-accent/50 mb-6"/>
                    <ul className="space-y-4 font-medium text-sm">
                        <li onClick={() => navigate('/daily')} className="cursor-pointer hover:text-accent transition-colors flex items-center gap-2">
                            <span>[+]</span> NEW TASK
                        </li>
                        <li onClick={() => navigate('/vision')} className="cursor-pointer hover:text-accent transition-colors flex items-center gap-2">
                            <span>[&gt;]</span> WORK SESSION
                        </li>
                        <li onClick={() => navigate('/routine')} className="cursor-pointer hover:text-accent transition-colors flex items-center gap-2">
                            <span>[o]</span> LOG HABIT
                        </li>
                    </ul>
                </div>
                
                {/* Decorative */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </div>
        </motion.div>

        {/* Pending Tasks / Ready for Review */}
        <motion.div variants={itemVariants} className="col-span-12 md:col-span-4 lg:col-span-3">
            <DashboardCard title="PENDING TASKS" className="h-full bg-cream-50">
                <div className="flex flex-col h-full justify-between">
                    <div className="text-right">
                        <span className="text-6xl font-serif font-medium text-foreground leading-none">{(data?.daily?.total - data?.daily?.completed).toString().padStart(2, '0') || '00'}</span>
                    </div>
                    <div className="space-y-3 mt-4">
                        {data?.pendingTasks?.length > 0 ? (
                            data.pendingTasks.map((task, i) => (
                                <div key={i} className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                                    <span className="font-medium text-muted-foreground truncate mr-2">{task.title}</span>
                                    <div className="flex items-center gap-2">
                                        {task.isOverdue && <span className="text-[9px] text-destructive font-bold animate-pulse">OVERDUE</span>}
                                        <span className={clsx(
                                            "text-[10px] px-2 py-0.5 rounded font-bold uppercase",
                                            task.priority === 'critical' || task.priority === 'high' ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                                        )}>
                                            {task.priority || 'MED'}
                                        </span>
                                    </div>

                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-muted-foreground italic">No pending tasks</p>
                        )}
                    </div>
                </div>
            </DashboardCard>
        </motion.div>

        {/* Habits / High Risk */}
        <motion.div variants={itemVariants} className="col-span-12 md:col-span-4 lg:col-span-3">
             <DashboardCard title="HABITS TO COMPLETE" className="h-full bg-cream-50">
                <div className="flex flex-col h-full justify-between">
                    <div className="text-right">
                        <span className="text-6xl font-serif font-medium text-foreground leading-none">{(data?.habitsToCompleteCount || 0).toString().padStart(2, '0')}</span>
                    </div>
                     <div className="space-y-3 mt-4">
                        {data?.habitsToCompleteList?.length > 0 ? (
                            data.habitsToCompleteList.map((habit, i) => (
                                <div key={i} className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                                    <span className="font-medium text-muted-foreground truncate mr-2">{habit.title}</span>
                                    <span className="flex items-center gap-1 text-[10px] text-forest-900 font-bold uppercase tracking-tighter">
                                        {habit.streak > 0 ? `🔥 ${habit.streak}` : 'PENDING'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-muted-foreground italic">All habits done!</p>
                        )}
                    </div>
                </div>
            </DashboardCard>
        </motion.div>

         {/* Weekly Trend / Time to Insight */}
        <motion.div variants={itemVariants} className="col-span-12 md:col-span-12 lg:col-span-3">
            <DashboardCard title="WEEKLY FOCUS" className="h-full bg-sage-100/50">
                <div className="h-full flex flex-col justify-end min-h-[140px]">
                    <WeeklyProgressChart data={data?.weeklyProgress} color="#2D4A30" />
                </div>
            </DashboardCard>
        </motion.div>


         {/* Row 2: Deep Dive & Visuals */}
         {/* Upcoming Tasks List (Replaced Schedule) */}
         <motion.div variants={itemVariants} className="col-span-12 lg:col-span-4 h-[400px]">
            <DashboardCard title="TODAY'S SCHEDULE" className="h-full">
                <UpcomingTasks />
            </DashboardCard>
         </motion.div>

         {/* Activity Heatmap (Middle Large) */}
         <motion.div variants={itemVariants} className="col-span-12 lg:col-span-5 h-[400px]">
             <DashboardCard title="FOCUS DENSITY (WEEKLY)" className="h-full bg-cream-50">
                 <div className="h-full flex flex-col justify-center">
                    <ActivityHeatmap data={data?.activityHeatmap} />
                 </div>
            </DashboardCard>
         </motion.div>

        {/* Results / Stats */}
         <motion.div variants={itemVariants} className="col-span-12 lg:col-span-3 h-[400px]">
            <DashboardCard title="TODAY'S PRODUCTIVITY" className="h-full !bg-forest-900 !border-none text-cream-50 overflow-hidden">
                <div className="flex flex-col h-full justify-between relative">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <svg width="100%" height="100%">
                            <pattern id="dotGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                <circle cx="2" cy="2" r="1.5" fill="currentColor" />
                            </pattern>
                            <rect width="100%" height="100%" fill="url(#dotGrid)" />
                        </svg>
                    </div>

                    {/* Circular Score */}
                    <div className="flex-1 flex flex-col items-center justify-center -mt-2 z-10">
                         <div className="relative w-40 h-40">
                            {/* Background Circle */}
                            <svg className="w-full h-full -rotate-90 transform">
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeOpacity="0.1"
                                    strokeWidth="8"
                                />
                                {/* Progress Circle */}
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    strokeDasharray="440"
                                    strokeDashoffset={440 - (440 * (data?.focusScore || 0)) / 100} 
                                    strokeLinecap="round"
                                    className="text-sage-300 drop-shadow-[0_0_10px_rgba(180,196,153,0.3)] transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-6xl font-serif font-bold text-cream-50 leading-none">{data?.focusScore || 0}</span>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-sage-300/80 font-medium mt-2">Focus<br/>Score</span>
                            </div>
                         </div>
                    </div>

                    {/* Bottom Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 z-10 mt-2">
                         <div className="bg-cream-50 rounded-xl p-3 shadow-sm flex flex-col items-center justify-center hover:bg-white transition-colors group">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Tasks</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-serif font-bold text-forest-900">{data?.daily?.completed || 0}</span>
                                <span className="text-xs text-muted-foreground font-medium">/ {data?.daily?.total || 0}</span>
                            </div>
                         </div>
                         
                         <div className="bg-cream-50 rounded-xl p-3 shadow-sm flex flex-col items-center justify-center hover:bg-white transition-colors group">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Habits</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-serif font-bold text-forest-900">{data?.habitsToday || 0}</span>
                                <span className="text-xs text-muted-foreground font-medium">done</span>
                            </div>
                         </div>
                    </div>
                </div>
            </DashboardCard>
         </motion.div>
      </div>

      {/* Quote Widget */}
      <motion.div variants={itemVariants}>
        <QuoteWidget />
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;

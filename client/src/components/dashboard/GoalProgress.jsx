import React, { useState, useCallback } from 'react';
import { Trophy, BookOpen, Barbell, Medal, Hourglass } from '@phosphor-icons/react';
import clsx from 'clsx';
import api from '../../lib/axios';
import useAutoRefresh from '../../hooks/useAutoRefresh';

const GoalItem = ({ title, subtitle, progress, status, total, current, unit, overdue, icon: Icon }) => {
  const statusColors = {
    'Behind': 'bg-destructive/10 text-destructive',
    'On Track': 'bg-primary/10 text-primary',
    'Completed': 'bg-secondary text-secondary-foreground',
  };

  return (
    <div className="p-4 bg-background rounded-xl border border-border/60 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-3">
            <div className="mt-0.5 text-muted-foreground p-1 bg-muted/50 rounded-lg">
                {Icon ? <Icon size={20} weight="duotone" /> : <Trophy size={20} weight="duotone" />}
            </div>
            <div>
                <h4 className="text-sm font-bold text-foreground">{title}</h4>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
        </div>
        <span className={clsx("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", statusColors[status] || "bg-muted text-muted-foreground")}>
            {status}
        </span>
      </div>
      
      <div className="relative h-2 bg-secondary rounded-full overflow-hidden mb-2">
        <div 
            className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-1000" 
            style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex justify-between items-center text-xs text-muted-foreground/80">
        <div>
            {overdue > 0 && progress < 100 ? (
                 <span className="text-destructive font-medium">{overdue} days overdue</span>
            ) : status === "Completed" ? (
                <span className="text-primary font-medium">Goal Achieved</span>
            ) : (
                <span>In Progress</span> 
            )}
        </div>
        <div className="font-medium">
            {progress}% <span className="text-muted-foreground/50 ml-1">({current}/{total} {unit})</span>
        </div>
      </div>
    </div>
  );
};

const GoalProgress = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    try {
      const response = await api.get('/vision/goals');
      setGoals(response.data || []);
    } catch (err) {
      console.error("Failed to fetch goals:", err);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Enable auto-refresh every 5 seconds
  useAutoRefresh(fetchGoals);

  if (loading) {
    return (
      <div className="bg-card rounded-3xl p-8 border border-border shadow-sm h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading goals...</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl p-8 border border-border shadow-sm h-full flex flex-col hover:shadow-md transition-shadow duration-300">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h3 className="text-xl font-serif font-bold text-foreground">Goal Progress</h3>
            <p className="text-sm text-muted-foreground mt-1">Track your objectives</p>
        </div>
        <div className="p-3 bg-secondary rounded-2xl">
             <Hourglass size={24} weight="duotone" className="text-primary" />
        </div>
      </div>

      <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
        {goals.length > 0 ? (
          goals.map(goal => (
            <GoalItem key={goal.id} {...goal} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed border-border rounded-2xl bg-muted/20">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <Trophy size={32} weight="duotone" />
            </div>
            <p className="text-sm font-bold text-foreground">No Goals Yet</p>
            <p className="text-xs text-muted-foreground mt-1">Set goals in the Vision section to track your progress</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalProgress;

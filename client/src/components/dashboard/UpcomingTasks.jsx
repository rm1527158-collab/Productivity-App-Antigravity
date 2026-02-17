import React, { useState, useCallback } from 'react';
import { CalendarCheck, ArrowRight } from '@phosphor-icons/react';
import { format } from 'date-fns';
import api from '../../lib/axios';
import useAutoRefresh from '../../hooks/useAutoRefresh';

const UpcomingTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUpcomingTasks = useCallback(async () => {
    try {
      const localDate = format(new Date(), 'yyyy-MM-dd');
      const response = await api.get('/dashboard/upcoming-tasks', { params: { date: localDate } });
      setTasks(response.data || []);
    } catch (err) {
      console.error("Failed to fetch upcoming tasks:", err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useAutoRefresh(fetchUpcomingTasks);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading tasks...</p>
      </div>
    );
  } 

  return (
    <div className="h-full flex flex-col">
      {tasks.length > 0 ? (
        <ul className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
             {tasks.map((task, index) => (
                <li key={index} className="flex justify-between items-center p-3 border border-border/50 rounded-xl bg-background/50 hover:bg-background transition-colors">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-destructive' : 'bg-primary'}`} />
                        <span className="text-sm font-medium text-foreground">{task.title}</span>
                    </div>
                    <span className={`text-xs font-bold ${task.isOverdue ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
                        {task.time}
                    </span>

                </li>
             ))}
        </ul>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border/50 rounded-2xl bg-muted/10 hover:bg-muted/20 transition-colors">
            <div className="opacity-60 max-w-[200px]">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    <CalendarCheck size={24} weight="duotone" />
                </div>
                <p className="text-sm font-bold text-foreground">No Tasks Scheduled</p>
                <p className="text-xs text-muted-foreground mt-1">Enjoy your free time!</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingTasks;

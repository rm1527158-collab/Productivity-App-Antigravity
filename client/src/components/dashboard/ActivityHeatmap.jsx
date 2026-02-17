
import React, { useMemo } from 'react';
import { format, subDays, eachDayOfInterval, endOfWeek, startOfWeek, isSameDay, getDay } from 'date-fns';
import { Tooltip } from 'react-tooltip';
import clsx from 'clsx';
import { motion } from 'framer-motion';

const ActivityHeatmap = ({ data = [] }) => {
  // Generate dates for the last 365 days
  const today = new Date();
  const startDate = subDays(today, 364); // 365 days including today
  
  // We want to align the grid to start on a Sunday or Monday depending on locale, 
  // but for simplicity let's stick to standard 7-row grid where each column is a week.
  // To make it look like GitHub, we need to pad the start to the previous Sunday (or whatever start of week).
  
  const calendarStart = startOfWeek(startDate);
  const calendarEnd = endOfWeek(today);

  const dates = useMemo(() => {
    return eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd
    });
  }, [calendarStart, calendarEnd]);

  // Transform data into a map for O(1) lookup
  const dataMap = useMemo(() => {
    const map = new Map();
    data.forEach(item => {
      map.set(item.date, { taskCount: item.taskCount || 0, habitCount: item.habitCount || 0 });
    });
    return map;
  }, [data]);

  // Determine color based on total count
  const getColor = (taskCount, habitCount) => {
    const total = taskCount + habitCount;
    if (total === 0) return 'bg-muted/20';
    if (total === 1) return 'bg-sage-200';
    if (total === 2) return 'bg-sage-300';
    if (total === 3) return 'bg-sage-500';
    return 'bg-forest-800';
  };

  // Group dates by week for rendering columns
  const weeks = useMemo(() => {
    const weeksArray = [];
    let currentWeek = [];
    
    dates.forEach((date) => {
      currentWeek.push(date);
      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
    });
    
    if (currentWeek.length > 0) weeksArray.push(currentWeek);
    return weeksArray;
  }, [dates]);

  // Labels for the Y-axis (Days of the week)
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate summary stats
  const totalActivity = useMemo(() => {
    return data.reduce((sum, item) => sum + (item.taskCount || 0) + (item.habitCount || 0), 0);
  }, [data]);

  const currentStreak = useMemo(() => {
    let streak = 0;
    const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    for (const item of sortedData) {
      if ((item.taskCount || 0) + (item.habitCount || 0) > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [data]);

  const mostActiveDay = useMemo(() => {
    if (data.length === 0) return { day: 'N/A', count: 0 };
    
    const maxItem = data.reduce((max, item) => {
      const total = (item.taskCount || 0) + (item.habitCount || 0);
      const maxTotal = (max.taskCount || 0) + (max.habitCount || 0);
      return total > maxTotal ? item : max;
    }, data[0]);
    
    const count = (maxItem.taskCount || 0) + (maxItem.habitCount || 0);
    return { 
      day: count > 0 ? format(new Date(maxItem.date), 'MMM d') : 'N/A', 
      count 
    };
  }, [data]);

  return (
    <div className="h-full flex flex-col justify-between w-full relative">
        <div className="w-full overflow-x-auto pb-4 custom-scrollbar flex-1">
            <div className="min-w-max flex flex-col gap-1.5">
                {/* Month Labels (X-Axis) */}
                <div className="flex ml-12 h-5 mb-1">
                    {weeks.map((week, i) => {
                        const firstDay = week[0];
                        const isNewMonth = i === 0 || format(firstDay, 'd') <= 7 && format(firstDay, 'M') !== format(weeks[i-1][0], 'M');
                        return (
                            <div key={i} className="w-3.5 mr-1.5 flex-shrink-0 relative">
                                {isNewMonth && (
                                    <span className="absolute left-0 bottom-0 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tight whitespace-nowrap">
                                        {format(firstDay, 'MMM')}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex">
                    {/* Day Labels (Y-Axis) */}
                    <div className="flex flex-col gap-1.5 pr-3 w-12 shrink-0">
                        {dayLabels.map((day, i) => (
                            <div key={day} className="h-3.5 flex items-center">
                                {i % 2 !== 0 && (
                                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tight leading-none">
                                        {day}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Heatmap Grid */}
                    <div className="flex gap-1.5">
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-1.5">
                                {week.map((date, dayIndex) => {
                                    const dateStr = format(date, 'yyyy-MM-dd');
                                    const dayData = dataMap.get(dateStr) || { taskCount: 0, habitCount: 0 };
                                    const taskCount = dayData.taskCount;
                                    const habitCount = dayData.habitCount;
                                    
                                    return (
                                        <motion.div
                                            key={dateStr}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: (weekIndex * 0.003) + (dayIndex * 0.003), type: 'spring' }}
                                            className={clsx(
                                                "w-3.5 h-3.5 rounded-[3px] cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-primary transition-all",
                                                getColor(taskCount, habitCount)
                                            )}
                                            data-tooltip-id="heatmap-tooltip"
                                            data-tooltip-content={`${format(date, 'MMM do, yyyy')} | ${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}, ${habitCount} ${habitCount === 1 ? 'habit' : 'habits'}`}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Focus Insights Section */}
        <div className="mt-6 pt-4 border-t border-border/40">
            <div className="flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2">
                    <span className="opacity-40 font-bold uppercase tracking-wider">LESS</span>
                    <div className="flex gap-1">
                        <span className="w-2.5 h-2.5 rounded-[2px] bg-muted/20"></span>
                        <span className="w-2.5 h-2.5 rounded-[2px] bg-sage-200"></span>
                        <span className="w-2.5 h-2.5 rounded-[2px] bg-sage-300"></span>
                        <span className="w-2.5 h-2.5 rounded-[2px] bg-sage-500"></span>
                        <span className="w-2.5 h-2.5 rounded-[2px] bg-forest-800"></span>
                    </div>
                    <span className="opacity-40 font-bold uppercase tracking-wider">MORE</span>
                </div>
                
                <div className="flex items-center gap-6 font-mono text-[10px] text-muted-foreground">
                    <div className="flex flex-col items-end">
                        <span className="text-xl font-bold text-foreground leading-none">{totalActivity}</span>
                        <span className="uppercase tracking-wider mt-1 opacity-60">Total</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xl font-bold text-primary leading-none">{currentStreak}</span>
                        <span className="uppercase tracking-wider mt-1 opacity-60">Streak</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-foreground leading-none">{mostActiveDay.day}</span>
                        <span className="uppercase tracking-wider mt-1 opacity-60 text-[9px]">Peak Day</span>
                    </div>
                </div>
            </div>
        </div>

        <Tooltip id="heatmap-tooltip" className="z-50 !bg-popover !text-popover-foreground !rounded-lg !shadow-lg !px-3 !py-1 text-xs font-bold" />
    </div>
  );
};

export default ActivityHeatmap;

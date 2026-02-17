import React from 'react';
import { motion } from 'framer-motion';
import { differenceInMilliseconds, startOfWeek, addWeeks } from 'date-fns';

const WeekProgressBar = () => {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const end = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
    const total = differenceInMilliseconds(end, start);
    const elapsed = differenceInMilliseconds(now, start);
    const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayOfWeek = now.getDay();
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    return (
        <div className="flex-1">
            <div className="flex justify-between items-end mb-1.5">
                <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                    Week
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                    {dayNames[dayIndex]} · <span className="text-foreground font-bold">{progress.toFixed(1)}%</span>
                </span>
            </div>
            <div className="relative h-2.5 bg-sage-100 rounded-full overflow-hidden border border-sage-200">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute top-0 left-0 h-full rounded-full"
                    style={{ backgroundColor: '#5A8F5E' }}
                />
            </div>
        </div>
    );
};

export default WeekProgressBar;

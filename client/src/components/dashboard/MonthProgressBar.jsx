import React from 'react';
import { motion } from 'framer-motion';
import { differenceInMilliseconds, startOfMonth, addMonths, format } from 'date-fns';

const MonthProgressBar = () => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = startOfMonth(addMonths(now, 1));
    const total = differenceInMilliseconds(end, start);
    const elapsed = differenceInMilliseconds(now, start);
    const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
    const monthName = format(now, 'MMMM');

    return (
        <div className="flex-1">
            <div className="flex justify-between items-end mb-1.5">
                <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
                    Month
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                    {monthName} · <span className="text-foreground font-bold">{progress.toFixed(1)}%</span>
                </span>
            </div>
            <div className="relative h-2.5 bg-sage-100 rounded-full overflow-hidden border border-sage-200">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute top-0 left-0 h-full rounded-full"
                    style={{ backgroundColor: '#3D6B42' }}
                />
            </div>
        </div>
    );
};

export default MonthProgressBar;

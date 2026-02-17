import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { differenceInMilliseconds, startOfYear, addYears, getYear } from 'date-fns';

const YearProgressBar = () => {
    const [progress, setProgress] = useState(0);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const updateProgress = () => {
            const now = new Date();
            const currentYear = getYear(now);
            const start = startOfYear(now); // Jan 1 00:00:00
            const nextYear = startOfYear(addYears(now, 1)); // Jan 1 00:00:00 next year
            
            const totalDuration = differenceInMilliseconds(nextYear, start);
            const elapsed = differenceInMilliseconds(now, start);
            
            const percentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
            setProgress(percentage);
            setYear(currentYear);
        };

        updateProgress();
        // Update frequently to show the decimals changing live (approx 60fps)
        const interval = setInterval(updateProgress, 50);
        return () => clearInterval(interval);
    }, []);

    // Format to 5 decimal places for that "precision" look
    const formattedProgress = progress.toFixed(5);
    const wholePart = Math.floor(progress);
    const decimalPart = (progress % 1).toFixed(5).substring(1); // .12345

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full mb-8"
        >
            <div className="flex justify-between items-end mb-2">
                <h2 className="text-sm font-bold tracking-widest uppercase text-muted-foreground">
                    Year Progress
                </h2>
                <div className="text-right font-mono text-xs text-muted-foreground/80">
                    <span className="text-forest-900 font-bold text-lg">{year}</span> is <span className="text-forest-900 font-bold">{formattedProgress}%</span> complete
                </div>
            </div>

            <div className="relative h-6 bg-sage-100 rounded-full overflow-hidden shadow-inner border border-sage-200">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #8C9E78 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                
                {/* Progress Bar */}
                <div 
                    className="absolute top-0 left-0 h-full z-20 overflow-hidden"
                    style={{ 
                        width: `${progress}%`,
                        backgroundColor: '#2D4A30'
                    }}
                >
                    {/* Subtle progress animation overlay */}
                    <motion.div 
                        className="absolute inset-0 w-full h-full opacity-20"
                        style={{ 
                            backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                            backgroundSize: '200% 100%'
                        }}
                        animate={{ 
                            backgroundPosition: ['100% 0', '-100% 0'] 
                        }}
                        transition={{ 
                            repeat: Infinity, 
                            duration: 3, 
                            ease: "linear" 
                        }}
                    />
                </div>
            </div>
            
            {/* Milestones markers (optional aesthetic touch) */}
            <div className="relative h-2 mt-1 w-full flex justify-between px-[1%] text-[10px] items-start text-muted-foreground opacity-50 font-mono">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
            </div>
        </motion.div>
    );
};

export default YearProgressBar;

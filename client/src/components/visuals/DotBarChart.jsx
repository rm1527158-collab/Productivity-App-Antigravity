import React, { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const DotBarChart = ({ data = [], maxDots = 12, color = '#2D4A30' }) => {
  // data: [{ date: '2023-01-01', value: 5 }]
  
  const width = 100 / data.length;
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className="w-full h-full flex items-end justify-between gap-1 px-2 pt-6"> {/* Added pt-6 for tooltip space */}
      {data.map((d, i) => {
        const count = Math.min(d.value, maxDots);
        const dateObj = parseISO(d.date);
        const isHovered = hoveredIndex === i;
        
        return (
          <div 
            key={d.date} 
            className="h-full flex flex-col justify-end items-center relative cursor-pointer" 
            style={{ width: `${width}%` }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Tooltip */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full mb-2 bg-popover/95 backdrop-blur-sm border border-border text-popover-foreground text-[10px] px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none flex flex-col items-center gap-0.5"
                    >
                        <span className="font-semibold">{format(dateObj, 'MMM do')}</span>
                        <span className="text-primary font-mono text-xs">{d.value} tasks</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stacked Dots */}
            <div className={`flex flex-col-reverse gap-[3px] w-full items-center transition-transform duration-300 ${isHovered ? 'scale-110 -translate-y-1' : ''}`}>
              {[...Array(count)].map((_, idx) => {
                // Gradient opacity
                const opacity = 0.4 + (0.6 * (idx / maxDots));
                
                return (
                    <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                        delay: i * 0.03 + idx * 0.02, 
                        duration: 0.3, 
                        type: "spring", 
                        stiffness: 260, 
                        damping: 20 
                    }}
                    className="w-2.5 h-1.5 rounded-full"
                    style={{ 
                        opacity: opacity,
                        backgroundColor: idx === count - 1 && d.value > maxDots ? 'hsl(var(--destructive))' : color 
                    }}
                    />
                )
              })}
              {d.value === 0 && (
                  <div className="w-2 h-[2px] bg-muted/40 rounded-full" />
              )}
            </div>
            
            {/* X-Axis Label */}
            <span className={`text-[9px] text-muted-foreground mt-3 font-mono uppercase transition-all duration-300 ${isHovered ? 'opacity-100 font-bold text-primary' : 'opacity-50'}`}>
                {format(dateObj, 'd')}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default DotBarChart;

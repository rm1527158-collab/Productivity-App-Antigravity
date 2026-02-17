import React from 'react';
import { ArrowUpRight } from '@phosphor-icons/react';
import clsx from 'clsx';

const DashboardCard = ({ title, children, className, action, accentColor = "bg-primary" }) => {
  return (
    <div className={clsx("bg-card border border-border/60 rounded-3xl p-6 flex flex-col relative overflow-hidden group hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md", className)}>
        {/* Header */}
        <div className="flex justify-between items-start mb-4 z-10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>
            {action && (
                <button className="text-muted-foreground hover:text-primary transition-colors">
                    {action}
                </button>
            )}
            {!action && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight size={18} className="text-muted-foreground" />
                </div>
            )}
        </div>

        {/* Content */}
        <div className="flex-1 z-10 font-sans">
            {children}
        </div>
        
        {/* Minimal Decorative Background Element (Optional) */}
        <div className={clsx("absolute -bottom-12 -right-12 w-32 h-32 rounded-full opacity-5 pointer-events-none blur-3xl", accentColor)} />
    </div>
  );
};

export default DashboardCard;

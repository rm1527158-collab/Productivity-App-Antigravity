import React from 'react';
import FocusRadar from '../visuals/FocusRadar';

const CategoryFocusChart = ({ data = [] }) => {
  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm h-full flex flex-col">
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Task Distribution Analysis</h3>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Category Breakdown</span>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-relaxed">
                Radial distribution of task allocation across priority categories. Imbalanced patterns suggest potential workflow optimization opportunities.
            </p>
        </div>
        
        <div className="flex-1 min-h-0">
            {data && data.length > 0 ? (
                <FocusRadar data={data} />
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-xs uppercase tracking-widest">
                    No data available
                </div>
            )}
        </div>
    </div>
  );
};

export default CategoryFocusChart;

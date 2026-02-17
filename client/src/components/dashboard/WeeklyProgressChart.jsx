import React from 'react';
import DotBarChart from '../visuals/DotBarChart';

const WeeklyProgressChart = ({ data = [], color }) => {
  return (
    <div className="h-full w-full flex flex-col">
        <div className="flex-1 min-h-0">
            <DotBarChart data={data} maxDots={12} color={color} />
        </div>
    </div>
  );
};

export default WeeklyProgressChart;

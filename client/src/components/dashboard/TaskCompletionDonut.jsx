import React, { useState, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../../lib/axios';
import useAutoRefresh from '../../hooks/useAutoRefresh';

const TaskCompletionDonut = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCompletionData = useCallback(async () => {
        try {
            const response = await api.get('/dashboard/task-completion');
            setData(response.data || []);
        } catch (err) {
            console.error("Failed to fetch task completion:", err);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Enable auto-refresh every 5 seconds
    useAutoRefresh(fetchCompletionData);

    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    const percentage = total > 0 ? Math.round((data.find(d => d.name === 'Done')?.value || 0) / total * 100) : 0;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover/90 backdrop-blur-sm p-3 rounded-xl shadow-xl border border-border">
                    <p className="font-bold text-foreground mb-1">{payload[0].name}</p>
                    <p className="text-sm">
                        <span className="font-mono font-bold" style={{ color: payload[0].payload.color }}>
                            {payload[0].value}
                        </span>
                        <span className="text-muted-foreground ml-1">tasks</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-card p-6 lg:p-8 rounded-3xl border border-border shadow-sm h-full hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground">Task Completion</h3>
                <p className="text-sm text-muted-foreground mt-1">Done vs Remaining</p>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
                </div>
            ) : data.length === 0 ? (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border rounded-2xl bg-muted/20">
                    <p className="text-sm text-muted-foreground">No data available</p>
                </div>
            ) : (
            <div className="flex-1 w-full min-h-[200px] flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
                {/* Chart */}
                <div className="w-full lg:w-1/2 h-[220px] lg:h-full relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius="60%"
                                outerRadius="80%"
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                                cornerRadius={6}
                                startAngle={90}
                                endAngle={-270}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl lg:text-4xl font-bold text-foreground font-serif">{percentage}%</span>
                        <span className="text-[10px] lg:text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Done</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center gap-3 lg:gap-4 px-4 lg:px-0">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center justify-between group cursor-default">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full transition-transform group-hover:scale-125"
                                    style={{ backgroundColor: item.color }}
                                ></div>
                                <span className="text-sm font-medium text-foreground">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-foreground">{item.value}</span>
                            </div>
                        </div>
                    ))}
                    <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex justify-between items-center">
                             <span className="text-sm font-medium text-muted-foreground">Total Tasks</span>
                             <span className="text-lg font-bold text-foreground">{total}</span>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </div>
    );
};

export default TaskCompletionDonut;

import React, { useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import api from '../../lib/axios';
import useAutoRefresh from '../../hooks/useAutoRefresh';

const WeeklyChart = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchWeeklyData = useCallback(async () => {
        try {
            const response = await api.get('/dashboard/weekly-progress');
            setData(response.data || []);
        } catch (err) {
            console.error("Failed to fetch weekly progress:", err);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Enable auto-refresh every 5 seconds
    useAutoRefresh(fetchWeeklyData);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover p-4 border border-border rounded-xl shadow-lg shadow-primary/5">
                    <p className="text-secondary-foreground font-bold font-serif mb-1">{label}</p>
                    <p className="text-muted-foreground text-sm">
                        Completed: <span className="font-bold text-primary">{payload[0].value}</span>
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">Target: {payload[0].payload.target}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-card p-6 lg:p-8 rounded-3xl border border-border shadow-sm h-full hover:shadow-md transition-shadow duration-300 flex flex-col">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground">Weekly Progress</h3>
                <p className="text-sm text-muted-foreground mt-1">Tasks completed vs daily target</p>
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
            <div className="flex-1 w-full min-h-[220px]"> 
               <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
                        barSize={32}
                    >
                        <XAxis 
                            dataKey="day" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 500 }}
                            dy={10}
                        />
                        <YAxis 
                            hide={true} 
                            domain={[0, 'dataMax + 2']} 
                        />
                        <Tooltip 
                            content={<CustomTooltip />} 
                            cursor={{ fill: 'hsl(var(--muted)/0.2)', radius: 6 }} 
                        />
                        <ReferenceLine 
                            y={8} 
                            stroke="hsl(var(--accent))" 
                            strokeDasharray="3 3" 
                            label={{ 
                                value: 'Goal', 
                                position: 'insideTopRight', 
                                fill: 'hsl(var(--accent))', 
                                fontSize: 10, 
                                fontWeight: 600,
                                dy: -10 
                            }} 
                        />
                        <Bar dataKey="completed" radius={[6, 6, 6, 6]}>
                            {data.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.completed >= entry.target ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground)/0.3)'} 
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            )}
        </div>
    );
};

export default WeeklyChart;

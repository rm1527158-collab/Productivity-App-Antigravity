import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const FocusRadar = ({ data }) => {
  // data: [{ subject: 'Math', A: 120, fullMark: 150 }, ...]

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover backdrop-blur-sm border border-border px-3 py-2 rounded-lg shadow-xl">
          <p className="font-serif text-sm font-semibold text-foreground mb-1">{label}</p>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Focus Score:</span>
            <span className="font-mono font-medium text-primary">{payload[0].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <defs>
          <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/> 
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/> 
          </linearGradient>
        </defs>
        
        <PolarGrid 
            gridType="polygon" 
            stroke="hsl(var(--border))" 
            strokeDasharray="4 4" 
            strokeWidth={1}
        />
        
        <PolarAngleAxis 
            dataKey="subject" 
            tick={{ 
                fill: 'hsl(var(--muted-foreground))', // gray-600 equivalent
                fontSize: 11, 
                fontWeight: 600, 
                fontFamily: 'var(--font-heading)',
                textTransform: 'uppercase', 
                letterSpacing: '0.05em' 
            }} 
        />
        
        <PolarRadiusAxis 
            angle={30} 
            domain={[0, 150]} 
            tick={false} 
            axisLine={false} 
        />
        
        <Radar
          name="Focus"
          dataKey="A"
          stroke="hsl(var(--primary))" 
          strokeWidth={2.5}
          fill="url(#radarFill)"
          fillOpacity={1}
          isAnimationActive={true}
          animationDuration={1500}
          animationEasing="ease-out"
        />
        
        <Tooltip content={<CustomTooltip />} cursor={false} />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default FocusRadar;

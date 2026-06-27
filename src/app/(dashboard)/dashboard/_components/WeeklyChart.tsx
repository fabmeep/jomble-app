import React from 'react';

export interface WeeklyActivity {
  label: string;
  count: number;
}

interface WeeklyChartProps {
  weeklyActivity?: WeeklyActivity[];
}

export function WeeklyChart({ weeklyActivity = [] }: WeeklyChartProps) {
  const maxVal = weeklyActivity.length > 0 ? Math.max(...weeklyActivity.map(w => w.count)) : 1;
  // Ensure we don't divide by zero if maxVal is 0
  const divisor = maxVal > 0 ? maxVal : 1;

  return (
    <div className="bg-card border border-border rounded-lg relative">
      <div className="p-3.5 px-4.5 border-b border-border flex items-center justify-between">
        <h3 className="text-[13.5px] font-bold">Weekly applications</h3>
        <span className="text-[11px] text-muted-foreground">Last 8 weeks</span>
      </div>
      <div className="p-[14px] pt-[14px] pb-2 h-[150px] flex items-end gap-2">
        {weeklyActivity.map((w, i) => {
          const isCurrent = i === weeklyActivity.length - 1;
          const heightPct = Math.max((w.count / divisor) * 100, 6);

          return (
            <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end relative group" key={w.label}>
              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-foreground text-background text-[11px] px-2.5 py-1 rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity font-mono z-10">
                {w.count} application{w.count === 1 ? '' : 's'}
              </div>

              {/* Bar */}
              <div
                className={`w-full max-w-[28px] rounded-t-sm transition-colors cursor-pointer ${isCurrent ? 'bg-primary' : 'bg-border hover:bg-muted-foreground/30'
                  }`}
                style={{ height: `${heightPct}%` }}
              />

              {/* Date Label */}
              <span className={`text-[10px] font-mono ${isCurrent ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                {w.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
import React from 'react';

interface PipelineFunnelProps {
  byStatus?: Record<string, number>;
}

export function PipelineFunnel({ byStatus }: PipelineFunnelProps) {
  // Fallbacks if stats data isn't loaded yet
  const applied = byStatus?.APPLIED || 0;
  const screening = byStatus?.SCREENING || 0;
  const interview = byStatus?.INTERVIEW || 0;
  const offer = byStatus?.OFFER || 0;
  const accepted = byStatus?.ACCEPTED || 0;

  // Cumulative funnel logic (Method 1)
  const countAccepted = accepted;
  const countOffer = offer + countAccepted;
  const countInterview = interview + countOffer;
  const countScreening = screening + countInterview;
  const countApplied = applied + countScreening;
  const funnelStages = [
    { label: 'Applied', count: countApplied, bgClass: 'bg-status-applied' },
    { label: 'Screening', count: countScreening, bgClass: 'bg-status-screening' },
    { label: 'Interview', count: countInterview, bgClass: 'bg-status-interview' },
    { label: 'Offer', count: countOffer, bgClass: 'bg-status-offer' },
    { label: 'Accepted', count: countAccepted, bgClass: 'bg-status-accepted' },
  ];

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-3.5 px-4.5 border-b border-border flex items-center justify-between">
        <h3 className="text-[13.5px] font-bold">Pipeline</h3>
      </div>
      <div className="p-4 flex flex-col gap-2">
        {funnelStages.map((stage) => {
          // Calculate percentage relative to the funnel base (Applied)
          const pct = countApplied > 0 ? Math.round((stage.count / countApplied) * 100) : 0;
          const percentageString = `${pct}%`;
          return (
            <div className="flex items-center gap-2.5" key={stage.label}>
              <span className="text-xs text-muted-foreground w-16 shrink-0 font-medium">
                {stage.label}
              </span>
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${stage.bgClass}`}
                  style={{ width: percentageString }}
                />
              </div>
              <span className="text-xs font-mono text-foreground font-medium w-[18px] text-right shrink-0">
                {stage.count}
              </span>
              <span className="text-[11px] text-muted-foreground w-8 text-right shrink-0">
                {percentageString}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
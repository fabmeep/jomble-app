import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subText: React.ReactNode;
  variant: 'coral' | 'amber' | 'green' | 'gray';
}

export function StatCard({ label, value, subText, variant }: StatCardProps) {
  // Map our configurations to your specific CSS variable utility names
  const borderVariants = {
    coral: 'border-t-primary',
    amber: 'border-t-accent',
    green: 'border-t-status-applied',
    gray: 'border-t-status-ghosted',
  };

  return (
    <div className={`bg-card border border-border border-t-[3px] ${borderVariants[variant]} rounded-lg p-4 px-[18px] flex flex-col gap-1.5 relative overflow-hidden`}>
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-3xl font-bold font-mono tracking-tighter text-foreground leading-none">{value}</span>
      <span className="text-[11.5px] text-muted-foreground">{subText}</span>
    </div>
  );
};
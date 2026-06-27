"use client"

import { StatCard } from './_components/StatCard';
import { PipelineFunnel } from './_components/PipelineFunnel';
import { HotLeads } from './_components/HotLeads';
import { WeeklyChart } from './_components/WeeklyChart';
import { useStats } from '@/hooks/useStats';
import { NeedsAttention } from './_components/NeedsAttention';



export default function Dashboard() {
  const { data, isLoading, error } = useStats();

  if (isLoading) {
    return (
      <div className="max-w-[1180px] mx-auto p-7 text-sm text-muted-foreground">
        Loading analytics...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-[1180px] mx-auto p-7 text-sm text-destructive">
        Failed to load statistics. Please try again.
      </div>
    );
  }

  // console.log("DATA", data);
  const total = data.stats.total

  // 3. Compute stats for other cards
  const addedLast7Days = data.stats.addedLast7Days
  const responseRate = data.stats.responseRate
  const ghostedRate = data.stats.ghostedRate
  const ghostedCount = data.stats.byStatus.GHOSTED
  const avgDaysToReply = data.stats.avgDaysToReply

  let replyTimeValue: string;
  if (avgDaysToReply === 0) {
    replyTimeValue = "N/A";
  } else if (avgDaysToReply < 1) {
    const hours = parseFloat((avgDaysToReply * 24).toFixed(1));
    replyTimeValue = `${hours} ${hours === 1 ? "hr" : "hrs"}`;
  } else {
    replyTimeValue = `${avgDaysToReply} ${avgDaysToReply === 1 ? "day" : "days"}`;
  }

  return (
    <div className="flex-1 overflow-y-auto w-full p-7 scroll-smooth">
      <div className="max-w-[1180px] mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">Overview</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track, manage, and analyze your job search progress.
            </p>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard label="Total applied" value={total} variant="coral" subText={<><strong>+{addedLast7Days}</strong> this past week</>} />
          <StatCard label="Response rate" value={`${responseRate} %`} variant="amber" subText="of applications" />
          <StatCard label="Avg. reply time" value={replyTimeValue} variant="green" subText="across responses" />
          <StatCard label="Ghosted" value={ghostedCount} variant="gray" subText={<><strong>{ghostedRate}%</strong> left on read</>} />
        </div>

        {/* MAIN TWO-COLUMN CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-4">
            <WeeklyChart weeklyActivity={data.weeklyActivity} />
            <NeedsAttention apps={data.stats.apps} total={total} />
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-1 space-y-4">
            <PipelineFunnel byStatus={data.stats.byStatus} />
            <HotLeads leads={data.hottestLeads} />
          </div>
        </div>

      </div>
    </div>
  );
}
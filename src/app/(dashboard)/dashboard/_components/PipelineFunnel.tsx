"use client"

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineFunnelProps {
  byStatus?: Record<string, number>;
  byContractType?: Record<string, number>;
  bySourcing?: {
    direct: number;
    outsource: number;
    outsourceRate: number;
    topAgencies: { name: string; count: number }[];
  };
  total?: number;
}

const SLIDES = [
  { id: 'stages', label: 'Funnel Stages' },
  { id: 'contract', label: 'Contract Types' },
  { id: 'sourcing', label: 'Sourcing Model' },
] as const;

export function PipelineFunnel({ byStatus, byContractType, bySourcing, total = 0 }: PipelineFunnelProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const lastWheelTime = useRef<number>(0);
  const touchStartX = useRef<number | null>(null);

  // Fallbacks if stats data isn't loaded yet
  const applied = byStatus?.APPLIED || 0;
  const screening = byStatus?.SCREENING || 0;
  const interview = byStatus?.INTERVIEW || 0;
  const offer = byStatus?.OFFER || 0;
  const accepted = byStatus?.ACCEPTED || 0;

  // Cumulative funnel logic
  const countAccepted = accepted;
  const countOffer = offer + countAccepted;
  const countInterview = interview + countOffer;
  const countScreening = screening + countInterview;
  const countApplied = applied + countScreening;

  const funnelStages = [
    { key: 'APPLIED', label: 'Applied', count: countApplied, bgClass: 'bg-status-applied' },
    { key: 'SCREENING', label: 'Screening', count: countScreening, bgClass: 'bg-status-screening' },
    { key: 'INTERVIEW', label: 'Interview', count: countInterview, bgClass: 'bg-status-interview' },
    { key: 'OFFER', label: 'Offer', count: countOffer, bgClass: 'bg-status-offer' },
    { key: 'ACCEPTED', label: 'Accepted', count: countAccepted, bgClass: 'bg-status-accepted' },
  ];

  // Contract type configuration
  const contractItems = [
    { key: 'FULL_TIME', label: 'Full-time', count: byContractType?.FULL_TIME || 0, dotClass: 'bg-emerald-500', barClass: 'bg-emerald-500' },
    { key: 'INTERN', label: 'Internship', count: byContractType?.INTERN || 0, dotClass: 'bg-blue-500', barClass: 'bg-blue-500' },
    { key: 'CONTRACT', label: 'Contract', count: byContractType?.CONTRACT || 0, dotClass: 'bg-amber-500', barClass: 'bg-amber-500' },
    { key: 'PART_TIME', label: 'Part-time', count: byContractType?.PART_TIME || 0, dotClass: 'bg-teal-500', barClass: 'bg-teal-500' },
    { key: 'FREELANCE', label: 'Freelance', count: byContractType?.FREELANCE || 0, dotClass: 'bg-purple-500', barClass: 'bg-purple-500' },
    { key: 'OTHER', label: 'Other', count: (byContractType?.TEMPORARY || 0) + (byContractType?.OTHER || 0), dotClass: 'bg-zinc-400', barClass: 'bg-zinc-400' },
  ];

  const effectiveTotal = total > 0 ? total : Math.max(1, countApplied);

  // Sourcing breakdown calculations
  const directCount = bySourcing?.direct ?? Math.max(0, effectiveTotal - (bySourcing?.outsource ?? 0));
  const outsourceCount = bySourcing?.outsource ?? 0;
  const directPct = effectiveTotal > 0 ? Math.round((directCount / effectiveTotal) * 100) : 0;
  const outsourcePct = effectiveTotal > 0 ? Math.round((outsourceCount / effectiveTotal) * 100) : 0;
  const topAgencies = bySourcing?.topAgencies || [];

  // Carousel controls
  const handlePrev = () => setCurrentSlide((prev) => Math.max(0, prev - 1));
  const handleNext = () => setCurrentSlide((prev) => Math.min(SLIDES.length - 1, prev + 1));

  // Touch swipe support
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    if (deltaX > 40) handleNext();
    else if (deltaX < -40) handlePrev();
    touchStartX.current = null;
  };

  // Trackpad horizontal swipe support
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 25) {
      const now = Date.now();
      if (now - lastWheelTime.current > 350) {
        if (e.deltaX > 25) handleNext();
        else if (e.deltaX < -25) handlePrev();
        lastWheelTime.current = now;
      }
    }
  };

  // Select top active contract rows to match the 5 rows of the funnel
  const activeContracts = contractItems
    .filter((item) => item.count > 0 || ['FULL_TIME', 'INTERN', 'CONTRACT'].includes(item.key))
    .slice(0, 5);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs">
      {/* Header with Slide Title, Dot Indicators & Prev/Next Chevrons */}
      <div className="p-3 px-4 border-b border-border flex items-center justify-between gap-2 select-none h-[49px]">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-[13.5px] font-bold text-foreground shrink-0">Pipeline</h3>
          <span className="text-muted-foreground/40 text-xs font-normal shrink-0">•</span>
          <span className="text-xs font-medium text-muted-foreground truncate transition-all duration-200">
            {SLIDES[currentSlide].label}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Interactive Slide Dots */}
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Pipeline views">
            {SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Switch to ${slide.label}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                  currentSlide === idx
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                )}
              />
            ))}
          </div>

          {/* Chevrons */}
          <div className="flex items-center gap-0.5 border-l border-border pl-1.5 ml-0.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentSlide === 0}
              aria-label="Previous view"
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentSlide === SLIDES.length - 1}
              aria-label="Next view"
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-25 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Static Fixed-Height Carousel Container (216px body) */}
      <div
        className="relative w-full overflow-hidden h-[216px]"
        onWheel={handleWheel}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {/* ── SLIDE 0: STAGES FUNNEL ── */}
          <div className="w-full shrink-0 h-full p-4 flex flex-col justify-between">
            {funnelStages.map((stage) => {
              const pct = countApplied > 0 ? Math.round((stage.count / countApplied) * 100) : 0;
              const percentageString = `${pct}%`;
              return (
                <Link
                  href={`/applications?stage=${stage.key}`}
                  key={stage.label}
                  className="group flex items-center gap-2.5 p-1 rounded-md hover:bg-secondary/50 transition-colors"
                  title={`View ${stage.label} applications`}
                >
                  <span className="text-xs text-muted-foreground group-hover:text-foreground w-16 shrink-0 font-medium transition-colors">
                    {stage.label}
                  </span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", stage.bgClass)}
                      style={{ width: percentageString }}
                    />
                  </div>
                  <span className="text-xs font-mono text-foreground font-medium w-[22px] text-right shrink-0">
                    {stage.count}
                  </span>
                  <span className="text-[11px] text-muted-foreground w-8 text-right shrink-0 font-mono">
                    {percentageString}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* ── SLIDE 1: CONTRACT TYPES ── */}
          <div className="w-full shrink-0 h-full p-4 flex flex-col justify-between">
            {activeContracts.map((item) => {
              const pct = effectiveTotal > 0 ? Math.round((item.count / effectiveTotal) * 100) : 0;
              return (
                <Link
                  href={`/applications?contract=${item.key}`}
                  key={item.key}
                  className="group flex items-center gap-2.5 p-1 rounded-md hover:bg-secondary/50 transition-colors"
                  title={`View ${item.label} applications`}
                >
                  <div className="flex items-center gap-1.5 w-22 shrink-0">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", item.dotClass)} />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground font-medium truncate transition-colors">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", item.barClass)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-foreground font-medium w-[22px] text-right shrink-0">
                    {item.count}
                  </span>
                  <span className="text-[11px] text-muted-foreground w-8 text-right shrink-0 font-mono">
                    {pct}%
                  </span>
                </Link>
              );
            })}

            {activeContracts.length === 0 && (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                No applications recorded yet.
              </div>
            )}
          </div>

          {/* ── SLIDE 2: SOURCING MODEL ── */}
          <div className="w-full shrink-0 h-full p-4 flex flex-col justify-between">
            {/* Breakdown Rows */}
            <div className="flex flex-col gap-1.5">
              <Link
                href="/applications?sourcing=DIRECT"
                className="group flex items-center justify-between text-xs p-1 rounded-md hover:bg-secondary/50 transition-colors"
                title="View direct hire applications"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                  <span className="font-medium text-foreground">Direct / In-house</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground">{directCount}</span>
                  <span className="font-mono text-muted-foreground text-[11px]">({directPct}%)</span>
                </div>
              </Link>

              <Link
                href="/applications?sourcing=OUTSOURCE"
                className="group flex items-center justify-between text-xs p-1 rounded-md hover:bg-secondary/50 transition-colors"
                title="View outsource applications"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-medium text-foreground">Outsource / Agency</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground">{outsourceCount}</span>
                  <span className="font-mono text-amber-600 font-semibold text-[11px]">({outsourcePct}%)</span>
                </div>
              </Link>
            </div>

            {/* Dual Segmented Progress Bar */}
            <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden flex p-0.5 gap-0.5">
              <div
                className="bg-sky-500 h-full rounded-full transition-all"
                style={{ width: `${directPct}%` }}
                title={`Direct Hire: ${directPct}%`}
              />
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{ width: `${outsourcePct}%` }}
                title={`Outsource: ${outsourcePct}%`}
              />
            </div>

            {/* Top Agencies Placements */}
            <div className="flex flex-col gap-1 pt-1 border-t border-border/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Top Partner Agencies
              </span>
              <div className="flex flex-wrap gap-1.5">
                {topAgencies.length > 0 ? (
                  topAgencies.slice(0, 3).map((agency) => (
                    <span
                      key={agency.name}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40"
                    >
                      <Building2 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      {agency.name}
                      <span className="font-mono font-bold text-amber-900 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-900/60 px-1 rounded text-[10px]">
                        {agency.count}
                      </span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No agency placements yet</span>
                )}
              </div>
            </div>

            {/* Bottom summary metric */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              <span>Direct vs Agency Ratio</span>
              <span className="font-medium text-foreground font-mono">{directPct}% Direct</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
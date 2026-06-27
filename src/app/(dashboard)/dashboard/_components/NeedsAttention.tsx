import React from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import StatusBadge from "@/components/ui/status-badge";
import CompanyLogo from "@/components/ui/company-logo";
import { statusMap } from "@/lib/status";


// 1. Extend your existing application interface fields
interface App {
  id: string;
  companyName: string;
  jobTitle: string;
  status: string;
  appliedAt: Date | string;
}

interface NeedsAttentionProps {
  apps: App[];
  total: number;
}

export function NeedsAttention({ apps, total }: NeedsAttentionProps) {
  // Helper to calculate age of the application listing link
  const getDaysSinceApplied = (dateInput: Date | string) => {
    const appliedDate = new Date(dateInput);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - appliedDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
      {/* PANEL HEAD */}
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between select-none">
        <span className="text-[13.5px] font-bold text-foreground">Needs attention</span>
      </div>

      {/* CARD LISTING STACK */}
      <div className="flex flex-col">
        {apps.length > 0 ? (
          apps.map((app) => {
            const days = getDaysSinceApplied(app.appliedAt);

            // Priority styling parameters
            const isOfferOrInterview = ["OFFER", "INTERVIEW"].includes(app.status);
            const needsFollowUp = app.status === "APPLIED" && days > 7;

            return (
              <Link
                key={app.id}
                href={`/applications/${app.id}`}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-3 p-3.5 pl-0 border-b border-border last:border-b-0 hover:bg-primary/[0.02] transition-colors relative group"
              >
                {/* Accent Indicators on the Left Margin */}
                <div
                  className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r transition-opacity ${isOfferOrInterview ? "bg-primary opacity-100" :
                    needsFollowUp ? "bg-accent opacity-100" : "opacity-0"
                    }`}
                />

                {/* Company Name & Role Initials Card */}
                <div className="flex items-center gap-2.5 pl-4 min-w-0">
                  <CompanyLogo companyName={app.companyName} />
                  <div className="min-w-0">
                    <div className="font-bold text-[13px] text-foreground leading-tight truncate">
                      {app.companyName}
                    </div>
                    <div className="text-[11.5px] text-muted-foreground truncate mt-0.5">
                      {app.jobTitle}
                    </div>
                    {needsFollowUp && (
                      <div className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold text-accent mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        Consider following up
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badge Custom Allocation */}
                <div className="shrink-0">
                  <StatusBadge status={app.status} dot={false} className="text-[10.5px] px-2 py-0.5" />
                </div>

                {/* Days age tracking */}
                <span className={`text-[11.5px] font-mono shrink-0 w-[50px] text-right pr-4 ${needsFollowUp ? "text-accent font-semibold" : "text-muted-foreground"
                  }`}>
                  {days}d
                </span>
              </Link>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-muted-foreground select-none">
            All caught up! No applications currently need immediate attention.
          </div>
        )}
      </div>

      {/* PANEL FOOTER */}
      <div className="px-5 py-3 border-t border-border bg-secondary/20 flex justify-between items-center select-none">
        <span className="text-[12px] text-muted-foreground">
          Showing {Math.min(apps.length, 6)} of {total} applications
        </span>
        <Link href="/applications" className="text-[12px] font-semibold text-primary hover:underline flex items-center gap-1">
          View all applications <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
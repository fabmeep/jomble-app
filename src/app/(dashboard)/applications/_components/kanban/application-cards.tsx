// components/ApplicationCard.tsx
import React from 'react';
import { Heart, ExternalLink, Trash2, Loader2 } from 'lucide-react';
import StatusBadge from '@/components/ui/status-badge';
import { cn } from "@/lib/utils";
import CompanyLogo from '@/components/ui/company-logo';

interface Application {
    id: string;
    companyName: string;
    jobTitle: string;
    status: string;
    excitementScore?: number;
    appliedAt: string;
    jobUrl?: string;
    redFlags?: { id: string; label: string; emoji: string }[];
}

interface ApplicationCardProps {
    app: Application;
    onNavigate: (id: string) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    deletingId: string | null;
    formatDateShort: (date: string) => string;
}

export function ApplicationCard({ app, onNavigate, onDelete, deletingId, formatDateShort }: ApplicationCardProps) {
    return (
        <div
            onClick={() => onNavigate(app.id)}
            className="bg-card border border-border rounded-xl p-3.5 shadow-2xs hover:border-primary hover:shadow-xs transition-all duration-150 cursor-pointer group flex flex-col gap-2 relative"
        >
            {/* Top: Logo & Title */}
            <div className="flex items-start gap-2.5">
                <CompanyLogo companyName={app.companyName} size="sm" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                    <div className="font-bold text-[13px] text-foreground leading-tight truncate">
                        {app.companyName}
                    </div>
                    <div className="text-[11.5px] text-muted-foreground leading-snug mt-0.5 truncate">
                        {app.jobTitle}
                    </div>
                </div>
            </div>

            {/* Bottom: Status & Details */}
            <div className="flex items-center justify-between border-t border-border/50 pt-2 mt-1">
                <div className="flex gap-0.5 items-center">
                    {[1, 2, 3, 4, 5].map((val) => (
                        <Heart
                            key={val}
                            className={cn(
                                "w-2.5 h-2.5",
                                val <= (app.excitementScore || 0)
                                    ? "fill-primary text-primary"
                                    : "text-border"
                            )}
                        />
                    ))}
                    {app.redFlags && app.redFlags.length > 0 && (
                        <div className="flex gap-0.5 items-center ml-2 border-l border-border/70 pl-2 select-none" title={app.redFlags.map(rf => rf.label).join(", ")}>
                            {app.redFlags.map((flag) => (
                                <span key={flag.id} className="text-xs leading-none">{flag.emoji}</span>
                            ))}
                        </div>
                    )}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                    {formatDateShort(app.appliedAt)}
                </span>
            </div>

            {/* Hover Status Info / Badge */}
            <div className="flex justify-between items-center gap-1 mt-1 flex-wrap">
                <StatusBadge
                    status={app.status}
                    dot={false}
                    className="text-[10px] px-2 py-0.5"
                />

                {/* Action Buttons */}
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto select-none">
                    {app.jobUrl && (
                        <a
                            href={app.jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 border border-border rounded bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                            title="Open posting"
                        >
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                    <button
                        onClick={(e) => onDelete(app.id, e)}
                        disabled={deletingId === app.id}
                        className="p-1 border border-border rounded bg-card text-muted-foreground hover:text-destructive hover:bg-status-rejected-bg hover:border-status-rejected/40 transition-all cursor-pointer"
                        title="Delete application"
                    >
                        {deletingId === app.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <Trash2 className="w-3 h-3" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
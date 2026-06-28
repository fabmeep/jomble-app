import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Heart, ExternalLink, Trash2, Loader2, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import StatusBadge from "@/components/ui/status-badge"
import CompanyLogo from "@/components/ui/company-logo"
import Link from "next/link"

export interface Application {
    id: string;
    companyName: string;
    jobTitle: string;
    location: string | null;
    jobUrl: string | null;
    status: string;
    appliedAt: Date;
    lastActivityAt: Date;
    excitementScore: number | null;
    redFlags?: { id: string; label: string; emoji: string }[];
}

export interface ColumnOptions {
    sortBy: string | null;
    sortOrder: "asc" | "desc" | null;
    deletingId: string | null;
    handleSort: (field: "company" | "appliedAt" | "lastActivity" | "excitement" | "status") => void;
    handleDelete: (id: string, e: React.MouseEvent) => void;
    formatDateShort: (date: Date | string) => string;
}

export const getColumns = (opts: ColumnOptions): ColumnDef<Application>[] => [
    {
        accessorKey: "companyName",
        meta: {
            className: "w-[45%]"
        },
        header: () => (
            <div
                onClick={() => opts.handleSort("company")}
                className="cursor-pointer hover:text-[#2D2D2D] select-none flex items-center gap-1"
            >
                Company / Role
                {opts.sortBy === "company" ? (
                    <span className="font-sans text-[10px] ml-1">{opts.sortOrder === "asc" ? "▲" : "▼"}</span>
                ) : (
                    <span className="opacity-30 ml-1">↕</span>
                )}
            </div>
        ),
        cell: ({ row }) => {
            const app = row.original
            return (
                <div className="flex items-center gap-3">
                    <CompanyLogo companyName={app.companyName} size="sm" />
                    <div className="min-w-0">
                        <div className="font-semibold text-[13px] text-[#2D2D2D] truncate" title={app.companyName}>
                            {app.companyName}
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[11.5px] text-[#6B6863] truncate" title={app.jobTitle}>
                                {app.jobTitle}
                            </span>
                            {app.redFlags && app.redFlags.length > 0 && (
                                <div className="flex items-center gap-0.5 flex-shrink-0 select-none" title={app.redFlags.map(rf => rf.label).join(", ")}>
                                    {app.redFlags.map(rf => (
                                        <span key={rf.id} className="text-xs">{rf.emoji}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
        }
    },
    {
        accessorKey: "status",
        meta: {
            className: "w-[15%]"
        },
        header: () => (
            <div
                onClick={() => opts.handleSort("status")}
                className="cursor-pointer hover:text-[#2D2D2D] select-none flex items-center gap-1"
            >
                Status
                {opts.sortBy === "status" ? (
                    <span className="font-sans text-[10px] ml-1">{opts.sortOrder === "asc" ? "▲" : "▼"}</span>
                ) : (
                    <span className="opacity-30 ml-1">↕</span>
                )}
            </div>
        ),
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />
    },
    {
        accessorKey: "appliedAt",
        meta: {
            className: "w-[100px]"
        },
        header: () => (
            <div
                onClick={() => opts.handleSort("appliedAt")}
                className="cursor-pointer hover:text-[#2D2D2D] select-none flex items-center gap-1"
            >
                Applied
                {opts.sortBy === "appliedAt" ? (
                    <span className="font-sans text-[10px] ml-1">{opts.sortOrder === "asc" ? "▲" : "▼"}</span>
                ) : (
                    <span className="opacity-30 ml-1">↕</span>
                )}
            </div>
        ),
        cell: ({ getValue }) => (
            <span className="text-xs font-mono text-[#6B6863]">
                {opts.formatDateShort(getValue<Date | string>())}
            </span>
        )
    },
    {
        accessorKey: "lastActivityAt",
        meta: {
            className: "w-[110px]"
        },
        header: () => (
            <div
                onClick={() => opts.handleSort("lastActivity")}
                className="cursor-pointer hover:text-[#2D2D2D] select-none flex items-center gap-1"
            >
                Last Activity
                {opts.sortBy === "lastActivity" ? (
                    <span className="font-sans text-[10px] ml-1">{opts.sortOrder === "asc" ? "▲" : "▼"}</span>
                ) : (
                    <span className="opacity-30 ml-1">↕</span>
                )}
            </div>
        ),
        cell: ({ getValue }) => (
            <span className="text-xs font-mono text-[#6B6863]">
                {opts.formatDateShort(getValue<Date | string>())}
            </span>
        )
    },
    {
        accessorKey: "location",
        meta: {
            className: "w-[15%]"
        },
        header: () => <span>Location</span>,
        cell: ({ getValue }) => (
            <span className="text-[12.5px] text-[#6B6863] truncate max-w-[120px] block" title={getValue<string>() || undefined}>
                {getValue<string>() || "—"}
            </span>
        )
    },
    {
        accessorKey: "excitementScore",
        meta: {
            className: "w-[100px]"
        },
        header: () => (
            <div
                onClick={() => opts.handleSort("excitement")}
                className="cursor-pointer hover:text-[#2D2D2D] select-none flex items-center gap-1"
            >
                Excitement
                {opts.sortBy === "excitement" ? (
                    <span className="font-sans text-[10px] ml-1">{opts.sortOrder === "asc" ? "▲" : "▼"}</span>
                ) : (
                    <span className="opacity-30 ml-1">↕</span>
                )}
            </div>
        ),
        cell: ({ getValue }) => (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((val) => (
                    <Heart
                        key={val}
                        className={cn(
                            "w-3 h-3 transition-colors",
                            val <= (getValue<number | null>() || 0)
                                ? "fill-[#FF6B6B] text-[#FF6B6B]"
                                : "text-[#E0DEDA]"
                        )}
                    />
                ))}
            </div>
        )
    },
    {
        id: "actions",
        meta: {
            className: "w-[110px] text-right"
        },
        header: () => null,
        cell: ({ row }) => {
            const app = row.original
            return (
                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                        href={`/applications/${app.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 border border-[#E8E6E0] rounded bg-white text-[#6B6863] hover:text-[#2D2D2D] hover:bg-[#F8F7F5] transition-all"
                        title="Edit application"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    {app.jobUrl && (
                        <a
                            href={app.jobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 border border-[#E8E6E0] rounded bg-white text-[#6B6863] hover:text-[#2D2D2D] hover:bg-[#F8F7F5] transition-all"
                            title="Open posting"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    )}
                    <button
                        onClick={(e) => opts.handleDelete(app.id, e)}
                        disabled={opts.deletingId === app.id}
                        className="p-1 border border-[#E8E6E0] rounded bg-white text-[#6B6863] hover:text-[#D84315] hover:bg-[#FBE9E7] hover:border-[#F0997B] transition-all cursor-pointer"
                        title="Delete application"
                    >
                        {opts.deletingId === app.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                        )}
                    </button>
                </div>
            )
        }
    }
]

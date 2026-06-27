import { cn } from "@/lib/utils";
import { ApplicationCard } from "./application-cards";

interface Column {
    title: string;
    statuses: string[];
    bg: string;
}

interface BoardViewProps {
    boardColumns: Column[];
    sortedApps: any[];
    router: any;
    deletingId: string | null;
    handleDelete: (id: string, e: React.MouseEvent) => void;
    formatDateShort: (date: string) => string;
    filterMode: string;
}

export function BoardView({ boardColumns, sortedApps, router, deletingId, handleDelete, formatDateShort, filterMode }: BoardViewProps) {
    // 2. Filter columns based on category match (not card count)
    const visibleColumns = boardColumns.filter((col) => {
        if (filterMode === "ALL") return true;

        if (filterMode === "ACTIVE") {
            const activeStatuses = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "ACCEPTED"];
            return col.statuses.some((status) => activeStatuses.includes(status));
        }
        if (filterMode === "ARCHIVED") {
            const archivedStatuses = ["GHOSTED", "REJECTED", "WITHDRAWN"];
            return col.statuses.some((status) => archivedStatuses.includes(status));
        }
        // Specific status dropdowns (e.g. SCREENING, REJECTED, etc.)
        return col.statuses.includes(filterMode);
    });

    return (
        <div className="flex-1 overflow-x-auto flex gap-4 min-h-[450px] pb-4">
            {/* 3. Map over visibleColumns instead of the raw boardColumns */}
            {visibleColumns.map((col) => {
                const colApps = sortedApps.filter((a) => col.statuses.includes(a.status));

                return (
                    <div
                        key={col.title}
                        className="flex-1 min-w-[250px] max-w-[360px] bg-card border border-border rounded-xl flex flex-col h-full shadow-xs"
                    >
                        {/* Column Header */}
                        <div className={cn("px-4 py-3.5 border-b border-border border-t-4 rounded-t-xl flex justify-between items-center select-none", col.bg)}>
                            <h3 className="font-bold text-foreground text-[13px]">{col.title}</h3>
                            <span className="font-mono text-xs text-muted-foreground bg-secondary border border-border rounded px-1.5 py-0.5">
                                {colApps.length}
                            </span>
                        </div>

                        {/* Card Stack Layout */}
                        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 min-h-[350px] bg-secondary/30">
                            {colApps.length > 0 ? (
                                colApps.map((app) => (
                                    <ApplicationCard
                                        key={app.id}
                                        app={app}
                                        onNavigate={(id) => router.push(`/applications/${id}`)}
                                        onDelete={handleDelete}
                                        deletingId={deletingId}
                                        formatDateShort={formatDateShort}
                                    />
                                ))
                            ) : (
                                /* This will now only display if you are in "ALL" view mode and a column happens to be empty */
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border rounded-xl select-none">
                                    <span className="text-[11px] text-muted-foreground/70 font-medium">Empty column</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
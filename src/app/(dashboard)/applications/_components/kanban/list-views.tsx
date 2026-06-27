import React from "react"
import { Briefcase, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { getColumns, Application } from "./columns"
import { DataTable } from "@/components/ui/data-table"

interface ListViewProps {
    paginatedApps: Application[];
    sortedApps: Application[];
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    sortBy: string | null;
    sortOrder: "asc" | "desc" | null;
    search: string;
    filterMode: string;
    deletingId: string | null;
    router: any;
    handleSort: (field: "company" | "appliedAt" | "excitement" | "status") => void;
    handleDelete: (id: string, e: React.MouseEvent) => void;
    handlePageChange: (page: number) => void;
    formatDateShort: (date: Date | string) => string;
}

// sliding window range builder for clean pagination with ellipses
function getPaginationRange(currentPage: number, totalPages: number) {
    const siblingCount = 1; // number of pages to show on either side of current page
    const totalPageNumbers = siblingCount * 2 + 5; // siblings + first + last + current + 2 ellipses

    // Case 1: Less pages than maximum page buttons to show
    if (totalPages <= totalPageNumbers) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    // Case 2: Only show right dots
    if (!shouldShowLeftDots && shouldShowRightDots) {
        let leftItemCount = 3 + 2 * siblingCount;
        let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
        return [...leftRange, "...", lastPageIndex];
    }

    // Case 3: Only show left dots
    if (shouldShowLeftDots && !shouldShowRightDots) {
        let rightItemCount = 3 + 2 * siblingCount;
        let rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
        return [firstPageIndex, "...", ...rightRange];
    }

    // Case 4: Show both left and right dots
    if (shouldShowLeftDots && shouldShowRightDots) {
        let middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
        return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex];
    }

    return [];
}

export function ListView({
    paginatedApps,
    sortedApps,
    currentPage,
    totalPages,
    itemsPerPage,
    sortBy,
    sortOrder,
    search,
    filterMode,
    deletingId,
    router,
    handleSort,
    handleDelete,
    handlePageChange,
    formatDateShort,
}: ListViewProps) {
    // Columns definition utilizing our separate columns file schema
    const columns = React.useMemo(() => getColumns({
        sortBy,
        sortOrder,
        deletingId,
        handleSort,
        handleDelete,
        formatDateShort
    }), [sortBy, sortOrder, deletingId, handleSort, handleDelete, formatDateShort])

    return (
        <div className="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden shadow-xs flex flex-col">
            <div className="overflow-x-auto">
                <DataTable
                    columns={columns}
                    data={paginatedApps}
                    onRowClick={(app) => router.push(`/applications/${app.id}`)}
                    emptyState={
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-[#6B6863]">
                            <Briefcase className="w-8 h-8 text-[#E8E6E0]" />
                            <div className="font-semibold text-sm text-[#2D2D2D]">No matches found</div>
                            <div className="text-xs max-w-xs">
                                {search || filterMode !== "ALL"
                                    ? "Try adjusting your filters or search terms."
                                    : "Get started by adding a job application match!"}
                            </div>
                        </div>
                    }
                />
            </div>

            {/* Table Footer / Pagination */}
            {sortedApps.length > 0 && (
                <div className="table-footer px-4 py-3.5 border-t border-[#E8E6E0] flex items-center justify-between bg-[#F8F7F5] select-none">
                    <span className="text-[12px] text-[#6B6863]">
                        Showing {Math.min(sortedApps.length, (currentPage - 1) * itemsPerPage + 1)}–
                        {Math.min(sortedApps.length, currentPage * itemsPerPage)} of {sortedApps.length} applications
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="p-1.5 border border-[#E8E6E0] bg-white text-[#6B6863] rounded-lg disabled:opacity-50 hover:bg-[#F8F7F5] disabled:hover:bg-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        {getPaginationRange(currentPage, totalPages).map((p, idx) => {
                            if (p === "...") {
                                return (
                                    <span key={`dots-${idx}`} className="w-7 h-7 text-xs font-semibold text-[#6B6863]/40 flex items-center justify-center select-none">
                                        ...
                                    </span>
                                )
                            }
                            return (
                                <button
                                    key={p}
                                    onClick={() => handlePageChange(p as number)}
                                    className={cn(
                                        "w-7 h-7 text-xs font-semibold rounded-lg transition-all flex items-center justify-center cursor-pointer border",
                                        currentPage === p
                                            ? "bg-[#FF6B6B] border-[#FF6B6B] text-white"
                                            : "bg-white border-[#E8E6E0] text-[#6B6863] hover:bg-[#F8F7F5]"
                                    )}
                                >
                                    {p}
                                </button>
                            )
                        })}
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="p-1.5 border border-[#E8E6E0] bg-white text-[#6B6863] rounded-lg disabled:opacity-50 hover:bg-[#F8F7F5] disabled:hover:bg-white cursor-pointer transition-colors flex items-center justify-center"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
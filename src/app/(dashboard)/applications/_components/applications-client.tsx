"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, Check, List, Grid, Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { statusMap } from "@/lib/status"
import { ListView } from "./kanban/list-views"
import { BoardView } from "./kanban/board-views"

interface Application {
  id: string
  companyName: string
  jobTitle: string
  location: string | null
  jobUrl: string | null
  source: string
  workMode: string
  salaryMin: number | null
  salaryMax: number | null
  currency: string | null
  excitementScore: number | null
  status: string
  contractType?: string | null
  isOutsource?: boolean
  agencyName?: string | null
  benefits?: string[]
  appliedAt: Date
  lastActivityAt: Date
  createdAt: Date
  updatedAt: Date
}

interface ApplicationsClientProps {
  initialApplications: Application[]
}

const ACTIVE_STAGES = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "ACCEPTED"] as const
const ARCHIVED_STAGES = ["GHOSTED", "WITHDRAWN", "REJECTED"] as const

export default function ApplicationsClient({ initialApplications }: ApplicationsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [localApps, setLocalApps] = useState<Application[]>(initialApplications)
  const search = searchParams.get("search") || ""

  // Parse query params on load
  const stageParam = searchParams.get("stage") || searchParams.get("status") || "ALL"
  const contractParam = searchParams.get("contract") || "ALL"
  const sourcingParam = (searchParams.get("sourcing") as "ALL" | "DIRECT" | "OUTSOURCE") || "ALL"

  const getInitialScope = (): "ALL" | "ACTIVE" | "ARCHIVED" => {
    if (stageParam !== "ALL") {
      if (ACTIVE_STAGES.includes(stageParam as any)) return "ACTIVE"
      if (ARCHIVED_STAGES.includes(stageParam as any)) return "ARCHIVED"
    }
    const scopeParam = searchParams.get("scope")
    if (scopeParam === "ACTIVE" || scopeParam === "ARCHIVED") return scopeParam
    return "ALL"
  }

  const [scope, setScope] = useState<"ALL" | "ACTIVE" | "ARCHIVED">(getInitialScope)
  const [stageFilter, setStageFilter] = useState<string>(stageParam)
  const [outsourceFilter, setOutsourceFilter] = useState<"ALL" | "DIRECT" | "OUTSOURCE">(sourcingParam)
  const [contractFilter, setContractFilter] = useState<string>(contractParam)
  const [sortBy, setSortBy] = useState<"company" | "appliedAt" | "lastActivity" | "excitement" | "status" | null>("appliedAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>("desc")
  const [viewMode, setViewMode] = useState<"list" | "board">("list")
  const [currentPage, setCurrentPage] = useState(1)
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const itemsPerPage = 8

  const CONTRACT_OPTIONS = [
    { key: "ALL", label: "All Contracts" },
    { key: "FULL_TIME", label: "Full-time" },
    { key: "INTERN", label: "Internship" },
    { key: "CONTRACT", label: "Contract" },
    { key: "PART_TIME", label: "Part-time" },
    { key: "FREELANCE", label: "Freelance" },
  ] as const

  const SOURCING_OPTIONS = [
    { key: "ALL", label: "All Sourcing" },
    { key: "DIRECT", label: "Direct / In-house" },
    { key: "OUTSOURCE", label: "Outsource / Agency" },
  ] as const

  const hasContractFilter = contractFilter !== "ALL"
  const hasOutsourceFilter = outsourceFilter !== "ALL"
  const hasStageFilter = stageFilter !== "ALL"
  const activeFilterCount = (hasContractFilter ? 1 : 0) + (hasOutsourceFilter ? 1 : 0) + (hasStageFilter ? 1 : 0)

  const handleScopeChange = (newScope: "ALL" | "ACTIVE" | "ARCHIVED") => {
    setScope(newScope)
    setStageFilter("ALL")
  }

  const handleSelectStage = (newStage: string) => {
    setStageFilter(newStage)
    if (newStage === "ALL") {
      // Keep current scope
    } else if (ACTIVE_STAGES.includes(newStage as any)) {
      setScope("ACTIVE")
    } else if (ARCHIVED_STAGES.includes(newStage as any)) {
      setScope("ARCHIVED")
    }
  }

  const handleResetAllFilters = () => {
    setStageFilter("ALL")
    setContractFilter("ALL")
    setOutsourceFilter("ALL")
    setShowMoreFilters(false)
  }

  // Keep local state in sync if props change
  useEffect(() => {
    setLocalApps(initialApplications)
  }, [initialApplications])

  // Synchronize with URL search params changes if user navigates
  useEffect(() => {
    const s = searchParams.get("stage") || searchParams.get("status") || "ALL"
    if (s !== "ALL") {
      setStageFilter(s)
      if (ACTIVE_STAGES.includes(s as any)) setScope("ACTIVE")
      else if (ARCHIVED_STAGES.includes(s as any)) setScope("ARCHIVED")
    }
    const c = searchParams.get("contract")
    if (c) setContractFilter(c)
    const src = searchParams.get("sourcing") as "ALL" | "DIRECT" | "OUTSOURCE" | null
    if (src) setOutsourceFilter(src)
  }, [searchParams])

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, scope, stageFilter, outsourceFilter, contractFilter])

  // Count calculations
  const counts = useMemo(() => {
    const all = localApps.length
    const active = localApps.filter(a => ACTIVE_STAGES.includes(a.status as any)).length
    const archived = localApps.filter(a => ARCHIVED_STAGES.includes(a.status as any)).length
    return { all, active, archived }
  }, [localApps])

  // Filter application helper
  const filteredApps = useMemo(() => {
    return localApps.filter(app => {
      const matchesSearch =
        app.companyName.toLowerCase().includes(search.toLowerCase()) ||
        app.jobTitle.toLowerCase().includes(search.toLowerCase())

      let matchesStatus = true
      if (stageFilter !== "ALL") {
        matchesStatus = app.status === stageFilter
      } else if (scope === "ACTIVE") {
        matchesStatus = ACTIVE_STAGES.includes(app.status as any)
      } else if (scope === "ARCHIVED") {
        matchesStatus = ARCHIVED_STAGES.includes(app.status as any)
      }

      let matchesOutsource = true
      if (outsourceFilter === "DIRECT") {
        matchesOutsource = !app.isOutsource
      } else if (outsourceFilter === "OUTSOURCE") {
        matchesOutsource = Boolean(app.isOutsource)
      }

      let matchesContract = true
      if (contractFilter !== "ALL") {
        matchesContract = app.contractType === contractFilter
      }

      return matchesSearch && matchesStatus && matchesOutsource && matchesContract
    })
  }, [localApps, search, scope, stageFilter, outsourceFilter, contractFilter])

  // Sort applications helper
  const sortedApps = useMemo(() => {
    if (!sortBy || !sortOrder) return filteredApps

    return [...filteredApps].sort((a, b) => {
      let comparison = 0

      if (sortBy === "company") {
        comparison = a.companyName.localeCompare(b.companyName)
      } else if (sortBy === "appliedAt") {
        comparison = new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime()
      } else if (sortBy === "lastActivity") {
        comparison = new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime()
      } else if (sortBy === "excitement") {
        comparison = (a.excitementScore || 0) - (b.excitementScore || 0)
      } else if (sortBy === "status") {
        const labelA = statusMap[a.status]?.label || a.status
        const labelB = statusMap[b.status]?.label || b.status
        comparison = labelA.localeCompare(labelB)
      }

      return sortOrder === "asc" ? comparison : -comparison
    })
  }, [filteredApps, sortBy, sortOrder])

  // Pagination helper
  const paginatedApps = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedApps.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedApps, currentPage])

  const totalPages = Math.max(1, Math.ceil(sortedApps.length / itemsPerPage))

  // Sort toggle handler
  const handleSort = (field: "company" | "appliedAt" | "lastActivity" | "excitement" | "status") => {
    if (sortBy === field) {
      if (sortOrder === "asc") {
        setSortOrder("desc")
      } else if (sortOrder === "desc") {
        setSortBy(null)
        setSortOrder(null)
      }
    } else {
      setSortBy(field)
      setSortOrder("asc")
    }
  }

  // Delete Handler
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this application?")) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        throw new Error("Failed to delete application")
      }
      setLocalApps(prev => prev.filter(app => app.id !== id))
      router.refresh()
    } catch (err) {
      alert("Error deleting application: " + (err as Error).message)
    } finally {
      setDeletingId(null)
    }
  }

  // Date formatters
  const formatDateShort = (dateInput: Date | string) => {
    const date = new Date(dateInput)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  // Board columns configuration
  const boardColumns = [
    { title: "Just Applied", statuses: ["APPLIED"], bg: "border-t-[#2E7D32]/80" },
    { title: "Screening", statuses: ["SCREENING"], bg: "border-t-[#F57C00]/80" },
    { title: "Interviewing", statuses: ["INTERVIEW"], bg: "border-t-[#1565C0]/80" },
    { title: "Offer", statuses: ["OFFER", "ACCEPTED"], bg: "border-t-[#512DA8]/80" },
    { title: "Archive", statuses: ["GHOSTED", "REJECTED", "WITHDRAWN"], bg: "border-t-[#546E7A]/80" },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F7F5]">
      {/* ── CONTENT AREA ── */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

        {/* TOOLBAR */}
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0 select-none">

          {/* Quick Scope Chips */}
          <button
            onClick={() => handleScopeChange("ALL")}
            className={cn(
              "filter-chip inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all duration-150 select-none",
              scope === "ALL" && stageFilter === "ALL"
                ? "bg-[#FFF0F0] border-[#FF6B6B] text-[#FF6B6B]"
                : "bg-white border-[#E8E6E0] text-[#6B6863] hover:border-[#FF6B6B] hover:text-[#FF6B6B]"
            )}
          >
            All <span className="font-mono text-[10.5px] opacity-75">{counts.all}</span>
          </button>

          <button
            onClick={() => handleScopeChange("ACTIVE")}
            className={cn(
              "filter-chip inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all duration-150 select-none",
              scope === "ACTIVE"
                ? "bg-[#FFF0F0] border-[#FF6B6B] text-[#FF6B6B]"
                : "bg-white border-[#E8E6E0] text-[#6B6863] hover:border-[#FF6B6B] hover:text-[#FF6B6B]"
            )}
          >
            Active <span className="font-mono text-[10.5px] opacity-75">{counts.active}</span>
          </button>

          <button
            onClick={() => handleScopeChange("ARCHIVED")}
            className={cn(
              "filter-chip inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all duration-150 select-none",
              scope === "ARCHIVED"
                ? "bg-[#FFF0F0] border-[#FF6B6B] text-[#FF6B6B]"
                : "bg-white border-[#E8E6E0] text-[#6B6863] hover:border-[#FF6B6B] hover:text-[#FF6B6B]"
            )}
          >
            Archived <span className="font-mono text-[10.5px] opacity-75">{counts.archived}</span>
          </button>

          {/* Unified Filters Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className={cn(
                "filter-chip inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all duration-150 select-none",
                activeFilterCount > 0
                  ? "bg-[#FFF0F0] border-[#FF6B6B] text-[#FF6B6B]"
                  : "bg-white border-[#E8E6E0] text-[#6B6863] hover:border-[#FF6B6B] hover:text-[#FF6B6B]",
                showMoreFilters && "border-[#FF6B6B]"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="font-mono text-[10px] bg-[#FF6B6B] text-white px-1.5 py-0.2 rounded-full font-bold">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={cn("w-3 h-3 transition-transform", showMoreFilters && "rotate-180")} />
            </button>

            {showMoreFilters && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowMoreFilters(false)} />
                <div className="absolute left-0 mt-1.5 w-64 max-h-[460px] overflow-y-auto bg-white border border-[#E8E6E0] rounded-xl shadow-xl p-2 z-30 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                  {/* Section 1: Contract Type */}
                  <div className="px-2 py-1 text-[10px] font-bold text-[#8A8780] uppercase tracking-wider select-none">
                    Contract Type
                  </div>
                  <div className="space-y-0.5">
                    {CONTRACT_OPTIONS.map((opt) => {
                      const isSelected = contractFilter === opt.key
                      return (
                        <button
                          key={opt.key}
                          onClick={() => setContractFilter(opt.key)}
                          className={cn(
                            "w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors",
                            isSelected
                              ? "bg-[#FFF0F0] text-[#FF6B6B] font-semibold"
                              : "text-[#2D2D2D] hover:bg-[#F8F7F5]"
                          )}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#FF6B6B]" />}
                        </button>
                      )
                    })}
                  </div>

                  <div className="border-t border-[#E8E6E0] my-2" />

                  {/* Section 2: Sourcing Model */}
                  <div className="px-2 py-1 text-[10px] font-bold text-[#8A8780] uppercase tracking-wider select-none">
                    Sourcing Model
                  </div>
                  <div className="space-y-0.5">
                    {SOURCING_OPTIONS.map((opt) => {
                      const isSelected = outsourceFilter === opt.key
                      return (
                        <button
                          key={opt.key}
                          onClick={() => setOutsourceFilter(opt.key)}
                          className={cn(
                            "w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors",
                            isSelected
                              ? "bg-[#FFF0F0] text-[#FF6B6B] font-semibold"
                              : "text-[#2D2D2D] hover:bg-[#F8F7F5]"
                          )}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#FF6B6B]" />}
                        </button>
                      )
                    })}
                  </div>

                  <div className="border-t border-[#E8E6E0] my-2" />

                  {/* Section 3: Status Stage */}
                  <div className="px-2 py-1 text-[10px] font-bold text-[#8A8780] uppercase tracking-wider select-none">
                    Stage {scope !== "ALL" ? `(${scope === "ACTIVE" ? "Active" : "Archived"})` : ""}
                  </div>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => handleSelectStage("ALL")}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors",
                        stageFilter === "ALL"
                          ? "bg-[#FFF0F0] text-[#FF6B6B] font-semibold"
                          : "text-[#2D2D2D] hover:bg-[#F8F7F5]"
                      )}
                    >
                      <span>
                        {scope === "ACTIVE"
                          ? "All Active Stages"
                          : scope === "ARCHIVED"
                          ? "All Archived Stages"
                          : "All Stages"}
                      </span>
                      {stageFilter === "ALL" && <Check className="w-3.5 h-3.5 text-[#FF6B6B]" />}
                    </button>

                    {(scope === "ALL" || scope === "ACTIVE") && (
                      <>
                        {scope === "ALL" && (
                          <div className="px-2 pt-2 pb-0.5 text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider">
                            Active Stages
                          </div>
                        )}
                        {ACTIVE_STAGES.map((status) => {
                          const mapped = statusMap[status]
                          const isSelected = stageFilter === status
                          return (
                            <button
                              key={status}
                              onClick={() => handleSelectStage(status)}
                              className={cn(
                                "w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors",
                                isSelected
                                  ? "bg-[#FFF0F0] text-[#FF6B6B] font-semibold"
                                  : "text-[#2D2D2D] hover:bg-[#F8F7F5]"
                              )}
                            >
                              <span>{mapped?.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#FF6B6B]" />}
                            </button>
                          )
                        })}
                      </>
                    )}

                    {(scope === "ALL" || scope === "ARCHIVED") && (
                      <>
                        {scope === "ALL" && (
                          <div className="px-2 pt-2 pb-0.5 text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider">
                            Archived Stages
                          </div>
                        )}
                        {ARCHIVED_STAGES.map((status) => {
                          const mapped = statusMap[status]
                          const isSelected = stageFilter === status
                          return (
                            <button
                              key={status}
                              onClick={() => handleSelectStage(status)}
                              className={cn(
                                "w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors",
                                isSelected
                                  ? "bg-[#FFF0F0] text-[#FF6B6B] font-semibold"
                                  : "text-[#2D2D2D] hover:bg-[#F8F7F5]"
                              )}
                            >
                              <span>{mapped?.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#FF6B6B]" />}
                            </button>
                          )
                        })}
                      </>
                    )}
                  </div>

                  {/* Footer: Reset Button */}
                  {activeFilterCount > 0 && (
                    <div className="border-t border-[#E8E6E0] pt-2 mt-2">
                      <button
                        onClick={handleResetAllFilters}
                        className="w-full text-center px-2.5 py-1.5 rounded-lg text-xs text-[#FF6B6B] hover:bg-[#FFF0F0] font-semibold cursor-pointer transition-colors"
                      >
                        Reset all filters
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Active Filter Tags on Toolbar */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 select-none">
              {hasStageFilter && (
                <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-[#FFF0F0] border border-[#FF6B6B]/40 text-[#FF6B6B]">
                  <span>Stage: {statusMap[stageFilter]?.label || stageFilter}</span>
                  <button
                    onClick={() => setStageFilter("ALL")}
                    className="p-0.5 hover:bg-[#FF6B6B]/20 rounded-full cursor-pointer transition-colors"
                    aria-label="Remove stage filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {hasContractFilter && (
                <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-[#FFF0F0] border border-[#FF6B6B]/40 text-[#FF6B6B]">
                  <span>{CONTRACT_OPTIONS.find((c) => c.key === contractFilter)?.label || contractFilter}</span>
                  <button
                    onClick={() => setContractFilter("ALL")}
                    className="p-0.5 hover:bg-[#FF6B6B]/20 rounded-full cursor-pointer transition-colors"
                    aria-label="Remove contract filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {hasOutsourceFilter && (
                <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-amber-50 border border-amber-300 text-amber-800">
                  <span>{outsourceFilter === "OUTSOURCE" ? "Outsource / Agency" : "Direct Hire"}</span>
                  <button
                    onClick={() => setOutsourceFilter("ALL")}
                    className="p-0.5 hover:bg-amber-200 rounded-full cursor-pointer transition-colors"
                    aria-label="Remove sourcing filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={handleResetAllFilters}
                className="text-[11px] text-[#8A8780] hover:text-[#FF6B6B] underline cursor-pointer transition-colors px-1"
              >
                Clear all
              </button>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex ml-auto border border-[#E8E6E0] rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 cursor-pointer transition-colors flex items-center justify-center border-r border-[#E8E6E0]",
                viewMode === "list" ? "bg-[#FF6B6B] text-white" : "text-[#6B6863] hover:bg-[#F8F7F5]"
              )}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("board")}
              className={cn(
                "p-2 cursor-pointer transition-colors flex items-center justify-center",
                viewMode === "board" ? "bg-[#FF6B6B] text-white" : "text-[#6B6863] hover:bg-[#F8F7F5]"
              )}
              title="Board View"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── LIST VIEW (TABLE) ── */}
        {viewMode === "list" && (
          <ListView
            paginatedApps={paginatedApps}
            sortedApps={sortedApps}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            sortBy={sortBy}
            sortOrder={sortOrder}
            search={search}
            filterMode={stageFilter !== "ALL" ? stageFilter : scope}
            deletingId={deletingId}
            router={router}
            handleSort={handleSort}
            handleDelete={handleDelete}
            handlePageChange={handlePageChange}
            formatDateShort={formatDateShort}
          />
        )}

        {/* ── BOARD VIEW (KANBAN) ── */}
        {viewMode === "board" && (
          <BoardView
            boardColumns={boardColumns}
            sortedApps={sortedApps}
            router={router}
            deletingId={deletingId}
            handleDelete={handleDelete}
            formatDateShort={formatDateShort}
            filterMode={stageFilter !== "ALL" ? stageFilter : scope}
          />
        )}
      </div>
    </div>
  )
}

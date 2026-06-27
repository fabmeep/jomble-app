"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, Check, List, Grid, Filter } from "lucide-react"
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
  appliedAt: Date
  lastActivityAt: Date
  createdAt: Date
  updatedAt: Date
}

interface ApplicationsClientProps {
  initialApplications: Application[]
}

export default function ApplicationsClient({ initialApplications }: ApplicationsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [localApps, setLocalApps] = useState<Application[]>(initialApplications)
  const search = searchParams.get("search") || ""
  const [filterMode, setFilterMode] = useState<string>("ALL") // ALL, ACTIVE, ARCHIVED, or specific status
  const [sortBy, setSortBy] = useState<"company" | "appliedAt" | "excitement" | "status" | null>("appliedAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>("desc")
  const [viewMode, setViewMode] = useState<"list" | "board">("list")
  const [currentPage, setCurrentPage] = useState(1)
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const itemsPerPage = 8

  // Keep local state in sync if props change
  useEffect(() => {
    setLocalApps(initialApplications)
  }, [initialApplications])

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterMode])

  // Count calculations
  const counts = useMemo(() => {
    const all = localApps.length
    const active = localApps.filter(a => ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "ACCEPTED"].includes(a.status)).length
    const archived = localApps.filter(a => ["GHOSTED", "WITHDRAWN", "REJECTED"].includes(a.status)).length
    return { all, active, archived }
  }, [localApps])

  // Filter application helper
  const filteredApps = useMemo(() => {
    return localApps.filter(app => {
      const matchesSearch =
        app.companyName.toLowerCase().includes(search.toLowerCase()) ||
        app.jobTitle.toLowerCase().includes(search.toLowerCase())

      let matchesFilter = true
      if (filterMode === "ACTIVE") {
        matchesFilter = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "ACCEPTED"].includes(app.status)
      } else if (filterMode === "ARCHIVED") {
        matchesFilter = ["GHOSTED", "WITHDRAWN", "REJECTED"].includes(app.status)
      } else if (filterMode !== "ALL") {
        matchesFilter = app.status === filterMode
      }

      return matchesSearch && matchesFilter
    })
  }, [localApps, search, filterMode])

  // Sort applications helper
  const sortedApps = useMemo(() => {
    if (!sortBy || !sortOrder) return filteredApps

    return [...filteredApps].sort((a, b) => {
      let comparison = 0

      if (sortBy === "company") {
        comparison = a.companyName.localeCompare(b.companyName)
      } else if (sortBy === "appliedAt") {
        comparison = new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime()
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
  const handleSort = (field: "company" | "appliedAt" | "excitement" | "status") => {
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

          {/* Quick Filter Chips */}
          <button
            onClick={() => setFilterMode("ALL")}
            className={cn(
              "filter-chip inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all duration-150 select-none",
              filterMode === "ALL"
                ? "bg-[#FFF0F0] border-[#FF6B6B] text-[#FF6B6B]"
                : "bg-white border-[#E8E6E0] text-[#6B6863] hover:border-[#FF6B6B] hover:text-[#FF6B6B]"
            )}
          >
            All <span className="font-mono text-[10.5px] opacity-75">{counts.all}</span>
          </button>

          <button
            onClick={() => setFilterMode("ACTIVE")}
            className={cn(
              "filter-chip inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all duration-150 select-none",
              filterMode === "ACTIVE"
                ? "bg-[#FFF0F0] border-[#FF6B6B] text-[#FF6B6B]"
                : "bg-white border-[#E8E6E0] text-[#6B6863] hover:border-[#FF6B6B] hover:text-[#FF6B6B]"
            )}
          >
            Active <span className="font-mono text-[10.5px] opacity-75">{counts.active}</span>
          </button>

          <button
            onClick={() => setFilterMode("ARCHIVED")}
            className={cn(
              "filter-chip inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all duration-150 select-none",
              filterMode === "ARCHIVED"
                ? "bg-[#FFF0F0] border-[#FF6B6B] text-[#FF6B6B]"
                : "bg-white border-[#E8E6E0] text-[#6B6863] hover:border-[#FF6B6B] hover:text-[#FF6B6B]"
            )}
          >
            Archived <span className="font-mono text-[10.5px] opacity-75">{counts.archived}</span>
          </button>

          {/* More Filters Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className={cn(
                "filter-chip inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all duration-150 bg-white border-[#E8E6E0] text-[#6B6863] select-none",
                ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "ACCEPTED", "GHOSTED", "REJECTED", "WITHDRAWN"].includes(filterMode)
                  ? "bg-[#FFF0F0] border-[#FF6B6B] text-[#FF6B6B]"
                  : "hover:border-[#FF6B6B] hover:text-[#FF6B6B]",
                showMoreFilters && "border-[#FF6B6B]"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              {["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "ACCEPTED", "GHOSTED", "REJECTED", "WITHDRAWN"].includes(filterMode)
                ? statusMap[filterMode]?.label
                : "More filters"}
              <ChevronDown className={cn("w-3 h-3 transition-transform", showMoreFilters && "rotate-180")} />
            </button>

            {showMoreFilters && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowMoreFilters(false)} />
                <div className="absolute left-0 mt-1.5 w-48 bg-white border border-[#E8E6E0] rounded-xl shadow-lg py-1.5 z-30 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-[#6B6863] uppercase tracking-wider select-none">
                    Status stages
                  </div>
                  {["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "ACCEPTED", "GHOSTED", "REJECTED", "WITHDRAWN"].map((status) => {
                    const mapped = statusMap[status]
                    const isActive = filterMode === status
                    return (
                      <button
                        key={status}
                        onClick={() => {
                          setFilterMode(status)
                          setShowMoreFilters(false)
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#2D2D2D] hover:bg-[#F8F7F5] flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span>{mapped?.label}</span>
                        {isActive && <Check className="w-3.5 h-3.5 text-[#FF6B6B]" />}
                      </button>
                    )
                  })}
                  {filterMode !== "ALL" && !["ACTIVE", "ARCHIVED"].includes(filterMode) && (
                    <>
                      <div className="border-t border-[#E8E6E0] my-1" />
                      <button
                        onClick={() => {
                          setFilterMode("ALL")
                          setShowMoreFilters(false)
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-[#FF6B6B] hover:bg-[#FFF0F0] font-semibold cursor-pointer transition-colors"
                      >
                        Clear filter
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

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
            filterMode={filterMode}
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
            filterMode={filterMode}
          />
        )}
      </div>
    </div>
  )
}

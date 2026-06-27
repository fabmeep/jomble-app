"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Search, Plus, Heart, Trash2, ExternalLink, Sparkles, Loader2, MapPin, Calendar, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { statusMap } from "@/lib/status"
import StatusBadge from "@/components/ui/status-badge"

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
}

interface DashboardClientProps {
  initialApplications: Application[]
}

const colors = [
  "#FF6B6B", // Coral
  "#FF8C42", // Amber
  "#3A86FF", // Blue
  "#8338EC", // Purple
  "#06D6A0", // Green
  "#118AB2", // Teal
  "#FFD166", // Yellow
  "#F15BB5", // Pink
]

const getBgColor = (name: string) => {
  const code = name.charCodeAt(0) || 0
  return colors[code % colors.length]
}


export default function DashboardClient({ initialApplications }: DashboardClientProps) {
  const searchParams = useSearchParams()
  const search = searchParams.get("search") || ""
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Stats calculation
  const totalMatches = initialApplications.length
  const activeCount = initialApplications.filter(a => ["APPLIED", "SCREENING", "INTERVIEW"].includes(a.status)).length
  const interviewingCount = initialApplications.filter(a => a.status === "INTERVIEW").length
  const offersCount = initialApplications.filter(a => ["OFFER", "ACCEPTED"].includes(a.status)).length

  // Funnel calculations
  const fApplied = initialApplications.filter(a => a.status === "APPLIED").length
  const fScreening = initialApplications.filter(a => a.status === "SCREENING").length
  const fInterview = initialApplications.filter(a => a.status === "INTERVIEW").length
  const fOffer = initialApplications.filter(a => a.status === "OFFER").length
  const maxFunnelCount = Math.max(fApplied, fScreening, fInterview, fOffer, 1)
  const getPercent = (count: number) => (count / maxFunnelCount) * 100

  // Filtering logic
  const filteredApplications = initialApplications.filter(app => {
    const matchesSearch =
      app.companyName.toLowerCase().includes(search.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = selectedStatus === "ALL" || app.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  // Date formatter
  const formatDate = (dateInput: Date | string) => {
    const date = new Date(dateInput)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleSeed = () => {
    startTransition(async () => {
      // await seedMockApplications()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return
    setDeletingId(id)
    startTransition(async () => {
      // await deleteJobApplication(id)
      setDeletingId(null)
    })
  }

  return (
    <>
      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

        {/* Seeding Loading State Overlay */}
        {isPending && !deletingId && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-5 rounded-2xl border border-[#E8E6E0] shadow-lg flex flex-col items-center gap-3 text-center">
              <Loader2 className="w-8 h-8 text-[#FF6B6B] animate-spin" />
              <span className="font-semibold text-sm text-[#2D2D2D]">Processing applications...</span>
            </div>
          </div>
        )}

        {/* ── STATS GRID ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E8E6E0] rounded-xl p-4.5 flex flex-col gap-1.5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:height-[3px] before:bg-[#FF6B6B] shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6863]">Total Matches</span>
            <span className="text-2xl font-bold tracking-tight font-mono text-[#2D2D2D]">{totalMatches}</span>
            <span className="text-[11.5px] text-[#6B6863]">applications tracked</span>
          </div>
          <div className="bg-white border border-[#E8E6E0] rounded-xl p-4.5 flex flex-col gap-1.5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:height-[3px] before:bg-[#FF8C42] shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6863]">Active</span>
            <span className="text-2xl font-bold tracking-tight font-mono text-[#2D2D2D]">{activeCount}</span>
            <span className="text-[11.5px] text-[#6B6863]">in progress stages</span>
          </div>
          <div className="bg-white border border-[#E8E6E0] rounded-xl p-4.5 flex flex-col gap-1.5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:height-[3px] before:bg-[#1565C0] shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6863]">Interviewing</span>
            <span className="text-2xl font-bold tracking-tight font-mono text-[#2D2D2D]">{interviewingCount}</span>
            <span className="text-[11.5px] text-[#6B6863]">
              <strong className="text-[#2E7D32] font-semibold">{totalMatches > 0 ? Math.round((interviewingCount / totalMatches) * 100) : 0}%</strong> of total
            </span>
          </div>
          <div className="bg-white border border-[#E8E6E0] rounded-xl p-4.5 flex flex-col gap-1.5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:height-[3px] before:bg-[#9E9E9E] shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6863]">Offers</span>
            <span className="text-2xl font-bold tracking-tight font-mono text-[#2D2D2D]">{offersCount}</span>
            <span className="text-[11.5px] text-[#6B6863]">
              <strong className="text-[#2E7D32] font-semibold">{offersCount}</strong> received
            </span>
          </div>
        </div>

        {/* ── TWO COLUMN LAYOUT ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">

          {/* LEFT SIDE: FILTERS & TABLE */}
          <div className="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden shadow-xs flex flex-col">

            {/* Status Filters Container */}
            <div className="p-4 border-b border-[#E8E6E0] flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {["ALL", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={cn(
                      "px-3 py-1 rounded-full border border-[#E8E6E0] text-xs font-medium cursor-pointer transition-all duration-150 select-none",
                      selectedStatus === status
                        ? "bg-[#FFF0F0] border-[#FF6B6B] text-[#FF6B6B]"
                        : "bg-white text-[#6B6863] hover:border-[#FF6B6B] hover:text-[#FF6B6B]"
                    )}
                  >
                    {status === "ALL" ? "All" : statusMap[status]?.label || status}
                  </button>
                ))}
              </div>

            {/* APPLICATIONS TABLE / LIST */}
            <div className="overflow-x-auto min-h-[300px]">
              {filteredApplications.length > 0 ? (
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#E8E6E0] bg-[#F8F7F5]">
                      <th className="px-4 py-2.5 text-[11px] font-bold text-[#6B6863] uppercase tracking-wider">Company & Role</th>
                      <th className="px-4 py-2.5 text-[11px] font-bold text-[#6B6863] uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2.5 text-[11px] font-bold text-[#6B6863] uppercase tracking-wider">Excitement</th>
                      <th className="px-4 py-2.5 text-[11px] font-bold text-[#6B6863] uppercase tracking-wider">Applied</th>
                      <th className="px-4 py-2.5 text-[11px] font-bold text-[#6B6863] uppercase tracking-wider">Location</th>
                      <th className="px-4 py-2.5 text-[11px] font-bold text-[#6B6863] uppercase tracking-wider w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((app) => {
                      return (
                        <tr key={app.id} className="border-b border-[#E8E6E0] hover:bg-[#FFFAFA] transition-colors group">
                          {/* Company / Title */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                                style={{ backgroundColor: getBgColor(app.companyName) }}
                              >
                                {app.companyName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-[13px] text-[#2D2D2D] truncate" title={app.companyName}>
                                  {app.companyName}
                                </div>
                                <div className="text-[11.5px] text-[#6B6863] truncate" title={app.jobTitle}>
                                  {app.jobTitle}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="px-4 py-3.5">
                            <StatusBadge status={app.status} />
                          </td>

                          {/* Excitement Hearts */}
                          <td className="px-4 py-3.5">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((val) => (
                                <Heart
                                  key={val}
                                  className={cn(
                                    "w-3 h-3 transition-colors",
                                    val <= (app.excitementScore || 0)
                                      ? "fill-[#FF6B6B] text-[#FF6B6B]"
                                      : "text-[#E0DEDA]"
                                  )}
                                />
                              ))}
                            </div>
                          </td>

                          {/* Applied Date */}
                          <td className="px-4 py-3.5 text-xs font-mono text-[#6B6863]">
                            {formatDate(app.appliedAt)}
                          </td>

                          {/* Location */}
                          <td className="px-4 py-3.5 text-[12.5px] text-[#6B6863]">
                            {app.location || "—"}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {app.jobUrl && (
                                <a
                                  href={app.jobUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 border border-[#E8E6E0] rounded bg-white text-[#6B6863] hover:text-[#2D2D2D] hover:bg-[#F8F7F5] transition-all"
                                  title="Open posting"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                onClick={() => handleDelete(app.id)}
                                disabled={deletingId === app.id}
                                className="p-1 border border-[#E8E6E0] rounded bg-white text-[#6B6863] hover:text-[#D84315] hover:bg-[#FBE9E7] hover:border-[#F0997B] transition-all cursor-pointer"
                                title="Delete application"
                              >
                                {deletingId === app.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                /* EMPTY STATE */
                <div className="flex flex-col items-center justify-center text-center p-8 min-h-[300px]">
                  <div className="w-12 h-12 rounded-full bg-[#FFF0F0] flex items-center justify-center text-[#FF6B6B] mb-4">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#2D2D2D] mb-1">No applications found</h3>
                  <p className="text-xs text-[#6B6863] max-w-xs mb-5">
                    {search || selectedStatus !== "ALL"
                      ? "Try adjustments to your search query or status filter to locate matches."
                      : "Start tracking job matches by clicking Add Application, or seed mock data to populate your board instantly."}
                  </p>

                  {!(search || selectedStatus !== "ALL") && (
                    <button
                      onClick={handleSeed}
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#E8E6E0] hover:border-[#FF6B6B] text-[#6B6863] hover:text-[#FF6B6B] rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
                    >
                      <Sparkles className="w-4 h-4 text-[#FF8C42]" />
                      Seed Mock Applications
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: FUNNEL CHART */}
          <div className="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#E8E6E0]">
              <h2 className="text-[13.5px] font-bold text-[#2D2D2D]">Application Funnel</h2>
            </div>
            <div className="p-4 flex flex-col gap-4">

              {/* Funnel Row: Applied */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-[#6B6863]">Just applied</span>
                  <span className="font-mono font-semibold text-[#2D2D2D]">{fApplied}</span>
                </div>
                <div className="h-2 bg-[#F8F7F5] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2E7D32] rounded-full transition-all duration-500"
                    style={{ width: `${getPercent(fApplied)}%` }}
                  />
                </div>
              </div>

              {/* Funnel Row: Screening */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-[#6B6863]">Screening</span>
                  <span className="font-mono font-semibold text-[#2D2D2D]">{fScreening}</span>
                </div>
                <div className="h-2 bg-[#F8F7F5] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#F57C00] rounded-full transition-all duration-500"
                    style={{ width: `${getPercent(fScreening)}%` }}
                  />
                </div>
              </div>

              {/* Funnel Row: Interview */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-[#6B6863]">Interviewing</span>
                  <span className="font-mono font-semibold text-[#2D2D2D]">{fInterview}</span>
                </div>
                <div className="h-2 bg-[#F8F7F5] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1565C0] rounded-full transition-all duration-500"
                    style={{ width: `${getPercent(fInterview)}%` }}
                  />
                </div>
              </div>

              {/* Funnel Row: Offer */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-[#6B6863]">Offer received</span>
                  <span className="font-mono font-semibold text-[#2D2D2D]">{fOffer}</span>
                </div>
                <div className="h-2 bg-[#F8F7F5] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#512DA8] rounded-full transition-all duration-500"
                    style={{ width: `${getPercent(fOffer)}%` }}
                  />
                </div>
              </div>

              {totalMatches === 0 && (
                <div className="text-center py-4 text-xs text-[#6B6863] border border-dashed border-[#E8E6E0] rounded-lg">
                  No tracking records to render funnel graph.
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </>
  )
}

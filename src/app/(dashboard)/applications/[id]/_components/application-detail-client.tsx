"use client"

import { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import PageHeader from "../../../_components/page-header"
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  DollarSign,
  ExternalLink,
  Heart,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  User,
  Link as LinkIcon,
  ChevronDown,
  ChevronRight,
  Check,
  Activity,
  FileText,
  Mail,
  Pencil,
  X
} from "lucide-react"
import { cn, getInitials } from "@/lib/utils"
import { statusMap } from "@/lib/status"
import { toast } from "sonner"
import StatusBadge from "@/components/ui/status-badge"
import CompanyLogo from "@/components/ui/company-logo"

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg fill="currentColor" viewBox="0 0 24 24" className={className}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
)

interface Note {
  id: string
  content: string
  createdAt: Date
}

interface Contact {
  id: string
  name: string
  role: string | null
  email: string | null
  linkedinUrl: string | null
}

interface TimelineEvent {
  id: string
  eventType: string
  oldStatus: string | null
  newStatus: string | null
  description: string | null
  occurredAt: Date
}

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
  notes: Note[]
  contacts: Contact[]
  timelineEvents: TimelineEvent[]
  redFlags?: { id: string; label: string; emoji: string }[]
}

interface ApplicationDetailClientProps {
  initialApplication: Application
}




export default function ApplicationDetailClient({ initialApplication }: ApplicationDetailClientProps) {
  const router = useRouter()
  const [localApp, setLocalApp] = useState<Application>(initialApplication)
  const [notes, setNotes] = useState<Note[]>(initialApplication.notes || [])
  const [contacts, setContacts] = useState<Contact[]>(initialApplication.contacts || [])
  const [timeline, setTimeline] = useState<TimelineEvent[]>(initialApplication.timelineEvents || [])

  // Interactive UI states
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Notes inputs
  const [newNoteText, setNewNoteText] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)

  // Contacts inputs
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [contactName, setContactName] = useState("")
  const [contactRole, setContactRole] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactLinkedin, setContactLinkedin] = useState("")
  const [isSavingContact, setIsSavingContact] = useState(false)
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null)

  // Format salary utility
  const formattedSalary = useMemo(() => {
    const min = localApp.salaryMin
    const max = localApp.salaryMax
    const cur = localApp.currency || "USD"

    if (min === null && max === null) return null

    const formatVal = (val: number) => {
      if (val >= 1000) {
        return `${Math.round(val / 1000)}k`
      }
      return `${val}`
    }

    const prefixSymbol = cur === "USD" ? "$" : cur === "EUR" ? "€" : cur === "GBP" ? "£" : `${cur} `

    if (min !== null && max !== null) {
      return `${prefixSymbol}${formatVal(min)} – ${prefixSymbol}${formatVal(max)} / mo`
    } else if (min !== null) {
      return `From ${prefixSymbol}${formatVal(min)} / mo`
    } else if (max !== null) {
      return `Up to ${prefixSymbol}${formatVal(max)} / mo`
    }
    return null
  }, [localApp.salaryMin, localApp.salaryMax, localApp.currency])


  // Date formatting helpers
  const formatDateLong = (dateInput: Date | string) => {
    const date = new Date(dateInput)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatDateTime = (dateInput: Date | string) => {
    const date = new Date(dateInput)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " · " + date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  }

  // Calculate last activity duration
  const lastActivityText = useMemo(() => {
    const now = new Date()
    const activity = new Date(localApp.lastActivityAt)
    const diffTime = Math.abs(now.getTime() - activity.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    return `${diffDays} days ago`
  }, [localApp.lastActivityAt])

  // Excitement Score selector
  const handleExcitementChange = async (score: number) => {
    try {
      const res = await fetch(`/api/applications/${localApp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excitementScore: score }),
      })
      if (!res.ok) throw new Error("Failed to update excitement score")

      setLocalApp(prev => ({ ...prev, excitementScore: score }))
      toast.success("Rating updated!")
    } catch (err) {
      toast.error("Error updating rating: " + (err as Error).message)
    }
  }

  // Status selection handler
  const handleStatusChange = async (newStatus: string) => {
    setShowStatusDropdown(false)
    const oldStatus = localApp.status
    if (oldStatus === newStatus) return

    try {
      const res = await fetch(`/api/applications/${localApp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, lastActivityAt: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error("Failed to update status")

      // Update local state application
      setLocalApp(prev => ({
        ...prev,
        status: newStatus,
        lastActivityAt: new Date()
      }))

      // Push custom status change onto timeline
      setTimeline(prev => [
        {
          id: Math.random().toString(),
          eventType: "STATUS_CHANGE",
          oldStatus: oldStatus,
          newStatus: newStatus,
          description: null,
          occurredAt: new Date()
        },
        ...prev
      ])
      toast.success(`Status updated to "${statusMap[newStatus]?.label || newStatus}"`)
      router.refresh()
    } catch (err) {
      toast.error("Error updating status: " + (err as Error).message)
    }
  }

  // Delete entire application
  const handleDeleteApplication = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/applications/${localApp.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete application")

      toast.success("Job application deleted successfully!")
      router.push("/applications")
      router.refresh()
    } catch (err) {
      toast.error("Error deleting application: " + (err as Error).message)
      setIsDeleting(false)
    }
  }

  // Notes handling
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteText.trim()) return

    setIsAddingNote(true)
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobAppId: localApp.id, content: newNoteText }),
      })
      if (!res.ok) throw new Error("Failed to add note")

      const note = await res.json()
      setNotes(prev => [...prev, note])

      // Push timeline event locally
      setTimeline(prev => [
        {
          id: Math.random().toString(),
          eventType: "NOTE_ADDED",
          description: newNoteText.trim().length > 60 ? newNoteText.trim().substring(0, 57) + "..." : newNoteText.trim(),
          occurredAt: new Date(),
          oldStatus: null,
          newStatus: null
        },
        ...prev
      ])

      setNewNoteText("")
      toast.success("Note added successfully")
      router.refresh()
    } catch (err) {
      toast.error("Error saving note: " + (err as Error).message)
    } finally {
      setIsAddingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Delete this note permanently?")) return

    setDeletingNoteId(noteId)
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete note")

      setNotes(prev => prev.filter(n => n.id !== noteId))
      toast.success("Note deleted successfully")
    } catch (err) {
      toast.error("Error deleting note: " + (err as Error).message)
    } finally {
      setDeletingNoteId(null)
    }
  }

  // Contacts handling
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactName.trim()) return

    setIsSavingContact(true)
    try {
      const payload = {
        jobAppId: localApp.id,
        name: contactName,
        role: contactRole.trim() || null,
        email: contactEmail.trim() || null,
        linkedinUrl: contactLinkedin.trim() || null,
      }

      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to add contact")

      const newContact = await res.json()
      setContacts(prev => [...prev, newContact])

      // Push timeline event locally
      setTimeline(prev => [
        {
          id: Math.random().toString(),
          eventType: "CONTACT_ADDED",
          description: `${contactName}${contactRole ? `, ${contactRole}` : ""}`,
          occurredAt: new Date(),
          oldStatus: null,
          newStatus: null
        },
        ...prev
      ])

      // Reset inputs
      setContactName("")
      setContactRole("")
      setContactEmail("")
      setContactLinkedin("")
      setIsAddingContact(false)
      toast.success("Contact added successfully")
      router.refresh()
    } catch (err) {
      toast.error("Error saving contact: " + (err as Error).message)
    } finally {
      setIsSavingContact(false)
    }
  }

  const handleDeleteContact = async (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Remove this contact permanently?")) return

    setDeletingContactId(contactId)
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete contact")

      setContacts(prev => prev.filter(c => c.id !== contactId))
      toast.success("Contact removed successfully")
    } catch (err) {
      toast.error("Error removing contact: " + (err as Error).message)
    } finally {
      setDeletingContactId(null)
    }
  }

  const statusDetail = statusMap[localApp.status] || {
    label: localApp.status,
    bg: "bg-zinc-100",
    text: "text-zinc-700",
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F7F5]">
      <PageHeader
        actions={
          <>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn px-2.5 sm:px-3.5 py-1.5 border border-[#F0997B] text-[#D84315] hover:bg-[#FBE9E7] rounded-lg text-[13px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
            <Link
              href={`/applications/${localApp.id}/edit`}
              className="btn px-2.5 sm:px-3.5 py-1.5 bg-[#FF6B6B] hover:bg-[#e85555] text-white rounded-lg text-[13px] font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </Link>
          </>
        }
      >
        <Link href="/applications" className="hover:text-[#FF6B6B] transition-colors flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          Applications
        </Link>
        <ChevronRight className="w-3 h-3 text-[#6B6863]/60" />
        <span className="font-semibold text-[#2D2D2D] truncate max-w-[120px]">{localApp.companyName}</span>
      </PageHeader>

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1100px] mx-auto flex flex-col gap-5">

          {/* ── HEADER CARD ── */}
          <div className="bg-white border border-[#E8E6E0] rounded-2xl p-6 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex flex-col md:flex-row gap-5 items-start">
              <CompanyLogo companyName={localApp.companyName} size="lg" />
              <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                <h2 className="text-xl font-extrabold text-[#2D2D2D] tracking-tight leading-tight">
                  {localApp.jobTitle}
                </h2>
                <div className="text-sm text-[#6B6863] flex items-center gap-1.5 flex-wrap">
                  <span>at {localApp.companyName}</span>
                  {localApp.jobUrl && (
                    <a
                      href={localApp.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-[#FF6B6B] hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View posting
                    </a>
                  )}
                </div>

                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 select-none border-t border-[#E8E6E0]/50 pt-3">
                  <span className="flex items-center gap-1.5 text-xs text-[#6B6863]">
                    <Briefcase className="w-3.5 h-3.5" />
                    {localApp.workMode === "ON_SITE" ? "On-site" : localApp.workMode === "HYBRID" ? "Hybrid" : "Remote"}
                  </span>
                  {localApp.location && (
                    <span className="flex items-center gap-1.5 text-xs text-[#6B6863]">
                      <MapPin className="w-3.5 h-3.5" />
                      {localApp.location}
                    </span>
                  )}
                  {formattedSalary && (
                    <span className="flex items-center gap-1.5 text-xs text-[#6B6863]">
                      <DollarSign className="w-3.5 h-3.5" />
                      {formattedSalary}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-xs text-[#6B6863]">
                    <Calendar className="w-3.5 h-3.5" />
                    Applied {formatDateLong(localApp.appliedAt)}
                  </span>
                </div>

                {/* Red Flags Display */}
                {localApp.redFlags && localApp.redFlags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <span className="text-[10px] font-bold text-[#FF6B6B] uppercase tracking-wider select-none bg-[#FFF0F0] border border-[#FF6B6B]/15 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      ⚠️ Concerns
                    </span>
                    {localApp.redFlags.map((flag) => (
                      <span
                        key={flag.id}
                        className="bg-[#FFF0F0] text-[#FF6B6B] border border-[#FF6B6B]/15 px-2.5 py-0.5 rounded-full text-xs font-semibold select-none flex items-center gap-1 hover:bg-[#FFE5E5] transition-colors animate-in fade-in duration-150"
                        title={flag.label}
                      >
                        <span>{flag.emoji}</span>
                        <span>{flag.label}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Status and Excitement select bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-3 border-t border-[#E8E6E0] pt-4 select-none">

                  {/* Status update */}
                  <div className="flex items-center gap-2.5 relative">
                    <span className="text-[11.5px] font-bold text-[#6B6863] uppercase tracking-wider">Status</span>
                    <button
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border border-transparent shadow-2xs",
                        statusDetail.bg,
                        statusDetail.text
                      )}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                      {statusDetail.label}
                      <ChevronDown className="w-3 h-3 ml-0.5" />
                    </button>

                    {showStatusDropdown && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setShowStatusDropdown(false)} />
                        <div className="absolute left-[45px] top-[32px] mt-1.5 w-44 bg-white border border-[#E8E6E0] rounded-xl shadow-lg py-1.5 z-30 animate-in fade-in duration-100">
                          {Object.keys(statusMap).map(status => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(status)}
                              className="w-full text-left px-3.5 py-2 text-xs text-[#2D2D2D] hover:bg-[#F8F7F5] flex items-center justify-between cursor-pointer transition-colors"
                            >
                              <span>{statusMap[status].label}</span>
                              {localApp.status === status && <Check className="w-3.5 h-3.5 text-[#FF6B6B]" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Excitement ratings updates */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11.5px] font-bold text-[#6B6863] uppercase tracking-wider">Excitement</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleExcitementChange(val)}
                          className="border-none bg-transparent hover:opacity-85 cursor-pointer transition-transform duration-100 hover:scale-105"
                        >
                          <Heart
                            className={cn(
                              "w-5 h-5",
                              val <= (localApp.excitementScore || 0)
                                ? "fill-[#FF6B6B] text-[#FF6B6B]"
                                : "text-[#E0DEDA]"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* ── TWO COLUMN MAIN CONTENT ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">

            {/* ── LEFT COLUMN ── */}
            <div className="flex flex-col gap-5">

              {/* PANEL: Role Information */}
              <div className="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden shadow-2xs">
                <div className="px-4.5 py-3.5 border-b border-[#E8E6E0] bg-[#FAF9F7]/50 select-none">
                  <h3 className="font-bold text-[#2D2D2D] text-[13px]">Role information</h3>
                </div>
                <div className="p-4.5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-[#6B6863] uppercase tracking-wider">Source</span>
                      <span className="text-[13px] font-semibold text-[#2D2D2D]">
                        {localApp.source.charAt(0).toUpperCase() + localApp.source.slice(1).toLowerCase().replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-[#6B6863] uppercase tracking-wider">Work Mode</span>
                      <span className="text-[13px] font-semibold text-[#2D2D2D]">
                        {localApp.workMode.charAt(0).toUpperCase() + localApp.workMode.slice(1).toLowerCase().replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-[#6B6863] uppercase tracking-wider">Currency</span>
                      <span className="text-[13px] font-mono font-semibold text-[#2D2D2D]">
                        {localApp.currency || "USD"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-[#6B6863] uppercase tracking-wider">Last Activity</span>
                      <span className="text-[13px] font-semibold text-[#2D2D2D]">
                        {lastActivityText}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PANEL: Notes section */}
              <div className="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden shadow-2xs">
                <div className="px-4.5 py-3.5 border-b border-[#E8E6E0] bg-[#FAF9F7]/50 select-none">
                  <h3 className="font-bold text-[#2D2D2D] text-[13px]">Notes</h3>
                </div>
                <div className="p-4.5 flex flex-col gap-3">
                  {notes.length > 0 ? (
                    <div className="flex flex-col divide-y divide-[#E8E6E0]/60">
                      {notes.map(note => (
                        <div key={note.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3 group/note">
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-[#2D2D2D] leading-relaxed break-words">{note.content}</p>
                            <span className="block text-[10.5px] font-mono text-[#6B6863] mt-1.5">
                              {formatDateTime(note.createdAt)}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={deletingNoteId === note.id}
                            className="p-1 border border-[#E8E6E0] rounded bg-white text-[#6B6863] hover:text-[#D84315] hover:bg-[#FBE9E7] hover:border-[#F0997B] transition-all opacity-0 group-hover/note:opacity-100 cursor-pointer disabled:opacity-50"
                            title="Delete note"
                          >
                            {deletingNoteId === note.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-[13px] text-[#6B6863] select-none border border-dashed border-[#E8E6E0] rounded-xl">
                      No notes logged for this application yet.
                    </div>
                  )}

                  {/* Add note input box */}
                  <form onSubmit={handleAddNote} className="flex gap-2.5 mt-2 border-t border-[#E8E6E0]/60 pt-4">
                    <textarea
                      placeholder="Add a note (prep details, recruiter updates...)"
                      value={newNoteText}
                      onChange={e => setNewNoteText(e.target.value)}
                      disabled={isAddingNote}
                      rows={2}
                      className="flex-1 border border-[#E8E6E0] rounded-lg p-2.5 text-[13px] text-[#2D2D2D] placeholder-[#6B6863] outline-none focus:border-[#FF6B6B] transition-colors resize-none disabled:bg-slate-50"
                    />
                    <button
                      type="submit"
                      disabled={isAddingNote || !newNoteText.trim()}
                      className="self-end inline-flex items-center justify-center px-4 py-2 bg-[#FF6B6B] hover:bg-[#e85555] disabled:bg-[#FF6B6B]/50 text-white rounded-lg text-xs font-semibold cursor-pointer h-9 transition-colors select-none"
                    >
                      {isAddingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                    </button>
                  </form>
                </div>
              </div>


              {/* Danger Zone panel */}
              <div className="border border-[#F5D0C5] bg-[#FFFBFA] rounded-xl p-4.5 flex flex-col gap-3">
                <div>
                  <h4 className="font-bold text-[#D84315] text-[13px]">Danger zone</h4>
                  <p className="text-[12px] text-[#6B6863] leading-relaxed mt-1">
                    Deleting this application will permanently remove all associated notes, contacts, and historical timeline logs. This operation cannot be undone.
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="self-start px-3.5 py-1.5 border border-[#F0997B] text-[#D84315] hover:bg-[#FBE9E7] rounded-lg text-xs font-semibold transition-colors cursor-pointer select-none"
                >
                  Delete this application
                </button>
              </div>

            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="flex flex-col gap-5">

              {/* PANEL: Contacts panel */}
              <div className="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden shadow-2xs">
                <div className="px-4.5 py-3.5 border-b border-[#E8E6E0] bg-[#FAF9F7]/50 flex justify-between items-center select-none">
                  <h3 className="font-bold text-[#2D2D2D] text-[13px]">Contacts</h3>
                  <button
                    onClick={() => setIsAddingContact(!isAddingContact)}
                    className="text-xs font-semibold text-[#FF6B6B] hover:text-[#e85555] cursor-pointer flex items-center gap-1"
                  >
                    {isAddingContact ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {isAddingContact ? "Cancel" : "Add"}
                  </button>
                </div>

                <div className="p-4.5 flex flex-col gap-3">

                  {/* Inline adding form */}
                  {isAddingContact && (
                    <form onSubmit={handleAddContact} className="p-3.5 bg-[#F8F7F5] border border-[#E8E6E0] rounded-xl flex flex-col gap-3">
                      <div className="text-xs font-bold text-[#2D2D2D] border-b border-[#E8E6E0] pb-1.5 mb-0.5">Add Contact Details</div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-[#6B6863] uppercase tracking-wider">Name *</label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={e => setContactName(e.target.value)}
                          placeholder="e.g. Sarah Chen"
                          className="w-full bg-white border border-[#E8E6E0] rounded-lg px-2.5 py-1.5 text-xs text-[#2D2D2D] placeholder-[#6B6863] outline-none focus:border-[#FF6B6B]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-[#6B6863] uppercase tracking-wider">Role</label>
                        <input
                          type="text"
                          value={contactRole}
                          onChange={e => setContactRole(e.target.value)}
                          placeholder="e.g. Technical Recruiter"
                          className="w-full bg-white border border-[#E8E6E0] rounded-lg px-2.5 py-1.5 text-xs text-[#2D2D2D] placeholder-[#6B6863] outline-none focus:border-[#FF6B6B]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-[#6B6863] uppercase tracking-wider">Email</label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={e => setContactEmail(e.target.value)}
                          placeholder="e.g. sarah.chen@stripe.com"
                          className="w-full bg-white border border-[#E8E6E0] rounded-lg px-2.5 py-1.5 text-xs text-[#2D2D2D] placeholder-[#6B6863] outline-none focus:border-[#FF6B6B]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-[#6B6863] uppercase tracking-wider">LinkedIn URL</label>
                        <input
                          type="url"
                          value={contactLinkedin}
                          onChange={e => setContactLinkedin(e.target.value)}
                          placeholder="e.g. https://linkedin.com/in/..."
                          className="w-full bg-white border border-[#E8E6E0] rounded-lg px-2.5 py-1.5 text-xs text-[#2D2D2D] placeholder-[#6B6863] outline-none focus:border-[#FF6B6B]"
                        />
                      </div>
                      <div className="flex gap-2 justify-end mt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingContact(false)}
                          className="px-3 py-1.5 border border-[#E8E6E0] hover:bg-white text-xs font-semibold text-[#6B6863] rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingContact || !contactName.trim()}
                          className="px-3.5 py-1.5 bg-[#FF6B6B] hover:bg-[#e85555] text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          {isSavingContact && <Loader2 className="w-3 h-3 animate-spin" />}
                          Save
                        </button>
                      </div>
                    </form>
                  )}

                  {contacts.length > 0 ? (
                    <div className="flex flex-col divide-y divide-[#E8E6E0]/60">
                      {contacts.map(c => (
                        <div key={c.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group/contact">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full border border-[#E8E6E0] bg-[#F8F7F5] flex items-center justify-center text-[10.5px] font-bold text-[#6B6863] select-none">
                              {getInitials(c.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold text-[#2D2D2D] truncate" title={c.name}>
                                {c.name}
                              </div>
                              {c.role && (
                                <div className="text-[11.5px] text-[#6B6863] truncate" title={c.role}>
                                  {c.role}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 ml-auto select-none">
                            {c.email && (
                              <a
                                href={`mailto:${c.email}`}
                                className="w-7 h-7 rounded-lg border border-[#E8E6E0] hover:bg-[#F8F7F5] hover:text-[#FF6B6B] flex items-center justify-center text-[#6B6863] transition-colors"
                                title={c.email}
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {c.linkedinUrl && (
                              <a
                                href={c.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-7 h-7 rounded-lg border border-[#E8E6E0] hover:bg-[#F8F7F5] hover:text-[#FF6B6B] flex items-center justify-center text-[#6B6863] transition-colors"
                                title="LinkedIn Profile"
                              >
                                <LinkedInIcon className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={(e) => handleDeleteContact(c.id, e)}
                              disabled={deletingContactId === c.id}
                              className="w-7 h-7 rounded-lg border border-[#E8E6E0] hover:border-red-200 hover:bg-[#FBE9E7] hover:text-[#D84315] flex items-center justify-center text-[#6B6863] opacity-0 group-hover/contact:opacity-100 transition-all cursor-pointer disabled:opacity-50"
                              title="Delete contact"
                            >
                              {deletingContactId === c.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    !isAddingContact && (
                      <div className="text-center py-6 text-[13px] text-[#6B6863] select-none border border-dashed border-[#E8E6E0] rounded-xl">
                        No contacts saved yet.
                      </div>
                    )
                  )}

                </div>
              </div>

              {/* PANEL: Chronological Timeline */}
              <div className="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden shadow-2xs">
                <div className="px-4.5 py-3.5 border-b border-[#E8E6E0] bg-[#FAF9F7]/50 select-none">
                  <h3 className="font-bold text-[#2D2D2D] text-[13px]">Timeline</h3>
                </div>

                <div className="p-4 flex flex-col gap-4 relative select-none">
                  {timeline.length > 0 ? (
                    <div className="flex flex-col">
                      {timeline.map((event, idx) => {
                        // Render timeline details
                        const isLast = idx === timeline.length - 1

                        let eventTitle = "Activity logged"
                        let eventDesc: React.ReactNode = event.description
                        let dotBg = "bg-[#FAF9F7]"
                        let dotColor = "text-[#6B6863]"
                        let dotIcon = <Activity className="w-3.5 h-3.5" />

                        if (event.eventType === "STATUS_CHANGE") {
                          const oldD = statusMap[event.oldStatus || ""]
                          const newD = statusMap[event.newStatus || ""]

                          eventTitle = "Status changed"
                          dotBg = newD ? newD.bg : "bg-[#FAF9F7]"
                          dotColor = newD ? newD.text : "text-[#6B6863]"
                          dotIcon = <Activity className="w-3.5 h-3.5" />

                          eventDesc = (
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {event.oldStatus ? (
                                <StatusBadge status={event.oldStatus} dot={false} className="text-[10px] px-2 py-0.5" />
                              ) : (
                                <span className="text-[10px] text-[#6B6863]">None</span>
                              )}
                              <span className="text-xs text-[#6B6863]/60">→</span>
                              {event.newStatus ? (
                                <StatusBadge status={event.newStatus} dot={false} className="text-[10px] px-2 py-0.5" />
                              ) : (
                                <span className="text-[10px] text-[#6B6863]">{event.newStatus}</span>
                              )}
                            </div>
                          )
                        } else if (event.eventType === "CONTACT_ADDED") {
                          eventTitle = "Contact added"
                          dotBg = "bg-[#F3E5F5]"
                          dotColor = "text-[#7B1FA2]"
                          dotIcon = <User className="w-3.5 h-3.5" />
                        } else if (event.eventType === "NOTE_ADDED") {
                          eventTitle = "Note logged"
                          dotBg = "bg-[#FFF0F0]"
                          dotColor = "text-[#FF6B6B]"
                          dotIcon = <FileText className="w-3.5 h-3.5" />
                        } else if (event.eventType === "AUTO_GHOSTED") {
                          eventTitle = "Auto-ghosted"
                          dotBg = "bg-[#F5F5F5]"
                          dotColor = "text-[#9E9E9E]"
                        }

                        // Check initial creation
                        const isCreation = event.description?.toLowerCase().includes("added via") || event.description?.toLowerCase().includes("created")
                        if (isCreation) {
                          dotBg = "bg-[#E8F5E9]"
                          dotColor = "text-[#2E7D32]"
                          dotIcon = <Plus className="w-3.5 h-3.5" />
                          eventTitle = "Application created"
                        }

                        return (
                          <div key={event.id} className="flex gap-3.5 relative pb-5 last:pb-0">
                            {/* Vertical Line Connector */}
                            {!isLast && (
                              <div className="absolute left-[13.5px] top-[26px] bottom-0 w-[1.5px] bg-[#E8E6E0]" />
                            )}

                            {/* Dot Icon */}
                            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 border border-white shadow-2xs", dotBg, dotColor)}>
                              {dotIcon}
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1 pt-0.5">
                              <h4 className="text-[12.5px] font-bold text-[#2D2D2D] leading-tight">
                                {eventTitle}
                              </h4>
                              {eventDesc && typeof eventDesc === "string" ? (
                                <p className="text-[11.5px] text-[#6B6863] leading-relaxed mt-1">
                                  {eventDesc}
                                </p>
                              ) : (
                                eventDesc
                              )}
                              <span className="block text-[10px] font-mono text-[#6B6863] mt-1">
                                {formatDateTime(event.occurredAt)}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-[13px] text-[#6B6863] border border-dashed border-[#E8E6E0] rounded-xl">
                      No logs listed in the timeline history.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DELETE APPLICATION MODAL ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200 select-none">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl border border-[#E8E6E0] flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="w-11 h-11 rounded-xl bg-[#FBE9E7] flex items-center justify-center text-[#D84315] flex-shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-bold text-base text-[#2D2D2D]">Delete this application?</h3>
              <p className="text-[12.5px] text-[#6B6863] leading-relaxed">
                You're about to delete <strong>{localApp.jobTitle} at {localApp.companyName}</strong>. All notes, contacts, and timeline logs will be permanently removed. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 justify-end border-t border-[#E8E6E0]/60 pt-3 mt-1">
              <button
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-3.5 py-1.5 border border-[#E8E6E0] bg-white hover:bg-[#F8F7F5] rounded-lg text-xs font-semibold text-[#6B6863] hover:text-[#2D2D2D] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={handleDeleteApplication}
                className="px-4 py-1.5 bg-[#D84315] hover:bg-[#B8390F] disabled:bg-[#D84315]/75 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm, useFieldArray } from "react-hook-form"
import PageHeader from "../../../../_components/page-header"
import { zodResolver } from "@hookform/resolvers/zod"
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
  ChevronRight,
  Check,
  FileText,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { jobApplicationSchema } from "@/shared/schemas/jobApplication"
import { z } from "zod"

type JobApplicationFormInput = z.input<typeof jobApplicationSchema>

interface Note {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}

interface Contact {
  id: string
  name: string
  role: string | null
  email: string | null
  linkedinUrl: string | null
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
  appliedAt: string
  lastActivityAt: string
  createdAt: string
  updatedAt: string
  notes: Note[]
  contacts: Contact[]
}

interface EditApplicationClientProps {
  initialApplication: Application
}

const excitementLabels = ["Not sure yet", "Mildly interested", "Pretty into it", "Really excited", "Dream job!"]

const sourceOptions = [
  { label: "LinkedIn", value: "LINKEDIN" },
  { label: "Indeed", value: "INDEED" },
  { label: "Glassdoor", value: "GLASSDOOR" },
  { label: "Company website", value: "COMPANY_WEBSITE" },
  { label: "Referral", value: "REFERRAL" },
  { label: "Recruiter outreach", value: "RECRUITER" },
  { label: "Job fair", value: "JOB_FAIR" },
  { label: "GitHub Jobs", value: "GITHUB_JOBS" },
  { label: "Other", value: "OTHER" },
]

const WORK_MODE_OPTIONS = [
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ON_SITE", label: "On-site" },
] as const

const STATUS_OPTIONS = [
  { value: "APPLIED", label: "Just applied", bg: "bg-[#E8F5E9] text-[#2E7D32]", border: "peer-checked:border-[#2E7D32] peer-checked:ring-[#2E7D32]/10" },
  { value: "SCREENING", label: "Screening", bg: "bg-[#FFF3E0] text-[#F57C00]", border: "peer-checked:border-[#F57C00] peer-checked:ring-[#F57C00]/10" },
  { value: "INTERVIEW", label: "Interviewing", bg: "bg-[#E3F2FD] text-[#1565C0]", border: "peer-checked:border-[#1565C0] peer-checked:ring-[#1565C0]/10" },
  { value: "OFFER", label: "Offer received", bg: "bg-[#EDE7F6] text-[#512DA8]", border: "peer-checked:border-[#512DA8] peer-checked:ring-[#512DA8]/10" },
  { value: "ACCEPTED", label: "Happily hired", bg: "bg-[#F3E5F5] text-[#7B1FA2]", border: "peer-checked:border-[#7B1FA2] peer-checked:ring-[#7B1FA2]/10" },
  { value: "REJECTED", label: "Not a fit", bg: "bg-[#FBE9E7] text-[#D84315]", border: "peer-checked:border-[#D84315] peer-checked:ring-[#D84315]/10" },
  { value: "WITHDRAWN", label: "I swiped left", bg: "bg-[#ECEFF1] text-[#546E7A]", border: "peer-checked:border-[#546E7A] peer-checked:ring-[#546E7A]/10" },
  { value: "GHOSTED", label: "Left on read", bg: "bg-[#F5F5F5] text-[#9E9E9E]", border: "peer-checked:border-[#9E9E9E] peer-checked:ring-[#9E9E9E]/10" },
] as const

export default function EditApplicationClient({ initialApplication }: EditApplicationClientProps) {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [hoveredHeart, setHoveredHeart] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<JobApplicationFormInput>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: {
      companyName: initialApplication.companyName,
      jobTitle: initialApplication.jobTitle,
      jobUrl: initialApplication.jobUrl || "",
      location: initialApplication.location || "",
      workMode: initialApplication.workMode as any,
      currency: initialApplication.currency || "USD",
      salaryMin: initialApplication.salaryMin,
      salaryMax: initialApplication.salaryMax,
      status: initialApplication.status as any,
      appliedAt: initialApplication.appliedAt as any,
      source: initialApplication.source as any,
      excitementScore: initialApplication.excitementScore || 3,
      contacts: initialApplication.contacts.map((c) => ({
        name: c.name,
        role: c.role || "",
        email: c.email || "",
        linkedinUrl: c.linkedinUrl || "",
        notes: "",
      })),
      notes: initialApplication.notes[0]?.content || "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "contacts",
  })

  const excitementScore = watch("excitementScore")
  const selectedStatus = watch("status")

  const onSubmit = async (data: JobApplicationFormInput) => {
    setSubmitError(null)

    const payload = {
      ...data,
      appliedAt: data.appliedAt ? new Date(data.appliedAt as any).toISOString() : new Date().toISOString(),
      salaryMin: data.salaryMin && !isNaN(Number(data.salaryMin)) ? Number(data.salaryMin) : null,
      salaryMax: data.salaryMax && !isNaN(Number(data.salaryMax)) ? Number(data.salaryMax) : null,
      location: data.location?.trim() || null,
      jobUrl: data.jobUrl?.trim() || null,
      notes: data.notes?.trim() || null,
      contacts: data.contacts
        ? data.contacts
            .map((c) => ({
              name: c.name?.trim(),
              role: c.role?.trim() || null,
              email: c.email?.trim() || null,
              linkedinUrl: c.linkedinUrl?.trim() || null,
              notes: c.notes?.trim() || null,
            }))
            .filter((c) => c.name !== "")
        : [],
    }

    try {
      const res = await fetch(`/api/applications/${initialApplication.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to update job application")
      }

      router.push(`/applications/${initialApplication.id}`)
      router.refresh()
    } catch (err) {
      console.error(err)
      setSubmitError((err as Error).message || "An unexpected error occurred.")
    }
  }

  const handleDeleteApplication = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/applications/${initialApplication.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to delete application")
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Error deleting application: " + (err as Error).message)
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const timeAgo = (dateInput: string) => {
    const now = new Date()
    const updated = new Date(dateInput)
    const diffTime = Math.abs(now.getTime() - updated.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    return `${diffDays} days ago`
  }

  const displayedHeartLevel = hoveredHeart || (excitementScore as number) || 3

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F7F5]">
      <PageHeader
        actions={
          <>
            <Link
              href={`/applications/${initialApplication.id}`}
              className="px-3.5 py-1.5 border border-[#E8E6E0] hover:bg-[#F8F7F5] rounded-lg text-[13px] font-semibold text-[#6B6863] hover:text-[#2D2D2D] transition-colors cursor-pointer flex items-center justify-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              form="edit-application-form"
              disabled={!isDirty || isSubmitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FF6B6B] hover:bg-[#e85555] disabled:bg-[#E8E6E0] disabled:text-[#6B6863] disabled:cursor-not-allowed text-white rounded-lg text-[13px] font-semibold transition-all duration-150 shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <svg fill="none" viewBox="0 0 14 14" className="w-3.5 h-3.5">
                  <path d="M2 7.5L5.5 11L12 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <span className="hidden sm:inline">Save changes</span>
              <span className="sm:hidden">Save</span>
            </button>
          </>
        }
      >
        <Link href="/applications" className="hover:text-[#FF6B6B] transition-colors flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          Applications
        </Link>
        <ChevronRight className="w-3 h-3 text-[#6B6863]/60" />
        <Link href={`/applications/${initialApplication.id}`} className="hover:text-[#FF6B6B] transition-colors font-medium">
          {initialApplication.companyName}
        </Link>
        <ChevronRight className="w-3 h-3 text-[#6B6863]/60" />
        <span className="font-semibold text-[#2D2D2D]">Edit</span>
      </PageHeader>

      {/* ── FORM CONTENT AREA ── */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex justify-center">
        <div className="w-full max-w-[760px] flex flex-col">
          <div className="page-head flex items-start justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#2D2D2D] md:text-2xl mb-1">Edit application</h1>
              <p className="text-xs md:text-sm text-[#6B6863] font-semibold">
                {initialApplication.jobTitle} at {initialApplication.companyName}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#6B6863] bg-white border border-[#E8E6E0] rounded-full px-3 py-1.5 flex-shrink-0 select-none shadow-2xs font-semibold">
              <svg fill="none" viewBox="0 0 14 14" className="w-3.5 h-3.5">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M7 4.5v3l2 1.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Last edited <strong className="text-[#2D2D2D] font-bold">{timeAgo(initialApplication.updatedAt)}</strong>
            </div>
          </div>

          {/* Unsaved changes banner */}
          {isDirty && (
            <div className="flex items-center gap-3 bg-[#FFF3E0] border border-[#FFD9A0] rounded-xl p-3.5 mb-5 animate-in fade-in duration-200">
              <AlertTriangle className="w-4.5 h-4.5 text-[#F57C00] flex-shrink-0" />
              <span className="text-[13px] text-[#8a5b1f] leading-normal font-medium">
                <strong>You have unsaved changes.</strong> Save before leaving this page or your edits will be lost.
              </span>
            </div>
          )}

          {submitError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 text-xs mb-5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form id="edit-application-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            
            {/* ── SECTION: Role details ── */}
            <div className="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden shadow-2xs">
              <div className="px-4.5 py-3.5 border-b border-[#E8E6E0] bg-[#FAF9F7]/50 flex items-center gap-2.5 select-none">
                <div className="w-7 h-7 rounded-lg bg-[#FFF0F0] flex items-center justify-center shrink-0">
                  <Briefcase className="w-3.5 h-3.5 text-[#FF6B6B]" />
                </div>
                <span className="font-bold text-[#2D2D2D] text-[13px]">Role details</span>
              </div>
              <div className="p-5 px-5.5 flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="companyName" className="text-[12.5px] font-semibold text-[#2D2D2D]">
                      Company name <span className="text-[#FF6B6B] font-bold">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Briefcase className="absolute left-3 w-[15px] h-[15px] text-[#6B6863] pointer-events-none" />
                      <input
                        type="text"
                        id="companyName"
                        placeholder="e.g. Stripe"
                        className={cn(
                          "w-full pl-9 pr-3 py-2.5 border border-[#E8E6E0] rounded-lg text-[13.5px] text-[#2D2D2D] bg-white outline-none focus:border-[#FF6B6B] focus:ring-3 focus:ring-[#FF6B6B]/10 transition-all placeholder-[#C0BCB8]",
                          errors.companyName && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                        )}
                        {...register("companyName")}
                      />
                    </div>
                    {errors.companyName && (
                      <span className="text-[11px] text-red-500 font-semibold">{errors.companyName.message}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="jobTitle" className="text-[12.5px] font-semibold text-[#2D2D2D]">
                      Job title <span className="text-[#FF6B6B] font-bold">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3 w-[15px] h-[15px] text-[#6B6863] pointer-events-none" />
                      <input
                        type="text"
                        id="jobTitle"
                        placeholder="e.g. Senior Frontend Engineer"
                        className={cn(
                          "w-full pl-9 pr-3 py-2.5 border border-[#E8E6E0] rounded-lg text-[13.5px] text-[#2D2D2D] bg-white outline-none focus:border-[#FF6B6B] focus:ring-3 focus:ring-[#FF6B6B]/10 transition-all placeholder-[#C0BCB8]",
                          errors.jobTitle && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                        )}
                        {...register("jobTitle")}
                      />
                    </div>
                    {errors.jobTitle && (
                      <span className="text-[11px] text-red-500 font-semibold">{errors.jobTitle.message}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="jobUrl" className="text-[12.5px] font-semibold text-[#2D2D2D]">
                    Job posting URL <span className="text-[11px] font-normal text-[#6B6863] ml-0.5">optional</span>
                  </label>
                  <div className="relative flex items-center">
                    <LinkIcon className="absolute left-3 w-[15px] h-[15px] text-[#6B6863] pointer-events-none" />
                    <input
                      type="url"
                      id="jobUrl"
                      placeholder="https://jobs.lever.co/..."
                      className={cn(
                        "w-full pl-9 pr-3 py-2.5 border border-[#E8E6E0] rounded-lg text-[13.5px] text-[#2D2D2D] bg-white outline-none focus:border-[#FF6B6B] focus:ring-3 focus:ring-[#FF6B6B]/10 transition-all placeholder-[#C0BCB8]",
                        errors.jobUrl && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                      )}
                      {...register("jobUrl")}
                    />
                  </div>
                  {errors.jobUrl && (
                    <span className="text-[11px] text-red-500 font-semibold">{errors.jobUrl.message}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="location" className="text-[12.5px] font-semibold text-[#2D2D2D]">
                      Location <span className="text-[11px] font-normal text-[#6B6863] ml-0.5">optional</span>
                    </label>
                    <div className="relative flex items-center">
                      <MapPin className="absolute left-3 w-[15px] h-[15px] text-[#6B6863] pointer-events-none" />
                      <input
                        type="text"
                        id="location"
                        placeholder="e.g. San Francisco, CA"
                        className={cn(
                          "w-full pl-9 pr-3 py-2.5 border border-[#E8E6E0] rounded-lg text-[13.5px] text-[#2D2D2D] bg-white outline-none focus:border-[#FF6B6B] focus:ring-3 focus:ring-[#FF6B6B]/10 transition-all placeholder-[#C0BCB8]",
                          errors.location && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                        )}
                        {...register("location")}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-semibold text-[#2D2D2D]">Work mode</label>
                    <div className="flex gap-2">
                      {WORK_MODE_OPTIONS.map((opt) => (
                        <div className="flex-1 relative" key={opt.value}>
                          <input
                            type="radio"
                            value={opt.value}
                            id={`wm-${opt.value}`}
                            className="sr-only peer"
                            {...register("workMode")}
                          />
                          <label
                            htmlFor={`wm-${opt.value}`}
                            className={cn(
                              "flex items-center justify-center gap-1.5 py-2.5 border border-[#E8E6E0] rounded-lg text-xs font-semibold text-[#6B6863] bg-white hover:text-[#2D2D2D] transition-colors cursor-pointer select-none",
                              "peer-checked:border-[#FF6B6B] peer-checked:bg-[#FFF0F0] peer-checked:text-[#FF6B6B]"
                            )}
                          >
                            {opt.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION: Compensation ── */}
            <div className="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden shadow-2xs">
              <div className="px-4.5 py-3.5 border-b border-[#E8E6E0] bg-[#FAF9F7]/50 flex items-center gap-2.5 select-none">
                <div className="w-7 h-7 rounded-lg bg-[#FFF3E0] flex items-center justify-center shrink-0">
                  <DollarSign className="w-3.5 h-3.5 text-[#F57C00]" />
                </div>
                <span className="font-bold text-[#2D2D2D] text-[13px]">Compensation</span>
                <span className="text-[11px] text-[#6B6863] ml-auto font-semibold">Optional, kept private</span>
              </div>
              <div className="p-5 px-5.5 flex flex-col gap-2">
                <label className="text-[12.5px] font-semibold text-[#2D2D2D]">Salary range</label>
                <div className="flex items-center gap-2">
                  <div className="w-[90px] flex-shrink-0">
                    <select
                      className="w-full px-3 py-2 border border-[#E8E6E0] rounded-lg text-[13.5px] text-[#2D2D2D] bg-white outline-none focus:border-[#FF6B6B] focus:ring-3 focus:ring-[#FF6B6B]/10 transition-all cursor-pointer appearance-none bg-no-repeat bg-[right_12px_center] bg-[length:16px] pr-8"
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none'%3e%3cpath d='M4 6l4 4 4-4' stroke='%236B6863' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e")`,
                      }}
                      {...register("currency")}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="IDR">IDR</option>
                      <option value="SGD">SGD</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full px-3 py-2 border border-[#E8E6E0] rounded-lg text-[13.5px] text-[#2D2D2D] bg-white placeholder-[#C0BCB8] outline-none focus:border-[#FF6B6B] focus:ring-3 focus:ring-[#FF6B6B]/10 transition-all"
                      {...register("salaryMin")}
                    />
                  </div>
                  <span className="text-[#6B6863] text-sm px-1">—</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="Max"
                      className={cn(
                        "w-full px-3 py-2 border border-[#E8E6E0] rounded-lg text-[13.5px] text-[#2D2D2D] bg-white placeholder-[#C0BCB8] outline-none focus:border-[#FF6B6B] focus:ring-3 focus:ring-[#FF6B6B]/10 transition-all",
                        errors.salaryMax && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                      )}
                      {...register("salaryMax")}
                    />
                  </div>
                  <span className="text-[#6B6863] text-xs whitespace-nowrap ml-1 font-semibold">/ month</span>
                </div>
                {errors.salaryMax && (
                  <span className="text-[11px] text-red-500 font-semibold">{errors.salaryMax.message}</span>
                )}
              </div>
            </div>

            {/* ── SECTION: Status & tracking ── */}
            <div className="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden shadow-2xs">
              <div className="px-4.5 py-3.5 border-b border-[#E8E6E0] bg-[#FAF9F7]/50 flex items-center gap-2.5 select-none">
                <div className="w-7 h-7 rounded-lg bg-[#E3F2FD] flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-[#1565C0]" />
                </div>
                <span className="font-bold text-[#2D2D2D] text-[13px]">Status & tracking</span>
              </div>
              <div className="p-5 px-5.5 flex flex-col gap-4.5">
                <div className="flex flex-col gap-2">
                  <label className="text-[12.5px] font-semibold text-[#2D2D2D]">Current status</label>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((opt) => (
                      <div className="relative" key={opt.value}>
                        <input
                          type="radio"
                          value={opt.value}
                          id={`status-${opt.value}`}
                          className="sr-only peer"
                          {...register("status")}
                        />
                        <label
                          htmlFor={`status-${opt.value}`}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border border-transparent select-none",
                            opt.bg,
                            opt.border,
                            "peer-checked:border-current peer-checked:ring-3"
                          )}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                          {opt.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-semibold text-[#2D2D2D]">Date applied</label>
                    <div className="relative flex items-center">
                      <Calendar className="absolute left-3 w-4 h-4 text-[#6B6863] pointer-events-none" />
                      <input
                        type="date"
                        className="w-full pl-9 pr-3 py-2 border border-[#E8E6E0] rounded-lg text-[13.5px] text-[#2D2D2D] bg-white outline-none focus:border-[#FF6B6B]"
                        {...register("appliedAt")}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-semibold text-[#2D2D2D]">How you found it</label>
                    <div className="relative flex items-center">
                      <select
                        className="w-full px-3 py-2 border border-[#E8E6E0] rounded-lg text-[13.5px] text-[#2D2D2D] bg-white outline-none focus:border-[#FF6B6B] cursor-pointer appearance-none bg-no-repeat bg-[right_12px_center] bg-[length:16px] pr-8"
                        style={{
                          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none'%3e%3cpath d='M4 6l4 4 4-4' stroke='%236B6863' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e")`,
                        }}
                        {...register("source")}
                      >
                        {sourceOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[12.5px] font-semibold text-[#2D2D2D]">How excited are you about this one?</label>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1" onMouseLeave={() => setHoveredHeart(0)}>
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setValue("excitementScore", val, { shouldDirty: true })}
                          onMouseEnter={() => setHoveredHeart(val)}
                          className="text-2xl border-none bg-transparent hover:opacity-75 cursor-pointer transition-transform duration-100 hover:scale-105"
                        >
                          <Heart
                            className={cn(
                              "w-6 h-6",
                              val <= displayedHeartLevel ? "fill-[#FF6B6B] text-[#FF6B6B]" : "text-[#E0DEDA]"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-[#6B6863] select-none">
                      {excitementLabels[displayedHeartLevel - 1] ?? excitementLabels[0]}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION: Contacts ── */}
            <div className="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden shadow-2xs">
              <div className="px-4.5 py-3.5 border-b border-[#E8E6E0] bg-[#FAF9F7]/50 flex justify-between items-center select-none">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#F3E5F5] flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-[#7B1FA2]" />
                  </div>
                  <span className="font-bold text-[#2D2D2D] text-[13px]">Contacts</span>
                  <span className="text-[11px] text-[#6B6863] font-semibold">Optional</span>
                </div>
              </div>
              <div className="p-5 px-5.5 flex flex-col gap-3">
                {fields.map((contact, index) => (
                  <div key={contact.id} className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1.2fr_1.2fr_auto] gap-3 items-start border-b border-[#E8E6E0]/40 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        placeholder="Name *"
                        className={cn(
                          "w-full px-2.5 py-2 border border-[#E8E6E0] rounded-lg text-xs text-[#2D2D2D] placeholder-[#C0BCB8] outline-none focus:border-[#FF6B6B]",
                          errors.contacts?.[index]?.name && "border-red-500"
                        )}
                        {...register(`contacts.${index}.name` as const)}
                      />
                      {errors.contacts?.[index]?.name && (
                        <span className="text-[10px] text-red-500 font-semibold">{errors.contacts?.[index]?.name?.message}</span>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Role (e.g. Recruiter)"
                      className="w-full px-2.5 py-2 border border-[#E8E6E0] rounded-lg text-xs text-[#2D2D2D] placeholder-[#C0BCB8] outline-none focus:border-[#FF6B6B]"
                      {...register(`contacts.${index}.role` as const)}
                    />
                    <div className="flex flex-col gap-1">
                      <input
                        type="email"
                        placeholder="Email"
                        className={cn(
                          "w-full px-2.5 py-2 border border-[#E8E6E0] rounded-lg text-xs text-[#2D2D2D] placeholder-[#C0BCB8] outline-none focus:border-[#FF6B6B]",
                          errors.contacts?.[index]?.email && "border-red-500"
                        )}
                        {...register(`contacts.${index}.email` as const)}
                      />
                      {errors.contacts?.[index]?.email && (
                        <span className="text-[10px] text-red-500 font-semibold">Invalid email</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <input
                        type="url"
                        placeholder="LinkedIn URL"
                        className={cn(
                          "w-full px-2.5 py-2 border border-[#E8E6E0] rounded-lg text-xs text-[#2D2D2D] placeholder-[#C0BCB8] outline-none focus:border-[#FF6B6B]",
                          errors.contacts?.[index]?.linkedinUrl && "border-red-500"
                        )}
                        {...register(`contacts.${index}.linkedinUrl` as const)}
                      />
                      {errors.contacts?.[index]?.linkedinUrl && (
                        <span className="text-[10px] text-red-500 font-semibold">Invalid URL</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-2 border border-[#E8E6E0] hover:border-red-200 text-[#6B6863] hover:text-[#D84315] hover:bg-[#FBE9E7] rounded-lg transition-colors cursor-pointer"
                      title="Remove contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => append({ name: "", role: "", email: "", linkedinUrl: "", notes: "" })}
                  className="mt-1 self-start inline-flex items-center gap-1.5 px-3 py-2 border border-dashed border-[#E8E6E0] hover:border-[#FF6B6B] text-xs font-semibold text-[#6B6863] hover:text-[#FF6B6B] rounded-lg bg-white transition-all cursor-pointer select-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add another contact
                </button>
              </div>
            </div>

            {/* ── SECTION: Notes ── */}
            <div className="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden shadow-2xs">
              <div className="px-4.5 py-3.5 border-b border-[#E8E6E0] bg-[#FAF9F7]/50 flex items-center gap-2.5 select-none">
                <div className="w-7 h-7 rounded-lg bg-[#FBEAF0] flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-[#D4537E]" />
                </div>
                <span className="font-bold text-[#2D2D2D] text-[13px]">Notes</span>
              </div>
              <div className="p-5 px-5.5 flex flex-col gap-1.5">
                <label htmlFor="notes" className="text-[12.5px] font-semibold text-[#2D2D2D]">
                  Notes <span className="text-xs font-normal text-[#6B6863] ml-1">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  placeholder="Anything you want to remember about this one — referral details, prep, gut feeling..."
                  className="w-full px-3 py-2 border border-[#E8E6E0] rounded-lg text-[13.5px] text-[#2D2D2D] bg-white placeholder-[#C0BCB8] outline-none focus:border-[#FF6B6B] focus:ring-3 focus:ring-[#FF6B6B]/10 transition-all min-h-[100px] resize-y leading-relaxed"
                  {...register("notes")}
                />
              </div>
            </div>

            {/* ── Danger zone ── */}
            <div className="border border-[#F5D0C5] bg-[#FFFBFA] rounded-xl p-4.5 flex flex-col gap-3">
              <div className="font-bold text-[#D84315] text-[13px]">Danger zone</div>
              <div className="text-[12px] text-[#6B6863] leading-relaxed">
                Deleting this application removes all its notes, contacts, and timeline history. This can&apos;t be undone.
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="self-start btn px-3.5 py-1.5 border border-[#F0997B] text-[#D84315] hover:bg-[#FBE9E7] rounded-lg text-xs font-semibold transition-colors cursor-pointer select-none flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete this application
              </button>
            </div>

            {/* ── Sticky Footer ── */}
            <div className="form-footer bg-white border-t border-[#E8E6E0] p-4.5 px-5.5 flex items-center justify-between rounded-b-xl z-20 shadow-xs mt-4">
              <span className={cn(
                "text-xs flex items-center gap-1.5 select-none font-semibold",
                isDirty ? "text-[#F57C00]" : "text-[#6B6863]"
              )}>
                {isDirty ? (
                  <>
                    <svg fill="none" viewBox="0 0 14 14" className="w-3.5 h-3.5">
                      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M7 4.5v3l2 1.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    Unsaved changes
                  </>
                ) : (
                  <>
                    <svg fill="none" viewBox="0 0 14 14" className="w-3.5 h-3.5 text-[#2E7D32]">
                      <path d="M2 7.5L5.5 11L12 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    All changes saved
                  </>
                )}
              </span>
              <div className="flex gap-2">
                <Link
                  href={`/applications/${initialApplication.id}`}
                  className="px-3.5 py-1.5 border border-[#E8E6E0] hover:bg-[#F8F7F5] rounded-lg text-[13px] font-semibold text-[#6B6863] hover:text-[#2D2D2D] transition-colors cursor-pointer flex items-center justify-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={!isDirty || isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FF6B6B] hover:bg-[#e85555] disabled:bg-[#E8E6E0] disabled:text-[#6B6863] disabled:cursor-not-allowed text-white rounded-lg text-[13px] font-semibold transition-all duration-150 shadow-sm cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <svg fill="none" viewBox="0 0 14 14" className="w-3.5 h-3.5">
                      <path d="M2 7.5L5.5 11L12 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  Save changes
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-[380px] shadow-xl flex flex-col gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#FBE9E7] flex items-center justify-center text-[#D84315] shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="text-base font-bold text-foreground">Delete this application?</div>
              <div className="text-[13px] text-muted-foreground leading-relaxed">
                You&apos;re about to delete <strong className="text-foreground">{initialApplication.jobTitle} at {initialApplication.companyName}</strong>. All notes, contacts, and timeline history will be permanently removed. This can&apos;t be undone.
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 border border-[#E8E6E0] hover:bg-[#F8F7F5] rounded-lg text-[13px] font-semibold text-[#6B6863] hover:text-[#2D2D2D] transition-colors cursor-pointer select-none"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteApplication}
                disabled={isDeleting}
                className="px-3.5 py-1.5 bg-[#D84315] hover:bg-[#B8390F] disabled:bg-[#D84315]/70 text-white rounded-lg text-[13px] font-semibold transition-colors cursor-pointer select-none flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

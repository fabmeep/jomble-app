"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm, useFieldArray } from "react-hook-form"
import PageHeader from "../../../_components/page-header"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ChevronRight,
  Briefcase,
  User,
  Link as LinkIcon,
  MapPin,
  Laptop,
  Layers,
  MapPin as MapPinIcon,
  DollarSign,
  Calendar,
  AlertCircle,
  Loader2,
  Trash2,
  Plus,
  Heart,
  FileText,
  ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import FormCard from "./form/form-cards"
import FormInputField from "./form/form-input-field"
import { AutoFillCard } from "./autofill/autofill-card"
import { jobApplicationSchema } from "@/shared/schemas/jobApplication"
import { z } from "zod"

type JobApplicationFormInput = z.input<typeof jobApplicationSchema>

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
  { value: "APPLIED", label: "Just applied" },
  { value: "SCREENING", label: "Screening" },
  { value: "INTERVIEW", label: "Interviewing" },
  { value: "OFFER", label: "Offer received" },
] as const

export default function AddApplicationForm() {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [hoveredHeart, setHoveredHeart] = useState(0)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<JobApplicationFormInput>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: {
      companyName: "",
      jobTitle: "",
      jobUrl: "",
      location: "",
      workMode: "REMOTE",
      currency: "USD",
      salaryMin: null,
      salaryMax: null,
      status: "APPLIED",
      appliedAt: new Date().toISOString().split("T")[0] as any,
      source: "LINKEDIN",
      excitementScore: 3,
      contacts: [{ name: "", role: "", email: "", linkedinUrl: "", notes: "" }],
      notes: "",
      redFlags: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "contacts",
  })

  const [availableFlags, setAvailableFlags] = useState<{ id: string; label: string; emoji: string }[]>([])
  
  useEffect(() => {
    async function fetchFlags() {
      try {
        const res = await fetch("/api/red-flags")
        if (res.ok) {
          const data = await res.json()
          setAvailableFlags(data)
        }
      } catch (err) {
        console.error("Error loading red flags for form selector:", err)
      }
    }
    fetchFlags()
  }, [])

  const excitementScore = watch("excitementScore")

  const handleAutofillSuccess = (data: any) => {
    if (data.companyName) setValue("companyName", data.companyName, { shouldDirty: true, shouldValidate: true });
    if (data.jobTitle) setValue("jobTitle", data.jobTitle, { shouldDirty: true, shouldValidate: true });
    if (data.location) setValue("location", data.location, { shouldDirty: true, shouldValidate: true });
    if (data.jobUrl) setValue("jobUrl", data.jobUrl, { shouldDirty: true, shouldValidate: true });
    if (data.workMode) setValue("workMode", data.workMode, { shouldDirty: true, shouldValidate: true });
    if (data.salaryMin) setValue("salaryMin", data.salaryMin, { shouldDirty: true, shouldValidate: true });
    if (data.salaryMax) setValue("salaryMax", data.salaryMax, { shouldDirty: true, shouldValidate: true });
    if (data.currency) setValue("currency", data.currency, { shouldDirty: true, shouldValidate: true });
    if (data.source) setValue("source", data.source, { shouldDirty: true, shouldValidate: true });
  };

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
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to create job application")
      }

      toast.success("Job application created successfully!")
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      console.error(err)
      const errorMsg = (err as Error).message || "An unexpected error occurred."
      setSubmitError(errorMsg)
      toast.error(errorMsg)
    }
  }

  const displayedHeartLevel = hoveredHeart || (excitementScore as number) || 3

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto flex flex-col bg-[#F8F7F5]">
      <PageHeader>
        <Link href="/applications" className="hover:text-[#FF6B6B] transition-colors flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          Applications
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#6B6863]/60" />
        <span className="font-semibold text-[#2D2D2D]">Add application</span>
      </PageHeader>
      {/* ── FORM CONTENT AREA ── */}
      <div className="p-6 md:p-8 flex justify-center">
        <div className="w-full max-w-[760px] flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-bold tracking-tight text-[#2D2D2D] md:text-2xl">Add a new match</h2>
            <p className="text-xs md:text-sm text-[#6B6863]">Fill in the details below — you can always edit this later.</p>
          </div>

          {submitError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <AutoFillCard onSuccess={handleAutofillSuccess} />

          {/* ── SECTION DIVIDER ── */}
          <div className="relative flex py-2 items-center select-none">
            <div className="flex-grow border-t border-border" />
            <span className="flex-shrink-0 mx-3.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider bg-transparent">
              or fill in manually below
            </span>
            <div className="flex-grow border-t border-border" />
          </div>

          {/* ── SECTION: Role details ── */}
          <FormCard
            title="Role details"
            icon={Briefcase}
            iconBgClass="bg-[#FFF0F0]"
            iconColorClass="text-[#FF6B6B]"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInputField
                label="Company name"
                placeholder="e.g. Stripe"
                icon={Briefcase}
                required
                error={errors.companyName?.message}
                {...register("companyName")}
              />
              <FormInputField
                label="Job title"
                placeholder="e.g. Senior Frontend Engineer"
                icon={User}
                required
                error={errors.jobTitle?.message}
                {...register("jobTitle")}
              />
            </div>

            <FormInputField
              label="Job posting URL"
              placeholder="https://jobs.lever.co/..."
              icon={LinkIcon}
              optional
              error={errors.jobUrl?.message}
              {...register("jobUrl")}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInputField
                label="Location"
                placeholder="e.g. San Francisco, CA"
                icon={MapPin}
                optional
                error={errors.location?.message}
                {...register("location")}
              />
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
                          "flex items-center justify-center gap-1.5 py-2 border border-[#E8E6E0] rounded-lg text-xs font-semibold text-[#6B6863] bg-white hover:text-[#2D2D2D] transition-colors cursor-pointer select-none",
                          "peer-checked:border-[#FF6B6B] peer-checked:bg-[#FFF0F0] peer-checked:text-[#FF6B6B]"
                        )}
                      >
                        {opt.value === "REMOTE" && <Laptop className="w-3.5 h-3.5" />}
                        {opt.value === "HYBRID" && <Layers className="w-3.5 h-3.5" />}
                        {opt.value === "ON_SITE" && <MapPinIcon className="w-3.5 h-3.5" />}
                        {opt.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FormCard>

          {/* ── SECTION: Compensation ── */}
          <FormCard
            title="Compensation"
            icon={DollarSign}
            iconBgClass="bg-[#FFF3E0]"
            iconColorClass="text-[#F57C00]"
            badgeText="Optional, kept private"
            bodyClassName="gap-1.5"
          >
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
              <span className="text-[#6B6863] text-xs whitespace-nowrap ml-1">/ month</span>
            </div>
            {errors.salaryMax && (
              <span className="text-[11px] text-red-500 font-semibold">{errors.salaryMax.message}</span>
            )}
          </FormCard>

          {/* ── SECTION: Status & tracking ── */}
          <FormCard
            title="Status & tracking"
            icon={Calendar}
            iconBgClass="bg-[#E3F2FD]"
            iconColorClass="text-[#1565C0]"
          >
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
                        opt.value === "APPLIED" && "bg-[#E8F5E9] text-[#2E7D32] peer-checked:border-[#2E7D32] peer-checked:ring-3 peer-checked:ring-[#2E7D32]/10",
                        opt.value === "SCREENING" && "bg-[#FFF3E0] text-[#F57C00] peer-checked:border-[#F57C00] peer-checked:ring-3 peer-checked:ring-[#F57C00]/10",
                        opt.value === "INTERVIEW" && "bg-[#E3F2FD] text-[#1565C0] peer-checked:border-[#1565C0] peer-checked:ring-3 peer-checked:ring-[#1565C0]/10",
                        opt.value === "OFFER" && "bg-[#EDE7F6] text-[#512DA8] peer-checked:border-[#512DA8] peer-checked:ring-3 peer-checked:ring-[#512DA8]/10"
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
                <select
                  className="w-full px-3 py-2 border border-[#E8E6E0] rounded-lg text-[13.5px] text-[#2D2D2D] bg-white outline-none focus:border-[#FF6B6B] cursor-pointer appearance-none bg-no-repeat bg-[right_12px_center] bg-[length:16px] pr-8"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none'%3e%3cpath d='M4 6l4 4 4-4' stroke='%236B6863' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e")`,
                  }}
                  {...register("source")}
                >
                  {sourceOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12.5px] font-semibold text-[#2D2D2D]">How excited are you about this one?</label>
              <div className="flex items-center gap-3">
                <div className="flex gap-1" onMouseLeave={() => setHoveredHeart(0)}>
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setValue("excitementScore", val)}
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
                <span className="text-xs font-semibold text-[#6B6863]">
                  {excitementLabels[displayedHeartLevel - 1] ?? excitementLabels[0]}
                </span>
              </div>
            </div>
          </FormCard>

          {/* ── SECTION: Contacts ── */}
          <FormCard
            title="Contacts"
            icon={User}
            iconBgClass="bg-[#F3E5F5]"
            iconColorClass="text-[#7B1FA2]"
            badgeText="Optional (Client-only)"
            bodyClassName="gap-3"
          >
            {fields.map((contact, index) => (
              <div key={contact.id} className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1.2fr_1.2fr_auto] gap-3 items-start">
                <FormInputField
                  label=""
                  placeholder="Name *"
                  error={errors.contacts?.[index]?.name?.message}
                  {...register(`contacts.${index}.name` as const)}
                />
                <FormInputField
                  label=""
                  placeholder="Role (e.g. Recruiter)"
                  error={errors.contacts?.[index]?.role?.message}
                  {...register(`contacts.${index}.role` as const)}
                />
                <FormInputField
                  label=""
                  placeholder="Email"
                  error={errors.contacts?.[index]?.email?.message}
                  {...register(`contacts.${index}.email` as const)}
                />
                <FormInputField
                  label=""
                  placeholder="LinkedIn URL"
                  error={errors.contacts?.[index]?.linkedinUrl?.message}
                  {...register(`contacts.${index}.linkedinUrl` as const)}
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-2 border border-[#E8E6E0] hover:border-red-200 text-[#6B6863] hover:text-[#D84315] hover:bg-[#FBE9E7] rounded-lg transition-colors cursor-pointer mt-1"
                  title="Remove contact"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => append({ name: "", role: "", email: "", linkedinUrl: "", notes: "" })}
              className="mt-1 self-start inline-flex items-center gap-1.5 px-3 py-2 border border-dashed border-[#E8E6E0] hover:border-[#FF6B6B] text-xs font-semibold text-[#6B6863] hover:text-[#FF6B6B] rounded-lg bg-white transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add another contact
            </button>
          </FormCard>

          {/* ── SECTION: Concerns & Red Flags ── */}
          {availableFlags.length > 0 && (
            <FormCard
              title="Concerns & Red Flags"
              icon={AlertCircle}
              iconBgClass="bg-[#FFF0F0]"
              iconColorClass="text-[#FF6B6B]"
            >
              <p className="text-xs text-[#6B6863] leading-normal mb-2.5">
                Select any red flags that apply to this role.
              </p>
              <div className="flex flex-wrap gap-2">
                {availableFlags.map((flag) => {
                  const selectedFlags = watch("redFlags") || []
                  const isSelected = selectedFlags.includes(flag.id)
                  return (
                    <button
                      type="button"
                      key={flag.id}
                      onClick={() => {
                        if (isSelected) {
                          setValue(
                            "redFlags",
                            selectedFlags.filter((id) => id !== flag.id),
                            { shouldDirty: true }
                          )
                        } else {
                          setValue("redFlags", [...selectedFlags, flag.id], { shouldDirty: true })
                        }
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 cursor-pointer select-none",
                        isSelected
                          ? "bg-[#FFF0F0] text-[#FF6B6B] border-[#FF6B6B]/25"
                          : "bg-white border-[#E8E6E0] text-[#6B6863] hover:bg-[#F8F7F5]"
                      )}
                    >
                      <span>{flag.emoji}</span>
                      <span>{flag.label}</span>
                    </button>
                  )
                })}
              </div>
            </FormCard>
          )}

          {/* ── SECTION: Notes ── */}
          <FormCard
            title="Notes"
            icon={FileText}
            iconBgClass="bg-[#FBEAF0]"
            iconColorClass="text-[#D4537E]"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[#2D2D2D]">
                Notes <span className="text-xs font-normal text-[#6B6863] ml-1">(optional)</span>
              </label>
              <textarea
                placeholder="Anything you want to remember about this one — referral details, interview prep, gut feeling..."
                className="w-full px-3 py-2 border border-[#E8E6E0] rounded-lg text-[13.5px] text-[#2D2D2D] bg-white placeholder-[#C0BCB8] outline-none focus:border-[#FF6B6B] focus:ring-3 focus:ring-[#FF6B6B]/10 transition-all min-h-[100px] resize-y leading-relaxed"
                {...register("notes")}
              />
            </div>
          </FormCard>

          {/* Form Footer */}
          <div className="bg-white border border-[#E8E6E0] rounded-xl p-5 flex items-center justify-between shadow-xs mb-10">
            <span className="text-xs text-[#6B6863] flex items-center gap-1.5 select-none font-semibold">
              <svg fill="none" viewBox="0 0 14 14" className="w-3.5 h-3.5">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M7 4.5v3l2 1.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              Fields marked with * are required
            </span>
            <div className="flex gap-2">
              <Link
                href="/dashboard"
                className="px-3.5 py-1.5 border border-[#E8E6E0] hover:bg-[#F8F7F5] rounded-lg text-[13px] font-semibold text-[#6B6863] hover:text-[#2D2D2D] transition-colors cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FF6B6B] hover:bg-[#e85555] disabled:bg-[#FF6B6B]/70 text-white rounded-lg text-[13px] font-semibold transition-all duration-150 shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <svg fill="none" viewBox="0 0 14 14" className="w-3.5 h-3.5">
                    <path d="M2 7.5L5.5 11L12 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                Save application
              </button>
            </div>
          </div>

        </div>
      </div>
    </form>
  )
}

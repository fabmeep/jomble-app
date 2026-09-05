"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
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
  AlertTriangle,
  Loader2,
  Trash2,
  Plus,
  Heart,
  FileText,
  Building2,
  Check,
  X,
  Shield,
  Gift,
  Sparkles,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { jobApplicationSchema } from "@/shared/schemas/jobApplication"
import { AutoFillCard } from "../new/_components/autofill/autofill-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type JobApplicationFormInput = z.input<typeof jobApplicationSchema>

interface JobApplicationFormProps {
  mode: "create" | "edit"
  applicationId?: string
  initialValues?: Partial<JobApplicationFormInput> & {
    updatedAt?: string
  }
}

const excitementLabels = ["Not sure yet", "Mildly interested", "Pretty into it", "Really excited", "Dream job!"]

const sourceOptions = [
  { label: "LinkedIn", value: "LINKEDIN" },
  { label: "Dealls", value: "DEALLS" },
  { label: "Kalibrr", value: "KALIBRR" },
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

const CONTRACT_TYPE_OPTIONS = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERN", label: "Internship" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "TEMPORARY", label: "Temporary" },
  { value: "OTHER", label: "Other" },
] as const

const BENEFIT_PRESETS = [
  { id: "BPJS_KESEHATAN", label: "BPJS Kesehatan" },
  { id: "PRIVATE_HEALTH", label: "Private Health Insurance" },
  { id: "DENTAL_OPTICAL", label: "Dental & Optical" },
  { id: "FAMILY_COVERAGE", label: "Family Coverage" },
  { id: "THR", label: "THR (13th Month Pay)" },
  { id: "PERFORMANCE_BONUS", label: "Performance Bonus" },
  { id: "SIGN_ON_BONUS", label: "Sign-on Bonus" },
  { id: "OVERTIME_PAY", label: "Overtime Pay" },
  { id: "WFH_ALLOWANCE", label: "WFH / Equipment Stipend" },
  { id: "TRANSPORT_MEAL", label: "Transport & Meal Allowance" },
  { id: "WELLNESS_GYM", label: "Wellness & Gym Subsidy" },
  { id: "LEARNING_BUDGET", label: "Learning & Book Budget" },
]


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

export function JobApplicationForm({
  mode,
  applicationId,
  initialValues,
}: JobApplicationFormProps) {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [hoveredHeart, setHoveredHeart] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const defaultFormValues: JobApplicationFormInput = {
    companyName: initialValues?.companyName || "",
    jobTitle: initialValues?.jobTitle || "",
    jobUrl: initialValues?.jobUrl || "",
    location: initialValues?.location || "",
    workMode: (initialValues?.workMode as any) || "REMOTE",
    contractType: (initialValues?.contractType as any) || "FULL_TIME",
    isOutsource: initialValues?.isOutsource ?? false,
    agencyName: initialValues?.agencyName || "",
    benefits: initialValues?.benefits || [],
    currency: initialValues?.currency || "USD",
    salaryMin: initialValues?.salaryMin ?? null,
    salaryMax: initialValues?.salaryMax ?? null,
    status: (initialValues?.status as any) || "APPLIED",
    appliedAt: (initialValues?.appliedAt
      ? new Date(initialValues.appliedAt as any).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]) as any,
    source: (initialValues?.source as any) || "LINKEDIN",
    excitementScore: initialValues?.excitementScore ?? 3,
    contacts: initialValues?.contacts || [],
    notes: initialValues?.notes || "",
    redFlags: initialValues?.redFlags || [],
    jobDescription: initialValues?.jobDescription || "",
  }

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<JobApplicationFormInput>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: defaultFormValues,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "contacts",
  })

  const excitementScore = watch("excitementScore")
  const isOutsource = watch("isOutsource")
  const selectedBenefits = watch("benefits") || []
  const [customPerkInput, setCustomPerkInput] = useState("")

  const toggleBenefit = (label: string) => {
    const current = getValues("benefits") || []
    if (current.includes(label)) {
      setValue("benefits", current.filter((b) => b !== label), { shouldDirty: true })
    } else {
      setValue("benefits", [...current, label], { shouldDirty: true })
    }
  }

  const addCustomPerk = () => {
    const trimmed = customPerkInput.trim()
    if (!trimmed) return
    const current = getValues("benefits") || []
    if (!current.includes(trimmed)) {
      setValue("benefits", [...current, trimmed], { shouldDirty: true })
    }
    setCustomPerkInput("")
  }

  const removeBenefit = (label: string) => {
    const current = getValues("benefits") || []
    setValue("benefits", current.filter((b) => b !== label), { shouldDirty: true })
  }

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
        console.error("Error loading red flags:", err)
      }
    }
    fetchFlags()
  }, [])

  const handleAutofillSuccess = (data: any) => {
    if (data.companyName) setValue("companyName", data.companyName, { shouldDirty: true, shouldValidate: true })
    if (data.jobTitle) setValue("jobTitle", data.jobTitle, { shouldDirty: true, shouldValidate: true })
    if (data.location) setValue("location", data.location, { shouldDirty: true, shouldValidate: true })
    if (data.jobUrl) setValue("jobUrl", data.jobUrl, { shouldDirty: true, shouldValidate: true })
    if (data.workMode) setValue("workMode", data.workMode, { shouldDirty: true, shouldValidate: true })
    if (data.contractType) setValue("contractType", data.contractType, { shouldDirty: true, shouldValidate: true })
    if (data.isOutsource !== undefined) setValue("isOutsource", data.isOutsource, { shouldDirty: true, shouldValidate: true })
    if (data.agencyName) setValue("agencyName", data.agencyName, { shouldDirty: true, shouldValidate: true })
    if (data.benefits) setValue("benefits", data.benefits, { shouldDirty: true, shouldValidate: true })
    if (data.salaryMin) setValue("salaryMin", data.salaryMin, { shouldDirty: true, shouldValidate: true })
    if (data.salaryMax) setValue("salaryMax", data.salaryMax, { shouldDirty: true, shouldValidate: true })
    if (data.currency) setValue("currency", data.currency, { shouldDirty: true, shouldValidate: true })
    if (data.source) setValue("source", data.source, { shouldDirty: true, shouldValidate: true })
    if (data.jobDescription) setValue("jobDescription", data.jobDescription, { shouldDirty: true, shouldValidate: true })
  }

  const onSubmit = async (data: JobApplicationFormInput) => {
    setSubmitError(null)

    const payload = {
      ...data,
      isOutsource: Boolean(data.isOutsource),
      agencyName: data.isOutsource && data.agencyName?.trim() ? data.agencyName.trim() : null,
      benefits: Array.isArray(data.benefits) ? data.benefits : [],
      jobDescription: data.jobDescription?.trim() || null,
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
          .filter((c) => c.name)
        : [],
    }

    try {
      const endpoint = mode === "create" ? "/api/applications" : `/api/applications/${applicationId}`
      const method = mode === "create" ? "POST" : "PUT"

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `Failed to ${mode} job application`)
      }

      const successMsg = mode === "create" ? "Job application created successfully!" : "Job application updated successfully!"
      toast.success(successMsg)

      const redirectUrl = mode === "create" ? "/dashboard" : `/applications/${applicationId}`
      router.push(redirectUrl)
      router.refresh()
    } catch (err) {
      console.error(err)
      const errorMsg = (err as Error).message || "An unexpected error occurred."
      setSubmitError(errorMsg)
      toast.error(errorMsg)
    }
  }

  const handleDeleteApplication = async () => {
    if (!applicationId) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to delete application")
      }

      toast.success("Job application deleted successfully!")
      router.push("/applications")
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error("Error deleting application: " + (err as Error).message)
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const displayedHeartLevel = hoveredHeart || (excitementScore as number) || 3

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-6">
      {mode === "edit" && isDirty && (
        <div className="flex items-center gap-3 bg-[#FFF3E0] border border-[#FFD9A0] rounded-xl p-3.5 animate-in fade-in duration-200">
          <AlertTriangle className="w-4.5 h-4.5 text-[#F57C00] flex-shrink-0" />
          <span className="text-[13px] text-[#8a5b1f] leading-normal font-medium">
            <strong>You have unsaved changes.</strong> Save before leaving this page or your edits will be lost.
          </span>
        </div>
      )}

      {submitError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {mode === "create" && (
        <>
          <AutoFillCard onSuccess={handleAutofillSuccess} />
          <div className="relative flex py-2 items-center select-none">
            <div className="flex-grow border-t border-border" />
            <span className="flex-shrink-0 mx-3.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              or fill in manually below
            </span>
            <div className="flex-grow border-t border-border" />
          </div>
        </>
      )}

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
              <Label htmlFor="companyName" className="text-[12.5px] font-semibold text-[#2D2D2D]">
                Company name <span className="text-[#FF6B6B] font-bold">*</span>
              </Label>
              <div className="relative flex items-center">
                <Briefcase className="absolute left-3 w-[15px] h-[15px] text-[#6B6863] pointer-events-none" />
                <Input
                  id="companyName"
                  placeholder="e.g. Stripe"
                  className={cn("pl-9 h-10 text-[13.5px]", errors.companyName && "border-red-500")}
                  {...register("companyName")}
                />
              </div>
              {errors.companyName && (
                <span className="text-[11px] text-red-500 font-semibold">{errors.companyName.message}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="jobTitle" className="text-[12.5px] font-semibold text-[#2D2D2D]">
                Job title <span className="text-[#FF6B6B] font-bold">*</span>
              </Label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-[15px] h-[15px] text-[#6B6863] pointer-events-none" />
                <Input
                  id="jobTitle"
                  placeholder="e.g. Senior Frontend Engineer"
                  className={cn("pl-9 h-10 text-[13.5px]", errors.jobTitle && "border-red-500")}
                  {...register("jobTitle")}
                />
              </div>
              {errors.jobTitle && (
                <span className="text-[11px] text-red-500 font-semibold">{errors.jobTitle.message}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="jobUrl" className="text-[12.5px] font-semibold text-[#2D2D2D]">
              Job posting URL <span className="text-[11px] font-normal text-[#6B6863] ml-0.5">optional</span>
            </Label>
            <div className="relative flex items-center">
              <LinkIcon className="absolute left-3 w-[15px] h-[15px] text-[#6B6863] pointer-events-none" />
              <Input
                type="url"
                id="jobUrl"
                placeholder="https://jobs.lever.co/..."
                className={cn("pl-9 h-10 text-[13.5px]", errors.jobUrl && "border-red-500")}
                {...register("jobUrl")}
              />
            </div>
            {errors.jobUrl && (
              <span className="text-[11px] text-red-500 font-semibold">{errors.jobUrl.message}</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location" className="text-[12.5px] font-semibold text-[#2D2D2D]">
                Location <span className="text-[11px] font-normal text-[#6B6863] ml-0.5">optional</span>
              </Label>
              <div className="relative flex items-center">
                <MapPin className="absolute left-3 w-[15px] h-[15px] text-[#6B6863] pointer-events-none" />
                <Input
                  id="location"
                  placeholder="e.g. San Francisco, CA"
                  className="pl-9 h-10 text-[13.5px]"
                  {...register("location")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contractType" className="text-[12.5px] font-semibold text-[#2D2D2D]">
                Contract type
              </Label>
              <Controller
                control={control}
                name="contractType"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="contractType"
                      className={cn(
                        "w-full !h-10 text-[13px] font-semibold px-3 rounded-lg border transition-all cursor-pointer select-none",
                        field.value
                          ? "bg-[#FFF0F0] border-[#FF6B6B] text-[#FF6B6B] hover:bg-[#FFE5E5] hover:text-[#FF6B6B] focus-visible:border-[#FF6B6B] focus-visible:ring-[#FF6B6B]/20 [&_svg]:text-[#FF6B6B]"
                          : "bg-white border-[#E8E6E0] text-[#6B6863] hover:border-[#D0CFC9] hover:text-[#2D2D2D]"
                      )}
                    >
                      <SelectValue placeholder="Select contract type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-[#E8E6E0] rounded-xl shadow-lg p-1 z-50">
                      {CONTRACT_TYPE_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="text-[13px] font-medium py-2 px-2.5 rounded-lg cursor-pointer transition-colors focus:bg-[#FFF0F0] focus:text-[#FF6B6B] data-[state=checked]:bg-[#FFF0F0] data-[state=checked]:text-[#FF6B6B] data-[state=checked]:font-semibold [&_svg]:text-[#FF6B6B]"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.contractType && (
                <span className="text-[11px] text-red-500 font-semibold">{errors.contractType.message}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[12.5px] font-semibold text-[#2D2D2D]">Work mode</Label>
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
                    {opt.value === "REMOTE" && <Laptop className="w-3.5 h-3.5" />}
                    {opt.value === "HYBRID" && <Layers className="w-3.5 h-3.5" />}
                    {opt.value === "ON_SITE" && <MapPinIcon className="w-3.5 h-3.5" />}
                    {opt.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Sourcing / Outsource Model */}
          <div className="pt-3 border-t border-[#E8E6E0]/60 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isOutsource" className="text-[12.5px] font-semibold text-[#2D2D2D] cursor-pointer">
                  Outsourced / Agency Role
                </Label>
                <p className="text-[11.5px] text-[#6B6863]">
                  Check if this position is via a third-party vendor, recruiter agency, or staff augmentation.
                </p>
              </div>
              <input
                type="checkbox"
                id="isOutsource"
                className="w-4 h-4 rounded text-[#FF6B6B] border-[#E8E6E0] focus:ring-[#FF6B6B] accent-[#FF6B6B] cursor-pointer"
                {...register("isOutsource")}
              />
            </div>

            {isOutsource && (
              <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
                <Label htmlFor="agencyName" className="text-[12.5px] font-semibold text-[#2D2D2D]">
                  Vendor / Agency name <span className="text-[11px] font-normal text-[#6B6863] ml-0.5">optional</span>
                </Label>
                <div className="relative flex items-center">
                  <Building2 className="absolute left-3 w-[15px] h-[15px] text-[#6B6863] pointer-events-none" />
                  <Input
                    id="agencyName"
                    placeholder="e.g. Mitrais, Accenture, Glints TalentHunt"
                    className="pl-9 h-10 text-[13.5px]"
                    {...register("agencyName")}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION: Job description ── */}
      <div className="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden shadow-2xs">
        <div className="px-4.5 py-3.5 border-b border-[#E8E6E0] bg-[#FAF9F7]/50 flex items-center gap-2.5 select-none">
          <div className="w-7 h-7 rounded-lg bg-[#E0F2FE] flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5 text-[#0284C7]" />
          </div>
          <span className="font-bold text-[#2D2D2D] text-[13px]">Job description</span>
          <span className="text-[11px] text-[#6B6863] ml-auto font-semibold">Optional • Used for CV tailoring</span>
        </div>
        <div className="p-5 px-5.5 flex flex-col gap-2">
          <p className="text-xs text-[#6B6863] leading-normal">
            Paste the job posting requirements or responsibilities. This powers automatic match scoring and AI CV tailoring.
          </p>
          <Textarea
            id="jobDescription"
            placeholder="Paste responsibilities, required skills, qualifications, or the full job posting here..."
            className="text-[13px] min-h-[130px] leading-relaxed font-normal bg-white"
            {...register("jobDescription")}
          />
          {errors.jobDescription && (
            <span className="text-[11px] text-red-500 font-semibold">{errors.jobDescription.message}</span>
          )}
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
          <Label className="text-[12.5px] font-semibold text-[#2D2D2D]">Salary range</Label>
          <div className="flex items-center gap-2">
            <div className="w-[90px] flex-shrink-0">
              <select
                className="w-full px-3 py-2 border border-[#E8E6E0] rounded-lg text-[13.5px] text-[#2D2D2D] bg-white outline-none focus:border-[#FF6B6B] transition-all cursor-pointer appearance-none bg-no-repeat bg-[right_12px_center] bg-[length:16px] pr-8"
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
              <Input
                type="number"
                placeholder="Min"
                className="h-10 text-[13.5px]"
                {...register("salaryMin")}
              />
            </div>
            <span className="text-[#6B6863] text-sm px-1">—</span>
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Max"
                className={cn("h-10 text-[13.5px]", errors.salaryMax && "border-red-500")}
                {...register("salaryMax")}
              />
            </div>
            <span className="text-[#6B6863] text-xs whitespace-nowrap ml-1 font-semibold">/ month</span>
          </div>
          {errors.salaryMax && (
            <span className="text-[11px] text-red-500 font-semibold">{errors.salaryMax.message}</span>
          )}

          {/* Contract Perks & Benefits */}
          <div className="pt-4 border-t border-[#E8E6E0]/60 flex flex-col gap-3">
            <div>
              <Label className="text-[12.5px] font-semibold text-[#2D2D2D]">
                Contract Perks & Benefits <span className="text-[11px] font-normal text-[#6B6863] ml-0.5">optional</span>
              </Label>
              <p className="text-[11.5px] text-[#6B6863] mt-0.5">
                Select known contract perks or type custom ones (bonuses, health coverage, stipends).
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              {BENEFIT_PRESETS.map((preset) => {
                const isSelected = selectedBenefits.includes(preset.label)
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => toggleBenefit(preset.label)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer select-none",
                      isSelected
                        ? "bg-[#FFF0F0] border-[#FF6B6B] text-[#FF6B6B] font-semibold shadow-2xs"
                        : "bg-[#FAF9F7] border-[#E8E6E0] text-[#6B6863] hover:border-[#D0CFC9] hover:text-[#2D2D2D]"
                    )}
                  >
                    {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-[#6B6863]" />}
                    {preset.label}
                  </button>
                )
              })}
            </div>

            {/* Custom Perk Input */}
            <div className="flex items-center gap-2 mt-1">
              <Input
                value={customPerkInput}
                onChange={(e) => setCustomPerkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addCustomPerk()
                  }
                }}
                placeholder="Type a custom perk (e.g. Uang Kompensasi PKWT, Laptop Buyout)..."
                className="h-9 text-xs flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomPerk}
                className="h-9 text-xs font-semibold px-3 cursor-pointer shrink-0 border-[#E8E6E0] text-[#2D2D2D] hover:bg-[#F8F7F5]"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>

            {/* Active Selected Badges */}
            {selectedBenefits.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1 pt-2 border-t border-[#E8E6E0]/40">
                <span className="text-[11px] font-semibold text-[#6B6863] mr-1">Selected:</span>
                {selectedBenefits.map((perk) => (
                  <span
                    key={perk}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FFF0F0] text-[#FF6B6B] border border-[#FF6B6B]/20"
                  >
                    {perk}
                    <button
                      type="button"
                      onClick={() => removeBenefit(perk)}
                      className="hover:text-red-700 transition-colors cursor-pointer"
                      title="Remove perk"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
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
            <Label className="text-[12.5px] font-semibold text-[#2D2D2D]">Current status</Label>
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
              <Label className="text-[12.5px] font-semibold text-[#2D2D2D]">Date applied</Label>
              <div className="relative flex items-center">
                <Calendar className="absolute left-3 w-4 h-4 text-[#6B6863] pointer-events-none" />
                <Input
                  type="date"
                  className="pl-9 h-10 text-[13.5px]"
                  {...register("appliedAt")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[12.5px] font-semibold text-[#2D2D2D]">How you found it</Label>
              <select
                className="w-full px-3 py-2 border border-[#E8E6E0] rounded-lg text-[13.5px] text-[#2D2D2D] bg-white outline-none focus:border-[#FF6B6B] cursor-pointer appearance-none bg-no-repeat bg-[right_12px_center] bg-[length:16px] pr-8 h-10"
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

          <div className="flex flex-col gap-2">
            <Label className="text-[12.5px] font-semibold text-[#2D2D2D]">How excited are you about this one?</Label>
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
        <div className="px-4.5 py-3.5 border-b border-[#E8E6E0] bg-[#FAF9F7]/50 flex items-center gap-2.5 select-none">
          <div className="w-7 h-7 rounded-lg bg-[#F3E5F5] flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-[#7B1FA2]" />
          </div>
          <span className="font-bold text-[#2D2D2D] text-[13px]">Contacts</span>
          <span className="text-[11px] text-[#6B6863] font-semibold">Optional</span>
        </div>
        <div className="p-5 px-5.5 flex flex-col gap-3">
          {fields.map((contact, index) => (
            <div key={contact.id} className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1.2fr_1.2fr_auto] gap-3 items-start border-b border-[#E8E6E0]/40 pb-3 last:border-b-0 last:pb-0">
              <div className="flex flex-col gap-1">
                <Input
                  placeholder="Name *"
                  className={cn("h-9 text-xs", errors.contacts?.[index]?.name && "border-red-500")}
                  {...register(`contacts.${index}.name` as const)}
                />
                {errors.contacts?.[index]?.name && (
                  <span className="text-[10px] text-red-500 font-semibold">{errors.contacts?.[index]?.name?.message}</span>
                )}
              </div>
              <Input
                placeholder="Role (e.g. Recruiter)"
                className="h-9 text-xs"
                {...register(`contacts.${index}.role` as const)}
              />
              <div className="flex flex-col gap-1">
                <Input
                  type="email"
                  placeholder="Email"
                  className={cn("h-9 text-xs", errors.contacts?.[index]?.email && "border-red-500")}
                  {...register(`contacts.${index}.email` as const)}
                />
                {errors.contacts?.[index]?.email && (
                  <span className="text-[10px] text-red-500 font-semibold">Invalid email</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Input
                  type="url"
                  placeholder="LinkedIn URL"
                  className={cn("h-9 text-xs", errors.contacts?.[index]?.linkedinUrl && "border-red-500")}
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

      {/* ── SECTION: Concerns & Red Flags ── */}
      {availableFlags.length > 0 && (
        <div className="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden shadow-2xs">
          <div className="px-4.5 py-3.5 border-b border-[#E8E6E0] bg-[#FAF9F7]/50 flex items-center gap-2.5 select-none">
            <div className="w-7 h-7 rounded-lg bg-[#FFF0F0] flex items-center justify-center shrink-0">
              <AlertCircle className="w-3.5 h-3.5 text-[#FF6B6B]" />
            </div>
            <span className="font-bold text-[#2D2D2D] text-[13px]">Concerns & Red Flags</span>
          </div>
          <div className="p-5 px-5.5 flex flex-col gap-2.5">
            <p className="text-xs text-[#6B6863] leading-normal mb-1">
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
          </div>
        </div>
      )}

      {/* ── SECTION: Notes ── */}
      <div className="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden shadow-2xs">
        <div className="px-4.5 py-3.5 border-b border-[#E8E6E0] bg-[#FAF9F7]/50 flex items-center gap-2.5 select-none">
          <div className="w-7 h-7 rounded-lg bg-[#FBEAF0] flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5 text-[#D4537E]" />
          </div>
          <span className="font-bold text-[#2D2D2D] text-[13px]">Notes</span>
        </div>
        <div className="p-5 px-5.5 flex flex-col gap-1.5">
          <Label htmlFor="notes" className="text-[12.5px] font-semibold text-[#2D2D2D]">
            Notes <span className="text-xs font-normal text-[#6B6863] ml-1">(optional)</span>
          </Label>
          <Textarea
            id="notes"
            placeholder="Anything you want to remember about this one — referral details, prep, gut feeling..."
            className="text-[13.5px] min-h-[100px] leading-relaxed"
            {...register("notes")}
          />
        </div>
      </div>

      {/* ── SECTION: Danger Zone (Edit Mode Only) ── */}
      {mode === "edit" && (
        <div className="border border-[#F5D0C5] bg-[#FFFBFA] rounded-xl p-4.5 flex flex-col gap-3">
          <div className="font-bold text-[#D84315] text-[13px]">Danger zone</div>
          <div className="text-[12px] text-[#6B6863] leading-relaxed">
            Deleting this application removes all its notes, contacts, and timeline history. This can&apos;t be undone.
          </div>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowDeleteModal(true)}
            className="self-start text-xs font-semibold flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete this application
          </Button>

          {/* Delete confirmation inline modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-[#E8E6E0] shadow-xl flex flex-col gap-4">
                <h3 className="font-bold text-base text-[#2D2D2D]">Delete application?</h3>
                <p className="text-xs text-[#6B6863] leading-relaxed">
                  Are you sure you want to delete this application? All notes, contacts, and activity timeline events will be permanently removed.
                </p>
                <div className="flex gap-2.5 justify-end mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteApplication}
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Yes, delete"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Form Footer ── */}
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
            href={mode === "create" ? "/dashboard" : `/applications/${applicationId}`}
            className="px-3.5 py-1.5 border border-[#E8E6E0] hover:bg-[#F8F7F5] rounded-lg text-[13px] font-semibold text-[#6B6863] hover:text-[#2D2D2D] transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting || (mode === "edit" && !isDirty)}
            className="bg-[#FF6B6B] hover:bg-[#e85555] text-white text-[13px] font-semibold h-9 px-4"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <svg fill="none" viewBox="0 0 14 14" className="w-3.5 h-3.5">
                <path d="M2 7.5L5.5 11L12 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {mode === "create" ? "Save application" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  )
}

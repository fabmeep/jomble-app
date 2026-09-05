"use client"

import Link from "next/link"
import PageHeader from "../../../../_components/page-header"
import { ArrowLeft, ChevronRight } from "lucide-react"
import { timeAgo } from "@/lib/utils"
import { JobApplicationForm } from "../../../_components/job-application-form"

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
  contractType?: string
  isOutsource?: boolean
  agencyName?: string | null
  benefits?: string[]
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
  redFlags?: any[]
  jobDescription?: string | null
}

interface EditApplicationClientProps {
  initialApplication: Application
}

export default function EditApplicationClient({ initialApplication }: EditApplicationClientProps) {
  // Normalize initialApplication data for form
  const formattedRedFlags = Array.isArray(initialApplication.redFlags)
    ? initialApplication.redFlags.map((rf) => (typeof rf === "string" ? rf : rf.flagId || rf.id))
    : []

  const initialValues = {
    companyName: initialApplication.companyName,
    jobTitle: initialApplication.jobTitle,
    jobUrl: initialApplication.jobUrl || "",
    location: initialApplication.location || "",
    workMode: initialApplication.workMode as any,
    contractType: initialApplication.contractType as any,
    isOutsource: initialApplication.isOutsource ?? false,
    agencyName: initialApplication.agencyName || "",
    benefits: initialApplication.benefits || [],
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
    redFlags: formattedRedFlags,
    jobDescription: initialApplication.jobDescription || "",
    updatedAt: initialApplication.updatedAt,
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F7F5]">
      <PageHeader>
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

          <JobApplicationForm
            mode="edit"
            applicationId={initialApplication.id}
            initialValues={initialValues}
          />
        </div>
      </div>
    </div>
  )
}

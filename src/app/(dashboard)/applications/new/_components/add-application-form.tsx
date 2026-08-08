"use client"

import Link from "next/link"
import PageHeader from "../../../_components/page-header"
import { ChevronRight, ArrowLeft } from "lucide-react"
import { JobApplicationForm } from "../../_components/job-application-form"

export default function AddApplicationForm() {
  return (
    <div className="flex-1 overflow-y-auto flex flex-col bg-[#F8F7F5]">
      <PageHeader>
        <Link href="/applications" className="hover:text-[#FF6B6B] transition-colors flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          Applications
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#6B6863]/60" />
        <span className="font-semibold text-[#2D2D2D]">Add application</span>
      </PageHeader>
      
      <div className="p-6 md:p-8 flex justify-center">
        <div className="w-full max-w-[760px] flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-bold tracking-tight text-[#2D2D2D] md:text-2xl">Add a new match</h2>
            <p className="text-xs md:text-sm text-[#6B6863]">Fill in the details below — you can always edit this later.</p>
          </div>
          <JobApplicationForm mode="create" />
        </div>
      </div>
    </div>
  )
}

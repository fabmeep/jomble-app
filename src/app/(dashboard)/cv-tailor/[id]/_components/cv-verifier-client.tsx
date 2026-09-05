"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Printer,
  ArrowLeft,
  Eye,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  FileCheck,
  Check,
  RotateCcw,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { TailoredCv, GroundingBulletResult, CvMaster, GroundingStatus } from "@/types/cv"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface CvVerifierClientProps {
  initialTailoredCv: TailoredCv
  masterCv: CvMaster
}

export default function CvVerifierClient({
  initialTailoredCv,
  masterCv,
}: CvVerifierClientProps) {
  const router = useRouter()
  const [tailoredCv, setTailoredCv] = useState<TailoredCv>(initialTailoredCv)
  const [groundingReport, setGroundingReport] = useState<GroundingBulletResult[]>(
    initialTailoredCv.groundingReport
  )

  // Filter bullets by status
  const passedBullets = groundingReport.filter((g) => g.status === "pass")
  const flaggedBullets = groundingReport.filter((g) => g.status === "flagged")
  const rejectedBullets = groundingReport.filter((g) => g.status === "rejected")

  const unresolvedFlagged = flaggedBullets.filter((g) => !g.user_resolution)
  const isAllResolved = unresolvedFlagged.length === 0
  const isVerified = tailoredCv.status === "VERIFIED" || tailoredCv.status === "EXPORTED" || isAllResolved

  const handleResolveBullet = (id: string, resolution: "approved" | "kept_original" | "discarded") => {
    setGroundingReport((prev) =>
      prev.map((g) => (g.id === id ? { ...g, user_resolution: resolution } : g))
    )
    toast.success(`Bullet resolution saved: ${resolution.replace("_", " ")}`)
  }

  const handleVerifyAll = () => {
    setTailoredCv((prev) => ({ ...prev, status: "VERIFIED" }))
    toast.success("All flagged bullets verified! Resume is ready for PDF export.")
  }

  const handlePrintPdf = () => {
    window.print()
  }

  return (
    <div className="flex-1 overflow-y-auto w-full p-6 scroll-smooth bg-[#F8F7F5]">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => router.push("/cv-tailor")}
              className="text-[#6B6863] hover:text-[#2D2D2D] text-xs font-semibold p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-[#2D2D2D]">
                  {tailoredCv.jobTitle}
                </h2>
                <Badge
                  className={
                    isVerified
                      ? "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]"
                      : "bg-[#FFF8F0] text-[#8A4B00] border-[#FFE0B2]"
                  }
                >
                  {isVerified ? "VERIFIED" : "DRAFT (Pending Grounding)"}
                </Badge>
              </div>
              <p className="text-xs text-[#6B6863]">
                Target Company: <span className="font-semibold text-[#2D2D2D]">{tailoredCv.companyName}</span> • Generated from Master CV
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {!isVerified && (
              <Button
                onClick={handleVerifyAll}
                disabled={!isAllResolved}
                className="bg-[#166534] hover:bg-[#14532d] disabled:bg-[#E8E6E0] disabled:text-[#6B6863] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                Confirm & Mark Verified
              </Button>
            )}

            <Button
              onClick={handlePrintPdf}
              disabled={!isVerified}
              className="bg-[#FF6B6B] hover:bg-[#e85555] disabled:bg-[#E8E6E0] disabled:text-[#6B6863] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print / Export PDF
            </Button>
          </div>
        </div>

        {/* Grounding Progress Bar */}
        <Card className="border-[#E8E6E0] shadow-xs bg-white p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FFF0F0] text-[#FF6B6B] flex items-center justify-center font-bold">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#2D2D2D]">Grounding Verification Status</h4>
                <p className="text-xs text-[#6B6863]">
                  {unresolvedFlagged.length === 0
                    ? "All AI-generated bullet rewords pass grounding check."
                    : `${unresolvedFlagged.length} flagged bullet(s) require explicit user approval.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-64">
              <Progress
                value={
                  flaggedBullets.length > 0
                    ? ((flaggedBullets.length - unresolvedFlagged.length) / flaggedBullets.length) * 100
                    : 100
                }
                className="h-2 bg-[#E8E6E0]"
              />
              <span className="text-xs font-mono font-bold text-[#2D2D2D]">
                {flaggedBullets.length - unresolvedFlagged.length}/{flaggedBullets.length}
              </span>
            </div>
          </div>
        </Card>

        {/* TWO-COLUMN GRID: LEFT = GROUNDING MANAGER, RIGHT = HTML CV PREVIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN (5 cols): GROUNDING VERIFICATION MANAGER */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            
            <Card className="border-[#E8E6E0] shadow-xs bg-white">
              <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
                <CardTitle className="text-sm text-[#2D2D2D] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#FF6B6B]" />
                  Grounding Audit Ledger
                </CardTitle>
                <CardDescription className="text-xs text-[#6B6863]">
                  Every generated bullet is cross-referenced with your Master CV bullet ID to prevent untraceable hallucinated claims.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 flex flex-col gap-4">
                
                {/* FLAGGED BULLETS SECTION */}
                {flaggedBullets.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#8A4B00] uppercase tracking-wide flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#FF8C42]" />
                        Flagged Bullets ({flaggedBullets.length})
                      </h4>
                      <Badge className="bg-[#FFF8F0] text-[#8A4B00] border-[#FFE0B2] text-[10px]">
                        0.55 – 0.72 Similarity
                      </Badge>
                    </div>

                    {flaggedBullets.map((bullet) => (
                      <div
                        key={bullet.id}
                        className={`p-3.5 rounded-xl border flex flex-col gap-3 transition-all ${
                          bullet.user_resolution === "approved"
                            ? "bg-[#F0FDF4] border-[#BBF7D0]"
                            : bullet.user_resolution === "kept_original"
                            ? "bg-[#F8F7F5] border-[#E8E6E0]"
                            : bullet.user_resolution === "discarded"
                            ? "bg-[#FEF2F2] border-[#FCA5A5] opacity-60"
                            : "bg-[#FFF8F0] border-[#FFE0B2]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-[#FF6B6B] bg-[#FFF0F0] px-1.5 py-0.5 rounded">
                            Source ID: {bullet.source_bullet_id}
                          </span>
                          <span className="text-[10px] font-mono text-[#6B6863]">
                            Similarity: {Math.round(bullet.similarity_score * 100)}%
                          </span>
                        </div>

                        <div className="flex flex-col gap-2 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-[#6B6863] uppercase">Original Master Bullet:</span>
                            <p className="text-[#6B6863] italic mt-0.5">{bullet.original_text}</p>
                          </div>

                          <Separator className="bg-[#E8E6E0]" />

                          <div>
                            <span className="text-[10px] font-bold text-[#2D2D2D] uppercase">Proposed Rewritten Bullet:</span>
                            <p className="text-[#2D2D2D] font-medium mt-0.5">{bullet.rewritten_text}</p>
                          </div>
                        </div>

                        {/* Resolution Buttons */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <Button
                            size="sm"
                            onClick={() => handleResolveBullet(bullet.id, "approved")}
                            className={`text-[11px] font-semibold py-1 px-2.5 h-7 cursor-pointer ${
                              bullet.user_resolution === "approved"
                                ? "bg-[#166534] text-white"
                                : "bg-white text-[#166534] border border-[#BBF7D0] hover:bg-[#F0FDF4]"
                            }`}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Approve
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveBullet(bullet.id, "kept_original")}
                            className={`text-[11px] font-semibold py-1 px-2.5 h-7 cursor-pointer border-[#E8E6E0] ${
                              bullet.user_resolution === "kept_original" ? "bg-[#2D2D2D] text-white" : "bg-white text-[#2D2D2D]"
                            }`}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Keep Original
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResolveBullet(bullet.id, "discarded")}
                            className="text-[11px] font-semibold text-[#991B1B] hover:bg-[#FEF2F2] py-1 px-2 h-7 ml-auto cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* PASSED BULLETS */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-[#166534] uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#166534]" />
                    Passed Bullets ({passedBullets.length})
                  </h4>

                  {passedBullets.map((bullet) => (
                    <div key={bullet.id} className="p-3 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] text-xs flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-mono font-bold text-[#166534]">ID: {bullet.source_bullet_id}</span>
                        <span className="font-mono text-[#166534] font-semibold">{Math.round(bullet.similarity_score * 100)}% Pass</span>
                      </div>
                      <p className="text-[#166534] font-medium">{bullet.rewritten_text}</p>
                    </div>
                  ))}
                </div>

              </CardContent>
            </Card>

          </div>

          {/* RIGHT COLUMN (7 cols): CLEAN HTML/CSS PRINT PREVIEW */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-[#2D2D2D] uppercase tracking-wide flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#FF6B6B]" />
                Live Format Resume Preview
              </span>
              <span className="text-[11px] text-[#6B6863]">A4 Document View</span>
            </div>

            {/* PRINTABLE RESUME CANVAS */}
            <div className="bg-white border border-[#E8E6E0] rounded-xl shadow-md p-8 min-h-[750px] flex flex-col gap-6 text-[#2D2D2D] font-sans print:shadow-none print:border-none print:p-0">
              
              {/* Header Contact */}
              <div className="flex flex-col items-center text-center gap-1 border-b border-[#E8E6E0] pb-5">
                <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">{tailoredCv.generatedContent.contact.name}</h1>
                <div className="flex flex-wrap justify-center items-center gap-3 text-xs text-[#6B6863]">
                  <span>{tailoredCv.generatedContent.contact.email}</span>
                  <span>•</span>
                  <span>{tailoredCv.generatedContent.contact.phone}</span>
                  <span>•</span>
                  <span>{tailoredCv.generatedContent.contact.location}</span>
                </div>
                <div className="flex justify-center gap-3 text-xs text-[#FF6B6B] font-medium mt-0.5">
                  <span>{tailoredCv.generatedContent.contact.linkedin}</span>
                  <span>•</span>
                  <span>{tailoredCv.generatedContent.contact.github}</span>
                </div>
              </div>

              {/* Professional Summary */}
              <div className="flex flex-col gap-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF6B6B] border-b border-[#FF6B6B]/20 pb-1">
                  Professional Summary
                </h3>
                <p className="text-xs leading-relaxed text-[#4A4A4A]">
                  {tailoredCv.generatedContent.summary}
                </p>
              </div>

              {/* Work Experience */}
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF6B6B] border-b border-[#FF6B6B]/20 pb-1">
                  Professional Experience
                </h3>

                {tailoredCv.generatedContent.experience.map((exp) => (
                  <div key={exp.id} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-xs text-[#1A1A1A]">{exp.title}</span>
                      <span className="text-[11px] font-mono text-[#6B6863]">{exp.dates}</span>
                    </div>
                    <div className="flex justify-between text-xs text-[#6B6863] italic">
                      <span>{exp.company}</span>
                      <span>{exp.location}</span>
                    </div>

                    <ul className="list-disc list-inside flex flex-col gap-1 text-xs text-[#333333] pl-1">
                      {exp.bullets.map((b) => {
                        const grounding = groundingReport.find((g) => g.source_bullet_id === b.id)
                        const displayText =
                          grounding?.user_resolution === "kept_original"
                            ? grounding.original_text
                            : grounding?.user_resolution === "discarded"
                            ? null
                            : b.text

                        if (!displayText) return null

                        return (
                          <li key={b.id} className="leading-normal">
                            <span className="ml-1">{displayText}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Skills */}
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF6B6B] border-b border-[#FF6B6B]/20 pb-1">
                  Technical Skills & Technologies
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {tailoredCv.generatedContent.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="bg-[#F8F7F5] border border-[#E8E6E0] text-[#2D2D2D] text-[11px] px-2 py-0.5 rounded font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF6B6B] border-b border-[#FF6B6B]/20 pb-1">
                  Education
                </h3>
                {tailoredCv.generatedContent.education.map((edu) => (
                  <div key={edu.id} className="flex justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#1A1A1A]">{edu.degree}</span>
                      <span className="text-[#6B6863]"> — {edu.institution}</span>
                    </div>
                    <span className="font-mono text-[#6B6863] text-[11px]">{edu.dates}</span>
                  </div>
                ))}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  )
}

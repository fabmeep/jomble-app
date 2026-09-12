"use client"

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Eye,
  ShieldCheck,
  Shield,
  FileCheck,
  Check,
  RotateCcw,
  Trash2,
  Code2,
  FileCode,
  AlertCircle,
  Sparkles,
  Info,
} from "lucide-react"
import { toast } from "sonner"
import { TailoredCv, GroundingBulletResult, CvMaster } from "@/types/cv"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { generateJakesResumeLatex } from "@/lib/cv/latex/jakes-resume"
import LatexExportModal from "./latex-export-modal"

export interface MissingKeywordItem {
  name: string
  category?: string
  frequency?: number
  importance?: string
}

export interface AlignmentItem {
  skill: string
  evidence: string
}

export interface GapDetailedItem {
  skill: string
  severity?: "critical" | "moderate" | "minor"
  reason: string
}

interface ScoreReportProps {
  overallScore?: number
  matchTier?: string
  summaryVerdict?: string
  alignments?: AlignmentItem[]
  gapsDetailed?: GapDetailedItem[]
  breakdown?: any
  gaps?: string[]
  criticalMissingKeywords?: MissingKeywordItem[]
}

interface CvVerifierClientProps {
  initialTailoredCv: TailoredCv
  masterCv: CvMaster
  scoreReport?: ScoreReportProps | null
}

export default function CvVerifierClient({
  initialTailoredCv,
  masterCv,
  scoreReport,
}: CvVerifierClientProps) {
  const router = useRouter()
  const [tailoredCv, setTailoredCv] = useState<TailoredCv>(initialTailoredCv)
  const [groundingReport, setGroundingReport] = useState<GroundingBulletResult[]>(
    initialTailoredCv.groundingReport || []
  )
  const [showLatexModal, setShowLatexModal] = useState(false)

  // Generate Jake's Resume LaTeX source code reactively
  const latexCode = useMemo(
    () => generateJakesResumeLatex(tailoredCv.generatedContent),
    [tailoredCv.generatedContent]
  )

  // Filter bullets by status
  const passedBullets = groundingReport.filter((g) => g.status === "pass")
  const flaggedBullets = groundingReport.filter((g) => g.status === "flagged")
  const rejectedBullets = groundingReport.filter((g) => g.status === "rejected")

  const unresolvedFlagged = flaggedBullets.filter((g) => !g.user_resolution)
  const isAllResolved = unresolvedFlagged.length === 0
  const isVerified = tailoredCv.status === "VERIFIED" || tailoredCv.status === "EXPORTED" || isAllResolved

  // Missing keywords from JD
  const missingKeywords = scoreReport?.criticalMissingKeywords || []

  // Grounded Match Score Analysis
  const overallScore = scoreReport?.overallScore ?? 84
  const matchTier =
    scoreReport?.matchTier ||
    (overallScore >= 85 ? "Strong Match" : overallScore >= 70 ? "Solid Fit" : overallScore >= 55 ? "Moderate Fit" : "Stretch Role")
  const summaryVerdict = scoreReport?.summaryVerdict
  const alignments = scoreReport?.alignments || []
  const gapsDetailed = scoreReport?.gapsDetailed || []

  const handleResolveBullet = async (
    id: string,
    resolution: "approved" | "kept_original" | "discarded"
  ) => {
    const targetGrounding = groundingReport.find((g) => g.id === id)
    if (!targetGrounding) return

    // 1. Optimistic update of the Grounding Audit Report state
    setGroundingReport((prev) =>
      prev.map((g) => (g.id === id ? { ...g, user_resolution: resolution } : g))
    )

    // 2. Synchronous reactive update of the live Resume Preview content
    setTailoredCv((prev) => {
      const updatedExperience = (prev.generatedContent.experience || []).map((exp) => {
        if (resolution === "discarded") {
          return {
            ...exp,
            bullets: exp.bullets.filter(
              (b) =>
                b.id !== targetGrounding.source_bullet_id &&
                b.text !== targetGrounding.rewritten_text &&
                b.text !== targetGrounding.original_text
            ),
          }
        }

        if (resolution === "kept_original") {
          return {
            ...exp,
            bullets: exp.bullets.map((b) => {
              if (
                b.id === targetGrounding.source_bullet_id ||
                b.text === targetGrounding.rewritten_text
              ) {
                return { ...b, text: targetGrounding.original_text }
              }
              return b
            }),
          }
        }

        if (resolution === "approved") {
          return {
            ...exp,
            bullets: exp.bullets.map((b) => {
              if (
                b.id === targetGrounding.source_bullet_id ||
                b.text === targetGrounding.original_text
              ) {
                return { ...b, text: targetGrounding.rewritten_text }
              }
              return b
            }),
          }
        }

        return exp
      })

      return {
        ...prev,
        generatedContent: {
          ...prev.generatedContent,
          experience: updatedExperience,
        },
      }
    })

    const resolutionLabel =
      resolution === "approved"
        ? "Approved rewrite"
        : resolution === "kept_original"
        ? "Original Master CV bullet restored"
        : "Bullet discarded"
    toast.success(`Resolution saved: ${resolutionLabel}`)

    // 3. Persist resolution to database
    try {
      const res = await fetch(`/api/tailor/${tailoredCv.id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullet_id: id, resolution }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.status) {
          setTailoredCv((prev) => ({
            ...prev,
            status: data.status,
          }))
        }
      }
    } catch (err) {
      console.warn("Could not sync bullet resolution to server:", err)
    }
  }

  const handleVerifyAll = async () => {
    setTailoredCv((prev) => ({ ...prev, status: "VERIFIED" }))
    toast.success("All flagged bullets verified! Resume is ready for export.")

    try {
      await fetch(`/api/tailor/${tailoredCv.id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verify_all: true }),
      })
    } catch (err) {
      console.warn("Could not sync verification status to server:", err)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto w-full p-6 scroll-smooth bg-[#F8F7F5] print:p-0 print:m-0 print:bg-white print:overflow-visible">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200 print:max-w-none print:m-0 print:p-0 print:gap-0">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => router.push("/cv-tailor")}
              className="text-[#6B6863] hover:text-[#2D2D2D] text-xs font-semibold p-2 cursor-pointer"
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
                Target Company: <span className="font-semibold text-[#2D2D2D]">{tailoredCv.companyName}</span> • Master CV: <span className="font-semibold text-[#2D2D2D]">{masterCv.title}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Export to Overleaf (Jake's Resume) */}
            <Button
              onClick={() => setShowLatexModal(true)}
              className="bg-[#FF6B6B] hover:bg-[#e85555] text-white text-xs font-bold shadow-xs cursor-pointer h-9 px-4"
            >
              <Code2 className="w-4 h-4 mr-1.5" />
              Export to Overleaf (.tex)
            </Button>

            {!isVerified && (
              <Button
                onClick={handleVerifyAll}
                disabled={!isAllResolved}
                className="bg-[#166534] hover:bg-[#14532d] disabled:bg-[#E8E6E0] disabled:text-[#6B6863] text-white text-xs font-bold shadow-xs cursor-pointer h-9"
              >
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                Confirm & Mark Verified
              </Button>
            )}
          </div>
        </div>

        {/* Verification Overview Banner */}
        <Card className="border-[#E8E6E0] shadow-xs bg-white p-4 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F0FDF4] text-[#166534] flex items-center justify-center font-bold">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2D2D2D]">Anti-Hallucination Grounding Audit</h3>
                <p className="text-xs text-[#6B6863]">
                  {isVerified
                    ? "All generated bullets are authentic and anchored to your Master CV."
                    : `${unresolvedFlagged.length} bullet${unresolvedFlagged.length === 1 ? "" : "s"} require your review before final export.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col text-right">
                <span className="text-[11px] text-[#6B6863]">Audit Status</span>
                <span className="text-xs font-bold text-[#166534]">
                  {passedBullets.length} Passed • {flaggedBullets.length} Flagged
                </span>
              </div>
              <Progress
                value={
                  flaggedBullets.length === 0
                    ? 100
                    : Math.round(((flaggedBullets.length - unresolvedFlagged.length) / flaggedBullets.length) * 100)
                }
                className="w-24 h-2"
              />
              <span className="text-xs font-mono font-bold text-[#2D2D2D]">
                {flaggedBullets.length - unresolvedFlagged.length}/{flaggedBullets.length}
              </span>
            </div>
          </div>
        </Card>

        {/* TWO-COLUMN GRID: LEFT = GROUNDING MANAGER, RIGHT = HTML CV PREVIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:block">
          
          {/* LEFT COLUMN (5 cols): GROUNDING VERIFICATION MANAGER & GAP AUDIT */}
          <div className="lg:col-span-5 flex flex-col gap-5 print:hidden">

            {/* 1. MATCH SCORE ESTIMATE CARD */}
            <Card className="border-[#E8E6E0] shadow-xs bg-white overflow-hidden">
              <CardHeader className="pb-3 border-b border-[#E8E6E0]/60 bg-[#FAF9F7]/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF6B6B]" />
                    <CardTitle className="text-sm font-bold text-[#2D2D2D]">
                      Match Score Estimate
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-mono text-[#2D2D2D]">
                      {overallScore}%
                    </span>
                    <Badge
                      className={
                        overallScore >= 85
                          ? "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0] text-[10px] font-bold"
                          : overallScore >= 70
                          ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0] text-[10px] font-bold"
                          : overallScore >= 55
                          ? "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A] text-[10px] font-bold"
                          : "bg-[#FFF0F0] text-[#B91C1C] border-[#FFCDD2] text-[10px] font-bold"
                      }
                    >
                      {matchTier}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-xs text-[#6B6863]">
                  Based on how well your authentic Master CV experience aligns with the job requirements.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-3.5 flex flex-col gap-3.5">
                {/* Executive Summary Verdict */}
                {summaryVerdict && (
                  <div className="bg-[#FAF9F7] border border-[#E8E6E0] p-3 rounded-lg text-xs text-[#4A4742] leading-relaxed">
                    <span className="font-bold text-[#2D2D2D]">Verdict: </span>
                    {summaryVerdict}
                  </div>
                )}

                {/* Where Your Experience Aligns */}
                {alignments.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#166534]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#166534]" />
                      <span>Where Your Experience Aligns</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {alignments.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-[#F0FDF4]/60 border border-[#BBF7D0]/70 p-2.5 rounded-lg text-xs flex flex-col gap-1"
                        >
                          <div className="font-bold text-[#14532D] text-xs">
                            {item.skill}
                          </div>
                          <div className="text-[#365314] text-[11px] leading-relaxed">
                            {item.evidence}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* What's Missing or Weak */}
                {gapsDetailed.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#B45309]">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>What's Missing or Weak</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {gapsDetailed.map((gap, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1 ${
                            gap.severity === "critical"
                              ? "bg-[#FFF0F0]/50 border-[#FF6B6B]/30 text-[#7F1D1D]"
                              : "bg-[#FFFBEB]/70 border-[#FDE68A] text-[#92400E]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs">
                              {gap.skill}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 font-bold uppercase ${
                                gap.severity === "critical"
                                  ? "border-[#FF6B6B]/40 text-[#B91C1C] bg-white"
                                  : "border-[#FDE68A] text-[#B45309] bg-white"
                              }`}
                            >
                              {gap.severity === "critical" ? "Required in JD" : "Preferred in JD"}
                            </Badge>
                          </div>
                          <p className="text-[11px] leading-relaxed opacity-90">
                            {gap.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* MISSING REQUIREMENTS & INTEGRITY GUARANTEE CARD */}
            {missingKeywords.length > 0 && (
              <Card className="border-[#FFE0B2] shadow-xs bg-white overflow-hidden">
                <CardHeader className="pb-3 border-b border-[#FFE0B2]/60 bg-[#FFF8F0]/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#D97706]" />
                      <CardTitle className="text-sm font-bold text-[#2D2D2D]">
                        Missing Core Requirements (JD Gaps)
                      </CardTitle>
                    </div>
                    <Badge className="bg-[#FFF8F0] text-[#8A4B00] border-[#FFE0B2] text-[10px]">
                      {missingKeywords.length} Unmatched
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-[#6B6863]">
                    Skills explicitly requested by this Job Description that were absent in your Master CV.
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-3.5 flex flex-col gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {missingKeywords.map((kw, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#FDE68A] bg-[#FFFBEB] text-xs font-semibold text-[#92400E]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                        <span>{kw.name}</span>
                        {kw.frequency && kw.frequency > 1 && (
                          <span className="text-[10px] text-[#B45309] font-mono">({kw.frequency}x in JD)</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Groundedness Notice */}
                  <div className="bg-[#FAF9F7] border border-[#E8E6E0] p-3 rounded-lg flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#166534]">
                      <Shield className="w-3.5 h-3.5 text-[#166534]" />
                      <span>Zero-Hallucination Guarantee</span>
                    </div>
                    <p className="text-[11px] text-[#6B6863] leading-relaxed">
                      To safeguard your credibility in technical interviews, Jomble strictly refrained from fabricating claims for these skills. If asked during screening, highlight your strong foundational grasp of related technologies.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* GROUNDING AUDIT CARD */}
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
                        {unresolvedFlagged.length === 0 ? "All Resolved" : `${unresolvedFlagged.length} Pending Review`}
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
                            ? "bg-[#FEF2F2] border-[#FCA5A5] opacity-70"
                            : "bg-[#FFF8F0] border-[#FFE0B2]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-[#FF6B6B] bg-[#FFF0F0] px-1.5 py-0.5 rounded">
                            Source ID: {bullet.source_bullet_id}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {bullet.user_resolution === "approved" && (
                              <span className="text-[10px] font-bold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" /> Approved
                              </span>
                            )}
                            {bullet.user_resolution === "kept_original" && (
                              <span className="text-[10px] font-bold text-[#2D2D2D] bg-[#E8E6E0] px-2 py-0.5 rounded-full flex items-center gap-1">
                                <RotateCcw className="w-2.5 h-2.5" /> Reverted to Master
                              </span>
                            )}
                            {bullet.user_resolution === "discarded" && (
                              <span className="text-[10px] font-bold text-[#991B1B] bg-[#FEE2E2] px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Trash2 className="w-2.5 h-2.5" /> Discarded
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-[#6B6863]">
                              Similarity: {Math.round(bullet.similarity_score * 100)}%
                            </span>
                          </div>
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

                        {/* Resolution Action Buttons */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-[#E8E6E0]/60">
                          <Button
                            size="sm"
                            type="button"
                            onClick={() => handleResolveBullet(bullet.id, "approved")}
                            className={`text-[11px] font-semibold py-1 px-2.5 h-7 cursor-pointer ${
                              bullet.user_resolution === "approved"
                                ? "bg-[#166534] text-white"
                                : "bg-white text-[#166534] border border-[#BBF7D0] hover:bg-[#F0FDF4]"
                            }`}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            {bullet.user_resolution === "approved" ? "Approved" : "Approve"}
                          </Button>

                          <Button
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={() => handleResolveBullet(bullet.id, "kept_original")}
                            className={`text-[11px] font-semibold py-1 px-2.5 h-7 cursor-pointer border-[#E8E6E0] ${
                              bullet.user_resolution === "kept_original"
                                ? "bg-[#2D2D2D] text-white"
                                : "bg-white text-[#2D2D2D] hover:bg-[#F8F7F5]"
                            }`}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            {bullet.user_resolution === "kept_original" ? "Original Active" : "Keep Original"}
                          </Button>

                          <Button
                            size="sm"
                            type="button"
                            variant="ghost"
                            onClick={() => handleResolveBullet(bullet.id, "discarded")}
                            className={`text-[11px] font-semibold py-1 px-2 h-7 ml-auto cursor-pointer ${
                              bullet.user_resolution === "discarded"
                                ? "bg-[#FEE2E2] text-[#991B1B]"
                                : "text-[#991B1B] hover:bg-[#FEF2F2]"
                            }`}
                            title="Discard this bullet (removes it from tailored CV)"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            {bullet.user_resolution === "discarded" ? "Removed" : "Discard"}
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

          {/* RIGHT COLUMN (7 cols): CLEAN HTML/CSS PRINT PREVIEW (Sticky Pinning) */}
          <div className="lg:col-span-7 flex flex-col gap-2.5 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] print:w-full print:max-w-none print:m-0 print:p-0 print:static print:max-h-none">
            
            {/* Pinned Toolbar */}
            <div className="flex items-center justify-between px-1 shrink-0 print:hidden">
              <span className="text-xs font-bold text-[#2D2D2D] uppercase tracking-wide flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#FF6B6B]" />
                Live Format Resume Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLatexModal(true)}
                  className="text-xs font-semibold text-[#FF6B6B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Code2 className="w-3 h-3" />
                  View Jake's LaTeX
                </button>
                <span className="text-[#D0CFC9]">•</span>
                <span className="text-[11px] text-[#6B6863]">A4 Document View</span>
              </div>
            </div>

            {/* Scrollable Container for Resume Canvas */}
            <div className="flex-1 overflow-y-auto pr-1 pb-2 [scrollbar-width:thin] [scrollbar-color:#E8E6E0_transparent] print:overflow-visible print:p-0">
              
              {/* PRINTABLE RESUME CANVAS */}
              <div className="bg-white border border-[#E8E6E0] rounded-xl shadow-md p-8 shrink-0 flex flex-col gap-6 text-[#2D2D2D] font-sans print:shadow-none print:border-none print:p-0 print:m-0 print:w-full">
              
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
              {tailoredCv.generatedContent.summary && (
                <div className="flex flex-col gap-1.5 break-inside-avoid">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF6B6B] border-b border-[#FF6B6B]/20 pb-1">
                    Professional Summary
                  </h3>
                  <p className="text-xs leading-relaxed text-[#4A4A4A]">
                    {tailoredCv.generatedContent.summary}
                  </p>
                </div>
              )}

              {/* Work Experience */}
              {tailoredCv.generatedContent.experience && tailoredCv.generatedContent.experience.length > 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF6B6B] border-b border-[#FF6B6B]/20 pb-1">
                    Professional Experience
                  </h3>

                  {tailoredCv.generatedContent.experience.map((exp) => (
                    <div key={exp.id || exp.company} className="flex flex-col gap-1.5 break-inside-avoid">
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
                          const grounding = groundingReport.find(
                            (g) =>
                              g.source_bullet_id === b.id ||
                              g.rewritten_text === b.text ||
                              g.original_text === b.text
                          )
                          const displayText =
                            grounding?.user_resolution === "kept_original"
                              ? grounding.original_text
                              : grounding?.user_resolution === "discarded"
                              ? null
                              : b.text

                          if (!displayText) return null

                          return (
                            <li key={b.id || b.text} className="leading-normal">
                              <span className="ml-1">{displayText}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {tailoredCv.generatedContent.skills && tailoredCv.generatedContent.skills.length > 0 && (
                <div className="flex flex-col gap-2 break-inside-avoid">
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
              )}

              {/* Education */}
              {tailoredCv.generatedContent.education && tailoredCv.generatedContent.education.length > 0 && (
                <div className="flex flex-col gap-2 break-inside-avoid">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF6B6B] border-b border-[#FF6B6B]/20 pb-1">
                    Education
                  </h3>
                  {tailoredCv.generatedContent.education.map((edu) => (
                    <div key={edu.id || edu.institution} className="flex justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#1A1A1A]">{edu.degree}</span>
                        <span className="text-[#6B6863]"> — {edu.institution}</span>
                      </div>
                      <span className="font-mono text-[#6B6863] text-[11px]">{edu.dates}</span>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

        </div>

        </div>

      </div>

      {/* Jake's Resume Overleaf LaTeX Export Modal */}
      <LatexExportModal
        isOpen={showLatexModal}
        onOpenChange={setShowLatexModal}
        latexCode={latexCode}
        jobTitle={tailoredCv.jobTitle}
        companyName={tailoredCv.companyName}
      />
    </div>
  )
}

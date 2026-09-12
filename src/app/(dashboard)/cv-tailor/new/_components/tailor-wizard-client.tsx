"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  FileText,
  Loader2,
  AlertTriangle,
  Award,
  CheckSquare,
  Tag,
  CheckCircle2,
  Shield,
  Zap,
} from "lucide-react"
import { toast } from "sonner"
import { CvMaster, JobDescription, ScoreReport, JdRequirements, LlmProviderConfig } from "@/types/cv"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import JobDescriptionStep from "./job-description-step"

interface TailorWizardClientProps {
  masterCv: CvMaster
  masterResumes?: CvMaster[]
  sampleJd: JobDescription
  jobAppId?: string | null
  defaultCompanyName?: string | null
  defaultJobTitle?: string | null
  llmConfig?: LlmProviderConfig | null
}

export default function TailorWizardClient({
  masterCv,
  masterResumes = [],
  sampleJd,
  jobAppId,
  defaultCompanyName,
  defaultJobTitle,
  llmConfig,
}: TailorWizardClientProps) {
  const router = useRouter()

  const [selectedMasterCv, setSelectedMasterCv] = useState<CvMaster>(masterCv)
  const [parsedJd, setParsedJd] = useState<JdRequirements | null>(sampleJd.structuredRequirements || null)
  const [activeJdId, setActiveJdId] = useState<string | null>(sampleJd.id || null)
  const [rawJdText, setRawJdText] = useState<string>(sampleJd.rawText || "")
  const [isScoring, setIsScoring] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const [scoreReport, setScoreReport] = useState<ScoreReport | null>(null)

  const calculateScore = async (targetJd: JdRequirements, jdId?: string) => {
    setIsScoring(true)
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cv_master_id: selectedMasterCv.id,
          job_description_id: jdId || activeJdId,
          cv: selectedMasterCv.structuredData,
          jd: targetJd,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to calculate match score.")
      }

      const report: ScoreReport = await res.json()
      setScoreReport(report)
      toast.success("Match score & keyword audit computed!")
    } catch (err: unknown) {
      console.error("[Scoring Error]:", err)
      const msg = err instanceof Error ? err.message : "Failed to compute match score."
      toast.error(msg)
    } finally {
      setIsScoring(false)
    }
  }

  const handleJdParsed = (requirements: JdRequirements, jdId: string, text: string) => {
    setParsedJd(requirements)
    setActiveJdId(jdId)
    setRawJdText(text)
    toast.success("Job description requirements saved to profile!")
    // Automatically calculate deterministic score
    calculateScore(requirements, jdId)
  }

  const handleManualCalculateScore = () => {
    if (!parsedJd) {
      toast.error("Please provide and analyze a job description first.")
      return
    }
    calculateScore(parsedJd, activeJdId || undefined)
  }

  const handleGenerateTailoredCv = async () => {
    if (!activeJdId || !selectedMasterCv.id) {
      toast.error("Please ensure a Master CV and Job Description are selected.")
      return
    }

    setIsGenerating(true)
    const toastId = toast.loading("Generating tailored resume and grounding verification report...")

    try {
      const res = await fetch("/api/tailor/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          master_resume_id: selectedMasterCv.id,
          job_description_id: activeJdId,
          score_report_id: scoreReport?.id || null,
          job_app_id: jobAppId || null,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Failed to generate tailored CV.")
      }

      const data = await res.json()
      toast.dismiss(toastId)
      toast.success("Tailored resume generated in DRAFT state!")
      router.push(`/cv-tailor/${data.id}`)
    } catch (err: unknown) {
      toast.dismiss(toastId)
      const msg = err instanceof Error ? err.message : "Could not generate tailored resume."
      toast.error(msg)
    } finally {
      setIsGenerating(false)
    }
  }



  return (
    <div className="flex-1 overflow-y-auto w-full p-6 scroll-smooth bg-[#F8F7F5]">
      <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">

        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-[#2D2D2D]">Tailor Resume for New Job</h2>
            {llmConfig && llmConfig.isActive ? (
              <Badge className="bg-[#F0FDF4] text-[#166534] border-[#BBF7D0] font-semibold text-[11px] flex items-center gap-1">
                {llmConfig.provider === "GEMINI" ? (
                  <>
                    <Sparkles className="w-3 h-3 text-[#4285F4]" />
                    <span>Gemini ({llmConfig.geminiModel || "gemini-flash-lite"})</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3 text-[#FF8C42]" />
                    <span>Ollama ({llmConfig.ollamaModel || "qwen2.5"})</span>
                  </>
                )}
              </Badge>
            ) : (
              <Badge className="bg-[#FFF0F0] text-[#FF6B6B] border-[#FF6B6B]/20 font-semibold text-[11px]">
                BYOK Match Engine
              </Badge>
            )}
          </div>
          <p className="text-sm text-[#6B6863]">
            Select your Master CV, input the target job description, and generate a tailored resume grounded in your real work history.
          </p>
        </div>

        {/* STEP 1: ACTIVE MASTER CV CARD */}
        <Card className="border-[#E8E6E0] shadow-xs bg-white">
          <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-[#2D2D2D] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FF6B6B]" />
                1. Selected Master CV
              </CardTitle>
              <Badge className="bg-[#F0FDF4] text-[#166534] border-[#BBF7D0] text-[11px]">
                Active Profile
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-[#2D2D2D]">{selectedMasterCv.fileName || selectedMasterCv.title}</h4>
              <p className="text-[11px] text-[#6B6863] mt-0.5">
                {selectedMasterCv.structuredData.contact.name} • {selectedMasterCv.structuredData.experience?.length || 0} Experience Entries • {selectedMasterCv.structuredData.skills?.length || 0} Skills Extracted
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {masterResumes.length > 1 && (
                <select
                  value={selectedMasterCv.id}
                  onChange={(e) => {
                    const found = masterResumes.find((r) => r.id === e.target.value)
                    if (found) setSelectedMasterCv(found)
                  }}
                  className="text-xs bg-[#F8F7F5] border border-[#E8E6E0] rounded-lg px-2.5 py-1.5 text-[#2D2D2D] font-medium"
                >
                  {masterResumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.fileName || r.title} {r.isDefault ? "(Default)" : ""}
                    </option>
                  ))}
                </select>
              )}
              <Button variant="outline" size="sm" onClick={() => router.push("/cv-tailor/upload")} className="border-[#E8E6E0] text-xs">
                Upload New CV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* STEP 2: JOB DESCRIPTION INPUT & LLM EXTRACTION */}
        <JobDescriptionStep
          onParsed={handleJdParsed}
          initialRawText={rawJdText}
          initialUrl={sampleJd.sourceUrl || ""}
          currentRequirements={parsedJd}
          jobAppId={jobAppId}
          defaultCompanyName={defaultCompanyName}
          defaultJobTitle={defaultJobTitle}
        />

        {/* STEP 3: DETERMINISTIC MATCH SCORE REPORT */}
        {!scoreReport && parsedJd && (
          <Card className="border-[#E8E6E0] shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
              <CardTitle className="text-base text-[#2D2D2D] flex items-center gap-2">
                <Award className="w-4.5 h-4.5 text-[#FF6B6B]" />
                3. Deterministic Match Score & Keyword Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center gap-3 py-8">
              <div className="w-12 h-12 rounded-full bg-[#FFF0F0] text-[#FF6B6B] flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div className="max-w-md">
                <h4 className="text-sm font-bold text-[#2D2D2D]">Ready to Calculate Match Score</h4>
                <p className="text-xs text-[#6B6863] mt-1">
                  Evaluate required and preferred skills, semantic experience overlap, and identify critical missing keywords.
                </p>
              </div>
              <Button
                onClick={handleManualCalculateScore}
                disabled={isScoring}
                className="bg-[#FF6B6B] hover:bg-[#e85555] text-white text-xs font-bold mt-2 cursor-pointer shadow-xs"
              >
                {isScoring ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Calculating Match Score...
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4 mr-1.5" />
                    Calculate Match Score & Gaps
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {scoreReport && (
          <Card className="border-[#E8E6E0] shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-[#E8E6E0]/60 bg-[#FAF9F7]/70">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base text-[#2D2D2D] flex items-center gap-2 font-bold">
                    <Award className="w-5 h-5 text-[#FF6B6B]" />
                    3. Match Score Estimate
                  </CardTitle>
                  <p className="text-xs text-[#6B6863] mt-0.5">
                    Grounded fit analysis comparing your authentic Master CV against this job description.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6B6863]">Computed Fit:</span>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                    scoreReport.overallScore >= 85
                      ? "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]"
                      : scoreReport.overallScore >= 70
                      ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]"
                      : scoreReport.overallScore >= 55
                      ? "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]"
                      : "bg-[#FFF0F0] text-[#B91C1C] border-[#FFCDD2]"
                  }`}>
                    {scoreReport.overallScore}% · {scoreReport.matchTier || (scoreReport.overallScore >= 85 ? "Strong Match" : scoreReport.overallScore >= 70 ? "Solid Fit" : scoreReport.overallScore >= 55 ? "Moderate Fit" : "Stretch Role")}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 flex flex-col gap-6">

              {/* Executive Summary Verdict */}
              {scoreReport.summaryVerdict && (
                <div className="bg-[#FAF9F7] border border-[#E8E6E0] p-3.5 rounded-xl text-xs text-[#4A4742] leading-relaxed">
                  <span className="font-bold text-[#2D2D2D]">Executive Verdict: </span>
                  {scoreReport.summaryVerdict}
                </div>
              )}

              {/* TWO COLUMNS: WHERE YOU ALIGN vs WHAT'S MISSING OR WEAK */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* WHERE YOUR EXPERIENCE ALIGNS */}
                <div className="border border-[#BBF7D0] rounded-xl p-4 bg-[#F0FDF4]/30 flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-[#BBF7D0]/60 pb-2.5 text-xs font-bold text-[#166534] uppercase tracking-wide">
                    <CheckCircle2 className="w-4 h-4 text-[#166534]" />
                    <span>Where Your Experience Aligns</span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {(scoreReport.alignments && scoreReport.alignments.length > 0) ? (
                      scoreReport.alignments.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white border border-[#BBF7D0]/70 p-3 rounded-lg text-xs flex flex-col gap-1 shadow-2xs"
                        >
                          <span className="font-bold text-[#14532D] text-xs">
                            {item.skill}
                          </span>
                          <span className="text-[#365314] text-[11px] leading-relaxed">
                            {item.evidence}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white border border-[#BBF7D0]/70 p-3 rounded-lg text-xs text-[#365314]">
                        Core technical background from your Master CV aligns with key job responsibilities.
                      </div>
                    )}
                  </div>
                </div>

                {/* WHAT'S MISSING OR WEAK */}
                <div className="border border-[#FFE0B2] rounded-xl p-4 bg-[#FFF8F0]/30 flex flex-col gap-3">
                  <div className="flex items-center gap-2 border-b border-[#FFE0B2]/60 pb-2.5 text-xs font-bold text-[#8A4B00] uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4 text-[#FF8C42]" />
                    <span>What's Missing or Weak</span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {(scoreReport.gapsDetailed && scoreReport.gapsDetailed.length > 0) ? (
                      scoreReport.gapsDetailed.map((gap, idx) => (
                        <div
                          key={idx}
                          className={`bg-white border p-3 rounded-lg text-xs flex flex-col gap-1 shadow-2xs ${
                            gap.severity === "critical"
                              ? "border-[#FF6B6B]/30"
                              : "border-[#FDE68A]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[#2D2D2D] text-xs">
                              {gap.skill}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 font-bold uppercase ${
                                gap.severity === "critical"
                                  ? "border-[#FF6B6B]/40 text-[#B91C1C] bg-[#FFF0F0]"
                                  : "border-[#FDE68A] text-[#B45309] bg-[#FFFBEB]"
                              }`}
                            >
                              {gap.severity === "critical" ? "Required in JD" : "Preferred in JD"}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-[#6B6863] leading-relaxed">
                            {gap.reason}
                          </span>
                        </div>
                      ))
                    ) : scoreReport.gaps && scoreReport.gaps.length > 0 ? (
                      scoreReport.gaps.map((gap, i) => (
                        <div key={i} className="bg-white border border-[#FFE0B2]/70 p-3 rounded-lg text-xs text-[#8A4B00]">
                          {gap}
                        </div>
                      ))
                    ) : (
                      <div className="bg-white border border-[#FFE0B2]/70 p-3 rounded-lg text-xs text-[#8A4B00]">
                        No critical skill deficiencies identified against this job description.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* CRITICAL MISSING KEYWORDS CHECKLIST WIDGET */}
              {scoreReport.criticalMissingKeywords && scoreReport.criticalMissingKeywords.length > 0 && (
                <div className="border border-[#E8E6E0] rounded-xl p-4 bg-white flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E6E0]/60 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-[#FF6B6B]" />
                      <h4 className="text-xs font-bold text-[#2D2D2D] uppercase tracking-wide">
                        Critical Missing Keywords Checklist ({scoreReport.criticalMissingKeywords.length})
                      </h4>
                    </div>
                    <span className="text-[11px] text-[#6B6863]">
                      Hard skills, frameworks, and methodologies absent or underrepresented in your CV
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                    {scoreReport.criticalMissingKeywords.map((kw, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start justify-between p-2.5 rounded-lg border text-xs ${
                          kw.importance === "critical"
                            ? "bg-[#FFF0F0]/50 border-[#FF6B6B]/30"
                            : "bg-[#FAF9F7] border-[#E8E6E0]"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Tag className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                            kw.importance === "critical" ? "text-[#FF6B6B]" : "text-[#6B6863]"
                          }`} />
                          <div className="flex flex-col">
                            <span className="font-bold text-[#2D2D2D]">{kw.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-[#6B6863] border-[#E8E6E0]">
                                {kw.category === "framework_tool" ? "Tool / Framework" : kw.category === "methodology" ? "Methodology" : "Hard Skill"}
                              </Badge>
                              {kw.frequency > 1 && (
                                <span className="text-[10px] text-[#6B6863]">
                                  {kw.frequency}x in JD
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <Badge className={`text-[10px] shrink-0 font-semibold ${
                          kw.importance === "critical"
                            ? "bg-[#FFF0F0] text-[#FF6B6B] border-[#FF6B6B]/30"
                            : "bg-[#F3F2EE] text-[#6B6863] border-transparent"
                        }`}>
                          {kw.importance === "critical" ? "CRITICAL" : "RECOMMENDED"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Zero-Hallucination Guarantee Notice */}
              <div className="bg-[#FAF9F7] border border-[#E8E6E0] p-3.5 rounded-xl flex items-start gap-3">
                <Shield className="w-4 h-4 text-[#166534] shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5 text-xs">
                  <span className="font-bold text-[#166534]">Zero-Hallucination Guarantee</span>
                  <p className="text-[11px] text-[#6B6863] leading-relaxed">
                    When tailoring your CV, Jomble will strictly rephrase and spotlight your authentic experience. We will never fabricate experience or claims for missing JD requirements.
                  </p>
                </div>
              </div>

            </CardContent>


            <CardFooter className="border-t border-[#E8E6E0]/60 flex items-center justify-between bg-[#FAF9F7] px-6 py-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/cv-tailor")}
                  className="text-[#6B6863] text-xs"
                >
                  Back to Dashboard
                </Button>
                {llmConfig && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-[#6B6863]">
                    <span>Using</span>
                    <span className="font-semibold text-[#2D2D2D]">
                      {llmConfig.provider === "GEMINI" ? `Gemini (${llmConfig.geminiModel || "gemini-flash-lite"})` : `Ollama (${llmConfig.ollamaModel || "qwen2.5"})`}
                    </span>
                  </span>
                )}
              </div>

              <Button
                onClick={handleGenerateTailoredCv}
                disabled={isGenerating}
                className="bg-[#FF6B6B] hover:bg-[#e85555] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Generating Tailored Resume...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Generate Tailored Resume (DRAFT)
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

      </div>
    </div>
  )
}

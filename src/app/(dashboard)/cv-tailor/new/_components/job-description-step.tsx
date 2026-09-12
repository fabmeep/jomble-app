"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  Globe,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Edit3,
  RotateCcw,
  Sparkles,
  Layers,
  Briefcase,
  Building2,
  Check,
  X,
  Info,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { JdRequirements } from "@/types/cv"

export type JdFlowState =
  | "INPUT_URL"
  | "FETCHING"
  | "PREVIEW"
  | "FAILED"
  | "MANUAL_PASTE"
  | "PARSING"
  | "PARSED"

interface JobDescriptionStepProps {
  onParsed: (requirements: JdRequirements, jdId: string, rawText: string) => void
  initialRawText?: string
  initialUrl?: string
  currentRequirements?: JdRequirements | null
  jobAppId?: string | null
  defaultCompanyName?: string | null
  defaultJobTitle?: string | null
}

const SAMPLE_JOB_LINKS = [
  {
    label: "Traveloka (Data Scientist)",
    url: "https://careers.traveloka.com/jobs/mj000277-data-scientist",
    badge: "SSR / Instant",
  },
  {
    label: "Dealls (Java Developer)",
    url: "https://dealls.com/loker/java-developer-25~pt-metrodata-electronics-tbk",
    badge: "JSON-LD",
  },
  {
    label: "LinkedIn (Kredivo SDE)",
    url: "https://www.linkedin.com/jobs/view/4376059178/",
    badge: "Public SSR",
  },
  {
    label: "DANA (SPA Test)",
    url: "https://www.career.dana.id/jobs/cmtmcod0l0000oe019nbicwfq",
    badge: "Fallback Demo",
  },
]

export default function JobDescriptionStep({
  onParsed,
  initialRawText = "",
  initialUrl = "",
  currentRequirements = null,
  jobAppId,
  defaultCompanyName,
  defaultJobTitle,
}: JobDescriptionStepProps) {
  const [url, setUrl] = useState(initialUrl)
  const [rawText, setRawText] = useState(initialRawText)
  const [flowState, setFlowState] = useState<JdFlowState>(
    currentRequirements ? "PARSED" : initialRawText ? "MANUAL_PASTE" : "INPUT_URL"
  )
  const [failureReason, setFailureReason] = useState<"blocked" | "timeout" | "empty" | "error" | null>(null)
  const [parsedData, setParsedData] = useState<JdRequirements | null>(currentRequirements)
  const [previewSnippet, setPreviewSnippet] = useState<string>("")

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auto-focus textarea when entering manual paste or failed fallback
  useEffect(() => {
    if (flowState === "MANUAL_PASTE" || flowState === "FAILED") {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }, [flowState])

  // Handle Stage 1: URL Fetch & Preview
  const handleFetchUrl = async (targetUrl?: string) => {
    const urlToFetch = (targetUrl || url).trim()
    if (!urlToFetch) {
      toast.error("Please enter a valid job posting URL.")
      return
    }

    setUrl(urlToFetch)
    setFailureReason(null)
    setFlowState("FETCHING")

    // Setup 10-second client timeout safety
    const controller = new AbortController()
    abortControllerRef.current = controller
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 10000)

    try {
      const res = await fetch("/api/jd/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToFetch }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        // Translate any server error to failed fallback without exposing status codes
        setFailureReason("error")
        setFlowState("FAILED")
        return
      }

      const data = await res.json()

      if (data.success && data.raw_text && data.raw_text.trim().length >= 200) {
        setRawText(data.raw_text)
        setPreviewSnippet(data.raw_text.slice(0, 380).trim())
        setFlowState("PREVIEW")
      } else {
        const reason = (data.reason as "blocked" | "timeout" | "empty") || "empty"
        setFailureReason(reason)
        setFlowState("FAILED")
      }
    } catch (err: any) {
      clearTimeout(timeoutId)
      if (err.name === "AbortError") {
        setFailureReason("timeout")
      } else {
        setFailureReason("error")
      }
      setFlowState("FAILED")
    }
  }

  // Cancel in-flight fetch
  const handleCancelFetch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setFlowState("MANUAL_PASTE")
  }

  // Handle Stage 2: LLM Requirements Extraction
  const handleParseJd = async () => {
    if (!rawText.trim() || rawText.trim().length < 200) {
      toast.error("Job description must contain at least 200 characters.")
      return
    }

    setFlowState("PARSING")

    try {
      const res = await fetch("/api/jd/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: rawText.trim(),
          source_url: url.trim() || null,
          job_app_id: jobAppId || null,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        toast.error(errData.error || "Failed to analyze job description with AI.")
        setFlowState("MANUAL_PASTE")
        return
      }

      const parsed: JdRequirements & { id?: string } = await res.json()
      setParsedData(parsed)
      setFlowState("PARSED")
      toast.success("Job requirements parsed successfully!")

      if (onParsed && parsed.id) {
        onParsed(parsed, parsed.id, rawText)
      }
    } catch (err) {
      console.error("[JD Parse UI Error]:", err)
      toast.error("Network error while connecting to AI requirement parser.")
      setFlowState("MANUAL_PASTE")
    }
  }

  // Friendly error messages mapping reasons to human explanations
  const getFriendlyFailureMessage = () => {
    switch (failureReason) {
      case "blocked":
        return "This job portal restricts automated access (e.g. strict anti-bot or private access). Please copy and paste the job description text directly below."
      case "empty":
        return "This careers page renders its content dynamically with client-side JavaScript. Please copy and paste the job description text directly below."
      case "timeout":
        return "Fetching the careers page took too long. Please copy and paste the job description text directly below."
      case "error":
      default:
        return "We couldn't fetch that page automatically — paste the job description text directly below."
    }
  }

  const charCount = rawText.trim().length
  const isTextValid = charCount >= 200

  return (
    <Card className="border-[#E8E6E0] shadow-xs bg-white overflow-hidden">
      <CardHeader className="pb-3 border-b border-[#E8E6E0]/60 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FFF0F0] text-[#FF6B6B] flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-[#2D2D2D] flex items-center gap-2">
                Target Job Description
                {flowState === "PARSED" && (
                  <Badge className="bg-[#F0FDF4] text-[#166534] border-[#BBF7D0] text-[10px] font-semibold">
                    <Check className="w-3 h-3 mr-1" /> Requirements Extracted
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-[#6B6863]">
                Auto-fetch from a careers URL or paste the job description text directly.
              </CardDescription>
            </div>
          </div>

          {/* Quick toggle if already parsed or pasting */}
          {flowState === "PARSED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFlowState("MANUAL_PASTE")}
              className="text-xs border-[#E8E6E0] text-[#6B6863] hover:text-[#2D2D2D]"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5 text-[#FF6B6B]" /> Edit JD
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-5 pb-5 flex flex-col gap-4">
        {/* ========================================================= */}
        {/* STATE 1: [INPUT_URL]                                     */}
        {/* ========================================================= */}
        {flowState === "INPUT_URL" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#2D2D2D]">
                Job Posting URL
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A49C]" />
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleFetchUrl()}
                    placeholder="e.g. https://careers.traveloka.com/jobs/..."
                    className="pl-9 bg-[#F8F7F5] border-[#E8E6E0] text-xs font-mono"
                  />
                </div>
                <Button
                  onClick={() => handleFetchUrl()}
                  className="bg-[#FF6B6B] hover:bg-[#e85555] text-white text-xs font-bold px-4 cursor-pointer"
                >
                  Fetch & Preview
                </Button>
              </div>
            </div>

            {/* Quick Test Links Pills */}
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-[#8C887F] uppercase tracking-wider">
                Quick Test Links:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_JOB_LINKS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setUrl(sample.url)
                      handleFetchUrl(sample.url)
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] bg-[#F4F2EE] hover:bg-[#EAE7E1] text-[#4A4742] border border-[#E0DCD4] transition-colors cursor-pointer"
                  >
                    <span>{sample.label}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-white text-[#8C887F] font-mono border border-[#E0DCD4]">
                      {sample.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prominent, 1-Click Escape Hatch (Always visible per spec) */}
            <div className="pt-2 border-t border-[#E8E6E0]/60 flex items-center justify-between">
              <span className="text-xs text-[#6B6863]">
                Already have the job description copied?
              </span>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setFlowState("MANUAL_PASTE")}
                className="text-xs font-semibold text-[#FF6B6B] hover:text-[#e85555] hover:bg-[#FFF0F0] cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Or paste the text instead
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STATE 2: [FETCHING] (8s max timeout with abort)           */}
        {/* ========================================================= */}
        {flowState === "FETCHING" && (
          <div className="py-8 px-6 bg-[#FAF9F7] border border-[#E8E6E0] rounded-xl flex flex-col items-center justify-center gap-4 text-center">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-[#FF6B6B]/20 border-t-[#FF6B6B] animate-spin" />
              <Globe className="w-5 h-5 text-[#FF6B6B] absolute" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-bold text-[#2D2D2D]">
                Fetching job posting…
              </h4>
              <p className="text-[11px] text-[#6B6863] max-w-sm font-mono truncate">
                {url}
              </p>
              <p className="text-[11px] text-[#8C887F]">
                Extracting clean requirements and stripping HTML noise (~8s max)
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelFetch}
              className="text-xs border-[#E8E6E0] text-[#6B6863] hover:text-[#2D2D2D] mt-1"
            >
              Cancel & Paste Manually Instead
            </Button>
          </div>
        )}

        {/* ========================================================= */}
        {/* STATE 3: [PREVIEW] (Confirm before spending LLM call)     */}
        {/* ========================================================= */}
        {flowState === "PREVIEW" && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-3.5 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#166534] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-[#166534]">
                  Job posting content fetched successfully!
                </span>
                <span className="text-[11px] text-[#15803D] font-mono truncate max-w-lg">
                  {url}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#2D2D2D]">
                  Extracted Excerpt Preview
                </label>
                <span className="text-[11px] text-[#6B6863]">
                  {rawText.length} characters extracted
                </span>
              </div>

              {/* Excerpt box */}
              <div className="p-3.5 bg-[#FAF9F7] border border-[#E8E6E0] rounded-xl text-xs text-[#4A4742] font-mono leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                {previewSnippet}...
              </div>
            </div>

            <div className="p-4 bg-[#FFF9F2] border border-[#FFE7CC] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-[#8A4B00]">
                <Info className="w-4 h-4 text-[#FF8C42] shrink-0" />
                <span>Does this excerpt match the target job posting?</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFlowState("MANUAL_PASTE")}
                  className="border-[#E0DCD4] text-xs font-semibold text-[#4A4742]"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                  Edit or Paste Manually
                </Button>

                <Button
                  size="sm"
                  onClick={handleParseJd}
                  className="bg-[#FF6B6B] hover:bg-[#e85555] text-white text-xs font-bold cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Continue & Extract Requirements
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STATE 4: [FAILED] (Fallback with friendly plain language) */}
        {/* ========================================================= */}
        {flowState === "FAILED" && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#FFF8F0] border border-[#FFE0B2] p-3.5 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#FF8C42] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-[#8A4B00]">
                  Could not auto-fetch page
                </span>
                <span className="text-xs text-[#8A4B00]">
                  {getFriendlyFailureMessage()}
                </span>
                {url && (
                  <span className="text-[10px] text-[#A66000] font-mono truncate max-w-lg mt-0.5">
                    Target URL: {url} (preserved in job record)
                  </span>
                )}
              </div>
            </div>

            {/* Seamlessly reveal pre-focused manual paste textarea */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#2D2D2D]">
                  Paste Job Description Text
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-mono font-semibold ${isTextValid ? "text-[#166534]" : "text-[#8C887F]"
                      }`}
                  >
                    {charCount} / 200 min characters
                  </span>
                  {isTextValid && (
                    <Badge className="bg-[#F0FDF4] text-[#166534] border-[#BBF7D0] text-[10px] py-0 px-1.5">
                      Ready
                    </Badge>
                  )}
                </div>
              </div>

              <Textarea
                ref={textareaRef}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste the job requirements, qualifications, and responsibilities here..."
                rows={7}
                className="bg-[#F8F7F5] border-[#E8E6E0] text-xs font-mono leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFlowState("INPUT_URL")}
                className="text-xs text-[#6B6863] hover:text-[#2D2D2D]"
              >
                ← Try another URL
              </Button>

              <Button
                disabled={!isTextValid}
                onClick={handleParseJd}
                className="bg-[#FF6B6B] hover:bg-[#e85555] text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Extract Requirements with AI
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STATE 5: [MANUAL_PASTE] (First-class path from start)    */}
        {/* ========================================================= */}
        {flowState === "MANUAL_PASTE" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#2D2D2D]">
                  Job Description Raw Text
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-mono font-semibold ${isTextValid ? "text-[#166534]" : "text-[#8C887F]"
                      }`}
                  >
                    {charCount} / 200 min characters
                  </span>
                  {isTextValid ? (
                    <Badge className="bg-[#F0FDF4] text-[#166534] border-[#BBF7D0] text-[10px] py-0 px-1.5">
                      Ready
                    </Badge>
                  ) : (
                    <Badge className="bg-[#FFF0F0] text-[#FF6B6B] border-[#FF6B6B]/20 text-[10px] py-0 px-1.5">
                      Min 200 chars
                    </Badge>
                  )}
                </div>
              </div>

              <Textarea
                ref={textareaRef}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste the full job posting requirements, responsibilities, and qualifications..."
                rows={8}
                className="bg-[#F8F7F5] border-[#E8E6E0] text-xs font-mono leading-relaxed"
              />
            </div>

            {url && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#6B6863] bg-[#FAF9F7] px-3 py-1.5 rounded-lg border border-[#E8E6E0]">
                <Globe className="w-3.5 h-3.5 text-[#A8A49C]" />
                <span className="font-semibold">Attached Source URL:</span>
                <span className="font-mono truncate">{url}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#E8E6E0]/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFlowState("INPUT_URL")}
                className="text-xs text-[#6B6863] hover:text-[#2D2D2D]"
              >
                ← Or scrape from URL
              </Button>

              <Button
                type="button"
                disabled={!isTextValid}
                onClick={handleParseJd}
                className="bg-[#FF6B6B] hover:bg-[#e85555] text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Extract Requirements with AI
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STATE 6: [PARSING] (Stage 2 LLM Extraction in progress)   */}
        {/* ========================================================= */}
        {flowState === "PARSING" && (
          <div className="py-10 px-6 bg-[#FAF9F7] border border-[#E8E6E0] rounded-xl flex flex-col items-center justify-center gap-4 text-center">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-[#FF6B6B]/20 border-t-[#FF6B6B] animate-spin" />
              <Sparkles className="w-5 h-5 text-[#FF6B6B] absolute" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-bold text-[#2D2D2D]">
                Analyzing Job Requirements with AI…
              </h4>
              <p className="text-[11px] text-[#6B6863] max-w-md">
                Separating required hard skills from preferred skills, detecting seniority level, and identifying ATS keywords.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STATE 7: [PARSED] (Stage 2 Requirements Extracted)       */}
        {/* ========================================================= */}
        {flowState === "PARSED" && parsedData && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#FAF9F7] border border-[#E8E6E0] rounded-xl">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#2D2D2D]">
                    {parsedData.job_title || parsedData.jobTitle || defaultJobTitle || "Target Position"}
                  </h3>
                  <span className="text-xs text-[#8C887F]">at</span>
                  <span className="text-xs font-bold text-[#2D2D2D]">
                    {(parsedData.company_name && parsedData.company_name !== "Target Company" ? parsedData.company_name : defaultCompanyName) || parsedData.companyName || "Company"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {parsedData.seniority && (
                    <Badge className="bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE] text-[10px] font-semibold">
                      {parsedData.seniority}
                    </Badge>
                  )}
                  {parsedData.employment_type && (
                    <Badge className="bg-[#F3F4F6] text-[#374151] border-[#E5E7EB] text-[10px] font-semibold">
                      {parsedData.employment_type}
                    </Badge>
                  )}
                  {parsedData.location && (
                    <span className="text-[11px] text-[#6B6863]">
                      📍 {parsedData.location}
                    </span>
                  )}
                </div>
              </div>

              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#FF6B6B] hover:underline font-mono truncate max-w-xs"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Original Posting
                </a>
              )}
            </div>

            {/* Required Skills vs Preferred Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Required Hard Skills */}
              <div className="p-4 bg-white border border-[#FF6B6B]/20 rounded-xl flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#FF6B6B] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FF6B6B]" />
                    Required Skills ({parsedData.required_skills?.length || 0})
                  </span>
                  <span className="text-[10px] font-mono text-[#8C887F]">
                    35% Match Weight
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[3rem]">
                  {parsedData.required_skills?.length ? (
                    parsedData.required_skills.map((skill, i) => (
                      <Badge
                        key={i}
                        className="bg-[#FFF0F0] hover:bg-[#FFE5E5] text-[#D93838] border-[#FFD0D0] text-[11px] font-medium py-0.5 px-2"
                      >
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[11px] text-[#8C887F] italic">
                      None explicitly listed
                    </span>
                  )}
                </div>
              </div>

              {/* Preferred Skills */}
              <div className="p-4 bg-white border border-[#E8E6E0] rounded-xl flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#6B6863] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#A8A49C]" />
                    Preferred / Good to Have ({parsedData.preferred_skills?.length || 0})
                  </span>
                  <span className="text-[10px] font-mono text-[#8C887F]">
                    15% Match Weight
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[3rem]">
                  {parsedData.preferred_skills?.length ? (
                    parsedData.preferred_skills.map((skill, i) => (
                      <Badge
                        key={i}
                        className="bg-[#F8F7F5] hover:bg-[#EFECE6] text-[#4A4742] border-[#E8E6E0] text-[11px] font-medium py-0.5 px-2"
                      >
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[11px] text-[#8C887F] italic">
                      None explicitly listed
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ATS Keywords */}
            {parsedData.keywords?.length > 0 && (
              <div className="p-3.5 bg-[#FAF9F7] border border-[#E8E6E0] rounded-xl flex flex-col gap-2">
                <span className="text-xs font-bold text-[#2D2D2D] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF6B6B]" />
                  ATS Keywords ({parsedData.keywords.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {parsedData.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-[#E8E6E0] text-[#4A4742]"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Responsibilities bullet list */}
            {parsedData.responsibilities?.length > 0 && (
              <div className="p-3.5 bg-white border border-[#E8E6E0] rounded-xl flex flex-col gap-2">
                <span className="text-xs font-bold text-[#2D2D2D]">
                  Core Responsibilities ({parsedData.responsibilities.length})
                </span>
                <ul className="flex flex-col gap-1 text-xs text-[#4A4742]">
                  {parsedData.responsibilities.slice(0, 5).map((resp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#FF6B6B] font-bold">•</span>
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

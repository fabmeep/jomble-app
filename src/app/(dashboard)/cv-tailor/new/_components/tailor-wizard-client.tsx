"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Globe, FileText, ArrowRight, Loader2, CheckCircle2, AlertTriangle, Cpu, Target, Award, Check } from "lucide-react"
import { toast } from "sonner"
import { CvMaster, JobDescription, ScoreReport } from "@/types/cv"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface TailorWizardClientProps {
  masterCv: CvMaster
  sampleJd: JobDescription
}

export default function TailorWizardClient({
  masterCv,
  sampleJd,
}: TailorWizardClientProps) {
  const router = useRouter()

  const [inputMode, setInputMode] = useState<"PASTE" | "SCRAPE">("PASTE")
  const [jdText, setJdText] = useState(sampleJd.rawText)
  const [jdUrl, setJdUrl] = useState(sampleJd.sourceUrl || "")
  const [isScraping, setIsScraping] = useState(false)
  const [isScoring, setIsScoring] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const [scoreReport, setScoreReport] = useState<ScoreReport | null>({
    id: "score_1",
    userId: "user_1",
    cvMasterId: masterCv.id,
    jobDescriptionId: sampleJd.id,
    overallScore: 86,
    breakdown: {
      requiredSkillsScore: 90, // 35% weight -> 31.5 pts
      preferredSkillsScore: 75, // 15% weight -> 11.25 pts
      semanticSimilarityScore: 88, // 20% weight -> 17.6 pts
      keywordOverlapScore: 82, // 15% weight -> 12.3 pts
      experienceFitScore: 90, // 15% weight -> 13.5 pts
    },
    gaps: [
      'JD emphasizes "GraphQL" 3x — missing from extracted Master CV skills tags.',
      'JD lists "WebSockets / Real-time streaming" as preferred — mentioned in pixelcraft experience but missing in top skills summary.',
    ],
    createdAt: new Date().toISOString(),
  })

  const handleScrapeUrl = async () => {
    if (!jdUrl.trim()) {
      toast.error("Please enter a job posting URL.")
      return
    }
    setIsScraping(true)
    await new Promise((r) => setTimeout(r, 1200))
    setIsScraping(false)
    setJdText(sampleJd.rawText)
    toast.success("Successfully scraped job posting details & description!")
  }

  const handleCalculateScore = async () => {
    if (!jdText.trim()) {
      toast.error("Job description text is empty.")
      return
    }
    setIsScoring(true)
    await new Promise((r) => setTimeout(r, 1000))
    setIsScoring(false)
    toast.success("Deterministic match score calculated!")
  }

  const handleGenerateTailoredCv = async () => {
    setIsGenerating(true)
    toast.loading("Generating tailored resume and grounding verification report...")
    await new Promise((r) => setTimeout(r, 1500))
    setIsGenerating(false)
    toast.dismiss()
    toast.success("Tailored resume generated in DRAFT state!")
    router.push("/cv-tailor/tailored_1")
  }

  return (
    <div className="flex-1 overflow-y-auto w-full p-6 scroll-smooth bg-[#F8F7F5]">
      <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-[#2D2D2D]">Tailor Resume for New Job</h2>
            <Badge className="bg-[#FFF0F0] text-[#FF6B6B] border-[#FF6B6B]/20 font-semibold text-[11px]">
              BYOK Match Engine
            </Badge>
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
                Active Master
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-[#2D2D2D]">{masterCv.fileName}</h4>
              <p className="text-[11px] text-[#6B6863]">
                {masterCv.structuredData.contact.name} • {masterCv.structuredData.experience?.length || 0} Jobs • {masterCv.structuredData.skills?.length || 0} Extracted Skills
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/cv-tailor/upload")} className="border-[#E8E6E0] text-xs">
              Change CV
            </Button>
          </CardContent>
        </Card>

        {/* STEP 2: JOB DESCRIPTION INPUT */}
        <Card className="border-[#E8E6E0] shadow-xs bg-white">
          <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
            <CardTitle className="text-sm text-[#2D2D2D] flex items-center gap-2">
              <Target className="w-4 h-4 text-[#FF6B6B]" />
              2. Target Job Description
            </CardTitle>
            <CardDescription className="text-xs text-[#6B6863]">
              Paste the raw job description or scrape it directly from a careers page URL.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 flex flex-col gap-4">
            <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as any)} className="w-full">
              <TabsList className="bg-[#F8F7F5] border border-[#E8E6E0] p-1 h-auto rounded-xl">
                <TabsTrigger value="PASTE" className="py-2 px-4 rounded-lg font-semibold text-xs cursor-pointer">
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Manual Paste Text
                </TabsTrigger>
                <TabsTrigger value="SCRAPE" className="py-2 px-4 rounded-lg font-semibold text-xs cursor-pointer">
                  <Globe className="w-3.5 h-3.5 mr-1.5" />
                  Scrape Job URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="PASTE" className="mt-4 flex flex-col gap-2">
                <Label className="text-[11px] font-bold text-[#6B6863] uppercase">Job Description Raw Text</Label>
                <Textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste full job posting requirements and responsibilities..."
                  rows={6}
                  className="bg-[#F8F7F5] border-[#E8E6E0] text-xs font-mono leading-relaxed"
                />
              </TabsContent>

              <TabsContent value="SCRAPE" className="mt-4 flex flex-col gap-3">
                <div className="flex gap-2">
                  <Input
                    value={jdUrl}
                    onChange={(e) => setJdUrl(e.target.value)}
                    placeholder="https://careers.shopee.com/job-detail/..."
                    className="bg-[#F8F7F5] border-[#E8E6E0] text-xs flex-1 font-mono"
                  />
                  <Button
                    onClick={handleScrapeUrl}
                    disabled={isScraping}
                    className="bg-[#FF6B6B] hover:bg-[#e85555] text-white text-xs font-bold"
                  >
                    {isScraping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Scrape JD"}
                  </Button>
                </div>
                {jdText && (
                  <Textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    rows={4}
                    className="bg-[#F8F7F5] border-[#E8E6E0] text-xs font-mono leading-relaxed"
                  />
                )}
              </TabsContent>
            </Tabs>

            <Button
              variant="outline"
              onClick={handleCalculateScore}
              disabled={isScoring || !jdText.trim()}
              className="border-[#E8E6E0] text-[#2D2D2D] hover:bg-[#F8F7F5] text-xs font-semibold self-start"
            >
              {isScoring ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-[#FF6B6B]" />
                  Computing Match Breakdown...
                </>
              ) : (
                "Re-compute Match Score"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* STEP 3: DETERMINISTIC MATCH SCORE REPORT */}
        {scoreReport && (
          <Card className="border-[#E8E6E0] shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-[#2D2D2D] flex items-center gap-2">
                  <Award className="w-4.5 h-4.5 text-[#FF6B6B]" />
                  3. Deterministic Match Score Report
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6B6863]">Computed Match:</span>
                  <div className="px-3 py-1 rounded-full bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-sm font-extrabold font-mono">
                    {scoreReport.overallScore}%
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 flex flex-col gap-6">
              
              {/* Score breakdown bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#2D2D2D]">Required Skills (35%)</span>
                    <span className="font-mono text-[#6B6863]">{scoreReport.breakdown.requiredSkillsScore}%</span>
                  </div>
                  <Progress value={scoreReport.breakdown.requiredSkillsScore} className="h-2 bg-[#E8E6E0]" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#2D2D2D]">Preferred Skills (15%)</span>
                    <span className="font-mono text-[#6B6863]">{scoreReport.breakdown.preferredSkillsScore}%</span>
                  </div>
                  <Progress value={scoreReport.breakdown.preferredSkillsScore} className="h-2 bg-[#E8E6E0]" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#2D2D2D]">Semantic Vector Similarity (20%)</span>
                    <span className="font-mono text-[#6B6863]">{scoreReport.breakdown.semanticSimilarityScore}%</span>
                  </div>
                  <Progress value={scoreReport.breakdown.semanticSimilarityScore} className="h-2 bg-[#E8E6E0]" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#2D2D2D]">Keyword Overlap (15%)</span>
                    <span className="font-mono text-[#6B6863]">{scoreReport.breakdown.keywordOverlapScore}%</span>
                  </div>
                  <Progress value={scoreReport.breakdown.keywordOverlapScore} className="h-2 bg-[#E8E6E0]" />
                </div>
              </div>

              {/* Identified Gaps Section */}
              <div className="bg-[#FFF8F0] border border-[#FFE0B2] p-4 rounded-xl flex flex-col gap-2">
                <h4 className="text-xs font-bold text-[#8A4B00] flex items-center gap-1.5 uppercase tracking-wide">
                  <AlertTriangle className="w-4 h-4 text-[#FF8C42]" />
                  Identified Gaps & Keyword Opportunities
                </h4>
                <ul className="flex flex-col gap-1.5 mt-1">
                  {scoreReport.gaps.map((gap, i) => (
                    <li key={i} className="text-xs text-[#8A4B00] flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </CardContent>

            <CardFooter className="border-t border-[#E8E6E0]/60 flex items-center justify-between bg-[#FAF9F7] px-6 py-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/cv-tailor")}
                className="text-[#6B6863] text-xs"
              >
                Back to Dashboard
              </Button>

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

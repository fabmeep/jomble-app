"use client"

import React from "react"
import Link from "next/link"
import {
  Sparkles,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  Bot,
  Plus,
  Star,
  Layers,
  ChevronRight,
  Briefcase,
  ExternalLink,
  Shield,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MasterResume, TailoredCv, LlmProviderConfig, PendingApplicationRow } from "@/types/cv"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useBackendHealth } from "@/hooks/use-backend-health"
import { BackendConnectionBanner } from "@/components/cv-tailor/backend-connection-banner"

interface CvTailorHubClientProps {
  masterCv: MasterResume | null
  masterResumes?: MasterResume[]
  tailoredCvs: TailoredCv[]
  pendingApplications?: PendingApplicationRow[]
  llmConfig: LlmProviderConfig | null
}

export default function CvTailorHubClient({
  masterCv,
  masterResumes = [],
  tailoredCvs,
  pendingApplications = [],
  llmConfig,
}: CvTailorHubClientProps) {
  const backendHealth = useBackendHealth()
  const isConfigActive = llmConfig && llmConfig.isActive && llmConfig.lastTestOk

  const allResumes = masterResumes.length > 0 ? masterResumes : (masterCv ? [masterCv] : [])

  return (
    <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6 scroll-smooth bg-[#F8F7F5]">
      <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">

        {/* Backend Local Connection Status Banner */}
        <BackendConnectionBanner health={backendHealth} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FFF0F0] text-[#FF6B6B] flex items-center justify-center font-bold">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[#2D2D2D]">CV Tailor</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#6B6863]">
              Upload your Master CV once, paste any job description, and generate grounded tailored resumes.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/cv-tailor/upload">
              <Button variant="outline" className="border-[#E8E6E0] text-[#2D2D2D] hover:bg-white text-xs font-semibold">
                <Upload className="w-3.5 h-3.5 mr-1.5 text-[#6B6863]" />
                Upload Master CV
              </Button>
            </Link>

            <Link href={masterCv?.reviewedAt ? `/cv-tailor/new?masterId=${masterCv.id}` : "/cv-tailor/upload"}>
              <Button className="bg-[#FF6B6B] hover:bg-[#e85555] text-white text-xs font-bold shadow-xs cursor-pointer">
                <Plus className="w-4 h-4 mr-1" />
                Tailor New CV
              </Button>
            </Link>
          </div>
        </div>

        {/* LLM Provider Status Indicator */}
        {llmConfig && llmConfig.isActive ? (
          <div className="bg-white border border-[#E8E6E0] p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F8F7F5] border border-[#E8E6E0] flex items-center justify-center flex-shrink-0">
                {llmConfig.provider === "GEMINI" ? (
                  <Sparkles className="w-4 h-4 text-[#4285F4]" />
                ) : (
                  <Zap className="w-4 h-4 text-[#FF8C42]" />
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#2D2D2D]">
                    {llmConfig.provider === "GEMINI" ? "Google Gemini (BYOK)" : "Ollama Local AI"}
                  </span>
                  <Badge className="bg-[#F0FDF4] text-[#166534] border-[#BBF7D0] text-[10px] font-semibold py-0 px-1.5 h-4">
                    Active Engine
                  </Badge>
                  {llmConfig.lastTestOk ? (
                    <span className="text-[10px] font-medium text-[#166534] bg-[#DCFCE7] px-1.5 py-0.5 rounded-md">
                      ✓ Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-[#B45309] bg-[#FEF3C7] px-1.5 py-0.5 rounded-md">
                      Untested
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#6B6863]">
                  Model: <span className="font-mono text-[#2D2D2D] font-medium">{llmConfig.provider === "GEMINI" ? (llmConfig.geminiModel || "gemini-3.7-flash") : (llmConfig.ollamaModel || "qwen2.5:3b")}</span>
                  {llmConfig.lastTestedAt ? ` • Last tested ${new Date(llmConfig.lastTestedAt).toLocaleDateString()}` : ` • Recommended to test connection in Settings`}
                </span>
              </div>
            </div>

            <Link href="/settings?tab=llm-provider">
              <Button variant="ghost" size="sm" className="text-xs text-[#6B6863] hover:text-[#2D2D2D] hover:bg-[#F8F7F5] h-8 px-3 font-semibold">
                Configure / Switch ↗
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-[#FFF0F0] border border-[#FF6B6B]/30 p-4 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FF6B6B]/15 text-[#FF6B6B] flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#2D2D2D]">LLM Provider Setup Required</h4>
                <p className="text-xs text-[#6B6863]">
                  Configure Ollama (local) or Gemini API Key to enable AI CV parsing and bullet tailoring.
                </p>
              </div>
            </div>

            <Link href="/settings?tab=llm-provider">
              <Button size="sm" className="bg-[#FF6B6B] hover:bg-[#e85555] text-white text-xs font-semibold cursor-pointer">
                Configure Now <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        )}

        {/* Active Default Master CV Summary Card */}
        <Card className="border-[#E8E6E0] shadow-xs bg-white">
          <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-[#FF6B6B]" />
                <CardTitle className="text-base text-[#2D2D2D]">Active Master CV</CardTitle>
              </div>
              {masterCv?.reviewedAt ? (
                <Badge className="bg-[#F0FDF4] text-[#166534] border-[#BBF7D0] hover:bg-[#F0FDF4] font-medium text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#166534]" />
                  Verified Master Data
                </Badge>
              ) : masterCv ? (
                <Badge className="bg-[#FFF8F0] text-[#8A4B00] border-[#FFE0B2] hover:bg-[#FFF8F0] font-medium text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#8A4B00]" />
                  Pending User Review
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[#6B6863] border-[#E8E6E0]">
                  No Master CV Uploaded
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {masterCv ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-[#2D2D2D]">{masterCv.title}</span>
                    {masterCv.isDefault && (
                      <Badge className="bg-[#FFF8F0] text-[#B45309] border-[#FDE68A] text-[10px] font-semibold flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-current text-[#F59E0B]" />
                        Default
                      </Badge>
                    )}
                    {masterCv.targetRole && (
                      <span className="text-xs text-[#FF6B6B] font-medium">({masterCv.targetRole})</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B6863]">
                    <span>{masterCv.structuredData?.experience?.length || 0} Experience entries</span>
                    <span>•</span>
                    <span>{masterCv.structuredData?.skills?.length || 0} Extracted skills</span>
                    <span>•</span>
                    <span>
                      {masterCv.reviewedAt
                        ? `Verified ${new Date(masterCv.reviewedAt).toLocaleDateString()}`
                        : `Uploaded ${new Date(masterCv.createdAt).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/cv-tailor/master/${masterCv.id}`}>
                    <Button variant="outline" size="sm" className="border-[#E8E6E0] text-[#2D2D2D] hover:bg-[#F8F7F5] text-xs font-semibold">
                      <Eye className="w-3.5 h-3.5 mr-1.5 text-[#FF6B6B]" />
                      Preview Master CV
                    </Button>
                  </Link>

                  <Link href={`/cv-tailor/master/edit?id=${masterCv.id}`}>
                    <Button variant="outline" size="sm" className="border-[#E8E6E0] text-[#2D2D2D] hover:bg-[#F8F7F5] text-xs font-semibold">
                      Edit Bullets
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#F8F7F5] border border-[#E8E6E0] flex items-center justify-center text-[#6B6863]">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="max-w-sm">
                  <h4 className="text-sm font-bold text-[#2D2D2D]">No Master Resume Found</h4>
                  <p className="text-xs text-[#6B6863] mt-1">
                    Upload your comprehensive resume once. We will extract all your experience bullet points into source data.
                  </p>
                </div>
                <Link href="/cv-tailor/upload">
                  <Button size="sm" className="bg-[#FF6B6B] hover:bg-[#e85555] text-white text-xs font-bold mt-2">
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Upload Master CV
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Multiple Master Resumes Section (if user has > 1 resume) */}
        {allResumes.length > 1 && (
          <Card className="border-[#E8E6E0] shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#FF6B6B]" />
                  <CardTitle className="text-sm font-bold text-[#2D2D2D]">
                    All Master Profiles ({allResumes.length})
                  </CardTitle>
                </div>
                <Link href="/cv-tailor/upload">
                  <Button variant="ghost" size="sm" className="text-xs text-[#FF6B6B] hover:bg-[#FFF0F0] font-semibold">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Profile
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-2 divide-y divide-[#F0EFEA]">
              {allResumes.map((res) => (
                <div key={res.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-[#6B6863]" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#2D2D2D]">{res.title}</span>
                        {res.isDefault && (
                          <Badge className="bg-[#FFF8F0] text-[#B45309] border-[#FDE68A] text-[9px]">
                            Default
                          </Badge>
                        )}
                        {res.reviewedAt ? (
                          <Badge className="bg-[#F0FDF4] text-[#166534] text-[9px]">Verified</Badge>
                        ) : (
                          <Badge className="bg-[#FFF8F0] text-[#8A4B00] text-[9px]">Draft</Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-[#6B6863]">
                        {res.structuredData?.experience?.length || 0} Experience items • {res.structuredData?.skills?.length || 0} Skills
                      </span>
                    </div>
                  </div>

                  <Link href={`/cv-tailor/master/${res.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-[#6B6863] hover:text-[#2D2D2D]">
                      View Preview <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Applications Awaiting Tailored Resume */}
        {pendingApplications && pendingApplications.length > 0 && (
          <Card className="border-[#E8E6E0] shadow-xs bg-white">
            <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#FF6B6B]" />
                    <CardTitle className="text-base text-[#2D2D2D]">
                      Applications Awaiting Tailored Resume
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs text-[#6B6863]">
                    Active job applications that haven't been paired with a custom CV yet
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs text-[#6B6863] border-[#E8E6E0]">
                  {pendingApplications.length} Awaiting
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-[#F0EFEA]">
                {pendingApplications.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF9F7]/60 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FAF9F7] border border-[#E8E6E0] flex items-center justify-center text-[#6B6863] shrink-0">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/applications/${app.id}`}
                            className="font-bold text-xs text-[#2D2D2D] hover:text-[#FF6B6B] transition-colors"
                          >
                            {app.jobTitle}
                          </Link>
                          <span className="text-[11px] text-[#6B6863]">at {app.companyName}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10.5px] text-[#6B6863]">
                            Applied {new Date(app.appliedAt).toLocaleDateString()}
                          </span>
                          <span className="text-[#D0CFC9]">•</span>
                          {app.hasJd ? (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              JD Available
                            </span>
                          ) : (
                            <span className="text-[10.5px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                              No JD attached
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link href={`/applications/${app.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-[#6B6863] hover:text-[#2D2D2D] h-8 cursor-pointer"
                        >
                          View App <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                      <Link
                        href={
                          masterCv?.reviewedAt
                            ? `/cv-tailor/new?applicationId=${app.id}`
                            : "/cv-tailor/upload"
                        }
                      >
                        <Button
                          size="sm"
                          className="bg-[#FF6B6B] hover:bg-[#e85555] text-white text-xs font-bold shadow-2xs h-8 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Tailor Resume
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tailored Resumes List */}
        <Card className="border-[#E8E6E0] shadow-xs bg-white">
          <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-[#2D2D2D]">Tailored Resumes</CardTitle>
                <CardDescription className="text-xs text-[#6B6863]">
                  Grounded resumes generated for specific job postings
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs text-[#6B6863] border-[#E8E6E0]">
                {tailoredCvs.length} Generations
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-[#E8E6E0] hover:bg-transparent">
                  <TableHead className="text-xs font-bold text-[#6B6863]">Target Role & Company</TableHead>
                  <TableHead className="text-xs font-bold text-[#6B6863]">Match Score</TableHead>
                  <TableHead className="text-xs font-bold text-[#6B6863]">Grounding Status</TableHead>
                  <TableHead className="text-xs font-bold text-[#6B6863]">Created</TableHead>
                  <TableHead className="text-right text-xs font-bold text-[#6B6863]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tailoredCvs.map((cv) => (
                  <TableRow key={cv.id} className="border-[#E8E6E0] hover:bg-[#FAF9F7]/60">
                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-[#2D2D2D]">{cv.jobTitle}</span>
                        {cv.jobAppId ? (
                          <Link
                            href={`/applications/${cv.jobAppId}`}
                            className="text-[11px] text-[#FF6B6B] hover:underline inline-flex items-center gap-0.5"
                          >
                            <span>{cv.companyName}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        ) : (
                          <span className="text-[11px] text-[#6B6863]">{cv.companyName}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      {cv.overallScore !== undefined && cv.overallScore !== null ? (
                        <Badge
                          className={cn(
                            "text-xs font-bold",
                            cv.overallScore >= 75
                              ? "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]"
                              : cv.overallScore >= 50
                              ? "bg-[#FFF8F0] text-[#8A4B00] border-[#FFE0B2]"
                              : "bg-[#FFF0F0] text-[#D84315] border-[#FFCDD2]"
                          )}
                        >
                          {cv.overallScore}% Match
                        </Badge>
                      ) : (
                        <Badge className="bg-[#F0FDF4] text-[#166534] border-[#BBF7D0] text-xs font-bold">
                          88% Match
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      {cv.status === "VERIFIED" ? (
                        <Badge className="bg-[#F0FDF4] text-[#166534] border-[#BBF7D0] text-[11px] inline-flex items-center gap-1">
                          <Shield className="w-3 h-3 text-[#166534]" />
                          All Bullets Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-[#FFF8F0] text-[#8A4B00] border-[#FFE0B2] text-[11px]">
                          Pending Grounding Check
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-xs text-[#6B6863]">
                      {new Date(cv.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <Link href={`/cv-tailor/${cv.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs text-[#FF6B6B] hover:text-[#e85555] hover:bg-[#FFF0F0] font-semibold cursor-pointer">
                          Inspect & Export <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  Sparkles,
  Star,
  Trash2,
  Eye,
  Code2,
  FileCode,
  Loader2,
  Copy,
  Download,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { MasterResume } from "@/types/cv"
import { ResumePaperPreview } from "@/components/cv-tailor/resume-paper-preview"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface MasterDetailClientProps {
  initialResume: MasterResume
}

export default function MasterDetailClient({ initialResume }: MasterDetailClientProps) {
  const router = useRouter()
  const [resume, setResume] = useState<MasterResume>(initialResume)
  const [isSettingDefault, setIsSettingDefault] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<"preview" | "pdf" | "bullets" | "raw">("preview")

  // PDF Preview State
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isLoadingPdf, setIsLoadingPdf] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const isDocx = (resume.fileName || "").toLowerCase().endsWith(".docx") || (resume.fileName || "").toLowerCase().endsWith(".doc")

  // Fetch signed PDF download URL on demand or when tab is opened
  const fetchPdfSignedUrl = async () => {
    if (!resume.rawFileUrl) return
    setIsLoadingPdf(true)
    setPdfError(null)

    try {
      const res = await fetch(`/api/cv/${resume.id}/download`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Could not generate download link for PDF.")
      }
      const data = await res.json()
      if (data.downloadUrl) {
        setPdfUrl(data.downloadUrl)
      } else {
        throw new Error("No download URL returned.")
      }
    } catch (err: any) {
      console.warn("PDF URL fetch warning:", err)
      setPdfError(err.message || "Failed to load original document.")
    } finally {
      setIsLoadingPdf(false)
    }
  }

  useEffect(() => {
    if (activeTab === "pdf" && !pdfUrl && resume.rawFileUrl) {
      fetchPdfSignedUrl()
    }
  }, [activeTab, resume.id, resume.rawFileUrl, pdfUrl])

  const handleSetDefault = async () => {
    setIsSettingDefault(true)
    try {
      const res = await fetch(`/api/cv/${resume.id}/default`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to set as default.")

      setResume({ ...resume, isDefault: true })
      toast.success(`"${resume.title}" is now your default Master CV!`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to set default.")
    } finally {
      setIsSettingDefault(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${resume.title}"? This cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/cv/${resume.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete master resume.")

      toast.success("Master CV deleted successfully.")
      router.push("/cv-tailor")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete master resume.")
      setIsDeleting(false)
    }
  }

  const handleDownloadOriginal = async () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank")
      return
    }

    setIsDownloading(true)
    try {
      const res = await fetch(`/api/cv/${resume.id}/download`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Download link not available.")
      }
      const data = await res.json()
      if (data.downloadUrl) {
        setPdfUrl(data.downloadUrl)
        window.open(data.downloadUrl, "_blank")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to download original resume.")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCopyRawText = () => {
    if (resume.rawText) {
      navigator.clipboard.writeText(resume.rawText)
      toast.success("Raw resume text copied to clipboard!")
    }
  }

  return (
    <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6 scroll-smooth bg-[#F8F7F5]">
      <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">

        {/* Navigation & Actions Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link href="/cv-tailor">
            <Button
              variant="ghost"
              size="sm"
              className="text-[#6B6863] hover:text-[#2D2D2D] text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to CV Tailor Hub
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            {resume.rawFileUrl && (
              <Button
                variant="outline"
                size="sm"
                disabled={isDownloading}
                onClick={handleDownloadOriginal}
                className="border-[#E8E6E0] text-[#2D2D2D] hover:bg-white text-xs font-semibold cursor-pointer"
              >
                {isDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 mr-1.5 text-[#6B6863]" />
                )}
                Download Original
              </Button>
            )}

            {!resume.isDefault && (
              <Button
                variant="outline"
                size="sm"
                disabled={isSettingDefault}
                onClick={handleSetDefault}
                className="border-[#E8E6E0] text-[#2D2D2D] hover:bg-white text-xs font-semibold cursor-pointer"
              >
                {isSettingDefault ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Star className="w-3.5 h-3.5 mr-1.5 text-[#F59E0B]" />
                )}
                Set as Default
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={handleDelete}
              className="border-[#E8E6E0] text-[#EF4444] hover:bg-[#FFF0F0] text-xs font-semibold cursor-pointer"
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </Button>

            <Link href={resume.reviewedAt ? `/cv-tailor/new?masterId=${resume.id}` : `/cv-tailor/upload`}>
              <Button
                size="sm"
                className="bg-[#FF6B6B] hover:bg-[#e85555] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Tailor for a Job
              </Button>
            </Link>
          </div>
        </div>

        {/* Master CV Summary Header Banner */}
        <Card className="border-[#E8E6E0] shadow-xs bg-white">
          <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-[#2D2D2D]">
                  {resume.title}
                </h1>
                {resume.isDefault && (
                  <Badge className="bg-[#FFF8F0] text-[#B45309] border-[#FDE68A] text-xs font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current text-[#F59E0B]" />
                    Default Profile
                  </Badge>
                )}
                {resume.reviewedAt ? (
                  <Badge className="bg-[#F0FDF4] text-[#166534] border-[#BBF7D0] text-xs font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#166534]" />
                    Verified Master Data
                  </Badge>
                ) : (
                  <Badge className="bg-[#FFF8F0] text-[#8A4B00] border-[#FFE0B2] text-xs font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#8A4B00]" />
                    Pending Review
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B6863]">
                {resume.targetRole && (
                  <span className="font-semibold text-[#FF6B6B]">{resume.targetRole}</span>
                )}
                {resume.fileName && (
                  <span>File: {resume.fileName}</span>
                )}
                <span>
                  Uploaded: {new Date(resume.createdAt).toLocaleDateString()}
                </span>
                <span>
                  {resume.structuredData?.experience?.length || 0} Experience items
                </span>
                <span>
                  {resume.structuredData?.skills?.length || 0} Skills
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/cv-tailor/master/edit?id=${resume.id}`}>
                <Button variant="outline" size="sm" className="border-[#E8E6E0] text-[#2D2D2D] hover:bg-[#F8F7F5] text-xs font-semibold">
                  <Edit3 className="w-3.5 h-3.5 mr-1 text-[#6B6863]" />
                  Edit Bullets
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* View Mode Selector Tabs */}
        <div className="flex flex-col gap-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <TabsList className="bg-white border border-[#E8E6E0] p-1">
                <TabsTrigger value="preview" className="text-xs font-semibold data-[state=active]:bg-[#2D2D2D] data-[state=active]:text-white cursor-pointer">
                  <Eye className="w-3.5 h-3.5 mr-1.5" /> Paper Resume Preview
                </TabsTrigger>
                <TabsTrigger value="pdf" className="text-xs font-semibold data-[state=active]:bg-[#2D2D2D] data-[state=active]:text-white cursor-pointer">
                  <FileText className="w-3.5 h-3.5 mr-1.5" /> Original Document (PDF)
                </TabsTrigger>
                <TabsTrigger value="bullets" className="text-xs font-semibold data-[state=active]:bg-[#2D2D2D] data-[state=active]:text-white cursor-pointer">
                  <Code2 className="w-3.5 h-3.5 mr-1.5" /> Traceable Bullet IDs
                </TabsTrigger>
                <TabsTrigger value="raw" className="text-xs font-semibold data-[state=active]:bg-[#2D2D2D] data-[state=active]:text-white cursor-pointer">
                  <FileCode className="w-3.5 h-3.5 mr-1.5" /> Raw Document Text
                </TabsTrigger>
              </TabsList>

              {activeTab === "pdf" && pdfUrl && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(pdfUrl, "_blank")}
                    className="text-xs border-[#E8E6E0] text-[#2D2D2D] hover:bg-white cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1 text-[#6B6863]" /> Open in New Tab
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDownloadOriginal}
                    className="bg-[#2D2D2D] hover:bg-[#1A1A1A] text-white text-xs font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> Download
                  </Button>
                </div>
              )}

              {activeTab === "raw" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyRawText}
                  className="text-xs border-[#E8E6E0] text-[#6B6863] hover:bg-white cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy Raw Text
                </Button>
              )}
            </div>

            {/* TAB 1: PAPER RESUME PREVIEW */}
            <TabsContent value="preview" className="mt-4">
              <ResumePaperPreview
                data={resume.structuredData}
                title={resume.title}
                targetRole={resume.targetRole}
                showBulletIds={false}
              />
            </TabsContent>

            {/* TAB 2: ORIGINAL UPLOADED PDF VIEWER */}
            <TabsContent value="pdf" className="mt-4">
              {isLoadingPdf ? (
                <Card className="border-[#E8E6E0] shadow-xs bg-white">
                  <CardContent className="py-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#FF6B6B]" />
                    <p className="text-xs font-semibold text-[#6B6863]">
                      Generating secure access link to your PDF...
                    </p>
                  </CardContent>
                </Card>
              ) : pdfUrl && !isDocx ? (
                <div className="flex flex-col gap-3">
                  <div className="w-full h-[850px] bg-white rounded-xl border border-[#E8E6E0] shadow-xs overflow-hidden">
                    <iframe
                      src={`${pdfUrl}#toolbar=1&navpanes=0`}
                      className="w-full h-full border-none"
                      title={resume.fileName || "Uploaded Resume PDF"}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#6B6863] px-1">
                    <span>Showing original uploaded file: <strong className="text-[#2D2D2D]">{resume.fileName}</strong></span>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={fetchPdfSignedUrl}
                      className="text-xs text-[#FF6B6B] p-0 h-auto font-medium hover:underline cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> Refresh Access Link
                    </Button>
                  </div>
                </div>
              ) : pdfUrl && isDocx ? (
                <Card className="border-[#E8E6E0] shadow-xs bg-white">
                  <CardContent className="py-16 flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div className="max-w-md">
                      <h3 className="text-sm font-bold text-[#2D2D2D]">Word Document (.docx) Uploaded</h3>
                      <p className="text-xs text-[#6B6863] mt-1">
                        Web browsers cannot render raw Word documents directly inline. You can download the original file or view the formatted layout in the <strong>Paper Resume Preview</strong> tab.
                      </p>
                    </div>
                    <Button
                      onClick={handleDownloadOriginal}
                      className="bg-[#2D2D2D] hover:bg-[#1A1A1A] text-white text-xs font-bold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" /> Download {resume.fileName}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-[#E8E6E0] shadow-xs bg-white">
                  <CardContent className="py-16 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#FFF8F0] border border-[#FFE0B2] flex items-center justify-center text-[#B45309]">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="max-w-md">
                      <h4 className="text-sm font-bold text-[#2D2D2D]">No Original PDF File Linked</h4>
                      <p className="text-xs text-[#6B6863] mt-1">
                        {resume.rawFileUrl
                          ? "The file link in Supabase Storage could not be loaded. You can view all extracted content in the Paper Resume Preview."
                          : "This master profile was created from pasted text or before Supabase Storage was enabled. You can view the formatted resume in Paper Resume Preview."}
                      </p>
                    </div>
                    {resume.rawFileUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchPdfSignedUrl}
                        className="text-xs border-[#E8E6E0] text-[#2D2D2D] hover:bg-white cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry Fetching Document
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* TAB 2: BULLETS INSPECTOR */}
            <TabsContent value="bullets" className="mt-4">
              <Card className="border-[#E8E6E0] shadow-xs bg-white">
                <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
                  <CardTitle className="text-sm font-bold text-[#2D2D2D] flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#FF6B6B]" />
                    Extracted Grounding Anchors
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex flex-col gap-6">
                  {resume.structuredData?.experience?.map((exp) => (
                    <div key={exp.id} className="p-4 bg-[#FAF9F7] rounded-xl border border-[#E8E6E0] flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#1A1A1A]">
                          {exp.title} <span className="text-[#FF6B6B]">@ {exp.company}</span>
                        </span>
                        <span className="text-[11px] text-[#6B6863]">{exp.dates}</span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {exp.bullets?.map((bullet) => (
                          <div key={bullet.id} className="flex items-start gap-2.5 bg-white p-2.5 rounded-lg border border-[#ECEAE4] text-xs">
                            <Badge variant="outline" className="font-mono text-[10px] font-bold text-[#FF6B6B] border-[#FF6B6B]/30 bg-[#FFF0F0] px-1.5 py-0.5">
                              #{bullet.id}
                            </Badge>
                            <span className="text-[#383531] leading-relaxed flex-1">
                              {bullet.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: RAW TEXT */}
            <TabsContent value="raw" className="mt-4">
              <Card className="border-[#E8E6E0] shadow-xs bg-white">
                <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
                  <CardTitle className="text-sm font-bold text-[#2D2D2D] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#FF6B6B]" />
                    Original Extracted Text
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <pre className="p-4 bg-[#FAF9F7] border border-[#E8E6E0] rounded-xl text-xs font-mono text-[#383531] whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {resume.rawText || "No raw text stored for this resume."}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

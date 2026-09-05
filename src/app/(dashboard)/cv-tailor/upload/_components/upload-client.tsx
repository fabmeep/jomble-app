"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Upload,
  FileText,
  CheckCircle2,
  Sparkles,
  Loader2,
  Edit3,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Code2,
  GraduationCap,
  Eye,
  ArrowRight,
  ArrowLeft,
  FileCode,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { StructuredCv, MasterResume } from "@/types/cv"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResumePaperPreview } from "@/components/cv-tailor/resume-paper-preview"

export default function UploadClient() {
  const router = useRouter()
  
  // Upload Form State
  const [file, setFile] = useState<File | null>(null)
  const [rawText, setRawText] = useState("")
  const [title, setTitle] = useState("")
  const [targetRole, setTargetRole] = useState("")
  const [activeUploadTab, setActiveUploadTab] = useState<"file" | "text">("file")
  
  // Processing & Review State
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [step, setStep] = useState<"UPLOAD" | "REVIEW">("UPLOAD")
  const [reviewViewMode, setReviewViewMode] = useState<"edit" | "preview" | "split">("split")

  // Extracted Master Resume
  const [createdResume, setCreatedResume] = useState<MasterResume | null>(null)
  const [cvData, setCvData] = useState<StructuredCv | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0]
      const lower = selected.name.toLowerCase()
      if (lower.endsWith(".pdf") || lower.endsWith(".docx") || lower.endsWith(".doc")) {
        setFile(selected)
        if (!title) {
          setTitle(selected.name.replace(/\.[^/.]+$/, ""))
        }
      } else {
        toast.error("Please upload a PDF or DOCX file.")
      }
    }
  }

  const handleStartExtraction = async () => {
    if (activeUploadTab === "file" && !file) {
      toast.error("Please select a resume file to upload.")
      return
    }
    if (activeUploadTab === "text" && !rawText.trim()) {
      toast.error("Please paste your resume text.")
      return
    }

    setIsUploading(true)
    setUploadProgress(20)

    try {
      const formData = new FormData()
      if (activeUploadTab === "file" && file) {
        formData.append("file", file)
      } else if (activeUploadTab === "text" && rawText) {
        formData.append("raw_text", rawText)
      }

      if (title.trim()) {
        formData.append("title", title.trim())
      }
      if (targetRole.trim()) {
        formData.append("target_role", targetRole.trim())
      }

      setUploadProgress(45)

      const response = await fetch("/api/cv/upload", {
        method: "POST",
        body: formData,
      })

      setUploadProgress(80)

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || errData.details || "Failed to process resume upload.")
      }

      const result = await response.json()
      setUploadProgress(100)

      setCreatedResume(result.masterResume)
      setCvData(result.structuredData)
      setStep("REVIEW")
      toast.success("Resume extracted into structured format! Please review your master data.")
    } catch (err: any) {
      console.error("Upload error:", err)
      toast.error(err.message || "Failed to upload and extract CV.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleUpdateBulletText = (expIndex: number, bulletIndex: number, newText: string) => {
    if (!cvData) return
    const updatedExp = [...cvData.experience]
    updatedExp[expIndex].bullets[bulletIndex].text = newText
    setCvData({ ...cvData, experience: updatedExp })
  }

  const handleConfirmMasterCv = async () => {
    if (!createdResume || !cvData) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/cv/${createdResume.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || createdResume.title,
          targetRole: targetRole || createdResume.targetRole,
          structuredData: cvData,
          confirmed: true, // marks reviewedAt timestamp
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save and verify Master CV.")
      }

      toast.success("Master CV verified & saved to your profile!")
      router.push(`/cv-tailor/master/${createdResume.id}`)
    } catch (err: any) {
      console.error("Save error:", err)
      toast.error(err.message || "Failed to save verified master resume.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6 scroll-smooth bg-[#F8F7F5]">
      <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-[#2D2D2D]">
                {step === "UPLOAD" ? "Upload Master CV" : "Review & Verify Master CV"}
              </h2>
              <Badge className="bg-[#FFF0F0] text-[#FF6B6B] border-[#FF6B6B]/20 font-semibold text-[11px]">
                Step {step === "UPLOAD" ? "1 of 2" : "2 of 2"}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#6B6863]">
              {step === "UPLOAD"
                ? "Upload your master resume PDF or DOCX. We'll extract your bullet points with stable IDs."
                : "Review and edit your structured bullet points. Verified data grounds all future tailored CV generations."}
            </p>
          </div>

          {step === "REVIEW" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("UPLOAD")}
                className="border-[#E8E6E0] text-[#6B6863] text-xs hover:bg-white"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
              </Button>
              <Button
                size="sm"
                disabled={isSaving}
                onClick={handleConfirmMasterCv}
                className="bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                )}
                Confirm & Save Master CV
              </Button>
            </div>
          )}
        </div>

        {/* STEP 1: FILE UPLOAD OR RAW TEXT INPUT */}
        {step === "UPLOAD" && (
          <div className="max-w-2xl mx-auto w-full flex flex-col gap-5">
            {/* Resume Details Card */}
            <Card className="border-[#E8E6E0] shadow-xs bg-white">
              <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
                <CardTitle className="text-sm font-bold text-[#2D2D2D] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#FF6B6B]" />
                  Resume Identification
                </CardTitle>
                <CardDescription className="text-xs text-[#6B6863]">
                  Give your master CV a label and optional target role for easy reference.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-[#2D2D2D]">CV Title / Label</Label>
                  <Input
                    placeholder="e.g., Fullstack Base Resume (EN)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-xs bg-[#FAF9F7] border-[#E8E6E0]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-[#2D2D2D]">Target Role (Optional)</Label>
                  <Input
                    placeholder="e.g., Senior Full Stack Engineer"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="text-xs bg-[#FAF9F7] border-[#E8E6E0]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ingestion Method Tabs */}
            <Card className="border-[#E8E6E0] shadow-xs bg-white">
              <CardHeader className="pb-2">
                <Tabs value={activeUploadTab} onValueChange={(v) => setActiveUploadTab(v as any)}>
                  <TabsList className="grid grid-cols-2 bg-[#F8F7F5] border border-[#E8E6E0]">
                    <TabsTrigger value="file" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#2D2D2D]">
                      <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload File (PDF / DOCX)
                    </TabsTrigger>
                    <TabsTrigger value="text" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#2D2D2D]">
                      <FileCode className="w-3.5 h-3.5 mr-1.5" /> Paste Raw Text
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>

              <CardContent className="pt-4">
                {activeUploadTab === "file" ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    className="border-2 border-dashed border-[#E8E6E0] hover:border-[#FF6B6B] bg-[#FAF9F7] rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
                    onClick={() => document.getElementById("cv-file-input")?.click()}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#FFF0F0] text-[#FF6B6B] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-[#2D2D2D]">
                      {file ? file.name : "Drag & drop your Master Resume PDF / DOCX here"}
                    </h3>
                    <p className="text-xs text-[#6B6863] mt-1 max-w-sm">
                      Supports PDF and DOCX files up to 10MB.
                    </p>

                    <input
                      type="file"
                      accept=".pdf,.docx,.doc"
                      id="cv-file-input"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const selected = e.target.files[0]
                          setFile(selected)
                          if (!title) {
                            setTitle(selected.name.replace(/\.[^/.]+$/, ""))
                          }
                        }
                      }}
                    />

                    <Button variant="outline" size="sm" type="button" className="mt-4 border-[#E8E6E0] text-[#2D2D2D] hover:bg-white text-xs font-semibold pointer-events-none">
                      {file ? "Change File" : "Browse Computer"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs font-semibold text-[#2D2D2D]">
                      Paste Master Resume Content
                    </Label>
                    <Textarea
                      rows={12}
                      placeholder="Paste your comprehensive work experience, bullet points, skills, and education here..."
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      className="text-xs font-mono bg-[#FAF9F7] border-[#E8E6E0] resize-y"
                    />
                    <span className="text-[11px] text-[#6B6863]">
                      Our extractor will parse section headings, candidate contacts, and generate bullet IDs automatically.
                    </span>
                  </div>
                )}

                {isUploading && (
                  <div className="mt-6 flex flex-col gap-2 bg-[#FFF8F0] border border-[#FFE0B2] p-4 rounded-xl">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#2D2D2D] flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#FF6B6B]" />
                        Extracting & parsing structured resume data...
                      </span>
                      <span className="font-mono text-[#6B6863] font-bold">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2 bg-[#E8E6E0]" />
                  </div>
                )}
              </CardContent>

              <CardFooter className="border-t border-[#E8E6E0]/60 flex items-center justify-between bg-[#FAF9F7] px-6 py-4">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/cv-tailor")}
                  className="text-[#6B6863] hover:text-[#2D2D2D] text-xs"
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleStartExtraction}
                  disabled={isUploading || (activeUploadTab === "file" ? !file : !rawText.trim())}
                  className="bg-[#FF6B6B] hover:bg-[#e85555] text-white text-xs font-bold cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Extracting Data...
                    </>
                  ) : (
                    <>
                      Extract & Review
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* STEP 2: REVIEW & EDIT WITH LIVE RESUME PREVIEW */}
        {step === "REVIEW" && cvData && (
          <div className="flex flex-col gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center justify-between bg-white border border-[#E8E6E0] p-2.5 rounded-xl shadow-xs">
              <div className="flex items-center gap-2">
                <Badge className="bg-[#FFF0F0] text-[#FF6B6B] border-[#FF6B6B]/20 text-xs">
                  {cvData.experience?.length || 0} Experience Entries
                </Badge>
                <Badge className="bg-[#F4F3EF] text-[#2D2A26] border-[#E0DED7] text-xs">
                  {cvData.skills?.length || 0} Skills Extracted
                </Badge>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant={reviewViewMode === "edit" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setReviewViewMode("edit")}
                  className={`text-xs ${reviewViewMode === "edit" ? "bg-[#2D2D2D] text-white" : "text-[#6B6863]"}`}
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Form
                </Button>
                <Button
                  variant={reviewViewMode === "preview" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setReviewViewMode("preview")}
                  className={`text-xs ${reviewViewMode === "preview" ? "bg-[#2D2D2D] text-white" : "text-[#6B6863]"}`}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" /> Paper Preview
                </Button>
                <Button
                  variant={reviewViewMode === "split" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setReviewViewMode("split")}
                  className={`hidden lg:flex text-xs ${reviewViewMode === "split" ? "bg-[#2D2D2D] text-white" : "text-[#6B6863]"}`}
                >
                  Side-by-Side
                </Button>
              </div>
            </div>

            {/* Split / Single View Layout */}
            <div className={`grid gap-6 ${reviewViewMode === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 max-w-4xl mx-auto w-full"}`}>
              
              {/* EDIT COLUMN */}
              {(reviewViewMode === "edit" || reviewViewMode === "split") && (
                <div className="flex flex-col gap-5">
                  {/* Contact Info Card */}
                  <Card className="border-[#E8E6E0] shadow-xs bg-white">
                    <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
                      <CardTitle className="text-sm font-bold text-[#2D2D2D] flex items-center gap-2">
                        <User className="w-4 h-4 text-[#FF6B6B]" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <Label className="text-[11px] font-bold text-[#6B6863]">Full Name</Label>
                        <Input
                          value={cvData.contact?.name || ""}
                          onChange={(e) => setCvData({ ...cvData, contact: { ...cvData.contact, name: e.target.value } })}
                          className="bg-[#FAF9F7] border-[#E8E6E0] text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-[11px] font-bold text-[#6B6863]">Email</Label>
                        <Input
                          value={cvData.contact?.email || ""}
                          onChange={(e) => setCvData({ ...cvData, contact: { ...cvData.contact, email: e.target.value } })}
                          className="bg-[#FAF9F7] border-[#E8E6E0] text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-[11px] font-bold text-[#6B6863]">Phone</Label>
                        <Input
                          value={cvData.contact?.phone || ""}
                          onChange={(e) => setCvData({ ...cvData, contact: { ...cvData.contact, phone: e.target.value } })}
                          className="bg-[#FAF9F7] border-[#E8E6E0] text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-[11px] font-bold text-[#6B6863]">Location</Label>
                        <Input
                          value={cvData.contact?.location || ""}
                          onChange={(e) => setCvData({ ...cvData, contact: { ...cvData.contact, location: e.target.value } })}
                          className="bg-[#FAF9F7] border-[#E8E6E0] text-xs"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Summary Card */}
                  <Card className="border-[#E8E6E0] shadow-xs bg-white">
                    <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
                      <CardTitle className="text-sm font-bold text-[#2D2D2D] flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-[#FF6B6B]" />
                        Professional Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <Textarea
                        rows={3}
                        value={cvData.summary || ""}
                        onChange={(e) => setCvData({ ...cvData, summary: e.target.value })}
                        className="bg-[#FAF9F7] border-[#E8E6E0] text-xs leading-relaxed"
                      />
                    </CardContent>
                  </Card>

                  {/* Experience Entries & Bullets */}
                  <Card className="border-[#E8E6E0] shadow-xs bg-white">
                    <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold text-[#2D2D2D] flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-[#FF6B6B]" />
                          Work Experience & Bullet Points
                        </CardTitle>
                        <Badge variant="outline" className="text-[11px] font-mono text-[#6B6863]">
                          Stable Bullet IDs Assigned
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 flex flex-col gap-6">
                      {cvData.experience?.map((exp, expIdx) => (
                        <div key={exp.id || expIdx} className="p-3.5 bg-[#FAF9F7] rounded-xl border border-[#E8E6E0] flex flex-col gap-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="flex flex-col gap-1">
                              <Label className="text-[10px] font-bold text-[#6B6863] uppercase">Role / Title</Label>
                              <Input
                                value={exp.title}
                                onChange={(e) => {
                                  const updated = [...cvData.experience]
                                  updated[expIdx].title = e.target.value
                                  setCvData({ ...cvData, experience: updated })
                                }}
                                className="bg-white border-[#E8E6E0] text-xs font-semibold"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label className="text-[10px] font-bold text-[#6B6863] uppercase">Company</Label>
                              <Input
                                value={exp.company}
                                onChange={(e) => {
                                  const updated = [...cvData.experience]
                                  updated[expIdx].company = e.target.value
                                  setCvData({ ...cvData, experience: updated })
                                }}
                                className="bg-white border-[#E8E6E0] text-xs"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <Label className="text-[10px] font-bold text-[#6B6863] uppercase">Dates</Label>
                              <Input
                                value={exp.dates}
                                onChange={(e) => {
                                  const updated = [...cvData.experience]
                                  updated[expIdx].dates = e.target.value
                                  setCvData({ ...cvData, experience: updated })
                                }}
                                className="bg-white border-[#E8E6E0] text-xs"
                              />
                            </div>
                          </div>

                          {/* Bullet points */}
                          <div className="flex flex-col gap-2 pt-1">
                            <Label className="text-[11px] font-bold text-[#2D2D2D] flex items-center justify-between">
                              <span>Accomplishment Bullets</span>
                              <span className="text-[10px] font-normal text-[#6B6863]">
                                Grounding anchors for AI tailoring
                              </span>
                            </Label>

                            {exp.bullets?.map((bullet, bIdx) => (
                              <div key={bullet.id || bIdx} className="flex items-start gap-2">
                                <span className="mt-2 font-mono text-[10px] font-bold bg-white border border-[#E8E6E0] text-[#FF6B6B] px-1.5 py-0.5 rounded shadow-2xs">
                                  #{bullet.id}
                                </span>
                                <Textarea
                                  rows={2}
                                  value={bullet.text}
                                  onChange={(e) => handleUpdateBulletText(expIdx, bIdx, e.target.value)}
                                  className="bg-white border-[#E8E6E0] text-xs leading-relaxed flex-1"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Skills Card */}
                  <Card className="border-[#E8E6E0] shadow-xs bg-white">
                    <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
                      <CardTitle className="text-sm font-bold text-[#2D2D2D] flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-[#FF6B6B]" />
                        Skills (Comma Separated)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <Textarea
                        rows={3}
                        value={cvData.skills?.join(", ") || ""}
                        onChange={(e) => {
                          const newSkills = e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                          setCvData({ ...cvData, skills: newSkills })
                        }}
                        className="bg-[#FAF9F7] border-[#E8E6E0] text-xs"
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* PREVIEW COLUMN */}
              {(reviewViewMode === "preview" || reviewViewMode === "split") && (
                <div className="sticky top-6 flex flex-col gap-3">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold text-[#2D2D2D] flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#FF6B6B]" /> Live Paper Resume Preview
                    </span>
                    <span className="text-[11px] text-[#6B6863]">
                      Updates instantly as you edit
                    </span>
                  </div>

                  <ResumePaperPreview
                    data={cvData}
                    title={title || createdResume?.title}
                    targetRole={targetRole || createdResume?.targetRole}
                    showBulletIds={true}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, ArrowLeft, Briefcase, User, Edit3, Loader2, Code2 } from "lucide-react"
import { toast } from "sonner"
import { MasterResume, StructuredCv } from "@/types/cv"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface EditMasterClientProps {
  masterCv: MasterResume
}

export default function EditMasterClient({ masterCv }: EditMasterClientProps) {
  const router = useRouter()
  const [title, setTitle] = useState(masterCv.title)
  const [targetRole, setTargetRole] = useState(masterCv.targetRole || "")
  const [cvData, setCvData] = useState<StructuredCv>(masterCv.structuredData)
  const [isSaving, setIsSaving] = useState(false)

  const handleUpdateBulletText = (expIndex: number, bulletIndex: number, newText: string) => {
    const updatedExp = [...cvData.experience]
    updatedExp[expIndex].bullets[bulletIndex].text = newText
    setCvData({ ...cvData, experience: updatedExp })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/cv/${masterCv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          targetRole,
          structuredData: cvData,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to save changes.")
      }

      toast.success("Master CV data updated successfully!")
      router.push(`/cv-tailor/master/${masterCv.id}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to update master resume.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6 scroll-smooth bg-[#F8F7F5]">
      <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
        
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push(`/cv-tailor/master/${masterCv.id}`)}
            className="text-[#6B6863] hover:text-[#2D2D2D] text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Resume Preview
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            )}
            Save Changes
          </Button>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-[#2D2D2D]">Edit Structured Master CV</h2>
          <p className="text-xs sm:text-sm text-[#6B6863]">
            Update your master bullet points. Modifications apply to all future tailored CV generations.
          </p>
        </div>

        {/* Profile Title & Target Role */}
        <Card className="border-[#E8E6E0] shadow-xs bg-white">
          <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
            <CardTitle className="text-sm font-bold text-[#2D2D2D]">
              Profile Identification
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-[#2D2D2D]">Resume Title / Label</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-[#FAF9F7] border-[#E8E6E0] text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-[#2D2D2D]">Target Role</Label>
              <Input
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="bg-[#FAF9F7] border-[#E8E6E0] text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact info */}
        <Card className="border-[#E8E6E0] shadow-xs bg-white">
          <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
            <CardTitle className="text-sm font-bold text-[#2D2D2D] flex items-center gap-2">
              <User className="w-4 h-4 text-[#FF6B6B]" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Summary */}
        <Card className="border-[#E8E6E0] shadow-xs bg-white">
          <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
            <CardTitle className="text-sm font-bold text-[#2D2D2D] flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#FF6B6B]" />
              Master Summary
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

        {/* Experience & Bullets */}
        <Card className="border-[#E8E6E0] shadow-xs bg-white">
          <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
            <CardTitle className="text-sm font-bold text-[#2D2D2D] flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#FF6B6B]" />
              Experience & Bullet Points
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-6">
            {cvData.experience?.map((exp, expIdx) => (
              <div key={exp.id || expIdx} className="p-4 bg-[#FAF9F7] rounded-xl border border-[#E8E6E0] flex flex-col gap-3">
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

                {/* Bullets */}
                <div className="flex flex-col gap-2 pt-1">
                  <Label className="text-[11px] font-bold text-[#2D2D2D]">
                    Accomplishment Bullets
                  </Label>
                  {exp.bullets?.map((bullet, bIdx) => (
                    <div key={bullet.id || bIdx} className="flex items-start gap-2">
                      <span className="mt-2 font-mono text-[10px] font-bold bg-white border border-[#E8E6E0] text-[#FF6B6B] px-1.5 py-0.5 rounded">
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

        {/* Skills */}
        <Card className="border-[#E8E6E0] shadow-xs bg-white">
          <CardHeader className="pb-3 border-b border-[#E8E6E0]/60">
            <CardTitle className="text-sm font-bold text-[#2D2D2D] flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#FF6B6B]" />
              Skills
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
          <CardFooter className="border-t border-[#E8E6E0]/60 flex items-center justify-end bg-[#FAF9F7] px-6 py-3">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              )}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

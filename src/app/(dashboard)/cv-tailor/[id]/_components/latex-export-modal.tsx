"use client"

import React, { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, Download, ExternalLink, FileCode, CheckCircle2, Code2 } from "lucide-react"
import { toast } from "sonner"

interface LatexExportModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  latexCode: string
  jobTitle?: string
  companyName?: string
}

export default function LatexExportModal({
  isOpen,
  onOpenChange,
  latexCode,
  jobTitle,
  companyName,
}: LatexExportModalProps) {
  const [copied, setCopied] = useState(false)

  const lineCount = useMemo(() => {
    return latexCode ? latexCode.split("\n").length : 0
  }, [latexCode])

  const handleCopy = () => {
    navigator.clipboard.writeText(latexCode)
    setCopied(true)
    toast.success("LaTeX code copied to clipboard! Paste directly into Overleaf.")
    setTimeout(() => setCopied(false), 2500)
  }

  const handleDownload = () => {
    const cleanTitle = (jobTitle || "resume")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    const fileName = `${cleanTitle}-jakes-resume.tex`

    const blob = new Blob([latexCode], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`Downloaded ${fileName}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-w-4xl w-[95vw] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border-[#E8E6E0] rounded-2xl shadow-2xl">
        
        {/* Generous, Uncramped Header */}
        <DialogHeader className="p-6 pb-5 border-b border-[#E8E6E0] bg-[#FAF9F7]/80 pr-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#FFF0F0] text-[#FF6B6B] border border-[#FF6B6B]/20 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                <FileCode className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-lg font-bold text-[#2D2D2D]">
                    Export to Overleaf
                  </DialogTitle>
                  <Badge className="bg-[#FFF0F0] text-[#FF6B6B] border-[#FF6B6B]/30 text-[10px] font-bold">
                    Jake's Resume ATS Format
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-[#6B6863]">
                  Standard single-column LaTeX format tailored for{" "}
                  <span className="font-semibold text-[#2D2D2D]">{companyName || "Target Role"}</span>
                </DialogDescription>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="border-[#E8E6E0] bg-white hover:bg-[#FAF9F7] text-xs font-semibold h-9 px-3.5 cursor-pointer shadow-xs text-[#2D2D2D]"
              >
                <Download className="w-4 h-4 mr-1.5 text-[#6B6863]" />
                Download .tex
              </Button>

              <Button
                size="sm"
                onClick={handleCopy}
                className="bg-[#FF6B6B] hover:bg-[#e85555] text-white text-xs font-bold h-9 px-4 cursor-pointer shadow-xs transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5 text-white" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1.5" />
                    Copy LaTeX Code
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Spacious How-To Steps Banner */}
        <div className="bg-[#FFF8F0] border-b border-[#FFE0B2]/70 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#8A4B00]">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-extrabold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-md bg-[#FFE0B2] text-[#8A4B00] shrink-0">
              3 Quick Steps
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-[#2D2D2D]">1. Click Copy Code</span>
              <span className="text-[#8A4B00]/40">→</span>
              <span className="font-semibold text-[#2D2D2D]">2. Open Overleaf & Create Blank Project</span>
              <span className="text-[#8A4B00]/40">→</span>
              <span className="font-semibold text-[#2D2D2D]">3. Paste & Hit Recompile</span>
            </div>
          </div>
          <a
            href="https://www.overleaf.com/project"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-bold text-xs text-[#FF6B6B] hover:text-[#e85555] shrink-0 hover:underline cursor-pointer"
          >
            Open Overleaf <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Code Editor Header Bar */}
        <div className="bg-[#1E1E22] px-6 py-2 border-b border-[#2D2D32] flex items-center justify-between text-xs text-[#9CA3AF]">
          <div className="flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5 text-[#FF6B6B]" />
            <span className="font-mono text-xs font-semibold text-[#E5E7EB]">resume.tex</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span>{lineCount} lines</span>
            <span>•</span>
            <span className="text-[#4ADE80]">ATS Optimized</span>
            <span>•</span>
            <span>UTF-8</span>
          </div>
        </div>

        {/* Monospace Code Preview */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-5 bg-[#18181B] text-[#D4D4D4] font-mono text-xs leading-relaxed max-h-[50vh] min-h-[340px] select-all">
          <pre className="m-0 font-mono">
            <code>{latexCode}</code>
          </pre>
        </div>

        {/* Spacious Footer */}
        <div className="p-4 px-6 border-t border-[#E8E6E0] bg-[#FAF9F7] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#6B6863]">
          <span>Template: Jake Gutierrez (MIT License) • Built-in character escaping for Overleaf compiler</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs text-[#6B6863] hover:text-[#2D2D2D] h-8 px-4 border-[#E8E6E0] bg-white cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}

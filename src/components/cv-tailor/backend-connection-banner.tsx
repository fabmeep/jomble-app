"use client"

import React, { useState } from "react"
import { Server, RefreshCw, Terminal, CheckCircle2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BackendHealthState } from "@/hooks/use-backend-health"

interface BackendConnectionBannerProps {
  health: BackendHealthState
}

export function BackendConnectionBanner({ health }: BackendConnectionBannerProps) {
  const [copied, setCopied] = useState(false)
  const commandText = `cd backend && .\\venv\\Scripts\\python.exe -m uvicorn app.main:app --reload`

  const handleCopy = () => {
    navigator.clipboard.writeText(commandText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (health.isConnected) {
    return (
      <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-3.5 rounded-xl flex items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-2.5 text-xs text-[#166534]">
          <CheckCircle2 className="w-4 h-4 text-[#166534] flex-shrink-0" />
          <span className="font-semibold">Local Server Active:</span>
          <span>FastAPI backend connected at http://localhost:8000</span>
        </div>
        <Badge className="bg-[#DCFCE7] text-[#15803D] border-[#86EFAC] text-[11px] font-mono">
          Online
        </Badge>
      </div>
    )
  }

  return (
    <div className="bg-[#FFF0F0] border border-[#FF6B6B]/30 p-4 rounded-xl flex flex-col gap-3 transition-all animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B6B]/15 text-[#FF6B6B] flex items-center justify-center flex-shrink-0 mt-0.5">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-[#2D2D2D]">FastAPI Local Server Offline</h4>
              <Badge variant="outline" className="text-[10px] border-[#FF6B6B]/30 text-[#FF6B6B] bg-white">
                Retrying every 5s...
              </Badge>
            </div>
            <p className="text-xs text-[#6B6863] mt-0.5">
              Start your local Python server to enable AI CV generation & API plumbing.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => health.checkConnection()}
          disabled={health.isChecking}
          className="border-[#FF6B6B]/30 text-[#2D2D2D] hover:bg-white text-xs font-semibold self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-[#FF6B6B] ${health.isChecking ? "animate-spin" : ""}`} />
          {health.isChecking ? "Checking..." : "Retry Connection"}
        </Button>
      </div>

      {/* Terminal Command Instructions */}
      <div className="bg-[#2D2D2D] text-white p-3 rounded-lg flex items-center justify-between gap-2 font-mono text-[11px] overflow-x-auto border border-[#1A1A1A]">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="w-3.5 h-3.5 text-[#FF6B6B] flex-shrink-0" />
          <span className="text-[#A3A3A3] select-none">$</span>
          <span className="truncate">{commandText}</span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleCopy}
          className="h-6 w-6 text-[#A3A3A3] hover:text-white hover:bg-white/10 flex-shrink-0 cursor-pointer"
          title="Copy command"
        >
          {copied ? <Check className="w-3 h-3 text-[#4ADE80]" /> : <Copy className="w-3 h-3" />}
        </Button>
      </div>
    </div>
  )
}

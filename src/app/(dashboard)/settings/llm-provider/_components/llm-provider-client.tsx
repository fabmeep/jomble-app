"use client"

import React, { useState } from "react"
import { Bot, CheckCircle2, AlertTriangle, Loader2, Sparkles, ShieldAlert, ExternalLink, Zap } from "lucide-react"
import { toast } from "sonner"
import { LlmProviderConfig, LlmProviderType } from "@/types/cv"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface LlmProviderClientProps {
  initialConfig: LlmProviderConfig
}

const PRESET_GEMINI_MODELS = [
  { value: "gemini-flash-lite-latest", label: "gemini-flash-lite-latest (Ultra Fast ~1s - Recommended)" },
  { value: "gemini-3.1-flash-lite", label: "gemini-3.1-flash-lite (Fast & Responsive)" },
  { value: "gemini-3.5-flash-lite", label: "gemini-3.5-flash-lite (Balanced 3.5)" },
  { value: "gemini-3.5-flash", label: "gemini-3.5-flash (High Precision 3.5)" },
  { value: "gemini-3.7-flash", label: "gemini-3.7-flash (Extended Reasoning)" },
]

export default function LlmProviderClient({ initialConfig }: LlmProviderClientProps) {
  const [provider, setProvider] = useState<LlmProviderType>(initialConfig.provider || "GEMINI")
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState(initialConfig.ollamaBaseUrl || "http://localhost:11434")
  const [ollamaModel, setOllamaModel] = useState(initialConfig.ollamaModel || "qwen2.5:3b")
  const [geminiApiKey, setGeminiApiKey] = useState(initialConfig.geminiApiKeyEncrypted || "")
  
  const initialGeminiModel = initialConfig.geminiModel || "gemini-3.7-flash"
  const isPreset = PRESET_GEMINI_MODELS.some((m) => m.value === initialGeminiModel)
  const [geminiSelectValue, setGeminiSelectValue] = useState(isPreset ? initialGeminiModel : "custom")
  const [geminiModel, setGeminiModel] = useState(initialGeminiModel)

  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [testResult, setTestResult] = useState<{
    ok: boolean
    message: string
    timestamp?: string
  } | null>(
    initialConfig.lastTestOk !== undefined && initialConfig.lastTestOk !== null
      ? {
          ok: initialConfig.lastTestOk,
          message: initialConfig.lastTestOk
            ? "Connection tested successfully."
            : "Connection failed during last test.",
          timestamp: initialConfig.lastTestedAt || undefined,
        }
      : null
  )

  const handleGeminiSelectChange = (value: string) => {
    setGeminiSelectValue(value)
    if (value !== "custom") {
      setGeminiModel(value)
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const res = await fetch("/api/settings/llm-provider/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, ollamaBaseUrl, ollamaModel, geminiApiKey, geminiModel }),
      })

      const data = await res.json()

      setTestResult({
        ok: data.ok,
        message: data.message,
        timestamp: data.timestamp || new Date().toLocaleTimeString(),
      })

      if (data.ok) {
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      const msg = (err as Error).message || "Connection test failed."
      setTestResult({
        ok: false,
        message: msg,
        timestamp: new Date().toLocaleTimeString(),
      })
      toast.error(msg)
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const res = await fetch("/api/settings/llm-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          ollamaBaseUrl,
          ollamaModel,
          geminiApiKey,
          geminiModel,
          lastTestOk: testResult ? testResult.ok : undefined,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || errData.details || "Failed to save configuration.")
      }

      toast.success("LLM Provider configuration saved successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto w-full p-6 scroll-smooth bg-[#F8F7F5]">
      <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
        
        {/* Title */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-[#2D2D2D]">LLM Provider Settings</h2>
              <Badge className="bg-[#FFF0F0] text-[#FF6B6B] border-[#FF6B6B]/20 hover:bg-[#FFF0F0] font-semibold text-[11px]">
                BYOK Architecture
              </Badge>
            </div>
            <p className="text-sm text-[#6B6863]">
              Configure your local Ollama server or personal Gemini API key to power CV tailoring.
            </p>
          </div>
        </div>

        {/* Main Config Card */}
        <Card className="border-[#E8E6E0] shadow-xs bg-white">
          <CardHeader className="border-b border-[#E8E6E0]/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#FFF0F0] text-[#FF6B6B] flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base text-[#2D2D2D]">Select Provider</CardTitle>
                <CardDescription className="text-xs text-[#6B6863]">
                  Choose between local zero-cost privacy or cloud AI inference.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 flex flex-col gap-6">
            
            {/* Provider Tabs */}
            <Tabs
              value={provider}
              onValueChange={(val) => {
                setProvider(val as LlmProviderType)
                setTestResult(null)
              }}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full bg-[#F8F7F5] border border-[#E8E6E0] p-1 h-auto rounded-xl">
                <TabsTrigger
                  value="GEMINI"
                  className="py-2.5 rounded-lg font-semibold text-xs data-[state=active]:bg-white data-[state=active]:text-[#FF6B6B] data-[state=active]:shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#4285F4]" />
                  <span>Google Gemini (BYOK)</span>
                </TabsTrigger>
                <TabsTrigger
                  value="OLLAMA"
                  className="py-2.5 rounded-lg font-semibold text-xs data-[state=active]:bg-white data-[state=active]:text-[#FF6B6B] data-[state=active]:shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-[#FF8C42]" />
                  <span>Ollama (Local & Free)</span>
                </TabsTrigger>
              </TabsList>

              {/* Gemini Tab Content */}
              <TabsContent value="GEMINI" className="mt-5 flex flex-col gap-4">
                {/* MANDATORY PRIVACY DISCLAIMER */}
                <div className="bg-[#FFF0F0] border border-[#FF6B6B]/20 p-4 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#FF6B6B] flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-[#2D2D2D] leading-relaxed">
                    <span className="font-bold text-[#FF6B6B]">Important Privacy Notice:</span> Google's free tier may use inputs to improve their models. Your CV data will be processed via your Gemini API key. Use <span className="font-semibold underline">Ollama</span> for 100% private local execution.
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-[#6B6863] uppercase tracking-wide">
                        Gemini API Key
                      </Label>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#FF6B6B] hover:underline flex items-center gap-1 font-medium"
                      >
                        Get free API Key <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <Input
                      type="password"
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="bg-[#F8F7F5] border-[#E8E6E0] text-xs font-mono text-[#2D2D2D] focus-visible:ring-[#FF6B6B]"
                    />
                    <span className="text-[11px] text-[#6B6863]">
                      Your key is securely stored in your personal database profile.
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-bold text-[#6B6863] uppercase tracking-wide">
                      Gemini Model Name
                    </Label>
                    <select
                      value={geminiSelectValue}
                      onChange={(e) => handleGeminiSelectChange(e.target.value)}
                      className="bg-[#F8F7F5] border border-[#E8E6E0] text-xs font-medium rounded-lg p-2.5 text-[#2D2D2D] outline-none focus:border-[#FF6B6B] cursor-pointer"
                    >
                      {PRESET_GEMINI_MODELS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                      <option value="custom">Custom Model Name (specify below)</option>
                    </select>

                    {geminiSelectValue === "custom" && (
                      <div className="mt-2 flex flex-col gap-1">
                        <Input
                          value={geminiModel}
                          onChange={(e) => setGeminiModel(e.target.value)}
                          placeholder="e.g. gemini-3.7-flash or gemini-2.0-flash-exp"
                          className="bg-[#F8F7F5] border-[#E8E6E0] text-xs font-mono text-[#2D2D2D] focus-visible:ring-[#FF6B6B]"
                        />
                        <span className="text-[11px] text-[#6B6863]">
                          Enter any custom or preview model identifier available in your Google AI Studio account.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Ollama Tab Content */}
              <TabsContent value="OLLAMA" className="mt-5 flex flex-col gap-4">
                <div className="bg-[#FFF8F0] border border-[#FFE0B2] p-3.5 rounded-xl flex items-start gap-3">
                  <ShieldAlert className="w-4 h-4 text-[#FF8C42] flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-[#8A4B00] leading-relaxed">
                    <span className="font-semibold">Privacy First:</span> Ollama runs 100% locally on your computer. Your CV data never leaves your machine and zero API keys are required.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-bold text-[#6B6863] uppercase tracking-wide">
                      Ollama Base URL
                    </Label>
                    <Input
                      value={ollamaBaseUrl}
                      onChange={(e) => setOllamaBaseUrl(e.target.value)}
                      placeholder="http://localhost:11434"
                      className="bg-[#F8F7F5] border-[#E8E6E0] text-xs font-mono text-[#2D2D2D] focus-visible:ring-[#FF6B6B]"
                    />
                    <span className="text-[11px] text-[#6B6863]">Default: http://localhost:11434</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-bold text-[#6B6863] uppercase tracking-wide">
                      Ollama Model Tag
                    </Label>
                    <Input
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      placeholder="qwen2.5:3b"
                      className="bg-[#F8F7F5] border-[#E8E6E0] text-xs font-mono text-[#2D2D2D] focus-visible:ring-[#FF6B6B]"
                    />
                    <span className="text-[11px] text-[#6B6863]">Recommended: qwen2.5:3b or llama3.2</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Test Connection Banner */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
                  testResult.ok
                    ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]"
                    : "bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]"
                }`}
              >
                <div className="flex items-center gap-2">
                  {testResult.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-[#166534] flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-[#991B1B] flex-shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
                {testResult.timestamp && (
                  <span className="text-[11px] opacity-75 font-mono ml-2 flex-shrink-0">Tested: {testResult.timestamp}</span>
                )}
              </div>
            )}

          </CardContent>

          <CardFooter className="border-t border-[#E8E6E0]/60 flex items-center justify-between bg-[#FAF9F7] px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="border-[#E8E6E0] text-[#2D2D2D] hover:bg-white text-xs font-semibold cursor-pointer"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-[#FF6B6B]" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#FF6B6B] hover:bg-[#e85555] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

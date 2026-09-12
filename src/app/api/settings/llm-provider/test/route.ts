import { NextResponse } from "next/server"
import { getFastApiBaseUrl } from "@/lib/fastapi"
import { isCvTailorEnabled } from "@/lib/feature-flags"

export async function POST(req: Request) {
  if (!isCvTailorEnabled()) {
    return NextResponse.json(
      { ok: false, message: "LLM provider testing is disabled on this deployment." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { provider, geminiApiKey, geminiModel, ollamaBaseUrl, ollamaModel } = body
    const backendUrl = getFastApiBaseUrl()

    const startTime = Date.now()

    // 1. If testing Gemini BYOK
    if (provider === "GEMINI") {
      if (!geminiApiKey || !geminiApiKey.trim()) {
        return NextResponse.json(
          {
            ok: false,
            message: "Please provide a Gemini API Key to test.",
            timestamp: new Date().toLocaleTimeString(),
          },
          { status: 400 }
        )
      }

      const model = geminiModel || "gemini-3.7-flash"
      const cleanModel = model.startsWith("models/") ? model : `models/${model}`
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/${cleanModel}:generateContent?key=${geminiApiKey.trim()}`

      try {
        const geminiRes = await fetch(testUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: "ping" }],
              },
            ],
            generationConfig: {
              maxOutputTokens: 5,
            },
          }),
        })

        const responseTimeMs = Date.now() - startTime

        if (geminiRes.ok) {
          return NextResponse.json({
            ok: true,
            message: `Google Gemini API connected successfully with ${model} (${responseTimeMs}ms)`,
            timestamp: new Date().toLocaleTimeString(),
          })
        } else {
          const errData = await geminiRes.json().catch(() => ({}))
          const errMsg = errData.error?.message || `HTTP ${geminiRes.status}`
          return NextResponse.json(
            {
              ok: false,
              message: `Gemini API test failed: ${errMsg}`,
              timestamp: new Date().toLocaleTimeString(),
            },
            { status: 400 }
          )
        }
      } catch (geminiErr: any) {
        return NextResponse.json(
          {
            ok: false,
            message: `Failed to reach Google Gemini API: ${geminiErr.message}`,
            timestamp: new Date().toLocaleTimeString(),
          },
          { status: 503 }
        )
      }
    }

    // 2. If testing Ollama
    if (provider === "OLLAMA") {
      const url = (ollamaBaseUrl || "http://localhost:11434").replace(/\/+$/, "")
      try {
        const ollamaRes = await fetch(`${url}/api/tags`, {
          method: "GET",
          signal: AbortSignal.timeout(4000),
        })

        const responseTimeMs = Date.now() - startTime

        if (ollamaRes.ok) {
          const data = await ollamaRes.json().catch(() => ({}))
          const models = (data.models || []).map((m: any) => m.name).join(", ")
          return NextResponse.json({
            ok: true,
            message: `Ollama connected successfully at ${url} (${responseTimeMs}ms). Available models: ${models || "none found"}`,
            timestamp: new Date().toLocaleTimeString(),
          })
        } else {
          return NextResponse.json(
            {
              ok: false,
              message: `Ollama server returned HTTP ${ollamaRes.status}`,
              timestamp: new Date().toLocaleTimeString(),
            },
            { status: 502 }
          )
        }
      } catch (ollamaErr: any) {
        return NextResponse.json(
          {
            ok: false,
            message: `Could not connect to Ollama at ${url}. Make sure Ollama is running ('ollama serve').`,
            timestamp: new Date().toLocaleTimeString(),
          },
          { status: 503 }
        )
      }
    }

    // 3. Fallback: test FastAPI health
    const res = await fetch(`${backendUrl}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(4000),
    })

    if (res.ok) {
      return NextResponse.json({
        ok: true,
        message: `FastAPI backend is online at ${backendUrl} (${Date.now() - startTime}ms)`,
        timestamp: new Date().toLocaleTimeString(),
      })
    } else {
      return NextResponse.json(
        {
          ok: false,
          message: `FastAPI returned HTTP ${res.status}`,
          timestamp: new Date().toLocaleTimeString(),
        },
        { status: 502 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        message: error.message || "Connection test failed.",
        timestamp: new Date().toLocaleTimeString(),
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST(new Request("http://localhost:3000/api/settings/llm-provider/test", { method: "POST" }))
}

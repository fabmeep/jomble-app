import { NextRequest } from "next/server"
import { getUserId } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { apiSuccess, apiUnauthorized, apiError, apiBadRequest } from "@/lib/api-response"
import { LlmProvider } from "@prisma/client"
import { isCvTailorEnabled } from "@/lib/feature-flags"

export async function GET() {
  if (!isCvTailorEnabled()) {
    return apiSuccess(null)
  }

  try {
    const userId = await getUserId()
    const config = await prisma.llmProviderConfig.findFirst({
      where: { userId, isActive: true },
    })

    return apiSuccess(config || null)
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      return apiUnauthorized(error.message)
    }
    console.error("Error fetching LLM provider config:", error)
    return apiError("Failed to fetch LLM provider configuration")
  }
}

export async function POST(req: NextRequest) {
  if (!isCvTailorEnabled()) {
    return apiError("LLM provider configuration is disabled on this deployment.", 503)
  }

  try {
    const userId = await getUserId()
    const body = await req.json()

    const { provider, ollamaBaseUrl, ollamaModel, geminiApiKey, geminiModel, lastTestOk } = body

    if (!provider || !["OLLAMA", "GEMINI"].includes(provider)) {
      return apiBadRequest("Invalid LLM provider specified.")
    }

    const providerEnum = provider as LlmProvider

    // Deactivate previous configs for user
    await prisma.llmProviderConfig.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    })

    const config = await prisma.llmProviderConfig.upsert({
      where: {
        userId_provider: {
          userId,
          provider: providerEnum,
        },
      },
      create: {
        userId,
        provider: providerEnum,
        ollamaBaseUrl: ollamaBaseUrl || "http://localhost:11434",
        ollamaModel: ollamaModel || "qwen2.5:3b",
        geminiApiKeyEncrypted: geminiApiKey || null,
        geminiModel: geminiModel || "gemini-3.7-flash",
        isActive: true,
        lastTestedAt: lastTestOk !== undefined ? new Date() : undefined,
        lastTestOk: lastTestOk !== undefined ? lastTestOk : undefined,
      },
      update: {
        ollamaBaseUrl: ollamaBaseUrl || "http://localhost:11434",
        ollamaModel: ollamaModel || "qwen2.5:3b",
        geminiApiKeyEncrypted: geminiApiKey !== undefined ? geminiApiKey : undefined,
        geminiModel: geminiModel || "gemini-3.7-flash",
        isActive: true,
        ...(lastTestOk !== undefined && {
          lastTestedAt: new Date(),
          lastTestOk: lastTestOk,
        }),
      },
    })

    return apiSuccess(config)
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      return apiUnauthorized(error.message)
    }
    console.error("Error saving LLM provider config:", error)
    return apiError(error.message || "Failed to save LLM provider configuration")
  }
}

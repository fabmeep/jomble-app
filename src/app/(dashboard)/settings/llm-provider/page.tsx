import { auth } from "@/auth"
import { redirect } from "next/navigation"
import LlmProviderClient from "./_components/llm-provider-client"
import { prisma } from "@/lib/prisma"
import { LlmProviderConfig } from "@/types/cv"

export default async function LlmProviderSettingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const dbConfig = await prisma.llmProviderConfig.findFirst({
    where: { userId: session.user.id, isActive: true },
  })

  const initialConfig: LlmProviderConfig = {
    provider: dbConfig?.provider || "GEMINI",
    ollamaBaseUrl: dbConfig?.ollamaBaseUrl || "http://localhost:11434",
    ollamaModel: dbConfig?.ollamaModel || "qwen2.5:3b",
    geminiApiKeyEncrypted: dbConfig?.geminiApiKeyEncrypted || "",
    geminiModel: dbConfig?.geminiModel || "gemini-3.7-flash",
    isActive: dbConfig?.isActive ?? true,
    lastTestedAt: dbConfig?.lastTestedAt ? dbConfig.lastTestedAt.toISOString() : null,
    lastTestOk: dbConfig?.lastTestOk ?? null,
  }

  return <LlmProviderClient initialConfig={initialConfig} />
}

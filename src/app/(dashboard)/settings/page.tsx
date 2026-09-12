import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import SettingsClient from "./_components/settings-client"
import { LlmProviderConfig } from "@/types/cv"

import { isCvTailorEnabled } from "@/lib/feature-flags"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { tab } = await searchParams
  const cvTailorEnabled = isCvTailorEnabled()

  const name = session.user.name || "User"
  const email = session.user.email || ""
  const avatar = session.user.image

  // Fetch user settings and active LLM configuration in parallel
  const [dbUser, dbConfig] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { ghostThresholdDays: true },
    }),
    cvTailorEnabled
      ? prisma.llmProviderConfig.findFirst({
          where: { userId: session.user.id, isActive: true },
        })
      : null,
  ])

  const initialThreshold = dbUser?.ghostThresholdDays ?? 30

  const initialLlmConfig: LlmProviderConfig = {
    provider: dbConfig?.provider || "GEMINI",
    ollamaBaseUrl: dbConfig?.ollamaBaseUrl || "http://localhost:11434",
    ollamaModel: dbConfig?.ollamaModel || "qwen2.5:3b",
    geminiApiKeyEncrypted: dbConfig?.geminiApiKeyEncrypted || "",
    geminiModel: dbConfig?.geminiModel || "gemini-3.7-flash",
    isActive: dbConfig?.isActive ?? true,
    lastTestedAt: dbConfig?.lastTestedAt ? dbConfig.lastTestedAt.toISOString() : null,
    lastTestOk: dbConfig?.lastTestOk ?? null,
  }

  return (
    <SettingsClient
      name={name}
      email={email}
      avatar={avatar}
      initialGhostThresholdDays={initialThreshold}
      initialLlmConfig={initialLlmConfig}
      defaultTab={tab && (tab !== "llm-provider" || cvTailorEnabled) ? tab : "general"}
      enableCvTailor={cvTailorEnabled}
    />
  )
}

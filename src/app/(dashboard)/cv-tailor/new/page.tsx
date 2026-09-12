import { auth } from "@/auth"
import { redirect } from "next/navigation"
import TailorWizardClient from "./_components/tailor-wizard-client"
import { CvService } from "@/lib/services/cv.service"
import { prisma } from "@/lib/prisma"
import { MasterResume, JobDescription, StructuredCv, JdRequirements, ScrapeMethod, LlmProviderConfig, LlmProviderType } from "@/types/cv"
import { isCvTailorEnabled } from "@/lib/feature-flags"

export default async function NewTailoredCvPage({
  searchParams,
}: {
  searchParams: Promise<{ masterId?: string; jobAppId?: string; applicationId?: string; jdId?: string }>
}) {
  if (!isCvTailorEnabled()) {
    redirect("/dashboard")
  }

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { masterId, jobAppId, applicationId, jdId } = await searchParams
  const targetAppId = jobAppId || applicationId

  // 1. Fetch user master resumes
  const rawResumes = await CvService.getMasterResumes(session.user.id)

  if (rawResumes.length === 0) {
    redirect("/cv-tailor/upload")
  }

  const masterResumes: MasterResume[] = rawResumes.map((r) => ({
    id: r.id,
    userId: r.userId,
    title: r.title,
    targetRole: r.targetRole,
    rawFileUrl: r.rawFileUrl,
    fileName: r.fileName,
    rawText: r.rawText,
    structuredData: r.structuredData as unknown as StructuredCv,
    isDefault: r.isDefault,
    reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))

  const activeMasterCv =
    (masterId ? masterResumes.find((r) => r.id === masterId) : null) ||
    masterResumes.find((r) => r.isDefault) ||
    masterResumes[0]

  // 2. Fetch Job Description or target Job Application
  let dbJd = null
  if (jdId) {
    dbJd = await prisma.jobDescription.findFirst({
      where: { id: jdId, userId: session.user.id },
    })
  } else if (targetAppId) {
    dbJd = await prisma.jobDescription.findFirst({
      where: { jobAppId: targetAppId, userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })
  }

  let targetApp = null
  if (targetAppId) {
    targetApp = await prisma.jobApplication.findFirst({
      where: { id: targetAppId, userId: session.user.id },
      include: { jobDescriptions: { orderBy: { createdAt: "desc" }, take: 1 } },
    })
    if (!dbJd && targetApp?.jobDescriptions?.[0]) {
      dbJd = targetApp.jobDescriptions[0]
    }
  }

  const defaultCompanyName =
    (targetApp?.companyName && targetApp.companyName !== "Target Company")
      ? targetApp.companyName
      : (dbJd?.companyName && dbJd.companyName !== "Target Company")
      ? dbJd.companyName
      : null

  const defaultJobTitle =
    (targetApp?.jobTitle && targetApp.jobTitle !== "Position" && targetApp.jobTitle !== "Target Role")
      ? targetApp.jobTitle
      : (dbJd?.jobTitle && dbJd.jobTitle !== "Position" && dbJd.jobTitle !== "Target Role")
      ? dbJd.jobTitle
      : null

  const initialJd: JobDescription = dbJd
    ? {
        id: dbJd.id,
        userId: dbJd.userId,
        jobAppId: dbJd.jobAppId || targetAppId || null,
        companyName: defaultCompanyName || dbJd.companyName || "Company",
        jobTitle: defaultJobTitle || dbJd.jobTitle || "Position",
        sourceUrl: dbJd.sourceUrl,
        rawText: dbJd.rawText,
        structuredRequirements: dbJd.structuredRequirements as unknown as JdRequirements,
        scrapeMethod: dbJd.scrapeMethod as ScrapeMethod,
        createdAt: dbJd.createdAt.toISOString(),
      }
    : {
        id: "",
        userId: session.user.id,
        jobAppId: targetAppId || null,
        companyName: defaultCompanyName || "Company",
        jobTitle: defaultJobTitle || "Position",
        sourceUrl: targetApp?.jobUrl || null,
        rawText: "",
        structuredRequirements: null as unknown as JdRequirements,
        scrapeMethod: "MANUAL_PASTE",
        createdAt: new Date().toISOString(),
      }

  // 3. Fetch active user LLM provider config
  const dbLlmConfig = await prisma.llmProviderConfig.findFirst({
    where: { userId: session.user.id, isActive: true },
  })

  const llmConfig: LlmProviderConfig | null = dbLlmConfig
    ? {
        id: dbLlmConfig.id,
        userId: dbLlmConfig.userId,
        provider: dbLlmConfig.provider as LlmProviderType,
        ollamaBaseUrl: dbLlmConfig.ollamaBaseUrl || undefined,
        ollamaModel: dbLlmConfig.ollamaModel || undefined,
        geminiModel: dbLlmConfig.geminiModel || undefined,
        isActive: dbLlmConfig.isActive,
        lastTestedAt: dbLlmConfig.lastTestedAt?.toISOString() || null,
        lastTestOk: dbLlmConfig.lastTestOk || null,
      }
    : null

  return (
    <TailorWizardClient
      masterCv={activeMasterCv}
      masterResumes={masterResumes}
      sampleJd={initialJd}
      jobAppId={targetAppId || null}
      defaultCompanyName={defaultCompanyName}
      defaultJobTitle={defaultJobTitle}
      llmConfig={llmConfig}
    />
  )
}


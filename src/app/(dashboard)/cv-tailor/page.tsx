import { auth } from "@/auth"
import { redirect } from "next/navigation"
import CvTailorHubClient from "./_components/cv-tailor-hub-client"
import { CvService } from "@/lib/services/cv.service"
import { TailorService } from "@/lib/services/tailor.service"
import { prisma } from "@/lib/prisma"
import {
  MasterResume,
  TailoredCv,
  LlmProviderConfig,
  StructuredCv,
  GroundingBulletResult,
  TailoredCvStatus,
  LlmProviderType,
} from "@/types/cv"
import { isCvTailorEnabled } from "@/lib/feature-flags"

export default async function CvTailorPage() {
  if (!isCvTailorEnabled()) {
    redirect("/dashboard")
  }

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  // 1. Fetch user Master Resumes
  const rawResumes = await CvService.getMasterResumes(session.user.id)

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

  const defaultMasterCv = masterResumes.find((r) => r.isDefault) || masterResumes[0] || null

  // 2. Fetch real Tailored Resumes from Prisma
  const rawTailored = await TailorService.getTailoredCvs(session.user.id)

  const tailoredCvs: TailoredCv[] = rawTailored.map((t) => {
    const resolvedCompany =
      (t.jobApplication?.companyName && t.jobApplication.companyName !== "Target Company")
        ? t.jobApplication.companyName
        : (t.jobDescription?.companyName && t.jobDescription.companyName !== "Target Company")
        ? t.jobDescription.companyName
        : (t.jobDescription?.jobApplication?.companyName && t.jobDescription.jobApplication.companyName !== "Target Company")
        ? t.jobDescription.jobApplication.companyName
        : (t.jobDescription?.structuredRequirements as any)?.company_name && (t.jobDescription?.structuredRequirements as any)?.company_name !== "Target Company"
        ? (t.jobDescription?.structuredRequirements as any)?.company_name
        : t.jobApplication?.companyName || t.jobDescription?.companyName || "Company"

    const resolvedJobTitle =
      t.jobDescription?.jobTitle && t.jobDescription.jobTitle !== "Position" && t.jobDescription.jobTitle !== "Target Role"
        ? t.jobDescription.jobTitle
        : t.jobApplication?.jobTitle ||
          (t.jobDescription?.structuredRequirements as any)?.job_title ||
          t.title ||
          "Tailored Resume"

    return {
      id: t.id,
      userId: t.userId,
      cvMasterId: t.masterResumeId,
      jobDescriptionId: t.jobDescriptionId,
      scoreReportId: t.scoreReportId || undefined,
      jobAppId: t.jobAppId || t.jobApplication?.id || undefined,
      jobTitle: resolvedJobTitle,
      companyName: resolvedCompany,
      generatedContent: t.generatedContent as unknown as StructuredCv,
      groundingReport: (t.groundingReport as unknown as GroundingBulletResult[]) || [],
      renderedFileUrl: t.renderedFileUrl,
      status: t.status as TailoredCvStatus,
      overallScore: t.scoreReport?.overallScore ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }
  })

  // 3. Fetch applications awaiting a tailored resume (have no TailoredCv yet)
  const rawPendingApps = await prisma.jobApplication.findMany({
    where: {
      userId: session.user.id,
      tailoredCvs: { none: {} },
      status: { notIn: ["REJECTED", "WITHDRAWN"] },
    },
    include: {
      jobDescriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { appliedAt: "desc" },
    take: 6,
  })

  const pendingApplications = rawPendingApps.map((app) => ({
    id: app.id,
    companyName: app.companyName,
    jobTitle: app.jobTitle,
    status: app.status,
    hasJd: Boolean(app.jobDescriptions?.[0]?.rawText?.trim()),
    appliedAt: app.appliedAt.toISOString(),
  }))

  // 4. Fetch active user LLM provider config
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
    <CvTailorHubClient
      masterCv={defaultMasterCv}
      masterResumes={masterResumes}
      tailoredCvs={tailoredCvs}
      pendingApplications={pendingApplications}
      llmConfig={llmConfig}
    />
  )
}

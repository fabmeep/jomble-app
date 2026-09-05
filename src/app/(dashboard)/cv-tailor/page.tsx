import { auth } from "@/auth"
import { redirect } from "next/navigation"
import CvTailorHubClient from "./_components/cv-tailor-hub-client"
import { CvService } from "@/lib/services/cv.service"
import { MOCK_TAILORED_CVS, MOCK_LLM_CONFIG } from "@/lib/cv/mock-data"
import { MasterResume } from "@/types/cv"

export default async function CvTailorPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const rawResumes = await CvService.getMasterResumes(session.user.id)
  
  const masterResumes: MasterResume[] = rawResumes.map((r) => ({
    id: r.id,
    userId: r.userId,
    title: r.title,
    targetRole: r.targetRole,
    rawFileUrl: r.rawFileUrl,
    fileName: r.fileName,
    rawText: r.rawText,
    structuredData: r.structuredData as any,
    isDefault: r.isDefault,
    reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))

  const defaultMasterCv = masterResumes.find((r) => r.isDefault) || masterResumes[0] || null

  return (
    <CvTailorHubClient
      masterCv={defaultMasterCv}
      masterResumes={masterResumes}
      tailoredCvs={MOCK_TAILORED_CVS}
      llmConfig={MOCK_LLM_CONFIG}
    />
  )
}

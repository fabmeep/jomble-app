import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { CvService } from "@/lib/services/cv.service"
import MasterDetailClient from "./_components/master-detail-client"
import { MasterResume } from "@/types/cv"

export default async function MasterCvDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params
  const rawResume = await CvService.getMasterResumeById(session.user.id, id)

  if (!rawResume) {
    notFound()
  }

  const resume: MasterResume = {
    id: rawResume.id,
    userId: rawResume.userId,
    title: rawResume.title,
    targetRole: rawResume.targetRole,
    rawFileUrl: rawResume.rawFileUrl,
    fileName: rawResume.fileName,
    rawText: rawResume.rawText,
    structuredData: rawResume.structuredData as any,
    isDefault: rawResume.isDefault,
    reviewedAt: rawResume.reviewedAt ? rawResume.reviewedAt.toISOString() : null,
    createdAt: rawResume.createdAt.toISOString(),
    updatedAt: rawResume.updatedAt.toISOString(),
  }

  return <MasterDetailClient initialResume={resume} />
}

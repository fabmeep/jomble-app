import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CvService } from "@/lib/services/cv.service"
import EditMasterClient from "./_components/edit-master-client"
import { MasterResume } from "@/types/cv"
import { isCvTailorEnabled } from "@/lib/feature-flags"

export default async function EditMasterCvPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  if (!isCvTailorEnabled()) {
    redirect("/dashboard")
  }

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await searchParams
  let rawResume = null

  if (id) {
    rawResume = await CvService.getMasterResumeById(session.user.id, id)
  } else {
    rawResume = await CvService.getDefaultMasterResume(session.user.id)
  }

  if (!rawResume) {
    redirect("/cv-tailor/upload")
  }

  const masterCv: MasterResume = {
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

  return <EditMasterClient masterCv={masterCv} />
}

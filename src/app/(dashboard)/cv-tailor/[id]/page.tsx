import { auth } from "@/auth"
import { redirect } from "next/navigation"
import CvVerifierClient from "./_components/cv-verifier-client"
import { MOCK_TAILORED_CVS, MOCK_MASTER_CV } from "@/lib/cv/mock-data"

export default async function TailoredCvDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params

  // Use MOCK_TAILORED_CVS[0] for frontend preview
  const tailoredCv = MOCK_TAILORED_CVS.find((c) => c.id === id) || MOCK_TAILORED_CVS[0]

  return (
    <CvVerifierClient
      initialTailoredCv={tailoredCv}
      masterCv={MOCK_MASTER_CV}
    />
  )
}

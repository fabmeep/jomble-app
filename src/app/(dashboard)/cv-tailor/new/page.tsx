import { auth } from "@/auth"
import { redirect } from "next/navigation"
import TailorWizardClient from "./_components/tailor-wizard-client"
import { MOCK_MASTER_CV, MOCK_JOB_DESCRIPTIONS } from "@/lib/cv/mock-data"

export default async function NewTailoredCvPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  return (
    <TailorWizardClient
      masterCv={MOCK_MASTER_CV}
      sampleJd={MOCK_JOB_DESCRIPTIONS[0]}
    />
  )
}

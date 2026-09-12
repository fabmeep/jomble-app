import { auth } from "@/auth"
import { redirect } from "next/navigation"
import UploadClient from "./_components/upload-client"
import { isCvTailorEnabled } from "@/lib/feature-flags"

export default async function CvUploadPage() {
  if (!isCvTailorEnabled()) {
    redirect("/dashboard")
  }

  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  return <UploadClient />
}

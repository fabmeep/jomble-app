import { auth } from "@/auth"
import { redirect } from "next/navigation"
import UploadClient from "./_components/upload-client"

export default async function CvUploadPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  return <UploadClient />
}

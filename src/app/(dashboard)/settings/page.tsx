import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import SettingsClient from "./_components/settings-client"

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const name = session.user.name || "User"
  const email = session.user.email || ""
  const avatar = session.user.image

  // Fetch user settings from the database
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { ghostThresholdDays: true },
  })

  const initialThreshold = dbUser?.ghostThresholdDays ?? 30

  return (
    <SettingsClient
      name={name}
      email={email}
      avatar={avatar}
      initialGhostThresholdDays={initialThreshold}
    />
  )
}

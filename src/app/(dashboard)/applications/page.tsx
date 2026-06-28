import { prisma } from "@/lib/prisma"
import ApplicationsClient from "./_components/applications-client"
import { getUserId } from "@/lib/session"

export default async function ApplicationsPage() {
  const userId = await getUserId();

  // Fetch job applications belonging to the logged in user
  // Fetch job applications belonging to the logged in user with their red flags
  const applications = await prisma.jobApplication.findMany({
    where: {
      userId: userId,
    },
    include: {
      redFlags: {
        include: {
          redFlag: true,
        },
      },
    },
    orderBy: {
      appliedAt: "desc",
    },
  })

  // Format dates to avoid client/server serialization mismatch issues in Next.js Server Components
  const formattedApplications = applications.map(app => ({
    ...app,
    appliedAt: new Date(app.appliedAt),
    lastActivityAt: new Date(app.lastActivityAt),
    createdAt: new Date(app.createdAt),
    updatedAt: new Date(app.updatedAt),
    redFlags: app.redFlags.map(rf => ({
      id: rf.redFlag.id,
      label: rf.redFlag.label,
      emoji: rf.redFlag.emoji,
    })),
  }))

  return <ApplicationsClient initialApplications={formattedApplications} />
}

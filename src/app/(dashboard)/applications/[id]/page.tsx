import { prisma } from "@/lib/prisma"
import ApplicationDetailClient from "./_components/application-detail-client"
import { getUserId } from "@/lib/session"

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getUserId()

  // Fetch application with all data including timeline events and red flags
  const application = await prisma.jobApplication.findUnique({
    where: { id },
    include: {
      contacts: true,
      notes: {
        orderBy: { createdAt: "desc" },
      },
      timelineEvents: {
        orderBy: { occurredAt: "desc" },
      },
      redFlags: {
        include: {
          redFlag: true,
        },
      },
    },
  })

  if (!application || application.userId !== userId) {
    return (
      <div className="p-6">
        <p className="text-red-500">Application not found or access denied.</p>
      </div>
    )
  }

  // Format dates to avoid serialization issues
  const formattedApplication = {
    ...application,
    appliedAt: new Date(application.appliedAt),
    lastActivityAt: new Date(application.lastActivityAt),
    createdAt: new Date(application.createdAt),
    updatedAt: new Date(application.updatedAt),
    notes: application.notes.map(note => ({
      ...note,
      createdAt: new Date(note.createdAt),
    })),
    contacts: application.contacts.map(contact => ({
      ...contact,
      createdAt: new Date(contact.createdAt),
    })),
    timelineEvents: application.timelineEvents.map(event => ({
      ...event,
      occurredAt: new Date(event.occurredAt),
    })),
    redFlags: application.redFlags.map(rf => ({
      id: rf.redFlag.id,
      label: rf.redFlag.label,
      emoji: rf.redFlag.emoji,
    })),
  }

  return <ApplicationDetailClient initialApplication={formattedApplication} />
}

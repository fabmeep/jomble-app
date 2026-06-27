import { prisma } from "@/lib/prisma"
import { getUserId } from "@/lib/session"
import { notFound } from "next/navigation"
import EditApplicationClient from "./_components/edit-application-client"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditApplicationPage({ params }: PageProps) {
  const { id } = await params
  const userId = await getUserId()

  // Fetch job application with contacts and notes
  const application = await prisma.jobApplication.findUnique({
    where: { id },
    include: {
      contacts: true,
      notes: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  // Ownership security check
  if (!application || application.userId !== userId) {
    notFound()
  }

  // Format dates to strings for Next.js Server-Client component boundaries
  const formattedApplication = {
    ...application,
    appliedAt: application.appliedAt.toISOString().split("T")[0], // Format: YYYY-MM-DD for HTML5 date input
    lastActivityAt: application.lastActivityAt.toISOString(),
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
    notes: application.notes.map(note => ({
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    })),
    contacts: application.contacts.map(contact => ({
      ...contact,
      createdAt: contact.createdAt.toISOString(),
    })),
  }

  return <EditApplicationClient initialApplication={formattedApplication as any} />
}

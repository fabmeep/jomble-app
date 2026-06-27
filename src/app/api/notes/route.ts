import { prisma } from "@/lib/prisma"
import { getUserId } from "@/lib/session"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId()
    const { jobAppId, content } = await req.json()

    if (!jobAppId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify ownership of the job application
    const application = await prisma.jobApplication.findFirst({
      where: {
        id: jobAppId,
        userId,
      },
    })

    if (!application) {
      return NextResponse.json({ error: "Job application not found or unauthorized" }, { status: 404 })
    }

    const [note] = await prisma.$transaction([
      prisma.note.create({
        data: {
          jobAppId,
          content,
        },
      }),
      prisma.timelineEvent.create({
        data: {
          jobAppId,
          eventType: "NOTE_ADDED",
          description: content.trim().length > 60 ? content.trim().substring(0, 57) + "..." : content.trim(),
          occurredAt: new Date(),
        },
      }),
    ])

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error("Error creating note:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

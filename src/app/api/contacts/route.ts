import { prisma } from "@/lib/prisma"
import { getUserId } from "@/lib/session"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId()
    const { jobAppId, name, role, email, linkedinUrl } = await req.json()

    if (!jobAppId || !name) {
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

    // Use a transaction to create contact and log timeline event
    const [contact] = await prisma.$transaction([
      prisma.contact.create({
        data: {
          jobAppId,
          name,
          role: role || null,
          email: email || null,
          linkedinUrl: linkedinUrl || null,
        },
      }),
      prisma.timelineEvent.create({
        data: {
          jobAppId,
          eventType: "CONTACT_ADDED",
          description: `${name}${role ? `, ${role}` : ""}`,
          occurredAt: new Date(),
        },
      }),
    ])

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error("Error creating contact:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { prisma } from "@/lib/prisma"
import { getUserId } from "@/lib/session"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getUserId()

    // Verify contact belongs to an application owned by the user
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        jobApplication: {
          userId,
        },
      },
    })

    if (!contact) {
      return NextResponse.json({ error: "Contact not found or unauthorized" }, { status: 404 })
    }

    await prisma.contact.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting contact:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

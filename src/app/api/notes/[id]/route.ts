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

    // Verify the note belongs to an application owned by the user
    const note = await prisma.note.findFirst({
      where: {
        id,
        jobApplication: {
          userId,
        },
      },
    })

    if (!note) {
      return NextResponse.json({ error: "Note not found or unauthorized" }, { status: 404 })
    }

    await prisma.note.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting note:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

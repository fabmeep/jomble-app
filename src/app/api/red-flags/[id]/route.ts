import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify ownership
    const flag = await prisma.redFlag.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!flag) {
      return NextResponse.json({ error: "Red flag not found" }, { status: 404 })
    }

    await prisma.redFlag.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting red flag:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

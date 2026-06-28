import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ghostThresholdDays } = await req.json()

    // Validate inputs
    if (
      typeof ghostThresholdDays !== "number" ||
      !Number.isInteger(ghostThresholdDays) ||
      ghostThresholdDays < 0
    ) {
      return NextResponse.json(
        { error: "Invalid inactivity threshold days" },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        ghostThresholdDays,
      },
      select: {
        id: true,
        email: true,
        ghostThresholdDays: true,
      },
    })

    return NextResponse.json({
      success: true,
      user: updatedUser,
    })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

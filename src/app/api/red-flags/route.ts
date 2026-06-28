import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// GET: Fetch all red flags for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const flags = await prisma.redFlag.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(flags)
  } catch (error) {
    console.error("Error fetching red flags:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Add a new custom red flag
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { label, emoji } = await req.json()

    if (!label?.trim()) {
      return NextResponse.json({ error: "Label is required" }, { status: 400 })
    }

    // Create the red flag linked to the user
    const flag = await prisma.redFlag.create({
      data: {
        userId: session.user.id,
        label: label.trim(),
        emoji: emoji?.trim() || "🚩",
      },
    })

    return NextResponse.json(flag, { status: 201 })
  } catch (error) {
    console.error("Error creating red flag:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

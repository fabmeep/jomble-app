import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const authHeader = req.headers.get("authorization")

    // Enforce auth if CRON_SECRET env variable is defined
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all users with active auto-ghosting
    const users = await prisma.user.findMany({
      where: {
        ghostThresholdDays: {
          gt: 0,
        },
      },
      select: {
        id: true,
        email: true,
        ghostThresholdDays: true,
      },
    })

    const details: Array<{ email: string; updatedCount: number }> = []
    let totalUpdated = 0

    for (const user of users) {
      const thresholdDate = new Date()
      thresholdDate.setDate(thresholdDate.getDate() - user.ghostThresholdDays)

      // Find eligible stale applications for this user
      const staleApps = await prisma.jobApplication.findMany({
        where: {
          userId: user.id,
          status: {
            in: ["APPLIED", "SCREENING", "INTERVIEW", "OFFER"],
          },
          lastActivityAt: {
            lte: thresholdDate,
          },
        },
        select: {
          id: true,
          status: true,
        },
      })

      if (staleApps.length === 0) continue

      const staleAppIds = staleApps.map((app) => app.id)

      // 1. Bulk update application statuses to GHOSTED
      await prisma.jobApplication.updateMany({
        where: {
          id: {
            in: staleAppIds,
          },
        },
        data: {
          status: "GHOSTED",
          lastActivityAt: new Date(), // Set to now as it represents the status change event time
        },
      })

      // 2. Log AUTO_GHOSTED timeline events
      await prisma.timelineEvent.createMany({
        data: staleApps.map((app) => ({
          jobAppId: app.id,
          eventType: "AUTO_GHOSTED",
          oldStatus: app.status,
          newStatus: "GHOSTED",
          description: `Automatically marked as Ghosted due to ${user.ghostThresholdDays} days of inactivity.`,
          occurredAt: new Date(),
        })),
      })

      details.push({
        email: user.email,
        updatedCount: staleApps.length,
      })
      totalUpdated += staleApps.length
    }

    return NextResponse.json({
      success: true,
      usersChecked: users.length,
      totalUpdated,
      details,
    })
  } catch (error) {
    console.error("Error in ghost-runner job:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

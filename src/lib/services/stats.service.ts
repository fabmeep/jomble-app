import { prisma } from "@/lib/prisma";

export class StatsService {
  static async getUserDashboardStats(userId: string) {
    // 1. Fetch active applications summary
    const apps = await prisma.jobApplication.findMany({
      where: {
        userId,
        status: { notIn: ["REJECTED", "WITHDRAWN", "GHOSTED", "ACCEPTED"] },
      },
      orderBy: [{ lastActivityAt: "desc" }],
      take: 6,
      select: {
        id: true,
        companyName: true,
        jobTitle: true,
        status: true,
        appliedAt: true,
        lastActivityAt: true,
      },
    });

    // 2. Fetch by-status counts
    const statusCounts = await prisma.jobApplication.groupBy({
      by: ["status"],
      where: { userId },
      _count: { status: true },
    });

    const byStatus: Record<string, number> = {
      APPLIED: 0,
      SCREENING: 0,
      INTERVIEW: 0,
      OFFER: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
      GHOSTED: 0,
    };

    statusCounts.forEach((item) => {
      byStatus[item.status] = item._count.status;
    });

    const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0);

    // 2b. Fetch by-contractType counts
    const contractCounts = await prisma.jobApplication.groupBy({
      by: ["contractType"],
      where: { userId },
      _count: { contractType: true },
    });

    const byContractType: Record<string, number> = {
      FULL_TIME: 0,
      PART_TIME: 0,
      CONTRACT: 0,
      INTERN: 0,
      FREELANCE: 0,
      TEMPORARY: 0,
      OTHER: 0,
    };

    contractCounts.forEach((item) => {
      if (item.contractType) {
        byContractType[item.contractType] = item._count.contractType;
      }
    });

    // 2c. Fetch by-sourcing counts
    const outsourceCount = await prisma.jobApplication.count({
      where: { userId, isOutsource: true },
    });
    const directCount = Math.max(0, total - outsourceCount);
    const outsourceRate =
      total > 0 ? parseFloat(((outsourceCount / total) * 100).toFixed(1)) : 0;

    const topAgenciesData = await prisma.jobApplication.groupBy({
      by: ["agencyName"],
      where: { userId, isOutsource: true, agencyName: { not: null } },
      _count: { agencyName: true },
      orderBy: { _count: { agencyName: "desc" } },
      take: 3,
    });

    const topAgencies = topAgenciesData
      .filter((a) => a.agencyName && a.agencyName.trim().length > 0)
      .map((a) => ({
        name: a.agencyName as string,
        count: a._count.agencyName,
      }));

    const bySourcing = {
      direct: directCount,
      outsource: outsourceCount,
      outsourceRate,
      topAgencies,
    };

    const respondedCount =
      byStatus.SCREENING +
      byStatus.INTERVIEW +
      byStatus.OFFER +
      byStatus.ACCEPTED +
      byStatus.REJECTED;

    const responseRate =
      total > 0 ? parseFloat(((respondedCount / total) * 100).toFixed(1)) : 0;
    const ghostedCount = byStatus.GHOSTED;
    const ghostedRate =
      total > 0 ? parseFloat(((ghostedCount / total) * 100).toFixed(1)) : 0;

    // 3. Average Days to Reply
    const responsiveApps = await prisma.jobApplication.findMany({
      where: {
        userId,
        status: {
          in: ["SCREENING", "INTERVIEW", "OFFER", "ACCEPTED", "REJECTED"],
        },
      },
      select: {
        appliedAt: true,
        lastActivityAt: true,
        timelineEvents: {
          where: {
            eventType: "STATUS_CHANGE",
            newStatus: {
              in: ["SCREENING", "INTERVIEW", "OFFER", "ACCEPTED", "REJECTED"],
            },
          },
          orderBy: { occurredAt: "asc" },
          take: 1,
        },
      },
    });

    let totalResponseTimeDays = 0;
    let respondedCountForAvg = 0;

    responsiveApps.forEach((app) => {
      const firstResponseEvent = app.timelineEvents[0];
      const responseDate = firstResponseEvent
        ? new Date(firstResponseEvent.occurredAt)
        : new Date(app.lastActivityAt);

      const diffTime =
        responseDate.getTime() - new Date(app.appliedAt).getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays >= 0) {
        totalResponseTimeDays += diffDays;
        respondedCountForAvg++;
      }
    });

    const avgDaysToReply =
      respondedCountForAvg > 0
        ? parseFloat((totalResponseTimeDays / respondedCountForAvg).toFixed(1))
        : 0;

    // 4. Hottest Leads (IMMUTABLE SORTING)
    const activeApplications = await prisma.jobApplication.findMany({
      where: {
        userId,
        status: {
          in: ["APPLIED", "SCREENING", "INTERVIEW", "OFFER"],
        },
      },
    });

    const statusWeight: Record<string, number> = {
      OFFER: 4,
      INTERVIEW: 3,
      SCREENING: 2,
      APPLIED: 1,
    };

    // Immutably copy array before sorting
    const hottestLeads = [...activeApplications]
      .sort((a, b) => {
        const weightA = statusWeight[a.status] ?? 0;
        const weightB = statusWeight[b.status] ?? 0;
        if (weightA !== weightB) {
          return weightB - weightA;
        }
        const scoreA = a.excitementScore ?? -1;
        const scoreB = b.excitementScore ?? -1;
        if (scoreA !== scoreB) {
          return scoreB - scoreA;
        }
        return (
          new Date(b.lastActivityAt).getTime() -
          new Date(a.lastActivityAt).getTime()
        );
      })
      .slice(0, 5);

    // 5. Weekly Application Activity
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const addedLast7Days = await prisma.jobApplication.count({
      where: {
        userId,
        appliedAt: { gte: sevenDaysAgo },
      },
    });

    const eightWeeksAgo = new Date(now);
    eightWeeksAgo.setDate(now.getDate() - 56);
    const oldestDay = eightWeeksAgo.getDay();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - oldestDay);
    eightWeeksAgo.setHours(0, 0, 0, 0);

    const recentApplications = await prisma.jobApplication.findMany({
      where: {
        userId,
        appliedAt: { gte: eightWeeksAgo },
      },
      select: { appliedAt: true },
    });

    const weeklyActivity = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - i * 7);
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 7);

      const label = start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      const count = recentApplications.filter((app) => {
        const date = new Date(app.appliedAt);
        return date >= start && date < end;
      }).length;

      weeklyActivity.push({
        label,
        start: start.toISOString(),
        end: end.toISOString(),
        count,
      });
    }

    return {
      stats: {
        apps,
        total,
        responseRate,
        ghostedRate,
        byStatus,
        byContractType,
        bySourcing,
        addedLast7Days,
        avgDaysToReply,
      },
      hottestLeads,
      weeklyActivity,
    };
  }
}

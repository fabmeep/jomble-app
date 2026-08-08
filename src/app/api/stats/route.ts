import { getUserId } from "@/lib/session";
import { StatsService } from "@/lib/services/stats.service";
import { apiSuccess, apiUnauthorized, apiError } from "@/lib/api-response";

export async function GET() {
  try {
    const userId = await getUserId();
    const statsData = await StatsService.getUserDashboardStats(userId);
    return apiSuccess(statsData);
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      return apiUnauthorized(error.message);
    }
    console.error("Error fetching stats:", error);
    return apiError("Failed to fetch stats");
  }
}

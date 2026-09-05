import { NextRequest } from "next/server";
import { getUserId } from "@/lib/session";
import { CvService } from "@/lib/services/cv.service";
import { apiSuccess, apiUnauthorized, apiNotFound, apiError } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;

    const resume = await CvService.setDefaultMasterResume(userId, id);
    if (!resume) {
      return apiNotFound("Master resume not found");
    }

    return apiSuccess(resume);
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      return apiUnauthorized(error.message);
    }
    console.error("Error setting default resume:", error);
    return apiError(error.message || "Failed to set default master resume");
  }
}

import { NextRequest } from "next/server";
import { getUserId } from "@/lib/session";
import { CvService } from "@/lib/services/cv.service";
import { apiSuccess, apiUnauthorized, apiNotFound, apiError } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const resume = await CvService.getMasterResumeById(userId, id);

    if (!resume) {
      return apiNotFound("Master resume not found");
    }

    return apiSuccess(resume);
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      return apiUnauthorized(error.message);
    }
    console.error("Error fetching master resume:", error);
    return apiError("Failed to fetch master resume");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const body = await req.json();

    const updated = await CvService.updateMasterResume(userId, id, {
      title: body.title,
      targetRole: body.targetRole,
      structuredData: body.structuredData,
      reviewedAt: body.reviewedAt ? new Date(body.reviewedAt) : (body.confirmed ? new Date() : undefined),
      isDefault: body.isDefault,
    });

    return apiSuccess(updated);
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      return apiUnauthorized(error.message);
    }
    console.error("Error updating master resume:", error);
    return apiError(error.message || "Failed to update master resume");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    await CvService.deleteMasterResume(userId, id);
    return apiSuccess({ success: true });
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      return apiUnauthorized(error.message);
    }
    console.error("Error deleting master resume:", error);
    return apiError(error.message || "Failed to delete master resume");
  }
}

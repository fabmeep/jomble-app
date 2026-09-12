import { NextRequest } from "next/server";
import { getUserId } from "@/lib/session";
import { apiError, apiNotFound, apiSuccess, apiUnauthorized } from "@/lib/api-response";
import { TailorService } from "@/lib/services/tailor.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return apiUnauthorized();
    }

    const { id } = await params;
    const tailoredCv = await TailorService.getTailoredCvById(userId, id);

    if (!tailoredCv) {
      return apiNotFound("Tailored CV not found.");
    }

    return apiSuccess(tailoredCv);
  } catch (error: unknown) {
    console.error("[Get Tailored CV API Error]:", error);
    return apiError("Failed to fetch tailored CV.");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return apiUnauthorized();
    }

    const { id } = await params;
    await TailorService.deleteTailoredCv(userId, id);

    return apiSuccess({ deleted: true });
  } catch (error: unknown) {
    console.error("[Delete Tailored CV API Error]:", error);
    return apiError("Failed to delete tailored CV.");
  }
}

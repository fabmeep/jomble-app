import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { apiBadRequest, apiError, apiUnauthorized } from "@/lib/api-response";
import { TailorService } from "@/lib/services/tailor.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return apiUnauthorized();
    }

    const { id } = await params;
    const body = await req.json();
    const { bullet_id, resolution, verify_all } = body;

    if (verify_all) {
      const updated = await TailorService.updateStatus(userId, id, "VERIFIED");
      return NextResponse.json({ success: true, status: updated.status });
    }

    if (!bullet_id || !resolution) {
      return apiBadRequest("bullet_id and resolution are required.");
    }

    if (!["approved", "kept_original", "discarded"].includes(resolution)) {
      return apiBadRequest("Invalid resolution. Must be approved, kept_original, or discarded.");
    }

    const updated = await TailorService.updateGroundingResolution(
      userId,
      id,
      bullet_id,
      resolution
    );

    return NextResponse.json({
      success: true,
      status: updated.status,
      groundingReport: updated.groundingReport,
      generatedContent: updated.generatedContent,
    });
  } catch (error: unknown) {
    console.error("[Tailor Verify API Error]:", error);
    const message = error instanceof Error ? error.message : "Failed to update grounding resolution.";
    return apiError(message);
  }
}

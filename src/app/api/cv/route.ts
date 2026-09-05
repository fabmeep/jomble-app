import { NextRequest } from "next/server";
import { getUserId } from "@/lib/session";
import { CvService } from "@/lib/services/cv.service";
import { apiSuccess, apiUnauthorized, apiError, apiBadRequest } from "@/lib/api-response";

export async function GET() {
  try {
    const userId = await getUserId();
    const resumes = await CvService.getMasterResumes(userId);
    return apiSuccess(resumes);
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      return apiUnauthorized(error.message);
    }
    console.error("Error fetching master resumes:", error);
    return apiError("Failed to fetch master resumes");
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();

    if (!body.structuredData) {
      return apiBadRequest("structuredData is required");
    }

    const resume = await CvService.createMasterResume(userId, {
      title: body.title,
      targetRole: body.targetRole,
      fileName: body.fileName,
      rawText: body.rawText,
      structuredData: body.structuredData,
      isDefault: body.isDefault,
      reviewedAt: body.reviewedAt ? new Date(body.reviewedAt) : null,
    });

    return apiSuccess(resume, 201);
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      return apiUnauthorized(error.message);
    }
    console.error("Error creating master resume:", error);
    return apiError("Failed to create master resume");
  }
}

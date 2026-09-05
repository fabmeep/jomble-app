import { NextRequest } from "next/server";
import { getUserId } from "@/lib/session";
import { CvService } from "@/lib/services/cv.service";
import { getResumeDownloadUrl } from "@/lib/storage";
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

    if (!resume.rawFileUrl) {
      return apiNotFound("No raw file stored for this resume.");
    }

    const downloadUrl = await getResumeDownloadUrl(resume.rawFileUrl, 3600); // 1 hour valid
    if (!downloadUrl) {
      return apiError("Storage bucket is not configured or file was not found in bucket.", 404);
    }

    return apiSuccess({
      downloadUrl,
      fileName: resume.fileName || "resume.pdf",
    });
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      return apiUnauthorized(error.message);
    }
    console.error("Error generating resume download URL:", error);
    return apiError("Failed to generate download link");
  }
}

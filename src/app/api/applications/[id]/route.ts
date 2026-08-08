import { NextRequest } from "next/server";
import { getUserId } from "@/lib/session";
import { ApplicationsService } from "@/lib/services/applications.service";
import {
  apiSuccess,
  apiNotFound,
  apiBadRequest,
  apiUnauthorized,
  apiError,
} from "@/lib/api-response";
import { ZodError } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserId();
    const application = await ApplicationsService.getApplicationById(id, userId);

    if (!application) {
      return apiNotFound("Job application not found");
    }

    return apiSuccess(application);
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      return apiUnauthorized(error.message);
    }
    console.error("Error fetching application:", error);
    return apiError("Failed to fetch application");
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserId();
    const body = await req.json();

    const updatedApplication = await ApplicationsService.updateApplication(
      id,
      userId,
      body
    );

    if (!updatedApplication) {
      return apiNotFound("Job application not found or unauthorized");
    }

    return apiSuccess(updatedApplication);
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      return apiUnauthorized(error.message);
    }
    if (error instanceof ZodError) {
      return apiBadRequest("Validation failed", error.issues);
    }
    console.error("Error updating application:", error);
    return apiError("Failed to update application");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserId();

    const deleted = await ApplicationsService.deleteApplication(id, userId);
    if (!deleted) {
      return apiNotFound("Job application not found or unauthorized");
    }

    return apiSuccess(deleted);
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      return apiUnauthorized(error.message);
    }
    console.error("Error deleting application:", error);
    return apiError("Failed to delete application");
  }
}

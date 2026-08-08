import { NextRequest } from "next/server";
import { getUserId } from "@/lib/session";
import { ApplicationsService } from "@/lib/services/applications.service";
import { apiSuccess, apiBadRequest, apiUnauthorized, apiError } from "@/lib/api-response";
import { ZodError } from "zod";

export async function GET() {
  try {
    const userId = await getUserId();
    const applications = await ApplicationsService.getUserApplications(userId);
    return apiSuccess(applications);
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      return apiUnauthorized(error.message);
    }
    console.error("Error fetching applications:", error);
    return apiError("Failed to fetch applications");
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const application = await ApplicationsService.createApplication(userId, body);
    return apiSuccess(application, 201);
  } catch (error: any) {
    if (error?.name === "UnauthorizedError") {
      return apiUnauthorized(error.message);
    }
    if (error instanceof ZodError) {
      return apiBadRequest("Validation failed", error.issues);
    }
    console.error("Error creating application:", error);
    return apiError("Failed to create application");
  }
}
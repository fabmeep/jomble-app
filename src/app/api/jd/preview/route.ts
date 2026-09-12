import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { apiBadRequest, apiError, apiUnauthorized } from "@/lib/api-response";
import { getFastApiBaseUrl } from "@/lib/fastapi";
import { isCvTailorEnabled } from "@/lib/feature-flags";

const FASTAPI_BASE_URL = getFastApiBaseUrl();

export async function POST(req: NextRequest) {
  if (!isCvTailorEnabled()) {
    return NextResponse.json(
      { error: "AI and job scraping features are disabled on this deployment." },
      { status: 503 }
    );
  }

  try {
    const userId = await getUserId();
    if (!userId) {
      return apiUnauthorized();
    }

    const body = await req.json();
    const url = body.url as string | undefined;

    if (!url || !url.trim()) {
      return apiBadRequest("Please provide a job posting URL.");
    }

    const response = await fetch(`${FASTAPI_BASE_URL}/jd/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim() }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return apiError(
        errorData.detail || "Failed to fetch job preview from backend service.",
        response.status
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[JD Preview Error]:", error);
    return apiError("An error occurred while fetching the job posting preview.");
  }
}

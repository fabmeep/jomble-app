import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { apiBadRequest, apiError, apiUnauthorized } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getFastApiBaseUrl } from "@/lib/fastapi";
import { isCvTailorEnabled } from "@/lib/feature-flags";

const FASTAPI_BASE_URL = getFastApiBaseUrl();

export async function POST(req: NextRequest) {
  if (!isCvTailorEnabled()) {
    return NextResponse.json(
      { error: "AI and job description parsing features are disabled on this deployment." },
      { status: 503 }
    );
  }

  try {
    const userId = await getUserId();
    if (!userId) {
      return apiUnauthorized();
    }

    const body = await req.json();
    const rawText = body.raw_text as string | undefined;
    const sourceUrl = body.source_url as string | undefined;
    const jobAppId = body.job_app_id as string | undefined;

    if (!rawText || rawText.trim().length < 100) {
      return apiBadRequest("Please provide a job description with at least 100 characters.");
    }

    // 1. Fetch user's active LLM configuration
    const llmConfig = await prisma.llmProviderConfig.findFirst({
      where: { userId, isActive: true },
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (llmConfig) {
      headers["X-Llm-Provider"] = llmConfig.provider;
      if (llmConfig.geminiApiKeyEncrypted) {
        headers["X-Gemini-Api-Key"] = llmConfig.geminiApiKeyEncrypted;
      }
      if (llmConfig.geminiModel) {
        headers["X-Gemini-Model"] = llmConfig.geminiModel;
      }
      if (llmConfig.ollamaBaseUrl) {
        headers["X-Ollama-Url"] = llmConfig.ollamaBaseUrl;
      }
      if (llmConfig.ollamaModel) {
        headers["X-Ollama-Model"] = llmConfig.ollamaModel;
      }
    }

    // 2. Forward to FastAPI backend for parsing
    const response = await fetch(`${FASTAPI_BASE_URL}/jd/parse`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        raw_text: rawText.trim(),
        source_url: sourceUrl || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return apiError(
        errorData.detail || "Failed to parse job description with LLM.",
        response.status
      );
    }

    const jdRequirements = await response.json();

    // 3. Persist parsed JobDescription into database
    let companyName = jdRequirements.company_name;
    let jobTitle = jdRequirements.job_title;

    if (jobAppId) {
      const jobApp = await prisma.jobApplication.findFirst({
        where: { id: jobAppId, userId },
        select: { companyName: true, jobTitle: true },
      });
      if (jobApp) {
        if (!companyName || companyName === "Target Company" || companyName === "Company") {
          companyName = jobApp.companyName;
        }
        if (!jobTitle || jobTitle === "Position" || jobTitle === "Target Role") {
          jobTitle = jobApp.jobTitle;
        }
      }
    }

    const finalCompanyName = companyName && companyName !== "Target Company" ? companyName : (companyName || "Company");
    const finalJobTitle = jobTitle && jobTitle !== "Target Role" ? jobTitle : (jobTitle || "Position");

    const savedJd = await prisma.jobDescription.create({
      data: {
        userId,
        jobAppId: jobAppId || null,
        companyName: finalCompanyName,
        jobTitle: finalJobTitle,
        sourceUrl: sourceUrl || null,
        rawText: rawText.trim(),
        structuredRequirements: {
          ...jdRequirements,
          company_name: finalCompanyName,
          job_title: finalJobTitle,
        },
        scrapeMethod: sourceUrl ? "URL_SCRAPE" : "MANUAL_PASTE",
      },
    });

    return NextResponse.json({
      ...jdRequirements,
      company_name: finalCompanyName,
      job_title: finalJobTitle,
      id: savedJd.id,
    });
  } catch (error) {
    console.error("[JD Parse Error]:", error);
    return apiError("An unexpected error occurred while parsing the job description.");
  }
}

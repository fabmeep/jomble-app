import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { apiBadRequest, apiError, apiUnauthorized } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { TailorService } from "@/lib/services/tailor.service";
import { getFastApiBaseUrl } from "@/lib/fastapi";
import { isCvTailorEnabled } from "@/lib/feature-flags";

const FASTAPI_BASE_URL = getFastApiBaseUrl();

export async function POST(req: NextRequest) {
  if (!isCvTailorEnabled()) {
    return NextResponse.json(
      { error: "AI and CV tailoring features are disabled on this deployment." },
      { status: 503 }
    );
  }

  try {
    const userId = await getUserId();
    if (!userId) {
      return apiUnauthorized();
    }

    const body = await req.json();
    const masterResumeId = body.master_resume_id as string | undefined;
    const jobDescriptionId = body.job_description_id as string | undefined;
    const scoreReportId = body.score_report_id as string | undefined;
    const jobAppId = body.job_app_id as string | undefined;

    if (!masterResumeId || !jobDescriptionId) {
      return apiBadRequest("master_resume_id and job_description_id are required.");
    }

    // 1. Fetch Master CV from database
    const masterResume = await prisma.masterResume.findFirst({
      where: { id: masterResumeId, userId },
    });

    if (!masterResume || !masterResume.structuredData) {
      return apiBadRequest("Master CV not found or has no structured data.");
    }

    // 2. Fetch Job Description from database
    const jobDescription = await prisma.jobDescription.findFirst({
      where: { id: jobDescriptionId, userId },
      include: { jobApplication: true },
    });

    if (!jobDescription || !jobDescription.structuredRequirements) {
      return apiBadRequest("Job description not found or has no parsed requirements.");
    }

    // Resolve true company name & job title with fallback hierarchy
    const effectiveJobAppId = jobAppId || jobDescription.jobAppId;
    const linkedApp = effectiveJobAppId
      ? await prisma.jobApplication.findFirst({ where: { id: effectiveJobAppId, userId } })
      : jobDescription.jobApplication || null;

    const resolvedCompany =
      (linkedApp?.companyName && linkedApp.companyName !== "Target Company")
        ? linkedApp.companyName
        : (jobDescription.companyName && jobDescription.companyName !== "Target Company")
        ? jobDescription.companyName
        : (jobDescription.structuredRequirements as any)?.company_name && (jobDescription.structuredRequirements as any)?.company_name !== "Target Company"
        ? (jobDescription.structuredRequirements as any)?.company_name
        : linkedApp?.companyName || jobDescription.companyName || "Company";

    const resolvedJobTitle =
      (jobDescription.jobTitle && jobDescription.jobTitle !== "Position" && jobDescription.jobTitle !== "Target Role")
        ? jobDescription.jobTitle
        : (linkedApp?.jobTitle && linkedApp.jobTitle !== "Position")
        ? linkedApp.jobTitle
        : (jobDescription.structuredRequirements as any)?.job_title || "Position";

    // Auto-heal jobDescription in DB if it was previously saved with "Target Company"
    if (resolvedCompany && resolvedCompany !== "Target Company" && jobDescription.companyName === "Target Company") {
      await prisma.jobDescription.update({
        where: { id: jobDescription.id },
        data: {
          companyName: resolvedCompany,
          jobTitle: resolvedJobTitle,
          ...(effectiveJobAppId && !jobDescription.jobAppId ? { jobAppId: effectiveJobAppId } : {}),
        },
      });
    }

    // 3. Fetch user's active LLM configuration
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

    // 4. Call FastAPI tailoring & grounding microservice
    let fastapiRes;
    try {
      fastapiRes = await fetch(`${FASTAPI_BASE_URL}/tailor/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          cv: masterResume.structuredData,
          jd: jobDescription.structuredRequirements,
          job_title: resolvedJobTitle,
          company_name: resolvedCompany,
        }),
      });
    } catch (connErr) {
      console.error("[Tailor API Connection Error]:", connErr);
      return apiError(
        "Could not connect to the Python backend server on http://localhost:8000.",
        503
      );
    }

    if (!fastapiRes.ok) {
      const errData = await fastapiRes.json().catch(() => ({}));
      return apiError(
        errData.detail || "FastAPI tailoring generation failed.",
        fastapiRes.status
      );
    }

    const tailoredData = await fastapiRes.json();

    // 5. Persist into Postgres TailoredCv table
    const title = `${resolvedJobTitle} - ${resolvedCompany}`;

    const savedTailoredCv = await TailorService.createTailoredCv(userId, {
      masterResumeId,
      jobDescriptionId,
      scoreReportId: scoreReportId || null,
      jobAppId: effectiveJobAppId || null,
      title,
      generatedContent: tailoredData.tailored_content,
      groundingReport: tailoredData.grounding_report,
      status: "DRAFT",
    });

    return NextResponse.json({
      id: savedTailoredCv.id,
      jobTitle: resolvedJobTitle,
      companyName: resolvedCompany,
      matchScore: tailoredData.match_score,
      status: savedTailoredCv.status,
      groundingReport: tailoredData.grounding_report,
    });
  } catch (error) {
    console.error("[Tailor Generate API Error]:", error);
    return apiError("An unexpected error occurred while generating the tailored CV.");
  }
}

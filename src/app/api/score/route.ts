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
      { error: "AI scoring features are disabled on this deployment." },
      { status: 503 }
    );
  }

  try {
    const userId = await getUserId();
    if (!userId) {
      return apiUnauthorized();
    }

    const body = await req.json();
    const cvMasterId = body.cv_master_id as string | undefined;
    const jobDescriptionId = body.job_description_id as string | undefined;

    let structuredCv = body.cv;
    let structuredJd = body.jd;

    // 1. If IDs are provided and objects aren't directly passed, load them from database
    if (!structuredCv && cvMasterId) {
      const resume = await prisma.masterResume.findFirst({
        where: { id: cvMasterId, userId },
      });
      if (resume?.structuredData) {
        structuredCv = resume.structuredData;
      }
    }

    if (!structuredJd && jobDescriptionId) {
      const jdRecord = await prisma.jobDescription.findFirst({
        where: { id: jobDescriptionId, userId },
      });
      if (jdRecord?.structuredRequirements) {
        structuredJd = jdRecord.structuredRequirements;
      }
    }

    if (!structuredCv) {
      return apiBadRequest("Master CV data or valid cv_master_id is required.");
    }

    if (!structuredJd) {
      return apiBadRequest("Job description requirements or valid job_description_id is required.");
    }

    // 2. Call FastAPI score calculate endpoint
    let fastapiResponse;
    try {
      fastapiResponse = await fetch(`${FASTAPI_BASE_URL}/score/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cv: structuredCv,
          jd: structuredJd,
        }),
      });
    } catch (connErr) {
      console.error("[Score API Error] Cannot reach FastAPI backend:", connErr);
      return apiError("Cannot connect to scoring backend microservice.", 503);
    }

    if (!fastapiResponse.ok) {
      const errData = await fastapiResponse.json().catch(() => ({}));
      return apiError(
        errData.detail || "FastAPI scoring calculation failed.",
        fastapiResponse.status
      );
    }

    const scoreData = await fastapiResponse.json();

    const formattedBreakdown = {
      requiredSkillsScore: scoreData.breakdown.required_skills_score,
      preferredSkillsScore: scoreData.breakdown.preferred_skills_score,
      semanticSimilarityScore: scoreData.breakdown.semantic_similarity_score,
      keywordOverlapScore: scoreData.breakdown.keyword_overlap_score,
      experienceFitScore: scoreData.breakdown.experience_fit_score,
    };

    // 3. Persist into ScoreReport table if IDs exist
    let reportId = `score_${Date.now()}`;
    let createdAt = new Date().toISOString();

    if (cvMasterId && jobDescriptionId) {
      try {
        const savedReport = await prisma.scoreReport.create({
          data: {
            userId,
            masterResumeId: cvMasterId,
            jobDescriptionId,
            overallScore: scoreData.overall_score,
            breakdown: formattedBreakdown,
            gaps: {
              highlights: scoreData.gaps,
              criticalMissingKeywords: scoreData.critical_missing_keywords,
              matchTier: scoreData.match_tier,
              summaryVerdict: scoreData.summary_verdict,
              alignments: scoreData.alignments,
              gapsDetailed: scoreData.gaps_detailed,
            },
          },
        });
        reportId = savedReport.id;
        createdAt = savedReport.createdAt.toISOString();
      } catch (dbErr) {
        console.warn("[ScoreReport Persistence Warning] Could not persist to DB, returning live calculation:", dbErr);
      }
    }

    return NextResponse.json({
      id: reportId,
      userId,
      cvMasterId: cvMasterId || "temp_cv",
      jobDescriptionId: jobDescriptionId || "temp_jd",
      overallScore: scoreData.overall_score,
      matchTier: scoreData.match_tier,
      summaryVerdict: scoreData.summary_verdict,
      alignments: scoreData.alignments,
      gapsDetailed: scoreData.gaps_detailed,
      breakdown: formattedBreakdown,
      gaps: scoreData.gaps,
      criticalMissingKeywords: scoreData.critical_missing_keywords,
      createdAt,
    });
  } catch (error) {
    console.error("[Score API Handler Error]:", error);
    return apiError("An unexpected error occurred while calculating the match score.");
  }
}

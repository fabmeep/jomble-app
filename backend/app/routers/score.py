from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.score import (
    MatchAlignmentItem,
    MatchGapItem,
    ScoreCalculateRequest,
    ScoreReportResponse,
)
from app.services.scoring import calculate_match_score
from app.services.llm.factory import get_llm_provider

router = APIRouter()


@router.post("/calculate", response_model=ScoreReportResponse, status_code=status.HTTP_200_OK)
async def calculate_score(
    payload: ScoreCalculateRequest,
    use_llm: bool = Query(default=True, description="Whether to enhance report with zero-hallucination LLM analysis"),
) -> ScoreReportResponse:
    """
    Computes match score (0-100) and alignments/gaps between Master CV and Job Description.
    Uses strict zero-hallucination LLM analysis when enabled, with resilient fallback to deterministic scoring.
    """
    try:
        score_report = calculate_match_score(cv=payload.cv, jd=payload.jd)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate baseline match score: {str(e)}",
        )

    if use_llm:
        try:
            provider = get_llm_provider()
            missing_names = [kw.name for kw in score_report.critical_missing_keywords]
            llm_result = await provider.analyze_match(
                cv=payload.cv,
                jd=payload.jd,
                baseline_score=score_report.overall_score,
                missing_skills=missing_names,
            )

            # Safely merge LLM insights
            if "overall_score" in llm_result and isinstance(llm_result["overall_score"], (int, float)):
                score_report.overall_score = max(0, min(100, int(llm_result["overall_score"])))
            if "match_tier" in llm_result and isinstance(llm_result["match_tier"], str):
                score_report.match_tier = llm_result["match_tier"]
            if "summary_verdict" in llm_result and isinstance(llm_result["summary_verdict"], str):
                score_report.summary_verdict = llm_result["summary_verdict"]

            if "alignments" in llm_result and isinstance(llm_result["alignments"], list):
                parsed_alignments = []
                for item in llm_result["alignments"]:
                    if isinstance(item, dict) and "skill" in item and "evidence" in item:
                        parsed_alignments.append(
                            MatchAlignmentItem(
                                skill=str(item["skill"]),
                                evidence=str(item["evidence"]),
                            )
                        )
                if parsed_alignments:
                    score_report.alignments = parsed_alignments

            if "gaps" in llm_result and isinstance(llm_result["gaps"], list):
                parsed_gaps = []
                for item in llm_result["gaps"]:
                    if isinstance(item, dict) and "skill" in item and "reason" in item:
                        severity = item.get("severity", "moderate")
                        if severity not in ["critical", "moderate", "minor"]:
                            severity = "moderate"
                        parsed_gaps.append(
                            MatchGapItem(
                                skill=str(item["skill"]),
                                severity=severity,
                                reason=str(item["reason"]),
                            )
                        )
                if parsed_gaps:
                    score_report.gaps_detailed = parsed_gaps

        except Exception as llm_err:
            print(f"[ScoreRouter] LLM analysis fallback to deterministic scores: {llm_err}")

    return score_report


from typing import Optional
from fastapi import APIRouter, Header, HTTPException, status
from app.schemas.tailor import TailorGenerateRequest, TailorGenerateResponse
from app.services.grounding import audit_tailored_cv
from app.services.llm.factory import get_llm_provider
from app.services.scoring import calculate_match_score

router = APIRouter()


@router.post("/generate", response_model=TailorGenerateResponse, status_code=status.HTTP_200_OK)
async def generate_tailored_cv(
    payload: TailorGenerateRequest,
    x_llm_provider: Optional[str] = Header(None, alias="X-Llm-Provider"),
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-Api-Key"),
    x_gemini_model: Optional[str] = Header(None, alias="X-Gemini-Model"),
    x_ollama_url: Optional[str] = Header(None, alias="X-Ollama-Url"),
    x_ollama_model: Optional[str] = Header(None, alias="X-Ollama-Model"),
) -> TailorGenerateResponse:
    """
    Generates an ATS-tailored resume using configured LLM, preserving truthful work experience facts,
    and runs a semantic grounding audit to verify bullet authenticity.
    """
    provider = get_llm_provider(
        provider_name=x_llm_provider,
        gemini_api_key=x_gemini_api_key,
        gemini_model=x_gemini_model,
        ollama_base_url=x_ollama_url,
        ollama_model=x_ollama_model,
    )

    model_display = getattr(provider, "model_name", "Unknown")
    print(f"\n=======================================================")
    print(f"[CV Tailor] Provider: {provider.__class__.__name__}")
    print(f"[CV Tailor] Active Model: {model_display}")
    print(f"[CV Tailor] Target: {payload.job_title or payload.jd.job_title or 'Target Role'} at {payload.company_name or payload.jd.company_name or 'Company'}")
    print(f"=======================================================\n")

    try:
        tailored_cv = await provider.tailor_cv(cv=payload.cv, jd=payload.jd)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate tailored CV: {str(e)}"
        )

    # Run Anti-Hallucination Grounding Audit
    grounding_report = audit_tailored_cv(original_cv=payload.cv, tailored_cv=tailored_cv)

    # Compute updated match score of the tailored CV
    score_report = calculate_match_score(cv=tailored_cv, jd=payload.jd)

    return TailorGenerateResponse(
        job_title=payload.job_title or payload.jd.job_title or "Target Role",
        company_name=payload.company_name or payload.jd.company_name or "Company",
        tailored_content=tailored_cv,
        grounding_report=grounding_report,
        match_score=score_report.overall_score,
    )

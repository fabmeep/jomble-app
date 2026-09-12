from typing import Optional
from fastapi import APIRouter, Header, HTTPException, status

from app.schemas.jd import (
    JdParseRequest,
    JdPreviewRequest,
    JdPreviewResponse,
    JdRequirements,
)
from app.services.document.web_scraper import fetch_job_posting
from app.services.llm.factory import get_llm_provider

router = APIRouter()


@router.post("/preview", response_model=JdPreviewResponse, status_code=status.HTTP_200_OK)
async def preview_job_posting(payload: JdPreviewRequest) -> JdPreviewResponse:
    """
    Stage 1: Fetches and cleans job description text from a URL without calling the LLM.
    Returns extracted text on success, or a reason code ('blocked' | 'timeout' | 'empty') on failure.
    """
    if not payload.url or not payload.url.strip():
        return JdPreviewResponse(
            success=False,
            raw_text=None,
            reason="empty",
        )

    success, raw_text, reason = await fetch_job_posting(payload.url.strip())
    return JdPreviewResponse(
        success=success,
        raw_text=raw_text,
        reason=reason,
    )


@router.post("/parse", response_model=JdRequirements, status_code=status.HTTP_200_OK)
async def parse_job_description(
    payload: JdParseRequest,
    x_llm_provider: Optional[str] = Header(None, alias="X-Llm-Provider"),
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-Api-Key"),
    x_gemini_model: Optional[str] = Header(None, alias="X-Gemini-Model"),
    x_ollama_url: Optional[str] = Header(None, alias="X-Ollama-Url"),
    x_ollama_model: Optional[str] = Header(None, alias="X-Ollama-Model"),
) -> JdRequirements:
    """
    Stage 2: Analyzes raw job description text with an LLM and extracts structured requirements
    (skills, responsibilities, keywords, seniority).
    """
    raw_text = payload.raw_text.strip()
    if not raw_text or len(raw_text) < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description text is too short. Please provide at least 100 characters.",
        )

    provider = get_llm_provider(
        provider_name=x_llm_provider,
        gemini_api_key=x_gemini_api_key,
        gemini_model=x_gemini_model,
        ollama_base_url=x_ollama_url,
        ollama_model=x_ollama_model,
    )

    model_display = getattr(provider, "model_name", "Unknown")
    print(f"\n=======================================================")
    print(f"[JD Parse] Provider: {provider.__class__.__name__}")
    print(f"[JD Parse] Active Model: {model_display}")
    print(f"[JD Parse] Source URL: {payload.source_url or 'Manual Paste'}")
    print(f"=======================================================\n")

    try:
        jd_requirements = await provider.extract_jd_requirements(
            raw_text=raw_text,
            source_url=payload.source_url,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse job description: {str(e)}",
        )

    return jd_requirements

from typing import Optional
from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile, status
from app.schemas.cv import CvExtractResponse, CvExtractRequest
from app.services.document.docx_reader import extract_text_from_docx
from app.services.llm.factory import get_llm_provider

router = APIRouter()


@router.post("/extract", response_model=CvExtractResponse, status_code=status.HTTP_200_OK)
async def extract_cv_content(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    x_llm_provider: Optional[str] = Header(None, alias="X-Llm-Provider"),
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-Api-Key"),
    x_gemini_model: Optional[str] = Header(None, alias="X-Gemini-Model"),
    x_ollama_url: Optional[str] = Header(None, alias="X-Ollama-Url"),
    x_ollama_model: Optional[str] = Header(None, alias="X-Ollama-Model"),
) -> CvExtractResponse:
    """
    Extracts plain text and structured resume data using Multimodal LLMs (Gemini / Ollama).
    Directly streams document bytes to the LLM to preserve layout without PDF library streams.
    """
    file_name = file.filename if file else None
    file_bytes: Optional[bytes] = None
    extracted_text_input: Optional[str] = None
    mime_type: Optional[str] = None

    if file:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file is empty."
            )

        lower_name = (file.filename or "").lower()
        content_type = file.content_type or ""

        if lower_name.endswith(".pdf") or content_type == "application/pdf":
            mime_type = "application/pdf"
        elif lower_name.endswith((".docx", ".doc")):
            try:
                extracted_text_input = extract_text_from_docx(file_bytes)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Failed to read text from DOCX document: {str(e)}"
                )
        elif lower_name.endswith((".png", ".jpg", ".jpeg", ".webp")) or content_type.startswith("image/"):
            mime_type = content_type or "image/jpeg"
        else:
            try:
                extracted_text_input = file_bytes.decode("utf-8", errors="ignore")
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unsupported file format: {str(e)}"
                )
    elif raw_text:
        extracted_text_input = raw_text.strip()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either a file upload or raw_text must be provided."
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
    print(f"[CV Extract] Provider: {provider.__class__.__name__}")
    print(f"[CV Extract] Active Model: {model_display}")
    print(f"[CV Extract] Target: {file_name or 'Raw Text'}")
    print(f"=======================================================\n")

    try:
        final_raw_text, structured_cv = await provider.extract_cv(
            file_bytes=file_bytes,
            mime_type=mime_type,
            raw_text=extracted_text_input,
            file_name=file_name,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LLM extraction failure: {str(e)}"
        )

    return CvExtractResponse(
        file_name=file_name,
        raw_text=final_raw_text,
        structured_data=structured_cv,
        extraction_confidence=1.0,
    )


@router.post("/extract-text", response_model=CvExtractResponse, status_code=status.HTTP_200_OK)
async def extract_cv_from_json(
    payload: CvExtractRequest,
    x_llm_provider: Optional[str] = Header(None, alias="X-Llm-Provider"),
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-Api-Key"),
    x_gemini_model: Optional[str] = Header(None, alias="X-Gemini-Model"),
    x_ollama_url: Optional[str] = Header(None, alias="X-Ollama-Url"),
    x_ollama_model: Optional[str] = Header(None, alias="X-Ollama-Model"),
) -> CvExtractResponse:
    """
    JSON endpoint to parse raw resume text directly using LLM.
    """
    if not payload.raw_text or not payload.raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="raw_text cannot be empty."
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
    print(f"[CV Extract Text] Provider: {provider.__class__.__name__}")
    print(f"[CV Extract Text] Active Model: {model_display}")
    print(f"=======================================================\n")

    final_raw_text, structured_cv = await provider.extract_cv(
        raw_text=payload.raw_text.strip()
    )

    return CvExtractResponse(
        file_name=None,
        raw_text=final_raw_text,
        structured_data=structured_cv,
        extraction_confidence=1.0,
    )

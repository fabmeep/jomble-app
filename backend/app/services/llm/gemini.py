import base64
import json
import os
from typing import Optional, Tuple
import httpx
from fastapi import HTTPException, status

from app.schemas.cv import StructuredCv
from app.schemas.jd import JdRequirements
from app.services.llm.base import BaseLlmProvider
from app.services.llm.prompts.cv_parser import get_cv_extraction_prompt
from app.services.llm.prompts.jd_parser import get_jd_extraction_prompt
from app.services.document.normalizer import normalize_structured_cv
from app.services.llm.prompts.cv_tailor import get_cv_tailoring_prompt
from app.services.llm.prompts.score_match import get_match_scoring_prompt


class GeminiProvider(BaseLlmProvider):
    """
    Multimodal Google Gemini LLM Provider supporting direct PDF document ingestion,
    DOCX text parsing, and structured JSON resume extraction.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
    ):
        self.api_key = (
            api_key
            or os.getenv("GEMINI_API_KEY", "")
            or os.getenv("GOOGLE_API_KEY", "")
        )
        self.model_name = model_name or os.getenv("GEMINI_MODEL", "gemini-3.7-flash")

    def _get_api_url(self) -> str:
        clean_model = self.model_name.strip()
        if not clean_model.startswith("models/"):
            clean_model = f"models/{clean_model}"
        return f"https://generativelanguage.googleapis.com/v1beta/{clean_model}:generateContent?key={self.api_key}"

    def _reconstruct_raw_text(self, cv: StructuredCv) -> str:
        """
        Reconstructs formatted plain text from StructuredCv in Python (0 tokens, 0ms latency).
        """
        lines = []
        if cv.contact.name:
            lines.append(cv.contact.name)
        
        contact_line = []
        if cv.contact.email:
            contact_line.append(f"Email: {cv.contact.email}")
        if cv.contact.phone:
            contact_line.append(f"Phone: {cv.contact.phone}")
        if cv.contact.location:
            contact_line.append(f"Location: {cv.contact.location}")
        if contact_line:
            lines.append(" | ".join(contact_line))

        links = []
        if cv.contact.linkedin:
            links.append(f"LinkedIn: {cv.contact.linkedin}")
        if cv.contact.github:
            links.append(f"GitHub: {cv.contact.github}")
        if cv.contact.website:
            links.append(f"Website: {cv.contact.website}")
        if links:
            lines.append(" | ".join(links))

        if cv.summary:
            lines.append(f"\nSUMMARY\n{cv.summary}")

        if cv.experience:
            lines.append("\nEXPERIENCE")
            for exp in cv.experience:
                loc = f" ({exp.location})" if exp.location else ""
                lines.append(f"{exp.title} | {exp.company}{loc} | {exp.dates}")
                for b in exp.bullets:
                    lines.append(f"• {b.text}")

        if cv.education:
            lines.append("\nEDUCATION")
            for edu in cv.education:
                details = f" ({edu.details})" if edu.details else ""
                lines.append(f"{edu.degree} | {edu.institution} | {edu.dates}{details}")

        if cv.skills:
            lines.append(f"\nSKILLS\n{', '.join(cv.skills)}")

        if cv.projects:
            lines.append("\nPROJECTS")
            for proj in cv.projects:
                tech = f" [{', '.join(proj.technologies)}]" if proj.technologies else ""
                lines.append(f"{proj.name}{tech}: {proj.description}")

        if cv.certifications:
            lines.append(f"\nCERTIFICATIONS\n{', '.join(cv.certifications)}")

        return "\n".join(lines)

    async def extract_cv(
        self,
        file_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None,
        raw_text: Optional[str] = None,
        file_name: Optional[str] = None,
    ) -> Tuple[str, StructuredCv]:
        if not self.api_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Gemini API Key is not configured. Please add your Gemini API Key in Settings > LLM Provider or backend .env.",
            )

        prompt_text = get_cv_extraction_prompt(raw_text=raw_text)
        parts = []

        # 1. Attach multimodal binary document part if PDF or image
        if file_bytes and (mime_type == "application/pdf" or (file_name and file_name.lower().endswith(".pdf"))):
            base64_data = base64.b64encode(file_bytes).decode("utf-8")
            parts.append({
                "inlineData": {
                    "mimeType": "application/pdf",
                    "data": base64_data,
                }
            })
        elif file_bytes and (mime_type and mime_type.startswith("image/")):
            base64_data = base64.b64encode(file_bytes).decode("utf-8")
            parts.append({
                "inlineData": {
                    "mimeType": mime_type,
                    "data": base64_data,
                }
            })

        # 2. Attach instructions prompt
        parts.append({"text": prompt_text})

        gen_config = {
            "responseMimeType": "application/json",
            "temperature": 0.0,
            "maxOutputTokens": 8192,
        }

        request_payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": parts,
                }
            ],
            "generationConfig": gen_config,
        }

        url = self._get_api_url()
        print(f"[GeminiProvider] -> Calling Google Gemini API with model: '{self.model_name}'")
        timeout_config = httpx.Timeout(120.0, connect=30.0, read=120.0, write=60.0)

        async with httpx.AsyncClient(timeout=timeout_config) as client:
            try:
                response = await client.post(
                    url,
                    json=request_payload,
                    headers={"Content-Type": "application/json"},
                )
            except httpx.ReadTimeout as timeout_err:
                print(f"[Gemini Timeout Error] Request exceeded 120s: {timeout_err}")
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="Google Gemini API took more than 120 seconds to process the document. Please try again with a faster model (e.g. gemini-3.7-flash).",
                )
            except Exception as conn_err:
                print(f"[Gemini Connection Error] {type(conn_err).__name__}: {conn_err}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Failed to connect to Google Gemini API: {str(conn_err)}",
                )

        if not response.is_success:
            error_msg = response.text
            try:
                err_json = response.json()
                error_msg = err_json.get("error", {}).get("message", response.text)
            except Exception:
                pass

            if response.status_code == 429:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Google Gemini Quota Exceeded (429): {error_msg}. Please wait a moment or switch to 'gemini-flash-lite-latest' in Settings.",
                )

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Gemini API error ({response.status_code}): {error_msg}",
            )

        response_data = response.json()
        candidates = response_data.get("candidates", [])
        if not candidates or not candidates[0].get("content", {}).get("parts", []):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Gemini API returned an empty extraction response.",
            )

        content_text = candidates[0]["content"]["parts"][0].get("text", "").strip()

        # Clean markdown code fences if present
        if content_text.startswith("```json"):
            content_text = content_text[7:]
        elif content_text.startswith("```"):
            content_text = content_text[3:]
        if content_text.endswith("```"):
            content_text = content_text[:-3]
        content_text = content_text.strip()

        try:
            parsed_json = json.loads(content_text)
        except Exception as json_err:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to parse JSON from Gemini response: {str(json_err)}",
            )

        # Handle either direct StructuredCv dict or wrapped { "structured_data": ... }
        if "structured_data" in parsed_json:
            structured_dict = parsed_json.get("structured_data", {})
        else:
            structured_dict = parsed_json

        # Validate with Pydantic
        try:
            raw_cv = StructuredCv.model_validate(structured_dict)
        except Exception as val_err:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Structured CV validation failed: {str(val_err)}",
            )

        # Normalize IDs and clean data
        normalized_cv = normalize_structured_cv(raw_cv)

        # Reconstruct clean raw_text instantly in Python
        extracted_raw_text = raw_text or self._reconstruct_raw_text(normalized_cv)

        return extracted_raw_text, normalized_cv

    async def extract_jd_requirements(
        self,
        raw_text: str,
        source_url: Optional[str] = None,
    ) -> JdRequirements:
        if not self.api_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Gemini API Key is not configured. Please add your Gemini API Key in Settings > LLM Provider or backend .env.",
            )

        if not raw_text or len(raw_text.strip()) < 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job description text is too short to parse.",
            )

        prompt_text = get_jd_extraction_prompt(raw_text=raw_text)
        gen_config = {
            "responseMimeType": "application/json",
            "temperature": 0.0,
            "maxOutputTokens": 8192,
        }

        request_payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt_text}],
                }
            ],
            "generationConfig": gen_config,
        }

        url = self._get_api_url()
        print(f"[GeminiProvider] -> Parsing JD with model: '{self.model_name}'")
        timeout_config = httpx.Timeout(60.0, connect=20.0, read=60.0, write=30.0)

        response = None
        async with httpx.AsyncClient(timeout=timeout_config) as client:
            for attempt in range(2):
                try:
                    response = await client.post(
                        url,
                        json=request_payload,
                        headers={"Content-Type": "application/json"},
                    )
                    # If 503 temporary overload, retry once after 1.5s
                    if response.status_code == 503 and attempt == 0:
                        print(f"[GeminiProvider] 503 Spike detected on '{self.model_name}', retrying in 1.5s...")
                        import asyncio
                        await asyncio.sleep(1.5)
                        continue
                    break
                except httpx.ReadTimeout as timeout_err:
                    print(f"[Gemini Timeout Error] Request exceeded 60s: {timeout_err}")
                    raise HTTPException(
                        status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                        detail="Google Gemini API took more than 60 seconds to parse the job description.",
                    )
                except Exception as conn_err:
                    print(f"[Gemini Connection Error] {type(conn_err).__name__}: {conn_err}")
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail=f"Failed to connect to Google Gemini API: {str(conn_err)}",
                    )

        if not response or not response.is_success:
            error_msg = response.text if response else "No response"
            try:
                err_json = response.json()
                error_msg = err_json.get("error", {}).get("message", response.text)
            except Exception:
                pass

            if response and response.status_code == 429:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Google Gemini Quota Exceeded (429): {error_msg}. Please wait a moment or switch models in Settings.",
                )

            status_code = response.status_code if response else status.HTTP_500_INTERNAL_SERVER_ERROR
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Gemini API error ({status_code}): {error_msg}",
            )

        response_data = response.json()
        candidates = response_data.get("candidates", [])
        if not candidates or not candidates[0].get("content", {}).get("parts", []):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Gemini API returned an empty extraction response for JD.",
            )

        content_text = candidates[0]["content"]["parts"][0].get("text", "").strip()

        # Clean code fences if present
        if content_text.startswith("```json"):
            content_text = content_text[7:]
        elif content_text.startswith("```"):
            content_text = content_text[3:]
        if content_text.endswith("```"):
            content_text = content_text[:-3]
        content_text = content_text.strip()

        try:
            parsed_json = json.loads(content_text)
        except Exception as json_err:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to parse JSON from Gemini JD response: {str(json_err)}",
            )

        parsed_json["raw_text"] = raw_text
        parsed_json["source_url"] = source_url
        if not parsed_json.get("company_name"):
            parsed_json["company_name"] = "Target Company"
        if not parsed_json.get("job_title"):
            parsed_json["job_title"] = "Target Position"

        try:
            jd_requirements = JdRequirements.model_validate(parsed_json)
        except Exception as val_err:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"JD requirements validation failed: {str(val_err)}",
            )

        return jd_requirements

    async def tailor_cv(
        self,
        cv: StructuredCv,
        jd: JdRequirements,
    ) -> StructuredCv:
        if not self.api_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Gemini API Key is not configured. Please add your Gemini API Key in Settings > LLM Provider or backend .env.",
            )

        prompt_text = get_cv_tailoring_prompt(cv=cv, jd=jd)
        gen_config = {
            "responseMimeType": "application/json",
            "temperature": 0.2,
            "maxOutputTokens": 8192,
        }

        request_payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt_text}],
                }
            ],
            "generationConfig": gen_config,
        }

        url = self._get_api_url()
        print(f"[GeminiProvider] -> Tailoring CV with model: '{self.model_name}'")
        timeout_config = httpx.Timeout(90.0, connect=20.0, read=90.0, write=30.0)

        response = None
        async with httpx.AsyncClient(timeout=timeout_config) as client:
            for attempt in range(2):
                try:
                    response = await client.post(
                        url,
                        json=request_payload,
                        headers={"Content-Type": "application/json"},
                    )
                    if response.status_code == 503 and attempt == 0:
                        import asyncio
                        await asyncio.sleep(1.5)
                        continue
                    break
                except httpx.ReadTimeout as timeout_err:
                    raise HTTPException(
                        status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                        detail="Google Gemini API took more than 90 seconds to tailor resume.",
                    )
                except Exception as conn_err:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail=f"Failed to connect to Google Gemini API: {str(conn_err)}",
                    )

        if not response or not response.is_success:
            error_msg = response.text if response else "No response"
            try:
                err_json = response.json()
                error_msg = err_json.get("error", {}).get("message", response.text)
            except Exception:
                pass

            if response and response.status_code == 429:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Google Gemini Quota Exceeded (429): {error_msg}",
                )

            status_code = response.status_code if response else status.HTTP_500_INTERNAL_SERVER_ERROR
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Gemini API tailoring error ({status_code}): {error_msg}",
            )

        response_data = response.json()
        candidates = response_data.get("candidates", [])
        if not candidates or not candidates[0].get("content", {}).get("parts", []):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Gemini API returned an empty response for CV tailoring.",
            )

        content_text = candidates[0]["content"]["parts"][0].get("text", "").strip()

        # Clean code fences if present
        if content_text.startswith("```json"):
            content_text = content_text[7:]
        elif content_text.startswith("```"):
            content_text = content_text[3:]
        if content_text.endswith("```"):
            content_text = content_text[:-3]
        content_text = content_text.strip()

        try:
            parsed_json = json.loads(content_text)
        except Exception as json_err:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to parse JSON from Gemini tailoring response: {str(json_err)}",
            )

        try:
            tailored_cv = StructuredCv.model_validate(parsed_json)
        except Exception as val_err:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Tailored CV validation failed: {str(val_err)}",
            )

        return tailored_cv

    async def analyze_match(
        self,
        cv: StructuredCv,
        jd: JdRequirements,
        baseline_score: int,
        missing_skills: list[str],
    ) -> dict:
        """
        Analyzes match alignment between Master CV and JD using Gemini with strict anti-hallucination.
        Returns dictionary with overall_score, match_tier, summary_verdict, alignments, and gaps.
        """
        prompt_text = get_match_scoring_prompt(
            cv=cv,
            jd=jd,
            baseline_score=baseline_score,
            missing_skills=missing_skills,
        )

        gen_config = {
            "temperature": 0.1,
            "responseMimeType": "application/json",
        }

        request_payload = {
            "contents": [
                {
                    "parts": [{"text": prompt_text}],
                }
            ],
            "generationConfig": gen_config,
        }

        url = self._get_api_url()
        print(f"[GeminiProvider] -> Analyzing CV/JD Match Score with model: '{self.model_name}'")
        timeout_config = httpx.Timeout(45.0, connect=15.0, read=45.0, write=20.0)

        response = None
        async with httpx.AsyncClient(timeout=timeout_config) as client:
            for attempt in range(2):
                try:
                    response = await client.post(
                        url,
                        json=request_payload,
                        headers={"Content-Type": "application/json"},
                    )
                    if response.status_code == 503 and attempt == 0:
                        import asyncio
                        await asyncio.sleep(1.5)
                        continue
                    break
                except Exception as conn_err:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail=f"Failed to connect to Google Gemini API for match scoring: {str(conn_err)}",
                    )

        if not response or not response.is_success:
            error_msg = response.text if response else "No response"
            try:
                err_json = response.json()
                error_msg = err_json.get("error", {}).get("message", response.text)
            except Exception:
                pass

            status_code = response.status_code if response else status.HTTP_500_INTERNAL_SERVER_ERROR
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Gemini API match analysis error ({status_code}): {error_msg}",
            )

        response_data = response.json()
        candidates = response_data.get("candidates", [])
        if not candidates or not candidates[0].get("content", {}).get("parts", []):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Gemini API returned an empty response for match analysis.",
            )

        content_text = candidates[0]["content"]["parts"][0].get("text", "").strip()

        if content_text.startswith("```json"):
            content_text = content_text[7:]
        elif content_text.startswith("```"):
            content_text = content_text[3:]
        if content_text.endswith("```"):
            content_text = content_text[:-3]
        content_text = content_text.strip()

        parsed_json = json.loads(content_text)
        return parsed_json


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


class OllamaProvider(BaseLlmProvider):
    """
    Local Ollama LLM Provider supporting structured JSON resume extraction.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        model_name: Optional[str] = None,
    ):
        self.base_url = (base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")).rstrip("/")
        self.model_name = model_name or os.getenv("OLLAMA_MODEL", "qwen2.5:3b")

    def _reconstruct_raw_text(self, cv: StructuredCv) -> str:
        lines = []
        if cv.contact.name:
            lines.append(cv.contact.name)
        if cv.contact.email:
            lines.append(f"Email: {cv.contact.email}")
        if cv.summary:
            lines.append(f"\nSUMMARY\n{cv.summary}")
        if cv.experience:
            lines.append("\nEXPERIENCE")
            for exp in cv.experience:
                lines.append(f"{exp.title} | {exp.company} | {exp.dates}")
                for b in exp.bullets:
                    lines.append(f"• {b.text}")
        if cv.education:
            lines.append("\nEDUCATION")
            for edu in cv.education:
                lines.append(f"{edu.degree} | {edu.institution} | {edu.dates}")
        if cv.skills:
            lines.append(f"\nSKILLS\n{', '.join(cv.skills)}")
        return "\n".join(lines)

    async def extract_cv(
        self,
        file_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None,
        raw_text: Optional[str] = None,
        file_name: Optional[str] = None,
    ) -> Tuple[str, StructuredCv]:
        if not raw_text or not raw_text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ollama text extraction requires readable text input.",
            )

        prompt = get_cv_extraction_prompt(raw_text=raw_text)
        chat_url = f"{self.base_url}/api/chat"
        print(f"[OllamaProvider] -> Calling Ollama at '{self.base_url}' with model: '{self.model_name}'")
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "format": "json",
            "stream": False,
            "options": {
                "temperature": 0.0,
            }
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(240.0, connect=15.0, read=240.0, write=30.0)) as client:
            try:
                response = await client.post(chat_url, json=payload)
            except httpx.TimeoutException:
                print(f"[Ollama Timeout Error] Model '{self.model_name}' timed out after 240s.")
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail=f"Ollama server at {self.base_url} timed out while running '{self.model_name}'. Local generation took longer than 240 seconds.",
                )
            except Exception as e:
                print(f"[Ollama Connection Error] {type(e).__name__}: {e}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Failed to connect to Ollama server at {self.base_url}: {type(e).__name__} {str(e)}",
                )

        if not response.is_success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ollama returned HTTP {response.status_code}: {response.text}",
            )

        resp_data = response.json()
        content = resp_data.get("message", {}).get("content", "").strip()

        try:
            parsed_json = json.loads(content)
        except Exception as json_err:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to parse JSON from Ollama response: {str(json_err)}",
            )

        if "structured_data" in parsed_json:
            target_json = parsed_json.get("structured_data", {})
        else:
            target_json = parsed_json

        # Ensure minimal structure
        structured_dict = {
            "contact": target_json.get("contact", {}),
            "summary": target_json.get("summary", ""),
            "experience": target_json.get("experience", []),
            "education": target_json.get("education", []),
            "skills": target_json.get("skills", []),
            "projects": target_json.get("projects", []),
            "certifications": target_json.get("certifications", []),
        }

        raw_cv = StructuredCv.model_validate(structured_dict)
        normalized_cv = normalize_structured_cv(raw_cv)
        extracted_raw_text = raw_text or self._reconstruct_raw_text(normalized_cv)

        return extracted_raw_text, normalized_cv

    async def extract_jd_requirements(
        self,
        raw_text: str,
        source_url: Optional[str] = None,
    ) -> JdRequirements:
        if not raw_text or len(raw_text.strip()) < 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job description text is too short to parse.",
            )

        prompt = get_jd_extraction_prompt(raw_text=raw_text)
        chat_url = f"{self.base_url}/api/chat"
        print(f"[OllamaProvider] -> Parsing JD with model: '{self.model_name}' at {self.base_url}")
        payload = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "format": "json",
            "stream": False,
            "options": {"temperature": 0.0},
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(240.0, connect=15.0, read=240.0, write=30.0)) as client:
            try:
                response = await client.post(chat_url, json=payload)
            except httpx.TimeoutException:
                print(f"[Ollama Timeout Error] Model '{self.model_name}' timed out after 240s.")
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail=f"Ollama server at {self.base_url} timed out while parsing JD with '{self.model_name}'. Local generation took longer than 240 seconds.",
                )
            except Exception as e:
                print(f"[Ollama Connection Error] {type(e).__name__}: {e}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Failed to connect to Ollama server at {self.base_url}: {type(e).__name__} {str(e)}",
                )

        if not response.is_success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ollama returned HTTP {response.status_code}: {response.text}",
            )

        resp_data = response.json()
        content = resp_data.get("message", {}).get("content", "").strip()

        try:
            parsed_json = json.loads(content)
        except Exception as json_err:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to parse JSON from Ollama response: {str(json_err)}",
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
        prompt_text = get_cv_tailoring_prompt(cv=cv, jd=jd)
        chat_url = f"{self.base_url}/api/chat"

        payload = {
            "model": self.model_name,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a professional resume strategist. Output valid raw JSON only.",
                },
                {
                    "role": "user",
                    "content": prompt_text,
                },
            ],
            "format": "json",
            "stream": False,
            "options": {
                "temperature": 0.2,
                "num_predict": 4096,
            },
        }

        print(f"[OllamaProvider] -> Tailoring CV with model: '{self.model_name}'")
        timeout_config = httpx.Timeout(240.0, connect=15.0, read=240.0, write=30.0)

        async with httpx.AsyncClient(timeout=timeout_config) as client:
            try:
                response = await client.post(chat_url, json=payload)
            except httpx.TimeoutException:
                print(f"[Ollama Timeout Error] Model '{self.model_name}' timed out after 240s.")
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail=f"Ollama server at {self.base_url} timed out while tailoring CV with '{self.model_name}'. Local generation took longer than 240 seconds.",
                )
            except Exception as e:
                print(f"[Ollama Connection Error] {type(e).__name__}: {e}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Failed to connect to Ollama server at {self.base_url}: {type(e).__name__} {str(e)}",
                )

        if not response.is_success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ollama returned HTTP {response.status_code}: {response.text}",
            )

        resp_data = response.json()
        content = resp_data.get("message", {}).get("content", "").strip()

        # Clean code fences if present
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        try:
            parsed_json = json.loads(content)
        except Exception as json_err:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to parse JSON from Ollama response: {str(json_err)}",
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
        Analyzes match alignment between Master CV and JD using local Ollama with strict anti-hallucination.
        Returns dictionary with overall_score, match_tier, summary_verdict, alignments, and gaps.
        """
        prompt_text = get_match_scoring_prompt(
            cv=cv,
            jd=jd,
            baseline_score=baseline_score,
            missing_skills=missing_skills,
        )
        chat_url = f"{self.base_url}/api/chat"

        payload = {
            "model": self.model_name,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a professional technical recruiter and auditor. Output valid raw JSON only.",
                },
                {
                    "role": "user",
                    "content": prompt_text,
                },
            ],
            "format": "json",
            "stream": False,
            "options": {
                "temperature": 0.1,
                "num_predict": 1024,
            },
        }

        print(f"[OllamaProvider] -> Analyzing CV/JD Match Score with model: '{self.model_name}'")
        timeout_config = httpx.Timeout(90.0, connect=15.0, read=90.0, write=20.0)

        async with httpx.AsyncClient(timeout=timeout_config) as client:
            try:
                response = await client.post(chat_url, json=payload)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Failed to connect to Ollama server at {self.base_url}: {str(e)}",
                )

        if not response.is_success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ollama returned HTTP {response.status_code}: {response.text}",
            )

        resp_data = response.json()
        content = resp_data.get("message", {}).get("content", "").strip()

        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        parsed_json = json.loads(content)
        return parsed_json


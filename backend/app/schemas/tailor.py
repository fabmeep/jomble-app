from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from app.schemas.cv import StructuredCv
from app.schemas.jd import JdRequirements


class GroundingBulletResult(BaseModel):
    id: str = Field(..., description="Unique ID for this audit item, e.g. g_1")
    source_bullet_id: str = Field(..., description="Original Master CV bullet ID, e.g. b_1")
    original_text: str = Field(..., description="Original Master CV bullet text")
    rewritten_text: str = Field(..., description="Rewritten tailored bullet text")
    target_experience_id: str = Field(..., description="Experience entry ID, e.g. exp_1")
    similarity_score: float = Field(..., ge=0.0, le=1.0, description="Semantic similarity score 0.0 to 1.0")
    status: Literal["pass", "flagged", "rejected"] = Field(
        ...,
        description="'pass' (>= 0.80), 'flagged' (0.60-0.79), 'rejected' (< 0.60)"
    )
    user_resolution: Optional[Literal["approved", "kept_original", "discarded"]] = Field(
        default=None,
        description="User override decision from verification audit"
    )


class TailorGenerateRequest(BaseModel):
    cv: StructuredCv = Field(..., description="Master CV structured data")
    jd: JdRequirements = Field(..., description="Target Job Description requirements")
    job_title: Optional[str] = Field(default=None, description="Target job title")
    company_name: Optional[str] = Field(default=None, description="Target company name")


class TailorGenerateResponse(BaseModel):
    job_title: str = Field(..., description="Target role title")
    company_name: str = Field(..., description="Target company name")
    tailored_content: StructuredCv = Field(..., description="ATS-tailored resume content")
    grounding_report: List[GroundingBulletResult] = Field(
        default_factory=list,
        description="Anti-hallucination grounding audit comparing original and rewritten bullets"
    )
    match_score: int = Field(..., ge=0, le=100, description="Match score of the tailored CV against JD")

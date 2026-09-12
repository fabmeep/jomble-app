from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from app.schemas.cv import StructuredCv
from app.schemas.jd import JdRequirements


class ScoreBreakdown(BaseModel):
    required_skills_score: int = Field(..., ge=0, le=100, description="Score for required skills match (35% weight)")
    preferred_skills_score: int = Field(..., ge=0, le=100, description="Score for preferred skills match (15% weight)")
    semantic_similarity_score: int = Field(..., ge=0, le=100, description="Score for semantic & token similarity (20% weight)")
    keyword_overlap_score: int = Field(..., ge=0, le=100, description="Score for technical keyword overlap (15% weight)")
    experience_fit_score: int = Field(..., ge=0, le=100, description="Score for experience & seniority fit (15% weight)")


class MissingKeyword(BaseModel):
    name: str = Field(..., description="The missing or underrepresented skill, tool, or methodology")
    category: Literal["hard_skill", "framework_tool", "methodology"] = Field(
        default="hard_skill",
        description="Category of the keyword"
    )
    frequency: int = Field(default=1, description="Mention frequency in the job description")
    importance: Literal["critical", "recommended"] = Field(
        default="recommended",
        description="'critical' for required skills / frequent mentions, 'recommended' for preferred / keywords"
    )


class MatchAlignmentItem(BaseModel):
    skill: str = Field(..., description="Skill, technology, or domain area from Master CV matching the JD")
    evidence: str = Field(..., description="Grounded explanation citing authentic Master CV experience and JD requirement")


class MatchGapItem(BaseModel):
    skill: str = Field(..., description="The missing or underrepresented skill/requirement explicitly from the JD")
    severity: Literal["critical", "moderate", "minor"] = Field(
        default="moderate",
        description="'critical' for core required skills, 'moderate' for preferred skills, 'minor' for extra keywords"
    )
    reason: str = Field(..., description="Objective explanation of what the JD specifies that is missing from Master CV")


class ScoreCalculateRequest(BaseModel):
    cv: StructuredCv = Field(..., description="Candidate Master CV structured data")
    jd: JdRequirements = Field(..., description="Target Job Description structured requirements")


class ScoreReportResponse(BaseModel):
    overall_score: int = Field(..., ge=0, le=100, description="Overall weighted match score 0-100")
    match_tier: str = Field(
        default="Solid Fit",
        description="Human-friendly fit level: 'Strong Match', 'Solid Fit', 'Moderate Fit', or 'Stretch Role'"
    )
    summary_verdict: str = Field(
        default="",
        description="Concise 1-2 sentence executive summary of candidate fit against the job description"
    )
    alignments: List[MatchAlignmentItem] = Field(
        default_factory=list,
        description="Where candidate authentic experience aligns with JD requirements"
    )
    gaps_detailed: List[MatchGapItem] = Field(
        default_factory=list,
        description="Grounded gaps strictly derived from unfulfilled JD requirements"
    )
    breakdown: ScoreBreakdown = Field(..., description="Component breakdown scores")
    gaps: List[str] = Field(default_factory=list, description="Plain English gap analysis summary")
    critical_missing_keywords: List[MissingKeyword] = Field(
        default_factory=list,
        description="Structured checklist of missing hard skills, tools, and methodologies"
    )

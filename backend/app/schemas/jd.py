from typing import List, Optional
from pydantic import BaseModel, Field


class JdPreviewRequest(BaseModel):
    url: str = Field(..., description="Job posting URL to fetch")


class JdPreviewResponse(BaseModel):
    success: bool = Field(..., description="Whether the job posting was successfully fetched")
    raw_text: Optional[str] = Field(default=None, description="Extracted plain text of the job posting")
    reason: Optional[str] = Field(
        default=None,
        description="Reason code if fetch failed: 'blocked' | 'timeout' | 'empty'"
    )


class JdParseRequest(BaseModel):
    raw_text: str = Field(..., description="Raw text of the job description to parse")
    source_url: Optional[str] = Field(default=None, description="Original job posting URL if available")


class JdRequirements(BaseModel):
    job_title: Optional[str] = Field(default="Job Position", description="Job title extracted from the description")
    company_name: Optional[str] = Field(default="Company", description="Company or hiring organization name")
    location: Optional[str] = Field(default=None, description="Job location or Remote/Hybrid")
    seniority: Optional[str] = Field(default=None, description="Detected seniority: ENTRY | MID | SENIOR | LEAD")
    employment_type: Optional[str] = Field(
        default=None,
        description="Employment type: FULL_TIME | CONTRACT | INTERNSHIP | PART_TIME"
    )
    required_skills: List[str] = Field(
        default_factory=list,
        description="Mandatory hard skills, technologies, and methods required for the role"
    )
    preferred_skills: List[str] = Field(
        default_factory=list,
        description="Nice-to-have skills, preferred tools, or bonus qualifications"
    )
    responsibilities: List[str] = Field(
        default_factory=list,
        description="Core duties and day-to-day responsibilities"
    )
    keywords: List[str] = Field(
        default_factory=list,
        description="High-impact ATS domain keywords for resume tailoring"
    )
    raw_text: str = Field(default="", description="Original raw text passed to the parser")
    source_url: Optional[str] = Field(default=None, description="Source URL of the job posting")

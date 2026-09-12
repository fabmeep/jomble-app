from typing import List, Optional
from pydantic import BaseModel, Field


class ContactInfo(BaseModel):
    name: str = Field(default="", description="Candidate full name")
    email: str = Field(default="", description="Candidate email address")
    phone: Optional[str] = Field(default=None, description="Phone number")
    location: Optional[str] = Field(default=None, description="City / Region / Country")
    linkedin: Optional[str] = Field(default=None, description="LinkedIn profile URL")
    github: Optional[str] = Field(default=None, description="GitHub profile URL")
    website: Optional[str] = Field(default=None, description="Personal portfolio website URL")


class CvBullet(BaseModel):
    id: str = Field(..., description="Stable, unique bullet ID across extractions, e.g. b_1, b_2")
    text: str = Field(..., description="Original bullet text")


class ExperienceEntry(BaseModel):
    id: str = Field(..., description="Stable experience entry ID, e.g. exp_1")
    company: str = Field(..., description="Company or organization name")
    title: str = Field(..., description="Job title / role")
    dates: str = Field(default="", description="Employment date range, e.g. Jan 2022 - Present")
    location: Optional[str] = Field(default=None, description="Job location")
    bullets: List[CvBullet] = Field(default_factory=list, description="List of accomplishment bullets with IDs")


class EducationEntry(BaseModel):
    id: str = Field(..., description="Stable education ID, e.g. edu_1")
    institution: str = Field(..., description="University / College / School name")
    degree: str = Field(..., description="Degree or qualification obtained")
    dates: str = Field(default="", description="Attendance dates or graduation year")
    details: Optional[str] = Field(default=None, description="GPA, honors, or coursework")


class ProjectEntry(BaseModel):
    id: str = Field(..., description="Stable project ID, e.g. proj_1")
    name: str = Field(..., description="Project name")
    description: str = Field(default="", description="Project summary / highlights")
    technologies: List[str] = Field(default_factory=list, description="Technologies used")
    link: Optional[str] = Field(default=None, description="Project repository or live link")


class StructuredCv(BaseModel):
    contact: ContactInfo
    summary: str = Field(default="", description="Professional summary / objective")
    experience: List[ExperienceEntry] = Field(default_factory=list, description="Work experience list")
    education: List[EducationEntry] = Field(default_factory=list, description="Education list")
    skills: List[str] = Field(default_factory=list, description="Extracted skills and technologies")
    projects: Optional[List[ProjectEntry]] = Field(default_factory=list, description="Personal or open source projects")
    certifications: Optional[List[str]] = Field(default_factory=list, description="Certifications and licenses")


class CvExtractRequest(BaseModel):
    raw_text: Optional[str] = Field(default=None, description="Directly pasted raw CV text")


class CvExtractResponse(BaseModel):
    file_name: Optional[str] = Field(default=None, description="Uploaded file name")
    raw_text: str = Field(..., description="Normalized raw text extracted from document")
    structured_data: StructuredCv = Field(..., description="Structured resume data with stable bullet IDs")
    extraction_confidence: float = Field(default=1.0, description="Heuristic parsing confidence score 0.0-1.0")


class BulletComparison(BaseModel):
    original: str
    tailored: str


class GenerateRequest(BaseModel):
    job_title: Optional[str] = "Full Stack Engineer"
    company_name: Optional[str] = "TechCorp"
    job_description: Optional[str] = ""
    master_resume_text: Optional[str] = ""


class TailoredCVResponse(BaseModel):
    id: str
    job_title: str
    company_name: str
    match_score: int
    summary: str
    tailored_experience: List[ExperienceEntry]
    matched_skills: List[str]
    missing_skills: List[str]
    grounding_status: str
    is_canned_mock: bool

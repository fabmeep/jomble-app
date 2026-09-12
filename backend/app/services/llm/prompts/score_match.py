import json
from typing import List
from app.schemas.cv import StructuredCv
from app.schemas.jd import JdRequirements


def get_match_scoring_prompt(
    cv: StructuredCv,
    jd: JdRequirements,
    baseline_score: int,
    missing_skills: List[str],
) -> str:
    """
    Constructs a strict, zero-hallucination prompt instructing the LLM to analyze candidate alignment
    against the target Job Description. Enforces that all alignments originate directly from the Master CV
    and all gaps originate directly from the Job Description.
    """
    cv_data = cv.model_dump()
    # Strip unnecessary raw fields to preserve context budget
    cv_json = json.dumps(
        {
            "contact": cv_data.get("contact", {}),
            "summary": cv_data.get("summary", ""),
            "skills": cv_data.get("skills", []),
            "experience": [
                {
                    "company": exp.get("company"),
                    "title": exp.get("title"),
                    "dates": exp.get("dates"),
                    "bullets": [b.get("text") for b in exp.get("bullets", [])],
                }
                for exp in cv_data.get("experience", [])
            ],
            "projects": cv_data.get("projects", []),
            "education": cv_data.get("education", []),
            "certifications": cv_data.get("certifications", []),
        },
        indent=2,
    )

    jd_json = json.dumps(
        {
            "job_title": jd.job_title,
            "company_name": jd.company_name,
            "seniority": jd.seniority,
            "required_skills": jd.required_skills,
            "preferred_skills": jd.preferred_skills,
            "responsibilities": jd.responsibilities,
            "keywords": jd.keywords,
        },
        indent=2,
    )

    return f"""You are an objective Technical Recruiter and Career Auditor.
Your task is to analyze how well the Candidate's Master CV aligns with the Target Job Description (JD).

=== CANDIDATE MASTER CV (AUTHENTIC SOURCE OF TRUTH) ===
{cv_json}

=== TARGET JOB DESCRIPTION (TARGET SPECIFICATION) ===
{jd_json}

=== PRE-CALCULATED BENCHMARKS ===
- Deterministic Match Score Baseline: {baseline_score}%
- Verified Missing/Unmatched Requirements: {json.dumps(missing_skills)}

=== STRICT ANTI-HALLUCINATION RULES (CRITICAL) ===
1. ZERO FABRICATION OF JD REQUIREMENTS:
   - Under 'alignments' and 'gaps', you MUST ONLY reference technologies, skills, or responsibilities that appear explicitly in the Target Job Description above.
   - NEVER invent requirements, frameworks, languages, cloud tools, or methodologies that the employer did not request.

2. ZERO FABRICATION OF CANDIDATE QUALIFICATIONS:
   - Under 'alignments', you MUST ONLY cite skills, roles, accomplishments, or tools that are explicitly written in the Candidate Master CV.
   - NEVER invent candidate experience, metrics, past titles, or proficiencies.

3. NO FALSE GAPS:
   - If the candidate's CV contains a skill or an obvious synonym (e.g., React/Next.js, PostgreSQL/Postgres, TypeScript/JavaScript), do NOT claim they lack it.
   - ONLY list genuine omissions or areas where the candidate falls short of the JD's stated requirements.

4. OBJECTIVE SYNTHESIS:
   - "overall_score": An integer between 0 and 100 representing realistic fit (keep within +/- 8 points of the baseline score {baseline_score}%).
   - "match_tier": One of exactly: "Strong Match" (85-100), "Solid Fit" (70-84), "Moderate Fit" (55-69), or "Stretch Role" (<55).
   - "summary_verdict": Exactly 1-2 objective sentences summarizing candidate fit, highlighting the primary strength and the primary missing requirement.
   - "alignments": An array of 2 to 4 objects where candidate authentic experience matches JD requirements:
       {{
         "skill": "Specific skill or area",
         "evidence": "Brief explanation citing Master CV experience and how it satisfies the JD requirement."
       }}
   - "gaps": An array of 1 to 4 objects highlighting real JD requirements the candidate lacks:
       {{
         "skill": "Specific missing tool or qualification from JD",
         "severity": "critical" (if required in JD) | "moderate" (if preferred) | "minor" (if keyword),
         "reason": "Clear explanation of what the JD requests that is absent from the candidate's profile."
       }}

=== REQUIRED JSON OUTPUT FORMAT ===
You must return ONLY a single valid raw JSON object matching this schema:
{{
  "overall_score": {baseline_score},
  "match_tier": "Solid Fit",
  "summary_verdict": "Candidate has strong TypeScript and frontend architecture experience matching core JD requirements, but lacks the required Golang backend experience.",
  "alignments": [
    {{
      "skill": "TypeScript & React",
      "evidence": "Candidate has 3+ years building scalable interfaces with React, Next.js, and TypeScript, directly satisfying the core frontend requirement."
    }}
  ],
  "gaps": [
    {{
      "skill": "Golang",
      "severity": "critical",
      "reason": "The JD specifies Golang as a required backend language, but it is not mentioned anywhere in the Master CV."
    }}
  ]
}}

Return ONLY the raw JSON object. Do NOT include markdown fences, comments, or extra text.
"""

import json
from app.schemas.cv import StructuredCv
from app.schemas.jd import JdRequirements


def get_cv_tailoring_prompt(cv: StructuredCv, jd: JdRequirements) -> str:
    """
    Constructs a strict, anti-hallucination resume tailoring prompt for the LLM.
    Enforces stable bullet ID mapping, truthful metric preservation, and targeted phrasing.
    """
    cv_json = json.dumps(cv.model_dump(), indent=2)
    jd_json = json.dumps(jd.model_dump(), indent=2)

    return f"""You are an expert Career Strategist and Executive Resume Specialist.
Your job is to tailor the candidate's Master CV to directly align with the target Job Description (JD).

=== CANDIDATE MASTER CV (GROUND TRUTH) ===
{cv_json}

=== TARGET JOB DESCRIPTION ===
{jd_json}

=== STRICT ANTI-HALLUCINATION RULES ===
1. TRUTH PRESERVATION IS PARAMOUNT:
   - NEVER fabricate employment, companies, degrees, dates, or certifications.
   - NEVER invent new numbers, percentages, dollar amounts, or metrics. If a bullet says "42%", retain "42%". If a bullet has no metric, do NOT make one up.
   - Only highlight tools, frameworks, and methodologies that the candidate has authentic experience with in their Master CV.

2. STABLE BULLET ID MAPPING (MANDATORY):
   - Every experience bullet MUST retain its exact original 'id' from the Master CV (e.g. "b_1", "b_2", "b_101").
   - Rewritten bullets must be direct, optimized rewrites of that specific original bullet.

3. TAILORING OBJECTIVES:
   - SUMMARY: Rewrite the professional summary into a high-impact 3-sentence summary highlighting the candidate's background aligned with the target job title ("{jd.job_title or 'Target Role'}") and company ("{jd.company_name or 'the company'}").
   - BULLETS: Rewrite experience bullets using strong action verbs, aligning phrasing with JD keywords and responsibilities while preserving factual truth.
   - SKILLS: Reorder the skills array to place the JD-required and preferred skills first, followed by the candidate's other authentic skills.

=== REQUIRED JSON OUTPUT FORMAT ===
You must return ONLY a single valid JSON object strictly matching this schema:
{{
  "contact": {{
    "name": "{cv.contact.name}",
    "email": "{cv.contact.email}",
    "phone": "{cv.contact.phone or ''}",
    "location": "{cv.contact.location or ''}",
    "linkedin": "{cv.contact.linkedin or ''}",
    "github": "{cv.contact.github or ''}",
    "website": "{cv.contact.website or ''}"
  }},
  "summary": "Tailored 3-sentence professional summary...",
  "experience": [
    {{
      "id": "exp_1",
      "company": "Company Name",
      "title": "Job Title",
      "dates": "Employment Dates",
      "location": "Location",
      "bullets": [
        {{
          "id": "ORIGINAL_BULLET_ID",
          "text": "Targeted rewritten bullet text preserving metrics..."
        }}
      ]
    }}
  ],
  "education": [
    {{
      "id": "edu_1",
      "institution": "University",
      "degree": "Degree",
      "dates": "Dates",
      "details": "Details"
    }}
  ],
  "skills": ["Skill1", "Skill2", "Skill3"],
  "projects": [
    {{
      "id": "proj_1",
      "name": "Project Name",
      "description": "Project Description",
      "technologies": ["Tech1"],
      "link": "Link"
    }}
  ],
  "certifications": ["Cert1"]
}}

Return ONLY the raw JSON object. Do not include markdown code fences, comments, or explanations.
"""

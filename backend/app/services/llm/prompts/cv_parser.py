from typing import Optional


CV_EXTRACTION_BASE_INSTRUCTIONS = (
    "You are an expert, precise resume parsing system.\n"
    "Your task is to analyze the provided resume document or text and convert it into a strictly structured JSON object.\n\n"
    "CRITICAL RULES:\n"
    "1. ACCURACY & FIDELITY: Transcribe all candidate details, dates, job titles, company names, and bullet points verbatim.\n"
    "2. DO NOT HALLUCINATE: Never invent, assume, summarize, or omit bullet points, achievements, or employment periods.\n"
    "3. STABLE IDENTIFIERS:\n"
    "   - Assign 'exp_1', 'exp_2', ... for experience entries.\n"
    "   - Assign 'b_1', 'b_2', 'b_3', ... for individual accomplishment bullet points.\n"
    "   - Assign 'edu_1', 'edu_2', ... for education entries.\n"
    "   - Assign 'proj_1', 'proj_2', ... for project entries.\n"
    "4. MULTI-COLUMN LAYOUTS: Ensure sidebar contact/skills details are not mixed into experience bullets.\n"
    "5. OUTPUT FORMAT: Return ONLY a valid JSON object matching the schema below without markdown formatting or code fences.\n\n"
    "REQUIRED JSON SCHEMA:\n"
    "{\n"
    '  "contact": {\n'
    '    "name": "Candidate Full Name",\n'
    '    "email": "candidate.email@example.com",\n'
    '    "phone": "+1234567890 or null",\n'
    '    "location": "City, Country or null",\n'
    '    "linkedin": "LinkedIn profile URL or null",\n'
    '    "github": "GitHub profile URL or null",\n'
    '    "website": "Personal portfolio URL or null"\n'
    "  },\n"
    '  "summary": "Professional summary paragraph or empty string",\n'
    '  "experience": [\n'
    "    {\n"
    '      "id": "exp_1",\n'
    '      "company": "Company / Organization Name",\n'
    '      "title": "Job Title / Role",\n'
    '      "dates": "Employment date range e.g. Jan 2022 - Present",\n'
    '      "location": "Job location or null",\n'
    '      "bullets": [\n'
    '        {"id": "b_1", "text": "Verbatim bullet point 1"},\n'
    '        {"id": "b_2", "text": "Verbatim bullet point 2"}\n'
    "      ]\n"
    "    }\n"
    "  ],\n"
    '  "education": [\n'
    "    {\n"
    '      "id": "edu_1",\n'
    '      "institution": "University / College / School name",\n'
    '      "degree": "Degree / Qualification obtained",\n'
    '      "dates": "Attendance dates or graduation year",\n'
    '      "details": "GPA, honors, or coursework or null"\n'
    "    }\n"
    "  ],\n"
    '  "skills": ["Skill 1", "Skill 2", "Skill 3"],\n'
    '  "projects": [\n'
    "    {\n"
    '      "id": "proj_1",\n'
    '      "name": "Project Name",\n'
    '      "description": "Project summary",\n'
    '      "technologies": ["Tech 1", "Tech 2"],\n'
    '      "link": "Project link or null"\n'
    "    }\n"
    "  ],\n"
    '  "certifications": ["Certification 1", "License 2"]\n'
    "}"
)


def get_cv_extraction_prompt(raw_text: Optional[str] = None) -> str:
    """
    Returns the optimized prompt string for CV parsing.
    If raw_text is provided, appends the text block to the instructions.
    """
    if not raw_text or not raw_text.strip():
        return CV_EXTRACTION_BASE_INSTRUCTIONS

    return (
        f"{CV_EXTRACTION_BASE_INSTRUCTIONS}\n\n"
        f"--- RESUME CONTENT ---\n"
        f"{raw_text.strip()}\n"
        f"--- END RESUME CONTENT ---"
    )

from app.schemas.cv import (
    ContactInfo,
    StructuredCv,
    CvBullet,
    ExperienceEntry,
    EducationEntry,
    ProjectEntry,
)


def normalize_structured_cv(structured_cv: StructuredCv) -> StructuredCv:
    """
    Guarantees that all experience entries, bullets, education, and project entries
    have deterministic, sequential identifiers (exp_1, b_1, edu_1, proj_1, etc.)
    and clean trimmed strings for downstream anti-hallucination grounding.
    """
    normalized_contact = ContactInfo(
        name=structured_cv.contact.name.strip() if structured_cv.contact.name else "",
        email=structured_cv.contact.email.strip() if structured_cv.contact.email else "",
        phone=structured_cv.contact.phone.strip() if structured_cv.contact.phone else None,
        location=structured_cv.contact.location.strip() if structured_cv.contact.location else None,
        linkedin=structured_cv.contact.linkedin.strip() if structured_cv.contact.linkedin else None,
        github=structured_cv.contact.github.strip() if structured_cv.contact.github else None,
        website=structured_cv.contact.website.strip() if structured_cv.contact.website else None,
    )

    bullet_counter = 1
    normalized_experience = []

    for exp_idx, exp in enumerate(structured_cv.experience, start=1):
        exp_id = exp.id if (exp.id and exp.id.startswith("exp_")) else f"exp_{exp_idx}"
        normalized_bullets = []
        for b in exp.bullets:
            b_text = b.text.strip() if hasattr(b, "text") else str(b).strip()
            if not b_text:
                continue
            b_id = b.id if (hasattr(b, "id") and b.id and b.id.startswith("b_")) else f"b_{bullet_counter}"
            normalized_bullets.append(CvBullet(id=b_id, text=b_text))
            bullet_counter += 1

        normalized_experience.append(
            ExperienceEntry(
                id=exp_id,
                company=exp.company.strip() if exp.company else "Organization",
                title=exp.title.strip() if exp.title else "Role",
                dates=exp.dates.strip() if exp.dates else "",
                location=exp.location.strip() if exp.location else None,
                bullets=normalized_bullets,
            )
        )

    normalized_education = []
    for edu_idx, edu in enumerate(structured_cv.education, start=1):
        edu_id = edu.id if (edu.id and edu.id.startswith("edu_")) else f"edu_{edu_idx}"
        normalized_education.append(
            EducationEntry(
                id=edu_id,
                institution=edu.institution.strip() if edu.institution else "",
                degree=edu.degree.strip() if edu.degree else "",
                dates=edu.dates.strip() if edu.dates else "",
                details=edu.details.strip() if edu.details else None,
            )
        )

    normalized_projects = []
    if structured_cv.projects:
        for proj_idx, proj in enumerate(structured_cv.projects, start=1):
            proj_id = proj.id if (proj.id and proj.id.startswith("proj_")) else f"proj_{proj_idx}"
            normalized_projects.append(
                ProjectEntry(
                    id=proj_id,
                    name=proj.name.strip() if proj.name else "Project",
                    description=proj.description.strip() if proj.description else "",
                    technologies=[t.strip() for t in proj.technologies if t.strip()] if proj.technologies else [],
                    link=proj.link.strip() if proj.link else None,
                )
            )

    normalized_skills = [s.strip() for s in structured_cv.skills if s.strip()] if structured_cv.skills else []
    normalized_certifications = (
        [c.strip() for c in structured_cv.certifications if c.strip()]
        if structured_cv.certifications
        else None
    )

    return StructuredCv(
        contact=normalized_contact,
        summary=structured_cv.summary.strip() if structured_cv.summary else "",
        experience=normalized_experience,
        education=normalized_education,
        skills=normalized_skills,
        projects=normalized_projects if normalized_projects else None,
        certifications=normalized_certifications if normalized_certifications else None,
    )

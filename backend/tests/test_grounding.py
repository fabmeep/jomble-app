import pytest
from app.schemas.cv import StructuredCv, ContactInfo, ExperienceEntry, CvBullet
from app.services.grounding import compute_bullet_similarity, audit_tailored_cv


def test_compute_bullet_similarity_pass():
    orig = "Architected micro-frontend architecture using Next.js 15 App Router, boosting page load speeds by 42%."
    rewritten = "Architected micro-frontend architecture using Next.js 15 App Router, boosting initial page speeds by 42% for active users."
    
    score, status = compute_bullet_similarity(orig, rewritten)
    assert score >= 0.75
    assert status == "pass"


def test_compute_bullet_similarity_flagged_metric_drift():
    orig = "Optimized SQL queries and Prisma ORM indexing in PostgreSQL, reducing p95 database response latency."
    rewritten = "Optimized database performance to achieve high-throughput response speeds, cutting latency by 99%."
    
    score, status = compute_bullet_similarity(orig, rewritten)
    # 99% was not in original, should trigger penalty or flag
    assert status in ["flagged", "rejected"]


def test_compute_bullet_similarity_rejected():
    orig = "Mentored 4 junior engineers and implemented strict CI/CD quality gates using Playwright."
    rewritten = "Managed multi-million dollar cloud budgets across AWS and Kubernetes infrastructure."
    
    score, status = compute_bullet_similarity(orig, rewritten)
    assert score < 0.50
    assert status == "rejected"


def test_audit_tailored_cv():
    orig_cv = StructuredCv(
        contact=ContactInfo(name="Test Candidate", email="test@example.com"),
        summary="Experienced engineer",
        skills=["React", "TypeScript"],
        experience=[
            ExperienceEntry(
                id="exp_1",
                company="TechCorp",
                title="Frontend Lead",
                dates="2022 - Present",
                bullets=[
                    CvBullet(id="b_1", text="Built responsive dashboard using React and TailwindCSS with 99.9% uptime."),
                    CvBullet(id="b_2", text="Collaborated with product designers on accessibility."),
                ]
            )
        ]
    )

    tailored_cv = StructuredCv(
        contact=ContactInfo(name="Test Candidate", email="test@example.com"),
        summary="Frontend Specialist",
        skills=["React", "TypeScript"],
        experience=[
            ExperienceEntry(
                id="exp_1",
                company="TechCorp",
                title="Frontend Lead",
                dates="2022 - Present",
                bullets=[
                    # Faithful rewrite
                    CvBullet(id="b_1", text="Engineered responsive dashboard using React and TailwindCSS maintaining 99.9% uptime."),
                    # Substantial change
                    CvBullet(id="b_2", text="Led cross-functional design sprints to achieve strict WCAG 2.1 AA accessibility standards."),
                ]
            )
        ]
    )

    report = audit_tailored_cv(orig_cv, tailored_cv)
    assert len(report) == 2
    assert report[0].source_bullet_id == "b_1"
    assert report[0].status == "pass"
    assert report[0].user_resolution == "approved"
    assert report[1].source_bullet_id == "b_2"

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.cv import StructuredCv, ContactInfo, ExperienceEntry, CvBullet, EducationEntry
from app.schemas.jd import JdRequirements
from app.services.scoring import calculate_match_score


client = TestClient(app)


@pytest.fixture
def sample_candidate_cv():
    return StructuredCv(
        contact=ContactInfo(name="Jane Doe", email="jane@example.com"),
        summary="Senior Full-Stack Engineer with 5+ years of experience building modern web apps with TypeScript, React, and Node.js.",
        skills=["TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "Prisma", "TailwindCSS"],
        experience=[
            ExperienceEntry(
                id="exp_1",
                company="TechCorp",
                title="Senior Frontend Engineer",
                dates="2022 - Present",
                bullets=[
                    CvBullet(id="b_1", text="Architected high-throughput React dashboard with Next.js and TailwindCSS."),
                    CvBullet(id="b_2", text="Optimized database query performance with PostgreSQL and Prisma."),
                ]
            ),
            ExperienceEntry(
                id="exp_2",
                company="StartupX",
                title="Full-Stack Developer",
                dates="2020 - 2022",
                bullets=[
                    CvBullet(id="b_3", text="Built REST APIs using Node.js and PostgreSQL."),
                ]
            )
        ],
        education=[
            EducationEntry(id="edu_1", institution="State University", degree="B.S. Computer Science", dates="2016 - 2020")
        ]
    )


@pytest.fixture
def sample_matching_jd():
    return JdRequirements(
        company_name="Acme Tech",
        job_title="Senior Full-Stack Engineer",
        seniority="Senior",
        required_skills=["React", "TypeScript", "Node.js"],
        preferred_skills=["PostgreSQL", "TailwindCSS"],
        responsibilities=[
            "Design and maintain scalable web interfaces in React and TypeScript.",
            "Build reliable REST backend endpoints with Node.js.",
        ],
        keywords=["Frontend", "REST APIs", "Clean Code"],
        raw_text="We are seeking a Senior Full-Stack Engineer with strong React, TypeScript, and Node.js skills."
    )


@pytest.fixture
def sample_gap_jd():
    return JdRequirements(
        company_name="Cloud Corp",
        job_title="Lead DevOps & Cloud Engineer",
        seniority="Senior",
        required_skills=["Golang", "Kubernetes", "Terraform"],
        preferred_skills=["CI/CD", "AWS"],
        responsibilities=[
            "Maintain Kubernetes clusters and Terraform infrastructure.",
            "Build automated CI/CD deployment pipelines."
        ],
        keywords=["Infrastructure", "SRE", "Observability"],
        raw_text="Looking for a Lead DevOps Engineer. Kubernetes is essential. We use Kubernetes for all services. Kubernetes, Golang, and Terraform."
    )


def test_scoring_high_match(sample_candidate_cv, sample_matching_jd):
    report = calculate_match_score(sample_candidate_cv, sample_matching_jd)
    
    assert report.overall_score >= 80
    assert report.breakdown.required_skills_score == 100
    assert report.breakdown.preferred_skills_score == 100
    assert report.breakdown.experience_fit_score == 100
    # No critical required skills missing
    critical_missing = [kw for kw in report.critical_missing_keywords if kw.importance == "critical"]
    assert len(critical_missing) == 0


def test_scoring_gap_detection_and_categorization(sample_candidate_cv, sample_gap_jd):
    report = calculate_match_score(sample_candidate_cv, sample_gap_jd)
    
    assert report.overall_score < 50
    assert report.breakdown.required_skills_score == 0
    assert len(report.gaps) > 0

    # Verify Critical Missing Keywords Checklist
    names = {kw.name: kw for kw in report.critical_missing_keywords}
    assert "Kubernetes" in names
    assert "Golang" in names
    assert "Terraform" in names

    # Check categories
    assert names["Kubernetes"].category == "framework_tool"
    assert names["Terraform"].category == "framework_tool"
    assert names["Golang"].category == "hard_skill"
    if "CI/CD" in names:
        assert names["CI/CD"].category == "methodology"

    # Check importance and frequency
    assert names["Kubernetes"].importance == "critical"
    assert names["Kubernetes"].frequency >= 2


def test_score_router_endpoint(sample_candidate_cv, sample_matching_jd):
    payload = {
        "cv": sample_candidate_cv.model_dump(),
        "jd": sample_matching_jd.model_dump(),
    }
    response = client.post("/score/calculate?use_llm=false", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "overall_score" in data
    assert "breakdown" in data
    assert "critical_missing_keywords" in data
    assert data["breakdown"]["required_skills_score"] == 100
    assert "match_tier" in data
    assert data["match_tier"] in ["Strong Match", "Solid Fit"]
    assert "summary_verdict" in data
    assert len(data["summary_verdict"]) > 0
    assert "alignments" in data
    assert len(data["alignments"]) > 0
    assert "skill" in data["alignments"][0]
    assert "evidence" in data["alignments"][0]


def test_simplified_match_score_alignments_and_gaps(sample_candidate_cv, sample_gap_jd):
    report = calculate_match_score(sample_candidate_cv, sample_gap_jd)
    assert report.match_tier == "Stretch Role"
    assert "Stretch opportunity" in report.summary_verdict
    assert len(report.gaps_detailed) > 0
    gap_skills = [g.skill for g in report.gaps_detailed]
    assert "Kubernetes" in gap_skills
    assert "Golang" in gap_skills


def test_match_scoring_prompt_anti_hallucination(sample_candidate_cv, sample_matching_jd):
    from app.services.llm.prompts.score_match import get_match_scoring_prompt
    prompt = get_match_scoring_prompt(
        cv=sample_candidate_cv,
        jd=sample_matching_jd,
        baseline_score=85,
        missing_skills=["AWS", "Docker"],
    )
    assert "ZERO FABRICATION OF JD REQUIREMENTS" in prompt
    assert "ZERO FABRICATION OF CANDIDATE QUALIFICATIONS" in prompt
    assert "NO FALSE GAPS" in prompt
    assert "alignments" in prompt
    assert "gaps" in prompt
    assert "85%" in prompt


import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.cv import StructuredCv, ContactInfo, ExperienceEntry, CvBullet, EducationEntry
from app.schemas.jd import JdRequirements
from app.services.llm.prompts.cv_tailor import get_cv_tailoring_prompt


client = TestClient(app)


@pytest.fixture
def sample_cv():
    return StructuredCv(
        contact=ContactInfo(name="Alex Rivera", email="alex@example.com"),
        summary="Software Engineer with React experience.",
        skills=["React", "TypeScript", "TailwindCSS"],
        experience=[
            ExperienceEntry(
                id="exp_1",
                company="Acme Co",
                title="Frontend Developer",
                dates="2022 - Present",
                bullets=[
                    CvBullet(id="b_1", text="Built web applications using React and Next.js, improving page speed by 40%."),
                    CvBullet(id="b_2", text="Collaborated with product teams to build UI design systems."),
                ]
            )
        ]
    )


@pytest.fixture
def sample_jd():
    return JdRequirements(
        company_name="Shopee",
        job_title="Senior Frontend Engineer",
        required_skills=["React", "Next.js", "TypeScript"],
        preferred_skills=["Performance Optimization", "Design Systems"],
        responsibilities=["Architect high-scale web interfaces in Next.js."],
        keywords=["Frontend", "Core Web Vitals"],
        raw_text="Looking for a Senior Frontend Engineer at Shopee."
    )


def test_cv_tailoring_prompt_generation(sample_cv, sample_jd):
    prompt = get_cv_tailoring_prompt(sample_cv, sample_jd)
    assert "Alex Rivera" in prompt
    assert "Shopee" in prompt
    assert "Senior Frontend Engineer" in prompt
    assert "STRICT ANTI-HALLUCINATION RULES" in prompt
    assert "b_1" in prompt


@pytest.mark.asyncio
async def test_tailor_router_endpoint_with_mock(sample_cv, sample_jd):
    mock_tailored_cv = StructuredCv(
        contact=sample_cv.contact,
        summary="Senior Frontend Engineer with proven Next.js and React expertise.",
        skills=["React", "Next.js", "TypeScript", "TailwindCSS"],
        experience=[
            ExperienceEntry(
                id="exp_1",
                company="Acme Co",
                title="Frontend Developer",
                dates="2022 - Present",
                bullets=[
                    CvBullet(id="b_1", text="Architected high-scale web apps using React and Next.js, boosting page speeds by 40%."),
                    CvBullet(id="b_2", text="Partnered with product designers to implement scalable UI design systems."),
                ]
            )
        ]
    )

    with patch("app.routers.tailor.get_llm_provider") as mock_get_provider:
        mock_provider_instance = AsyncMock()
        mock_provider_instance.tailor_cv.return_value = mock_tailored_cv
        mock_provider_instance.model_name = "mock-model"
        mock_get_provider.return_value = mock_provider_instance

        payload = {
            "cv": sample_cv.model_dump(),
            "jd": sample_jd.model_dump(),
            "job_title": "Senior Frontend Engineer",
            "company_name": "Shopee",
        }

        response = client.post("/tailor/generate", json=payload)
        assert response.status_code == 200
        data = response.json()

        assert data["job_title"] == "Senior Frontend Engineer"
        assert data["company_name"] == "Shopee"
        assert len(data["grounding_report"]) == 2
        assert data["match_score"] > 0
        assert data["grounding_report"][0]["source_bullet_id"] == "b_1"
        assert data["grounding_report"][0]["status"] in ["pass", "flagged"]


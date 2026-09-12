from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.cv import ContactInfo, CvBullet, ExperienceEntry, StructuredCv

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"


def test_cv_extract_text_json():
    payload = {
        "raw_text": "Jane Doe\njane.doe@example.com\nSUMMARY\nLead Engineer"
    }

    mock_cv = StructuredCv(
        contact=ContactInfo(name="Jane Doe", email="jane.doe@example.com"),
        summary="Lead Frontend Engineer with 7 years of experience in React and TypeScript.",
        experience=[
            ExperienceEntry(
                id="exp_1",
                company="CloudScale Inc",
                title="Staff Engineer",
                dates="Jan 2021 - Present",
                bullets=[
                    CvBullet(id="b_1", text="Spearheaded design system adoption across 14 engineering teams."),
                ]
            )
        ],
        education=[],
        skills=["TypeScript", "React", "Next.js"],
    )

    with patch("app.services.llm.gemini.GeminiProvider.extract_cv", new_callable=AsyncMock) as mock_extract:
        mock_extract.return_value = (payload["raw_text"], mock_cv)

        response = client.post(
            "/cv/extract-text",
            json=payload,
            headers={"X-Llm-Provider": "GEMINI", "X-Gemini-Api-Key": "test-key"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["structured_data"]["contact"]["name"] == "Jane Doe"
        assert data["structured_data"]["contact"]["email"] == "jane.doe@example.com"
        assert len(data["structured_data"]["experience"]) >= 1
        assert data["structured_data"]["experience"][0]["bullets"][0]["id"] == "b_1"
        assert "TypeScript" in data["structured_data"]["skills"]


def test_cv_extract_empty_fails():
    response = client.post("/cv/extract-text", json={"raw_text": "   "})
    assert response.status_code == 400

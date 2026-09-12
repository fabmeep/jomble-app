from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.jd import JdRequirements

client = TestClient(app)


def test_jd_preview_success():
    sample_text = "Software Engineer at TechCorp. Responsible for building scalable REST APIs in Python. Requires 3+ years experience." * 3
    with patch("app.routers.jd.fetch_job_posting", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = (True, sample_text, None)
        response = client.post("/jd/preview", json={"url": "https://example.com/job/123"})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "Software Engineer" in data["raw_text"]
        assert data["reason"] is None


def test_jd_preview_failure():
    with patch("app.routers.jd.fetch_job_posting", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = (False, None, "blocked")
        response = client.post("/jd/preview", json={"url": "https://linkedin.com/jobs/view/999"})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert data["raw_text"] is None
        assert data["reason"] == "blocked"


def test_jd_parse_success():
    sample_jd = """
    Job Title: Senior Backend Engineer
    Company: CloudScale
    Location: Remote
    Requirements:
    - 5+ years of experience with Go and PostgreSQL
    - Experience in microservices architecture and Kubernetes
    - Docker, Redis, and gRPC familiarity preferred
    Responsibilities:
    - Design and maintain mission-critical backend microservices
    - Optimize database queries and schema migrations
    """
    mock_requirements = JdRequirements(
        job_title="Senior Backend Engineer",
        company_name="CloudScale",
        location="Remote",
        seniority="SENIOR",
        employment_type="FULL_TIME",
        required_skills=["Go", "PostgreSQL", "Microservices", "Kubernetes"],
        preferred_skills=["Docker", "Redis", "gRPC"],
        responsibilities=["Design and maintain mission-critical backend microservices"],
        keywords=["Go", "PostgreSQL", "Kubernetes", "Microservices", "gRPC"],
        raw_text=sample_jd,
        source_url="https://example.com/job/senior-be",
    )

    with patch("app.services.llm.gemini.GeminiProvider.extract_jd_requirements", new_callable=AsyncMock) as mock_extract:
        mock_extract.return_value = mock_requirements
        response = client.post(
            "/jd/parse",
            json={"raw_text": sample_jd, "source_url": "https://example.com/job/senior-be"},
            headers={"X-Llm-Provider": "GEMINI", "X-Gemini-Api-Key": "test-key"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["job_title"] == "Senior Backend Engineer"
        assert data["company_name"] == "CloudScale"
        assert data["seniority"] == "SENIOR"
        assert "Go" in data["required_skills"]
        assert "Redis" in data["preferred_skills"]


def test_jd_parse_text_too_short():
    response = client.post(
        "/jd/parse",
        json={"raw_text": "Too short"},
    )
    assert response.status_code == 400

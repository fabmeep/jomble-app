import pytest
from unittest.mock import MagicMock, patch
from app.services.llm.gemini import GeminiProvider


@pytest.mark.asyncio
async def test_gemini_provider_mock_extraction_direct_json():
    provider = GeminiProvider(api_key="mock-api-key", model_name="gemini-3.7-flash")

    mock_gemini_response = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": """
                            {
                                "contact": {
                                    "name": "Alex Dev",
                                    "email": "alex@example.com"
                                },
                                "summary": "Experienced engineer",
                                "experience": [
                                    {
                                        "id": "exp_1",
                                        "company": "NextGen Labs",
                                        "title": "Lead Developer",
                                        "dates": "2021 - 2024",
                                        "bullets": [
                                            {"id": "b_1", "text": "Engineered scalable cloud services"}
                                        ]
                                    }
                                ],
                                "education": [],
                                "skills": ["Python", "Docker"]
                            }
                            """
                        }
                    ]
                }
            }
        ]
    }

    with patch("httpx.AsyncClient.post") as mock_post:
        mock_resp = MagicMock()
        mock_resp.is_success = True
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_gemini_response
        mock_post.return_value = mock_resp

        raw_text, structured_cv = await provider.extract_cv(
            file_bytes=b"%PDF-mock-bytes",
            mime_type="application/pdf",
        )

        assert "Alex Dev" in raw_text
        assert structured_cv.contact.name == "Alex Dev"
        assert structured_cv.contact.email == "alex@example.com"
        assert len(structured_cv.experience) == 1
        assert structured_cv.experience[0].bullets[0].id == "b_1"
        assert "Docker" in structured_cv.skills

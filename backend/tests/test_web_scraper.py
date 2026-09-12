import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import httpx

from app.services.document.web_scraper import (
    _strip_html_tags,
    _extract_from_json_ld,
    fetch_job_posting,
)


def test_strip_html_tags():
    raw_html = "<p>Senior <strong>Software Engineer</strong></p><br/><ul><li>Python</li><li>FastAPI</li></ul>"
    cleaned = _strip_html_tags(raw_html)
    assert "Senior Software Engineer" in cleaned
    assert "Python" in cleaned
    assert "FastAPI" in cleaned
    assert "<" not in cleaned


def test_extract_from_json_ld():
    html_with_json_ld = """
    <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "JobPosting",
          "title": "Backend Go Engineer",
          "hiringOrganization": {"name": "Fintech Corp"},
          "jobLocation": {"address": {"addressLocality": "Jakarta", "addressCountry": "Indonesia"}},
          "description": "<p>Build high-concurrency payment gateways. Minimum 3 years Go experience required. Docker and Kubernetes familiarity preferred.</p>"
        }
        </script>
      </head>
      <body><div>Ignored navigation and footer</div></body>
    </html>
    """
    result = _extract_from_json_ld(html_with_json_ld)
    assert result is not None
    assert "Backend Go Engineer" in result
    assert "Fintech Corp" in result
    assert "Jakarta, Indonesia" in result
    assert "high-concurrency payment gateways" in result


@pytest.mark.asyncio
async def test_fetch_job_posting_timeout():
    with patch("httpx.AsyncClient.get", side_effect=httpx.ReadTimeout("Timeout exceeded")):
        success, text, reason = await fetch_job_posting("https://example.com/slow-job")
        assert success is False
        assert text is None
        assert reason == "timeout"


@pytest.mark.asyncio
async def test_fetch_job_posting_empty_csr():
    # Simulates client-side SPA loading skeleton (<200 chars)
    empty_html = "<html><body><div class='loading-skeleton'>Loading...</div></body></html>"
    mock_resp = MagicMock()
    mock_resp.is_success = True
    mock_resp.status_code = 200
    mock_resp.text = empty_html

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        success, text, reason = await fetch_job_posting("https://example.com/csr-job")
        assert success is False
        assert text is None
        assert reason == "empty"

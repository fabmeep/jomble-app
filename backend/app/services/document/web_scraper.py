import html
import json
import re
from typing import Optional, Tuple
import httpx


def _strip_html_tags(raw_html: str) -> str:
    """Removes HTML tags and converts basic block boundaries to newlines."""
    # Replace block tags with newlines
    text = re.sub(r"<(?:p|div|h[1-6]|li|br|tr)[^>]*>", "\n", raw_html, flags=re.IGNORECASE)
    # Remove remaining tags
    text = re.sub(r"<[^>]+>", "", text)
    # Unescape HTML entities (&nbsp;, &amp;, etc.)
    text = html.unescape(text)
    # Collapse multiple whitespaces and consecutive newlines
    lines = [line.strip() for line in text.splitlines()]
    non_empty = [l for l in lines if l]
    return "\n".join(non_empty)


def _extract_from_json_ld(page_html: str) -> Optional[str]:
    """
    Attempts to locate and parse Schema.org 'JobPosting' from <script type="application/ld+json">.
    This provides 100% clean, structured text without HTML navigation boilerplate.
    """
    pattern = re.compile(
        r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        re.DOTALL | re.IGNORECASE,
    )
    for match in pattern.finditer(page_html):
        content = match.group(1).strip()
        if not content:
            continue
        try:
            data = json.loads(content)
        except Exception:
            continue

        items = data if isinstance(data, list) else [data]
        if isinstance(data, dict) and "@graph" in data:
            items = data["@graph"]

        for item in items:
            if not isinstance(item, dict):
                continue
            item_type = item.get("@type", "")
            if item_type == "JobPosting" or (isinstance(item_type, list) and "JobPosting" in item_type):
                title = item.get("title", "")
                company = ""
                hiring_org = item.get("hiringOrganization")
                if isinstance(hiring_org, dict):
                    company = hiring_org.get("name", "")
                elif isinstance(hiring_org, str):
                    company = hiring_org

                description = item.get("description", "")
                clean_desc = _strip_html_tags(description)

                location = ""
                job_loc = item.get("jobLocation")
                if isinstance(job_loc, dict):
                    addr = job_loc.get("address")
                    if isinstance(addr, dict):
                        loc_parts = [addr.get("addressLocality"), addr.get("addressCountry")]
                        location = ", ".join([p for p in loc_parts if p])
                    elif isinstance(addr, str):
                        location = addr

                parts = []
                if title:
                    parts.append(f"Job Title: {title}")
                if company:
                    parts.append(f"Company: {company}")
                if location:
                    parts.append(f"Location: {location}")
                if clean_desc:
                    parts.append(f"\nJob Description:\n{clean_desc}")

                combined = "\n".join(parts).strip()
                if len(combined) >= 150:
                    return combined
    return None


def _extract_from_html_content(page_html: str) -> str:
    """
    Fallback extractor: strips navigation, scripts, styles, and extracts main page content.
    """
    # Remove script, style, noscript, svg, header, footer, nav
    cleaned = re.sub(
        r"<(?:script|style|noscript|svg|header|footer|nav)[^>]*>.*?</(?:script|style|noscript|svg|header|footer|nav)>",
        " ",
        page_html,
        flags=re.DOTALL | re.IGNORECASE,
    )

    # Check for <main> or <article> tag content first
    main_match = re.search(r"<(?:main|article)[^>]*>(.*?)</(?:main|article)>", cleaned, re.DOTALL | re.IGNORECASE)
    if main_match:
        extracted = _strip_html_tags(main_match.group(1))
        if len(extracted) >= 200:
            return extracted

    return _strip_html_tags(cleaned)


async def fetch_job_posting(url: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Fetches job description text from a URL with an 8-second timeout.
    Returns: (success: bool, raw_text: Optional[str], reason: Optional[str])
    Reason is one of: 'blocked', 'timeout', 'empty'.
    """
    clean_url = url.strip()
    if not clean_url.startswith(("http://", "https://")):
        return False, None, "blocked"

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
        "Cache-Control": "no-cache",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            response = await client.get(clean_url, headers=headers)
    except httpx.TimeoutException:
        return False, None, "timeout"
    except Exception:
        return False, None, "blocked"

    # Status checks: rate limiting or authentication blocks
    if response.status_code in (401, 403, 429, 999):
        return False, None, "blocked"
    elif not response.is_success:
        return False, None, "blocked"

    html_text = response.text

    # 1. Try Schema.org JobPosting JSON-LD first
    json_ld_text = _extract_from_json_ld(html_text)
    if json_ld_text and len(json_ld_text) >= 200:
        return True, json_ld_text, None

    # 2. Try HTML body extraction
    extracted_text = _extract_from_html_content(html_text)

    # If extracted text is too short, page is likely an empty client-side SPA or captcha
    if not extracted_text or len(extracted_text) < 200:
        return False, None, "empty"

    return True, extracted_text, None

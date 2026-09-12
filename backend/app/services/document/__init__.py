from app.services.document.docx_reader import extract_text_from_docx
from app.services.document.normalizer import normalize_structured_cv
from app.services.document.web_scraper import fetch_job_posting

__all__ = [
    "extract_text_from_docx",
    "normalize_structured_cv",
    "fetch_job_posting",
]

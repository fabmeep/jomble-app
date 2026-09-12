from app.services.llm.prompts.cv_parser import (
    CV_EXTRACTION_BASE_INSTRUCTIONS,
    get_cv_extraction_prompt,
)
from app.services.llm.prompts.jd_parser import (
    JD_PARSER_BASE_INSTRUCTIONS,
    get_jd_extraction_prompt,
)

__all__ = [
    "CV_EXTRACTION_BASE_INSTRUCTIONS",
    "get_cv_extraction_prompt",
    "JD_PARSER_BASE_INSTRUCTIONS",
    "get_jd_extraction_prompt",
]

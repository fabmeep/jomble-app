import abc
from typing import Optional, Tuple
from app.schemas.cv import StructuredCv
from app.schemas.jd import JdRequirements


class BaseLlmProvider(abc.ABC):
    """
    Abstract base class for all LLM providers (Gemini, Ollama, OpenAI, etc.)
    responsible for CV extraction, text generation, and resume tailoring.
    """

    @abc.abstractmethod
    async def extract_cv(
        self,
        file_bytes: Optional[bytes] = None,
        mime_type: Optional[str] = None,
        raw_text: Optional[str] = None,
        file_name: Optional[str] = None,
    ) -> Tuple[str, StructuredCv]:
        """
        Parses resume input (binary file bytes or raw text) into (raw_text, StructuredCv).
        """
        pass

    @abc.abstractmethod
    async def extract_jd_requirements(
        self,
        raw_text: str,
        source_url: Optional[str] = None,
    ) -> JdRequirements:
        """
        Parses raw job description text into structured JdRequirements.
        """
        pass

    @abc.abstractmethod
    async def tailor_cv(
        self,
        cv: StructuredCv,
        jd: JdRequirements,
    ) -> StructuredCv:
        """
        Tailors candidate Master CV to target Job Description while enforcing truth preservation.
        """
        pass

    @abc.abstractmethod
    async def analyze_match(
        self,
        cv: StructuredCv,
        jd: JdRequirements,
        baseline_score: int,
        missing_skills: list[str],
    ) -> dict:
        """
        Produces a grounded, zero-hallucination match analysis between Master CV and Job Description.
        Returns dict containing overall_score, match_tier, summary_verdict, alignments, and gaps.
        """
        pass



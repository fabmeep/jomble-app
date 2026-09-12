import os
from typing import Optional
from app.services.llm.base import BaseLlmProvider
from app.services.llm.gemini import GeminiProvider
from app.services.llm.ollama import OllamaProvider


def get_llm_provider(
    provider_name: Optional[str] = None,
    gemini_api_key: Optional[str] = None,
    gemini_model: Optional[str] = None,
    ollama_base_url: Optional[str] = None,
    ollama_model: Optional[str] = None,
) -> BaseLlmProvider:
    """
    Factory function returning the configured LLM provider instance.
    Defaults to Gemini if GEMINI_API_KEY / GOOGLE_API_KEY is available or provider is 'GEMINI'.
    """
    selected_provider = (provider_name or os.getenv("LLM_PROVIDER", "GEMINI")).upper()

    if selected_provider == "OLLAMA":
        return OllamaProvider(
            base_url=ollama_base_url,
            model_name=ollama_model,
        )

    # Default to Gemini 3.7 Flash
    return GeminiProvider(
        api_key=gemini_api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"),
        model_name=gemini_model or os.getenv("GEMINI_MODEL", "gemini-3.7-flash"),
    )

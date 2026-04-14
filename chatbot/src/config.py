from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    chat_provider: Literal["openrouter", "gemini"] = "openrouter"
    chat_max_output_tokens: int = 220
    chat_temperature: float = 0.2
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash-lite"
    openrouter_api_key: str | None = None
    openrouter_model: str = "nvidia/nemotron-3-super-120b-a12b:free"
    groq_api_key: str
    groq_model: str = "llama-3.1-8b-instant"
    crop_identifier_debug: bool = False
    backend_base_url: str = "http://localhost:8080"
    # Cache TTL in seconds for the crop name list
    crop_cache_ttl: int = 300

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()

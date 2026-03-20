from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemini_api_key: str
    backend_base_url: str = "http://localhost:8080"
    # Cache TTL in seconds for the crop name list
    crop_cache_ttl: int = 300

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()

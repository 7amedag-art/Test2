from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    database_url: str = "postgresql://elp:elp_dev_password@localhost:5432/elp"
    ai_service_token: str = "dev-internal-token-change-me"

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-6"

    embeddings_provider: str = "voyage"
    voyage_api_key: str = ""
    voyage_model: str = "voyage-3-large"
    embedding_dim: int = 1024


settings = Settings()

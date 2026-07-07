"""
config.py — Application settings loaded from environment variables.
Uses pydantic-settings for automatic .env file loading and validation.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ────────────────────────────────────────────────────
    app_name: str = "Nauman Tariq Portfolio API"
    app_env: str = "development"
    debug: bool = True

    # ── Database ───────────────────────────────────────────────
    database_url: str

    # ── JWT ────────────────────────────────────────────────────
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7

    # ── Admin seed credentials ─────────────────────────────────
    admin_username: str = "admin"
    admin_password: str

    # ── Cloudinary ─────────────────────────────────────────────
    cloudinary_cloud_name: str
    cloudinary_api_key: str
    cloudinary_api_secret: str

    # ── Resend ─────────────────────────────────────────────────
    resend_api_key: str
    resend_from_email: str = "portfolio@yourdomain.com"
    resend_to_email: str

    # ── CORS ───────────────────────────────────────────────────
    allowed_origins: str = "http://localhost:5500,http://127.0.0.1:5500"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"


# Singleton — import this everywhere
settings = Settings()

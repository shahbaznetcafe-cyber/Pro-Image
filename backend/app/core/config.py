from functools import lru_cache
from pathlib import Path
from tempfile import gettempdir
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


def _default_jobs_dir() -> str:
    return str(Path(gettempdir()) / "sbz-jobs")


class Settings(BaseSettings):
    """Typed application configuration.

    Values come from environment variables (validated and coerced on load), so a
    malformed value fails fast at startup rather than at request time.
    """

    model_config = SettingsConfigDict(
        populate_by_name=True,
        case_sensitive=False,
        extra="ignore",
    )

    app_env: str = "development"
    allowed_origins: Annotated[list[str], NoDecode] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"],
        validation_alias="ALLOWED_ORIGINS",
    )
    api_keys: Annotated[set[str], NoDecode] = Field(
        default_factory=set, validation_alias="SBZ_API_KEYS"
    )
    supabase_url: str = ""
    supabase_publishable_key: str = ""
    # Server-held secret that authorises quota refunds (seller_release_usage).
    # Without it, a strict-quality block on a batch still consumes quota.
    seller_release_secret: str = ""
    # Requests/minute per client IP for public, unauthenticated CPU-heavy
    # endpoints. 0 disables the limiter.
    public_rate_limit_per_minute: int = 20
    # Async batch queue. When set, batch jobs run on an arq worker.
    redis_url: str = ""
    jobs_output_dir: str = Field(default_factory=_default_jobs_dir)
    job_retention_seconds: int = 3600
    log_level: str = "INFO"
    sentry_dsn: str = ""

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("api_keys", mode="before")
    @classmethod
    def _split_keys(cls, value: object) -> object:
        if isinstance(value, str):
            return {item.strip() for item in value.split(",") if item.strip()}
        return value

    @field_validator("supabase_url", mode="before")
    @classmethod
    def _strip_trailing_slash(cls, value: object) -> object:
        return value.rstrip("/") if isinstance(value, str) else value

    @field_validator("redis_url", "sentry_dsn", "seller_release_secret", mode="before")
    @classmethod
    def _strip(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value

    @field_validator("log_level", mode="before")
    @classmethod
    def _upper(cls, value: object) -> object:
        return value.upper() if isinstance(value, str) else value

    @field_validator("jobs_output_dir", mode="before")
    @classmethod
    def _default_dir_if_blank(cls, value: object) -> object:
        if value is None or (isinstance(value, str) and not value.strip()):
            return _default_jobs_dir()
        return value

    @field_validator("public_rate_limit_per_minute", "job_retention_seconds", mode="before")
    @classmethod
    def _blank_int_keeps_default(cls, value: object, info) -> object:
        if value is None or (isinstance(value, str) and not value.strip()):
            return cls.model_fields[info.field_name].default
        return value

    @field_validator("public_rate_limit_per_minute", "job_retention_seconds", mode="after")
    @classmethod
    def _clamp_non_negative(cls, value: int) -> int:
        return max(0, value)

    @property
    def api_auth_enabled(self) -> bool:
        return bool(self.api_keys)

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def saas_auth_enabled(self) -> bool:
        return bool(self.supabase_url and self.supabase_publishable_key)

    @property
    def queue_enabled(self) -> bool:
        return bool(self.redis_url)

    @property
    def sentry_enabled(self) -> bool:
        return bool(self.sentry_dsn)

    def readiness_checks(self) -> list[dict[str, str | bool]]:
        checks: list[dict[str, str | bool]] = [
            {
                "name": "environment",
                "ok": bool(self.app_env),
                "message": f"APP_ENV={self.app_env}",
            },
            {
                "name": "cors_origins",
                "ok": bool(self.allowed_origins),
                "message": ", ".join(self.allowed_origins) or "No ALLOWED_ORIGINS configured.",
            },
            {
                "name": "api_keys",
                "ok": self.api_auth_enabled or not self.is_production,
                "message": "API auth enabled."
                if self.api_auth_enabled
                else "API auth disabled; acceptable only for local development.",
            },
            {
                "name": "temporary_storage",
                "ok": _temp_dir_writable(),
                "message": f"Temporary directory: {gettempdir()}",
            },
            {
                "name": "saas_plan_enforcement",
                "ok": self.saas_auth_enabled or not self.is_production,
                "message": "Supabase auth and plan limits enabled."
                if self.saas_auth_enabled
                else "SaaS limits disabled; acceptable only for local development.",
            },
        ]

        if self.is_production:
            checks.append(
                {
                    "name": "production_origin_hardening",
                    "ok": not any("localhost" in origin for origin in self.allowed_origins),
                    "message": "Production CORS should not include localhost origins.",
                }
            )

        return checks


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


def _temp_dir_writable() -> bool:
    try:
        path = Path(gettempdir()) / "sbz-sellimage-ready.tmp"
        path.write_text("ok", encoding="utf-8")
        path.unlink(missing_ok=True)
        return True
    except OSError:
        return False

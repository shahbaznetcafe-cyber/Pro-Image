import os
from functools import lru_cache
from tempfile import gettempdir
from pathlib import Path


class Settings:
    app_env: str
    allowed_origins: list[str]
    api_keys: set[str]
    supabase_url: str
    supabase_publishable_key: str

    def __init__(self) -> None:
        self.app_env = os.getenv("APP_ENV", "development")
        self.allowed_origins = _split_env(
            "ALLOWED_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        )
        self.api_keys = set(_split_env("SBZ_API_KEYS", ""))
        self.supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self.supabase_publishable_key = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")

    @property
    def api_auth_enabled(self) -> bool:
        return bool(self.api_keys)

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def saas_auth_enabled(self) -> bool:
        return bool(self.supabase_url and self.supabase_publishable_key)

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


def _split_env(name: str, default: str) -> list[str]:
    value = os.getenv(name, default)
    return [item.strip() for item in value.split(",") if item.strip()]


def _temp_dir_writable() -> bool:
    try:
        path = Path(gettempdir()) / "sbz-sellimage-ready.tmp"
        path.write_text("ok", encoding="utf-8")
        path.unlink(missing_ok=True)
        return True
    except OSError:
        return False

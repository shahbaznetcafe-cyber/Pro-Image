from fastapi import Header, HTTPException, status

from app.core.config import get_settings


def require_api_key(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    authorization: str | None = Header(default=None),
) -> None:
    settings = get_settings()

    if not settings.api_auth_enabled:
        return

    bearer_token = None
    if authorization and authorization.lower().startswith("bearer "):
        bearer_token = authorization[7:].strip()

    supplied_key = x_api_key or bearer_token
    if supplied_key in settings.api_keys:
        return

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Valid API key required.",
    )

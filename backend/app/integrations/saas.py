import asyncio
from dataclasses import dataclass
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings


REQUIRED_SELLER_OBJECTS = (
    "/seller_profiles",
    "/seller_image_jobs",
    "/seller_usage_logs",
    "/seller_payment_requests",
    "/seller_subscriptions",
    "/rpc/seller_reserve_usage",
    "/rpc/seller_approve_payment_request",
    "/rpc/seller_reject_payment_request",
)


@dataclass(frozen=True)
class UsageReservation:
    job_id: str | None
    plan: str
    monthly_limit: int
    monthly_used: int
    monthly_remaining: int
    batch_limit: int
    access_token: str | None


async def check_saas_schema() -> dict[str, str | bool]:
    """Verify that the public seller tables and RPCs are visible to PostgREST."""
    settings = get_settings()
    if not settings.saas_auth_enabled:
        return {
            "name": "saas_schema",
            "ok": not settings.is_production,
            "message": "Supabase schema check skipped; configure SaaS auth before production.",
        }

    headers = {"apikey": settings.supabase_publishable_key}
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            responses = await asyncio.gather(
                *(
                    client.options(f"{settings.supabase_url}/rest/v1{path}", headers=headers)
                    for path in REQUIRED_SELLER_OBJECTS
                ),
                return_exceptions=True,
            )
    except httpx.HTTPError:
        return {
            "name": "saas_schema",
            "ok": False,
            "message": "Supabase schema preflight could not reach the project.",
        }

    missing = [
        path
        for path, response in zip(REQUIRED_SELLER_OBJECTS, responses)
        if isinstance(response, Exception) or not response.is_success
    ]
    if missing:
        return {
            "name": "saas_schema",
            "ok": False,
            "message": "Seller schema preflight failed. Run docs/supabase-schema.sql before launch.",
        }
    return {
        "name": "saas_schema",
        "ok": True,
        "message": "Seller tables and protected RPCs are visible in Supabase.",
    }


async def reserve_usage(
    authorization: str | None,
    *,
    action: str,
    file_count: int,
    original_filename: str,
    original_size_kb: int,
    expected_output_count: int,
) -> UsageReservation:
    settings = get_settings()

    if not settings.saas_auth_enabled:
        if settings.is_production:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="SaaS authentication is not configured.",
            )
        if file_count > 30:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Local development batch limit is 30 images.",
            )
        return UsageReservation(None, "development", 0, 0, 0, 30, None)

    access_token = _read_bearer_token(authorization)
    payload = {
        "p_action": action,
        "p_file_count": file_count,
        "p_original_filename": original_filename,
        "p_original_size_kb": original_size_kb,
        "p_expected_output_count": expected_output_count,
    }
    data = await _call_rpc("seller_reserve_usage", access_token, payload)
    if not isinstance(data, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unexpected entitlement response from Supabase.",
        )

    return UsageReservation(
        job_id=str(data["job_id"]),
        plan=str(data["plan"]),
        monthly_limit=int(data["monthly_limit"]),
        monthly_used=int(data["monthly_used"]),
        monthly_remaining=int(data["monthly_remaining"]),
        batch_limit=int(data["batch_limit"]),
        access_token=access_token,
    )


def quota_headers(reservation: UsageReservation) -> dict[str, str]:
    if reservation.plan == "development":
        return {"X-SBZ-Plan": "development"}
    return {
        "X-SBZ-Plan": reservation.plan,
        "X-SBZ-Monthly-Limit": str(reservation.monthly_limit),
        "X-SBZ-Monthly-Used": str(reservation.monthly_used),
        "X-SBZ-Monthly-Remaining": str(reservation.monthly_remaining),
    }


def _read_bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login is required to generate a seller pack.",
        )
    token = authorization[7:].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login session is missing or expired.",
        )
    return token


async def _call_rpc(name: str, access_token: str, payload: dict[str, Any]) -> Any:
    settings = get_settings()
    headers = {
        "apikey": settings.supabase_publishable_key,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post(
                f"{settings.supabase_url}/rest/v1/rpc/{name}",
                headers=headers,
                json=payload,
            )
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Plan service is temporarily unavailable.",
        ) from error

    if response.is_success:
        if not response.content:
            return None
        return response.json()

    message = _rpc_error_message(response)
    if response.status_code in (401, 403) or "AUTH_REQUIRED" in message:
        code = status.HTTP_401_UNAUTHORIZED
    elif "LIMIT_EXCEEDED" in message:
        code = status.HTTP_429_TOO_MANY_REQUESTS
    elif "PROFILE_NOT_READY" in message:
        code = status.HTTP_409_CONFLICT
    else:
        code = status.HTTP_502_BAD_GATEWAY

    raise HTTPException(status_code=code, detail=_friendly_error(message))


def _rpc_error_message(response: httpx.Response) -> str:
    try:
        data = response.json()
    except ValueError:
        return response.text
    if isinstance(data, dict):
        return str(data.get("message") or data.get("error_description") or data)
    return str(data)


def _friendly_error(message: str) -> str:
    if "DAILY_LIMIT_EXCEEDED" in message:
        return "Free plan daily limit reached. Upgrade or try again tomorrow."
    if "MONTHLY_LIMIT_EXCEEDED" in message:
        return "Monthly image limit reached. Upgrade your plan to continue."
    if "BATCH_LIMIT_EXCEEDED" in message:
        limit = message.rsplit(":", 1)[-1].strip()
        return f"Your plan allows up to {limit} images per batch."
    if "PROFILE_NOT_READY" in message:
        return "Your seller profile is still being prepared. Sign out and login again."
    if "Invalid JWT" in message or "JWT expired" in message:
        return "Login session expired. Please login again."
    return "Plan verification failed. Please try again."

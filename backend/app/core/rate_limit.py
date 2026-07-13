"""Lightweight in-process rate limiting for public, unauthenticated endpoints.

This is a fixed-window counter keyed by client IP. It is intentionally
dependency-free and matches the existing in-process metrics design. Because the
state lives in the worker process, limits are per-worker: run behind a single
worker for a hard global cap, or move to a shared store (Redis) when scaling out.
"""

from time import monotonic

from fastapi import HTTPException, Request, status

from app.core.config import get_settings

_WINDOW_SECONDS = 60.0
# Cap the tracking table so a flood of unique IPs cannot grow memory without bound.
_MAX_TRACKED_CLIENTS = 10_000

# client_key -> (window_start_monotonic, count)
_WINDOWS: dict[str, tuple[float, int]] = {}


def _client_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        # Left-most entry is the originating client per convention. Spoofable if
        # not behind a trusted proxy, but adequate for basic abuse mitigation.
        first = forwarded.split(",")[0].strip()
        if first:
            return first
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _prune(now: float) -> None:
    if len(_WINDOWS) <= _MAX_TRACKED_CLIENTS:
        return
    expired = [
        key
        for key, (started, _count) in _WINDOWS.items()
        if now - started >= _WINDOW_SECONDS
    ]
    for key in expired:
        _WINDOWS.pop(key, None)


def _hit(key: str, limit: int) -> int | None:
    """Register a hit. Return seconds until reset if over the limit, else None."""
    now = monotonic()
    started, count = _WINDOWS.get(key, (now, 0))

    if now - started >= _WINDOW_SECONDS:
        started, count = now, 0

    if count >= limit:
        _WINDOWS[key] = (started, count)
        return max(1, int(_WINDOW_SECONDS - (now - started)))

    _WINDOWS[key] = (started, count + 1)
    _prune(now)
    return None


async def public_rate_limit(request: Request) -> None:
    """FastAPI dependency: throttle a client IP on public CPU-heavy endpoints."""
    limit = get_settings().public_rate_limit_per_minute
    if limit <= 0:
        return

    retry_after = _hit(_client_key(request), limit)
    if retry_after is not None:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please slow down and try again shortly.",
            headers={"Retry-After": str(retry_after)},
        )


def reset_rate_limits() -> None:
    """Clear all tracked windows. Intended for tests."""
    _WINDOWS.clear()

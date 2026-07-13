import logging
from time import perf_counter
from uuid import uuid4

from fastapi import Request, Response

from app.core.metrics import record_request

logger = logging.getLogger("sbz.request")


async def request_observer_middleware(request: Request, call_next) -> Response:
    request_id = request.headers.get("x-request-id") or str(uuid4())
    started = perf_counter()
    client = request.client.host if request.client else None

    try:
        response = await call_next(request)
    except Exception:
        latency_ms = (perf_counter() - started) * 1000
        record_request(request.url.path, 500, latency_ms)
        logger.exception(
            "request_failed",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "latency_ms": round(latency_ms, 2),
                "client": client,
            },
        )
        raise

    latency_ms = (perf_counter() - started) * 1000
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-ms"] = f"{latency_ms:.2f}"
    record_request(request.url.path, response.status_code, latency_ms)
    logger.info(
        "request",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "latency_ms": round(latency_ms, 2),
            "client": client,
        },
    )
    return response

from time import perf_counter
from uuid import uuid4

from fastapi import Request, Response

from app.core.metrics import record_request


async def request_observer_middleware(request: Request, call_next) -> Response:
    request_id = request.headers.get("x-request-id") or str(uuid4())
    started = perf_counter()

    response = await call_next(request)

    latency_ms = (perf_counter() - started) * 1000
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-ms"] = f"{latency_ms:.2f}"
    record_request(request.url.path, response.status_code, latency_ms)
    return response

import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.core.metrics import snapshot
from app.core.middleware import request_observer_middleware
from app.core.observability import init_sentry
from app.image_tools.routes import router as image_tools_router
from app.integrations import queue as job_queue
from app.integrations.auth import require_api_key
from app.integrations.saas import check_saas_schema

settings = get_settings()
configure_logging(settings.log_level)
init_sentry()
logger = logging.getLogger("sbz.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.arq = None
    if settings.queue_enabled:
        try:
            app.state.arq = await job_queue.create_pool()
            logger.info("Batch queue connected to Redis.")
        except Exception as error:  # noqa: BLE001 - degrade gracefully to 503
            logger.warning("Batch queue unavailable at startup: %s", error)
            app.state.arq = None
    try:
        yield
    finally:
        pool = getattr(app.state, "arq", None)
        if pool is not None:
            closer = getattr(pool, "aclose", None) or getattr(pool, "close", None)
            if closer is not None:
                await closer()


app = FastAPI(
    title="SBZ SellImage Pro API",
    version="0.8.0",
    description="Seller-focused marketplace image pack generator.",
    lifespan=lifespan,
)

app.middleware("http")(request_observer_middleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str | bool]:
    return {
        "status": "ok",
        "environment": settings.app_env,
        "api_auth_enabled": settings.api_auth_enabled,
    }


@app.get("/ready")
async def ready() -> dict[str, object]:
    checks = settings.readiness_checks()
    if settings.saas_auth_enabled or settings.is_production:
        checks.append(await check_saas_schema())
    return {
        "status": "ready" if all(bool(check["ok"]) for check in checks) else "not_ready",
        "checks": checks,
    }


@app.get("/metrics", dependencies=[Depends(require_api_key)])
def metrics() -> dict[str, object]:
    return snapshot()


app.include_router(image_tools_router)
app.include_router(api_router)

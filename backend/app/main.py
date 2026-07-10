from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.core.config import get_settings
from app.core.metrics import snapshot
from app.core.middleware import request_observer_middleware
from app.image_tools.routes import router as image_tools_router
from app.integrations.auth import require_api_key
from app.integrations.saas import check_saas_schema

settings = get_settings()

app = FastAPI(
    title="SBZ SellImage Pro API",
    version="0.8.0",
    description="Seller-focused marketplace image pack generator.",
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

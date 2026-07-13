"""Optional Sentry error tracking.

Enabled only when ``SENTRY_DSN`` is set. ``sentry-sdk`` is a soft dependency:
if the DSN is configured but the package is missing we log a warning instead of
crashing, so the runtime stays lean when error tracking is not used.
"""

import logging

from app.core.config import get_settings

logger = logging.getLogger("sbz.observability")


def init_sentry() -> bool:
    settings = get_settings()
    if not settings.sentry_enabled:
        return False

    try:
        import sentry_sdk
    except ImportError:
        logger.warning("SENTRY_DSN is set but sentry-sdk is not installed.")
        return False

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.app_env,
        traces_sample_rate=0.0,
        send_default_pii=False,
    )
    logger.info("Sentry error tracking initialised.")
    return True

"""Async batch-job queue backed by Redis + arq.

The web process persists validated uploads to a shared job directory, writes a
small job spec, and enqueues an arq job. The worker (``app.worker``) reads the
inputs, builds the ZIP, and updates job metadata in Redis. Both processes share
``JOBS_OUTPUT_DIR`` (a mounted volume in docker-compose).

arq is imported lazily so the app still boots on machines without the queue
installed; the batch-job endpoints return 503 when ``queue_enabled`` is false.
"""

import json
import time
from pathlib import Path
from typing import Any

from app.core.config import get_settings

STATUS_QUEUED = "queued"
STATUS_PROCESSING = "processing"
STATUS_COMPLETED = "completed"
STATUS_BLOCKED = "blocked"
STATUS_FAILED = "failed"

_META_PREFIX = "sbz:job:"


def _meta_key(job_id: str) -> str:
    return f"{_META_PREFIX}{job_id}"


def jobs_root() -> Path:
    return Path(get_settings().jobs_output_dir)


def job_dir(job_id: str) -> Path:
    return jobs_root() / job_id


def input_dir(job_id: str) -> Path:
    return job_dir(job_id) / "inputs"


def spec_path(job_id: str) -> Path:
    return job_dir(job_id) / "job.json"


def output_zip_path(job_id: str) -> Path:
    return job_dir(job_id) / "output.zip"


def get_redis_settings() -> Any:
    """Build arq RedisSettings from REDIS_URL (imported lazily)."""
    from arq.connections import RedisSettings

    return RedisSettings.from_dsn(get_settings().redis_url)


async def create_pool() -> Any:
    """Create an arq redis pool for the web process (imported lazily)."""
    from arq import create_pool as _create_pool

    return await _create_pool(get_redis_settings())


# --- job metadata (stored in Redis as JSON) ---------------------------------


def initial_metadata(
    *,
    job_id: str,
    project_slug: str,
    filename: str,
    image_count: int,
    preset_count: int,
) -> dict[str, Any]:
    now = time.time()
    total = image_count * preset_count
    return {
        "job_id": job_id,
        "status": STATUS_QUEUED,
        "project_slug": project_slug,
        "download_filename": f"{project_slug}-batch-seller-pack.zip",
        "source_filename": filename,
        "image_count": image_count,
        "preset_count": preset_count,
        "total_outputs": total,
        "completed_outputs": 0,
        "output_ready": False,
        "error": None,
        "failed_outputs": [],
        "quality_summary": None,
        "created_at": now,
        "updated_at": now,
    }


async def write_metadata(redis: Any, job_id: str, metadata: dict[str, Any]) -> None:
    metadata["updated_at"] = time.time()
    ttl = get_settings().job_retention_seconds
    await redis.set(_meta_key(job_id), json.dumps(metadata), ex=ttl)


async def read_metadata(redis: Any, job_id: str) -> dict[str, Any] | None:
    raw = await redis.get(_meta_key(job_id))
    if raw is None:
        return None
    if isinstance(raw, bytes):
        raw = raw.decode("utf-8")
    try:
        return json.loads(raw)
    except (ValueError, TypeError):
        return None


async def update_metadata(redis: Any, job_id: str, **changes: Any) -> dict[str, Any] | None:
    metadata = await read_metadata(redis, job_id)
    if metadata is None:
        return None
    metadata.update(changes)
    await write_metadata(redis, job_id, metadata)
    return metadata


async def enqueue_batch(redis: Any, job_id: str) -> None:
    await redis.enqueue_job("process_batch_job", job_id, _job_id=job_id)

"""arq worker for batch seller-pack jobs.

Run with:  arq app.worker.WorkerSettings
Requires REDIS_URL and a JOBS_OUTPUT_DIR shared with the web process.
"""

import asyncio
import json
import shutil
import time
from typing import Any

from arq import cron

from app.core.config import get_settings
from app.image_tools.packager import (
    ImageInput,
    StrictQualityBlocked,
    build_seller_pack_zip,
)
from app.image_tools.presets import get_presets
from app.image_tools.processor import ProcessingOptions
from app.integrations import queue as q
from app.integrations.saas import release_usage

_PROGRESS_POLL_SECONDS = 1.0


def _load_inputs(job_id: str) -> list[ImageInput]:
    manifest_path = q.input_dir(job_id) / "manifest.json"
    entries = json.loads(manifest_path.read_text(encoding="utf-8"))
    inputs: list[ImageInput] = []
    for entry in entries:
        data = (q.input_dir(job_id) / entry["stored_name"]).read_bytes()
        inputs.append(
            {
                "filename": entry["filename"],
                "image_bytes": data,
                "product_slug": entry["product_slug"],
            }
        )
    return inputs


async def process_batch_job(ctx: dict[str, Any], job_id: str) -> str:
    redis = ctx["redis"]
    await q.update_metadata(redis, job_id, status=q.STATUS_PROCESSING)

    spec = json.loads(q.spec_path(job_id).read_text(encoding="utf-8"))
    presets = get_presets(spec["preset_ids"])
    options = ProcessingOptions(**spec["options"])
    image_inputs = _load_inputs(job_id)

    progress = {"completed": 0}

    def _progress_cb(completed: int, _total: int) -> None:
        progress["completed"] = completed

    build_task = asyncio.create_task(
        asyncio.to_thread(
            build_seller_pack_zip,
            q.output_zip_path(job_id),
            project_slug=spec["project_slug"],
            image_inputs=image_inputs,
            presets=presets,
            options=options,
            strict_quality=spec["strict_quality"],
            progress_cb=_progress_cb,
        )
    )

    last_reported = -1
    try:
        while not build_task.done():
            if progress["completed"] != last_reported:
                last_reported = progress["completed"]
                await q.update_metadata(
                    redis, job_id, completed_outputs=last_reported
                )
            await asyncio.sleep(_PROGRESS_POLL_SECONDS)

        report = await build_task
    except StrictQualityBlocked as blocked:
        # No deliverable was produced; refund the reserved usage (best-effort,
        # authorised by the server release secret).
        reservation_job_id = spec.get("reservation_job_id")
        if reservation_job_id:
            await release_usage(reservation_job_id)
        await q.update_metadata(
            redis,
            job_id,
            status=q.STATUS_BLOCKED,
            output_ready=False,
            failed_outputs=blocked.failed_outputs,
            error="Generated outputs failed quality control.",
        )
        return q.STATUS_BLOCKED
    except Exception as error:  # noqa: BLE001 - persist failure for the client
        await q.update_metadata(
            redis,
            job_id,
            status=q.STATUS_FAILED,
            output_ready=False,
            error=f"Processing failed: {error}",
        )
        return q.STATUS_FAILED
    finally:
        # Inputs are no longer needed once processing has resolved.
        shutil.rmtree(q.input_dir(job_id), ignore_errors=True)

    await q.update_metadata(
        redis,
        job_id,
        status=q.STATUS_COMPLETED,
        output_ready=True,
        completed_outputs=int(report["output_count"]),
        quality_summary=report.get("quality_summary"),
    )
    return q.STATUS_COMPLETED


async def cleanup_expired_jobs(ctx: dict[str, Any]) -> int:
    """Remove job directories whose outputs have outlived the retention window."""
    settings = get_settings()
    root = q.jobs_root()
    if not root.exists():
        return 0

    cutoff = time.time() - (settings.job_retention_seconds * 2)
    removed = 0
    for child in root.iterdir():
        try:
            if child.is_dir() and child.stat().st_mtime < cutoff:
                shutil.rmtree(child, ignore_errors=True)
                removed += 1
        except OSError:
            continue
    return removed


class WorkerSettings:
    functions = [process_batch_job]
    cron_jobs = [cron(cleanup_expired_jobs, minute=set(range(0, 60, 10)))]
    # arq reads this attribute when the worker starts. REDIS_URL is always set in
    # the worker container; the guard only keeps import safe if it is not.
    redis_settings = q.get_redis_settings() if get_settings().queue_enabled else None

import json
import tempfile
import uuid
from dataclasses import asdict
from pathlib import Path
from typing import Any

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    Header,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse, JSONResponse

from app.core.config import get_settings
from app.core.rate_limit import public_rate_limit
from app.integrations import queue as q

from app.image_tools.analyzer import analyze_image
from app.image_tools.connectors import list_connector_statuses
from app.image_tools.listing_copy import generate_listing_copy
from app.image_tools.output_quality import assess_output, create_preview_data_url
from app.image_tools.packager import ImageInput, StrictQualityBlocked, build_seller_pack_zip
from app.image_tools.presets import PRESETS, ImagePreset, get_presets
from app.image_tools.processor import ProcessingOptions, process_image
from app.image_tools.security import read_and_validate_upload
from app.integrations.saas import quota_headers, reserve_usage
from app.utils.filenames import safe_product_name

router = APIRouter(prefix="/tools", tags=["image tools"])

MAX_BATCH_FILES = 100


@router.get("/presets")
def list_presets() -> dict[str, list[dict[str, object]]]:
    return {"presets": [asdict(preset) for preset in PRESETS.values()]}


@router.get("/connectors")
def list_connectors() -> dict[str, list[dict[str, object]]]:
    return {"connectors": list_connector_statuses()}


@router.post("/generate-seller-pack")
async def generate_seller_pack(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    preset_ids: str = Form(...),
    product_name: str | None = Form(default=None),
    cleanup_background: bool = Form(default=False),
    smart_center: bool = Form(default=False),
    add_shadow: bool = Form(default=False),
    polish_output: bool = Form(default=True),
    subject_fill_percent: int = Form(default=85, ge=65, le=95),
    strict_quality: bool = Form(default=False),
    authorization: str | None = Header(default=None),
) -> FileResponse:
    selected_ids = [item.strip() for item in preset_ids.split(",") if item.strip()]
    presets = get_presets(selected_ids)

    if not presets:
        raise HTTPException(status_code=400, detail="Select at least one valid preset.")

    product_slug = safe_product_name(product_name or Path(file.filename or "product").stem)
    image_bytes = await read_and_validate_upload(file)
    image_input: ImageInput = {
        "filename": file.filename or "product",
        "image_bytes": image_bytes,
        "product_slug": product_slug,
    }

    options = ProcessingOptions(
        cleanup_background=cleanup_background,
        smart_center=smart_center,
        add_shadow=add_shadow,
        polish_output=polish_output,
        subject_fill_percent=subject_fill_percent,
    )

    # Build first, then reserve usage. A strict-quality block raises 422 before
    # any quota is consumed, so a rejected pack does not cost the user an image.
    # This is safe for the single-image endpoint because the build is cheap; the
    # batch paths still reserve up front to enforce per-batch limits before work.
    zip_path, report = await run_in_threadpool(
        _build_zip,
        project_slug=product_slug,
        image_inputs=[image_input],
        presets=presets,
        options=options,
        strict_quality=strict_quality,
    )

    try:
        reservation = await reserve_usage(
            authorization,
            action="seller_pack",
            file_count=1,
            original_filename=image_input["filename"],
            original_size_kb=round(len(image_bytes) / 1024),
            expected_output_count=len(presets),
        )
    except HTTPException:
        zip_path.unlink(missing_ok=True)
        raise

    background_tasks.add_task(zip_path.unlink, missing_ok=True)

    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=f"{product_slug}-seller-pack.zip",
        background=background_tasks,
        headers={
            "X-Output-Count": str(report["output_count"]),
            "X-SBZ-Usage-Saved": "true",
            **quota_headers(reservation),
        },
    )


@router.post("/generate-batch-seller-pack")
async def generate_batch_seller_pack(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    preset_ids: str = Form(...),
    project_name: str | None = Form(default=None),
    cleanup_background: bool = Form(default=False),
    smart_center: bool = Form(default=False),
    add_shadow: bool = Form(default=False),
    polish_output: bool = Form(default=True),
    subject_fill_percent: int = Form(default=85, ge=65, le=95),
    strict_quality: bool = Form(default=False),
    authorization: str | None = Header(default=None),
) -> FileResponse:
    selected_ids = [item.strip() for item in preset_ids.split(",") if item.strip()]
    presets = get_presets(selected_ids)

    if not presets:
        raise HTTPException(status_code=400, detail="Select at least one valid preset.")

    if not files:
        raise HTTPException(status_code=400, detail="Upload at least one image.")

    if len(files) > MAX_BATCH_FILES:
        raise HTTPException(
            status_code=413,
            detail=f"Maximum supported batch is {MAX_BATCH_FILES} images.",
        )

    image_inputs: list[ImageInput] = []
    used_slugs: dict[str, int] = {}

    for file in files:
        image_bytes = await read_and_validate_upload(file)
        base_slug = safe_product_name(Path(file.filename or "product").stem)
        count = used_slugs.get(base_slug, 0) + 1
        used_slugs[base_slug] = count
        product_slug = base_slug if count == 1 else f"{base_slug}-{count}"

        image_inputs.append(
            {
                "filename": file.filename or product_slug,
                "image_bytes": image_bytes,
                "product_slug": product_slug,
            }
        )

    project_slug = safe_product_name(project_name) if project_name else "seller-pack"
    original_size_kb = round(
        sum(len(image_input["image_bytes"]) for image_input in image_inputs) / 1024
    )
    reservation = await reserve_usage(
        authorization,
        action="seller_pack" if len(image_inputs) == 1 else "batch_seller_pack",
        file_count=len(image_inputs),
        original_filename=(
            image_inputs[0]["filename"]
            if len(image_inputs) == 1
            else f"{len(image_inputs)} files"
        ),
        original_size_kb=original_size_kb,
        expected_output_count=len(image_inputs) * len(presets),
    )

    zip_path, report = await run_in_threadpool(
        _build_zip,
        project_slug=project_slug,
        image_inputs=image_inputs,
        presets=presets,
        options=ProcessingOptions(
            cleanup_background=cleanup_background,
            smart_center=smart_center,
            add_shadow=add_shadow,
            polish_output=polish_output,
            subject_fill_percent=subject_fill_percent,
        ),
        strict_quality=strict_quality,
    )

    background_tasks.add_task(zip_path.unlink, missing_ok=True)

    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=f"{project_slug}-batch-seller-pack.zip",
        background=background_tasks,
        headers={
            "X-Image-Count": str(len(image_inputs)),
            "X-Output-Count": str(report["output_count"]),
            "X-SBZ-Usage-Saved": "true",
            **quota_headers(reservation),
        },
    )


def _require_queue(request: Request) -> Any:
    pool = getattr(request.app.state, "arq", None)
    if not get_settings().queue_enabled or pool is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Async batch queue is not configured. Set REDIS_URL to enable it.",
        )
    return pool


def _persist_job_inputs(
    job_id: str,
    image_inputs: list[ImageInput],
    *,
    project_slug: str,
    preset_ids: list[str],
    options: ProcessingOptions,
    strict_quality: bool,
) -> None:
    """Write uploads + job spec to the shared job directory (runs off-loop)."""
    inputs_path = q.input_dir(job_id)
    inputs_path.mkdir(parents=True, exist_ok=True)

    manifest: list[dict[str, str]] = []
    for index, image_input in enumerate(image_inputs):
        stored_name = f"{index:03d}.bin"
        (inputs_path / stored_name).write_bytes(image_input["image_bytes"])
        manifest.append(
            {
                "filename": image_input["filename"],
                "product_slug": image_input["product_slug"],
                "stored_name": stored_name,
            }
        )

    (inputs_path / "manifest.json").write_text(
        json.dumps(manifest), encoding="utf-8"
    )
    q.spec_path(job_id).write_text(
        json.dumps(
            {
                "project_slug": project_slug,
                "preset_ids": preset_ids,
                "options": asdict(options),
                "strict_quality": strict_quality,
            }
        ),
        encoding="utf-8",
    )


@router.post("/batch-jobs", status_code=status.HTTP_202_ACCEPTED)
async def submit_batch_job(
    request: Request,
    files: list[UploadFile] = File(...),
    preset_ids: str = Form(...),
    project_name: str | None = Form(default=None),
    cleanup_background: bool = Form(default=False),
    smart_center: bool = Form(default=False),
    add_shadow: bool = Form(default=False),
    polish_output: bool = Form(default=True),
    subject_fill_percent: int = Form(default=85, ge=65, le=95),
    strict_quality: bool = Form(default=False),
    authorization: str | None = Header(default=None),
) -> JSONResponse:
    pool = _require_queue(request)

    selected_ids = [item.strip() for item in preset_ids.split(",") if item.strip()]
    presets = get_presets(selected_ids)
    if not presets:
        raise HTTPException(status_code=400, detail="Select at least one valid preset.")
    if not files:
        raise HTTPException(status_code=400, detail="Upload at least one image.")
    if len(files) > MAX_BATCH_FILES:
        raise HTTPException(
            status_code=413,
            detail=f"Maximum supported batch is {MAX_BATCH_FILES} images.",
        )

    image_inputs: list[ImageInput] = []
    used_slugs: dict[str, int] = {}
    for file in files:
        image_bytes = await read_and_validate_upload(file)
        base_slug = safe_product_name(Path(file.filename or "product").stem)
        count = used_slugs.get(base_slug, 0) + 1
        used_slugs[base_slug] = count
        product_slug = base_slug if count == 1 else f"{base_slug}-{count}"
        image_inputs.append(
            {
                "filename": file.filename or product_slug,
                "image_bytes": image_bytes,
                "product_slug": product_slug,
            }
        )

    project_slug = safe_product_name(project_name) if project_name else "seller-pack"
    original_size_kb = round(
        sum(len(item["image_bytes"]) for item in image_inputs) / 1024
    )
    reservation = await reserve_usage(
        authorization,
        action="seller_pack" if len(image_inputs) == 1 else "batch_seller_pack",
        file_count=len(image_inputs),
        original_filename=(
            image_inputs[0]["filename"]
            if len(image_inputs) == 1
            else f"{len(image_inputs)} files"
        ),
        original_size_kb=original_size_kb,
        expected_output_count=len(image_inputs) * len(presets),
    )

    job_id = uuid.uuid4().hex
    options = ProcessingOptions(
        cleanup_background=cleanup_background,
        smart_center=smart_center,
        add_shadow=add_shadow,
        polish_output=polish_output,
        subject_fill_percent=subject_fill_percent,
    )

    await run_in_threadpool(
        _persist_job_inputs,
        job_id,
        image_inputs,
        project_slug=project_slug,
        preset_ids=[preset.id for preset in presets],
        options=options,
        strict_quality=strict_quality,
    )

    metadata = q.initial_metadata(
        job_id=job_id,
        project_slug=project_slug,
        filename=image_inputs[0]["filename"]
        if len(image_inputs) == 1
        else f"{len(image_inputs)} files",
        image_count=len(image_inputs),
        preset_count=len(presets),
    )
    await q.write_metadata(pool, job_id, metadata)
    await q.enqueue_batch(pool, job_id)

    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={
            "job_id": job_id,
            "status": q.STATUS_QUEUED,
            "image_count": len(image_inputs),
            "output_count": len(image_inputs) * len(presets),
            "status_url": f"/tools/batch-jobs/{job_id}",
            "download_url": f"/tools/batch-jobs/{job_id}/download",
        },
        headers=quota_headers(reservation),
    )


@router.get("/batch-jobs/{job_id}")
async def batch_job_status(request: Request, job_id: str) -> dict[str, object]:
    pool = _require_queue(request)
    metadata = await q.read_metadata(pool, job_id)
    if metadata is None:
        raise HTTPException(status_code=404, detail="Job not found or expired.")
    return metadata


@router.get("/batch-jobs/{job_id}/download")
async def batch_job_download(request: Request, job_id: str) -> FileResponse:
    pool = _require_queue(request)
    metadata = await q.read_metadata(pool, job_id)
    if metadata is None:
        raise HTTPException(status_code=404, detail="Job not found or expired.")

    job_status = metadata.get("status")
    if job_status == q.STATUS_BLOCKED:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "ZIP blocked because generated outputs failed quality control.",
                "failed_outputs": metadata.get("failed_outputs", []),
            },
        )
    if job_status == q.STATUS_FAILED:
        raise HTTPException(
            status_code=500,
            detail=metadata.get("error") or "Batch processing failed.",
        )
    if job_status != q.STATUS_COMPLETED or not metadata.get("output_ready"):
        raise HTTPException(
            status_code=409,
            detail="Job is still processing. Poll the status endpoint first.",
            headers={"Retry-After": "2"},
        )

    zip_path = q.output_zip_path(job_id)
    if not zip_path.exists():
        raise HTTPException(status_code=410, detail="Job output has expired.")

    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=str(metadata.get("download_filename") or f"{job_id}.zip"),
    )


@router.post("/analyze-images", dependencies=[Depends(public_rate_limit)])
async def analyze_images(files: list[UploadFile] = File(...)) -> dict[str, object]:
    if not files:
        raise HTTPException(status_code=400, detail="Upload at least one image.")

    if len(files) > MAX_BATCH_FILES:
        raise HTTPException(
            status_code=413,
            detail=f"Analysis limit is {MAX_BATCH_FILES} images for this MVP.",
        )

    results = []
    for file in files:
        image_bytes = await read_and_validate_upload(file)
        results.append(analyze_image(file.filename or "product", image_bytes))

    average_score = (
        round(
            sum(int(result["quality_score"]) for result in results) / len(results)
        )
        if results
        else 0
    )

    return {
        "image_count": len(results),
        "average_quality_score": average_score,
        "results": results,
    }


@router.post("/preview-seller-studio", dependencies=[Depends(public_rate_limit)])
async def preview_seller_studio(
    file: UploadFile = File(...),
    preset_ids: str = Form(...),
    cleanup_background: bool = Form(default=True),
    smart_center: bool = Form(default=True),
    add_shadow: bool = Form(default=False),
    polish_output: bool = Form(default=True),
    subject_fill_percent: int = Form(default=85, ge=65, le=95),
) -> dict[str, object]:
    selected_ids = [item.strip() for item in preset_ids.split(",") if item.strip()]
    presets = get_presets(selected_ids)
    if not presets:
        raise HTTPException(status_code=400, detail="Select at least one valid preset.")

    image_bytes = await read_and_validate_upload(file)
    options = ProcessingOptions(
        cleanup_background=cleanup_background,
        smart_center=smart_center,
        add_shadow=add_shadow,
        polish_output=polish_output,
        subject_fill_percent=subject_fill_percent,
    )
    summary, outputs = await run_in_threadpool(
        _build_preview, image_bytes, presets, options
    )

    return {
        "original_filename": file.filename or "product",
        "processing": asdict(options),
        "summary": {
            **summary,
            "can_download": summary["fail"] == 0,
        },
        "outputs": outputs,
    }


@router.post("/generate-listing-copy")
def listing_copy(
    product_name: str = Form(..., min_length=2, max_length=90),
    brand: str = Form(default="", max_length=50),
    category: str = Form(default="", max_length=60),
    primary_feature: str = Form(default="", max_length=120),
    audience: str = Form(default="", max_length=80),
) -> dict[str, object]:
    return generate_listing_copy(
        product_name=product_name,
        brand=brand,
        category=category,
        primary_feature=primary_feature,
        audience=audience,
    )


def _build_preview(
    image_bytes: bytes,
    presets: list[ImagePreset],
    options: ProcessingOptions,
) -> tuple[dict[str, int], list[dict[str, object]]]:
    outputs: list[dict[str, object]] = []
    summary = {"pass": 0, "warning": 0, "fail": 0}

    for preset in presets:
        output_bytes, output_report = process_image(image_bytes, preset, options)
        quality_control = assess_output(output_bytes, preset)
        summary[quality_control["status"]] += 1
        outputs.append(
            {
                **output_report,
                "preview_data_url": create_preview_data_url(output_bytes),
                "quality_control": quality_control,
            }
        )

    return summary, outputs


def _build_zip(
    project_slug: str,
    image_inputs: list[ImageInput],
    presets: list[ImagePreset],
    options: ProcessingOptions | None = None,
    strict_quality: bool = False,
) -> tuple[Path, dict[str, object]]:
    zip_file = tempfile.NamedTemporaryFile(
        prefix=f"{project_slug}-",
        suffix=".zip",
        delete=False,
    )
    zip_path = Path(zip_file.name)
    zip_file.close()

    try:
        report = build_seller_pack_zip(
            zip_path,
            project_slug=project_slug,
            image_inputs=image_inputs,
            presets=presets,
            options=options,
            strict_quality=strict_quality,
        )
    except StrictQualityBlocked as blocked:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "ZIP blocked because generated outputs failed quality control.",
                "failed_outputs": blocked.failed_outputs,
            },
        ) from blocked

    return zip_path, report

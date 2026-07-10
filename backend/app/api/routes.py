from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.image_tools.analyzer import analyze_image
from app.image_tools.presets import get_presets
from app.image_tools.processor import ProcessingOptions
from app.image_tools.routes import MAX_BATCH_FILES, ImageInput, _build_zip
from app.image_tools.security import read_and_validate_upload
from app.integrations.auth import require_api_key
from app.utils.filenames import safe_product_name

router = APIRouter(
    prefix="/api/v1",
    tags=["integrations"],
    dependencies=[Depends(require_api_key)],
)


@router.get("/status")
def api_status() -> dict[str, str]:
    return {"status": "ok", "version": "v1"}


@router.post("/analyze-images")
async def api_analyze_images(files: list[UploadFile] = File(...)) -> dict[str, object]:
    if not files:
        raise HTTPException(status_code=400, detail="Upload at least one image.")

    if len(files) > MAX_BATCH_FILES:
        raise HTTPException(
            status_code=413,
            detail=f"Analysis limit is {MAX_BATCH_FILES} images for this API version.",
        )

    results = []
    for file in files:
        image_bytes = await read_and_validate_upload(file)
        results.append(analyze_image(file.filename or "product", image_bytes))

    average_score = (
        round(sum(int(result["quality_score"]) for result in results) / len(results))
        if results
        else 0
    )

    return {
        "image_count": len(results),
        "average_quality_score": average_score,
        "results": results,
    }


@router.post("/seller-pack")
async def api_seller_pack(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    preset_ids: str = Form(...),
    project_name: str | None = Form(default=None),
    cleanup_background: bool = Form(default=False),
    smart_center: bool = Form(default=False),
    add_shadow: bool = Form(default=False),
    subject_fill_percent: int = Form(default=84, ge=65, le=92),
    strict_quality: bool = Form(default=False),
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
            detail=f"Batch limit is {MAX_BATCH_FILES} images for this API version.",
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
    zip_path, report = _build_zip(
        project_slug=project_slug,
        image_inputs=image_inputs,
        presets=presets,
        options=ProcessingOptions(
            cleanup_background=cleanup_background,
            smart_center=smart_center,
            add_shadow=add_shadow,
            subject_fill_percent=subject_fill_percent,
        ),
        strict_quality=strict_quality,
    )

    background_tasks.add_task(zip_path.unlink, missing_ok=True)

    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=f"{project_slug}-seller-pack-api.zip",
        background=background_tasks,
        headers={
            "X-Image-Count": str(len(image_inputs)),
            "X-Output-Count": str(report["output_count"]),
        },
    )


@router.post("/resize")
async def api_resize_alias(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    preset_ids: str = Form(...),
    project_name: str | None = Form(default=None),
    cleanup_background: bool = Form(default=False),
    smart_center: bool = Form(default=False),
    add_shadow: bool = Form(default=False),
    subject_fill_percent: int = Form(default=84, ge=65, le=92),
    strict_quality: bool = Form(default=False),
) -> FileResponse:
    return await api_seller_pack(
        background_tasks=background_tasks,
        files=files,
        preset_ids=preset_ids,
        project_name=project_name,
        cleanup_background=cleanup_background,
        smart_center=smart_center,
        add_shadow=add_shadow,
        subject_fill_percent=subject_fill_percent,
        strict_quality=strict_quality,
    )

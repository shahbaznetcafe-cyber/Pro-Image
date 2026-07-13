import json
import tempfile
import zipfile
from dataclasses import asdict
from pathlib import Path
from typing import TypedDict

from fastapi import APIRouter, BackgroundTasks, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.image_tools.analyzer import analyze_image
from app.image_tools.connectors import CONNECTORS, connector_status, list_connector_statuses
from app.image_tools.listing_copy import generate_listing_copy
from app.image_tools.output_quality import assess_output, create_preview_data_url
from app.image_tools.presets import PRESETS, ImagePreset, get_presets
from app.image_tools.processor import ProcessingOptions, process_image
from app.image_tools.security import read_and_validate_upload
from app.integrations.saas import quota_headers, reserve_usage
from app.utils.filenames import safe_product_name

router = APIRouter(prefix="/tools", tags=["image tools"])

MAX_BATCH_FILES = 100


class ImageInput(TypedDict):
    filename: str
    image_bytes: bytes
    product_slug: str


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

    reservation = await reserve_usage(
        authorization,
        action="seller_pack",
        file_count=1,
        original_filename=image_input["filename"],
        original_size_kb=round(len(image_bytes) / 1024),
        expected_output_count=len(presets),
    )

    zip_path, report = _build_zip(
        project_slug=product_slug,
        image_inputs=[image_input],
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

    zip_path, report = _build_zip(
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


@router.post("/analyze-images")
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


@router.post("/preview-seller-studio")
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


def _build_zip(
    project_slug: str,
    image_inputs: list[ImageInput],
    presets: list[ImagePreset],
    options: ProcessingOptions | None = None,
    strict_quality: bool = False,
) -> tuple[Path, dict[str, object]]:
    active_options = options or ProcessingOptions()
    zip_file = tempfile.NamedTemporaryFile(
        prefix=f"{project_slug}-",
        suffix=".zip",
        delete=False,
    )
    zip_path = Path(zip_file.name)
    zip_file.close()

    quality_summary = {"pass": 0, "warning": 0, "fail": 0}
    failed_outputs: list[dict[str, str]] = []
    report: dict[str, object] = {
        "project_name": project_slug,
        "image_count": len(image_inputs),
        "preset_count": len(presets),
        "output_count": len(image_inputs) * len(presets),
        "processing": asdict(active_options),
        "quality_summary": quality_summary,
        "products": [],
    }
    marketplace_manifest = {
        "schema_version": "1.0",
        "generated_by": "SBZ SellImage Pro",
        "project_name": project_slug,
        "presets": [
            {
                **asdict(preset),
                "regions": list(preset.regions),
                "connector": connector_status(CONNECTORS[preset.connector_id])
                if preset.connector_id and preset.connector_id in CONNECTORS
                else None,
            }
            for preset in presets
        ],
    }

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for image_input in image_inputs:
            product_report: dict[str, object] = {
                "product_name": image_input["product_slug"],
                "original_filename": image_input["filename"],
                "original_size_kb": round(len(image_input["image_bytes"]) / 1024),
                "outputs": [],
            }

            for preset in presets:
                output_bytes, output_report = process_image(
                    image_input["image_bytes"],
                    preset,
                    active_options,
                )
                quality_control = assess_output(output_bytes, preset)
                output_report["quality_control"] = quality_control
                quality_summary[quality_control["status"]] += 1
                if quality_control["status"] == "fail":
                    failed_outputs.append(
                        {
                            "product": image_input["product_slug"],
                            "preset": preset.id,
                            "filename": preset.filename,
                        }
                    )
                archive.writestr(
                    f"{project_slug}/{image_input['product_slug']}/{preset.filename}",
                    output_bytes,
                )
                product_report["outputs"].append(output_report)  # type: ignore[union-attr]

            report["products"].append(product_report)  # type: ignore[union-attr]

        archive.writestr(
            f"{project_slug}/report.json",
            json.dumps(report, indent=2),
        )
        archive.writestr(
            f"{project_slug}/marketplace-manifest.json",
            json.dumps(marketplace_manifest, indent=2),
        )

    if strict_quality and failed_outputs:
        zip_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=422,
            detail={
                "message": "ZIP blocked because generated outputs failed quality control.",
                "failed_outputs": failed_outputs,
            },
        )

    return zip_path, report

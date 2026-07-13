"""Shared seller-pack ZIP builder.

Used by the synchronous route (in a threadpool) and by the arq worker. Keeping
this logic in one place means the queued path and the inline path produce byte-
identical output and reports.
"""

import json
import zipfile
from dataclasses import asdict
from pathlib import Path
from typing import Callable, TypedDict

from app.image_tools.connectors import CONNECTORS, connector_status
from app.image_tools.output_quality import assess_output
from app.image_tools.presets import ImagePreset
from app.image_tools.processor import ProcessingOptions, process_image

ProgressCallback = Callable[[int, int], None]


class ImageInput(TypedDict):
    filename: str
    image_bytes: bytes
    product_slug: str


class StrictQualityBlocked(Exception):
    """Raised when strict quality is on and one or more outputs failed."""

    def __init__(self, failed_outputs: list[dict[str, str]]) -> None:
        super().__init__("Generated outputs failed quality control.")
        self.failed_outputs = failed_outputs


def build_seller_pack_zip(
    output_path: Path,
    *,
    project_slug: str,
    image_inputs: list[ImageInput],
    presets: list[ImagePreset],
    options: ProcessingOptions | None = None,
    strict_quality: bool = False,
    progress_cb: ProgressCallback | None = None,
) -> dict[str, object]:
    """Build the seller-pack ZIP at ``output_path`` and return its report.

    ``progress_cb(completed, total)`` is invoked after each generated output so
    callers can surface progress. Raises :class:`StrictQualityBlocked` (after
    removing the ZIP) when ``strict_quality`` is set and any output fails.
    """
    active_options = options or ProcessingOptions()
    total_outputs = len(image_inputs) * len(presets)
    completed = 0

    quality_summary = {"pass": 0, "warning": 0, "fail": 0}
    failed_outputs: list[dict[str, str]] = []
    report: dict[str, object] = {
        "project_name": project_slug,
        "image_count": len(image_inputs),
        "preset_count": len(presets),
        "output_count": total_outputs,
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

    with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
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
                completed += 1
                if progress_cb is not None:
                    progress_cb(completed, total_outputs)

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
        output_path.unlink(missing_ok=True)
        raise StrictQualityBlocked(failed_outputs)

    return report

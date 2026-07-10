import base64
from collections import deque
from io import BytesIO
from typing import Literal, TypedDict

from PIL import Image, ImageChops, ImageStat

from app.image_tools.presets import ImagePreset


QualityStatus = Literal["pass", "warning", "fail"]


class OutputCheck(TypedDict):
    label: str
    status: QualityStatus
    detail: str


class OutputQuality(TypedDict):
    status: QualityStatus
    score: int
    summary: str
    checks: list[OutputCheck]
    metrics: dict[str, int | float | str]


def _check(label: str, status: QualityStatus, detail: str) -> OutputCheck:
    return {"label": label, "status": status, "detail": detail}


def _foreground_mask(image: Image.Image, preset: ImagePreset) -> Image.Image:
    rgba = image.convert("RGBA")
    if preset.transparent:
        return rgba.getchannel("A").point(lambda value: 255 if value >= 20 else 0)

    rgb = rgba.convert("RGB")
    background = Image.new("RGB", rgb.size, preset.background)
    difference = ImageChops.difference(rgb, background)
    red, green, blue = difference.split()
    distance = ImageChops.lighter(red, ImageChops.lighter(green, blue))
    return distance.point(lambda value: 255 if value >= 20 else 0)


def _detached_pixel_ratio(mask: Image.Image) -> float:
    preview = mask.copy()
    preview.thumbnail((320, 320), Image.Resampling.NEAREST)
    width, height = preview.size
    pixels = bytearray(1 if value else 0 for value in preview.getdata())
    visited = bytearray(width * height)
    component_sizes: list[int] = []

    for start in range(width * height):
        if not pixels[start] or visited[start]:
            continue

        queue = deque([start])
        visited[start] = 1
        size = 0
        while queue:
            index = queue.popleft()
            size += 1
            x = index % width
            y = index // width
            for neighbor in (index - 1, index + 1, index - width, index + width):
                if neighbor < 0 or neighbor >= width * height:
                    continue
                neighbor_x = neighbor % width
                neighbor_y = neighbor // width
                if abs(neighbor_x - x) + abs(neighbor_y - y) != 1:
                    continue
                if pixels[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)
        component_sizes.append(size)

    if not component_sizes:
        return 1.0

    total = sum(component_sizes)
    return max(0.0, (total - max(component_sizes)) / total)


def _corner_background_distance(image: Image.Image, preset: ImagePreset) -> float:
    rgb = image.convert("RGB")
    sample_size = max(4, min(rgb.size) // 30)
    width, height = rgb.size
    crops = [
        rgb.crop((0, 0, sample_size, sample_size)),
        rgb.crop((width - sample_size, 0, width, sample_size)),
        rgb.crop((0, height - sample_size, sample_size, height)),
        rgb.crop((width - sample_size, height - sample_size, width, height)),
    ]
    means = [ImageStat.Stat(crop).mean[:3] for crop in crops]
    return round(
        sum(
            abs(channel - preset.background[index])
            for mean in means
            for index, channel in enumerate(mean)
        )
        / (len(means) * 3),
        2,
    )


def assess_output(image_bytes: bytes, preset: ImagePreset) -> OutputQuality:
    with Image.open(BytesIO(image_bytes)) as source:
        actual_format = source.format or "UNKNOWN"
        image = source.convert("RGBA")
        width, height = image.size

    checks: list[OutputCheck] = []
    expected_format = preset.format.upper()
    normalized_format = "JPEG" if actual_format.upper() in {"JPG", "JPEG"} else actual_format.upper()
    checks.append(
        _check(
            "Dimensions",
            "pass" if (width, height) == (preset.width, preset.height) else "fail",
            f"{width} x {height}; expected {preset.width} x {preset.height}.",
        )
    )
    checks.append(
        _check(
            "Format",
            "pass" if normalized_format == expected_format else "fail",
            f"{normalized_format}; expected {expected_format}.",
        )
    )

    mask = _foreground_mask(image, preset)
    bounds = mask.getbbox()
    fill_percent = 0
    edge_margin_percent = 0.0
    if bounds:
        subject_width = bounds[2] - bounds[0]
        subject_height = bounds[3] - bounds[1]
        fill_percent = round(max(subject_width / width, subject_height / height) * 100)
        edge_margin_percent = round(
            min(bounds[0], bounds[1], width - bounds[2], height - bounds[3])
            / min(width, height)
            * 100,
            2,
        )

    if not bounds:
        checks.append(_check("Product detected", "fail", "No visible product was detected in the output."))
    elif 75 <= fill_percent <= 90:
        checks.append(_check("Product fill", "pass", f"Product fills {fill_percent}% of the canvas."))
    elif 68 <= fill_percent <= 94:
        checks.append(_check("Product fill", "warning", f"Product fills {fill_percent}%; 75-90% is preferred."))
    else:
        checks.append(_check("Product fill", "fail", f"Product fills {fill_percent}%; output is not publish-ready."))

    if bounds and edge_margin_percent <= 0.5:
        checks.append(_check("Safe edges", "fail", "Product touches or clips the canvas edge."))
    elif bounds and edge_margin_percent < 2:
        checks.append(_check("Safe edges", "warning", f"Minimum edge margin is {edge_margin_percent}%."))
    else:
        checks.append(_check("Safe edges", "pass", f"Minimum edge margin is {edge_margin_percent}%."))

    detached_ratio = _detached_pixel_ratio(mask)
    if detached_ratio > 0.08:
        checks.append(_check("Detached artifacts", "fail", f"{round(detached_ratio * 100, 1)}% of foreground is detached."))
    elif detached_ratio > 0.025:
        checks.append(_check("Detached artifacts", "warning", f"{round(detached_ratio * 100, 1)}% detached foreground detected."))
    else:
        checks.append(_check("Detached artifacts", "pass", "No significant detached watermark or background artifact detected."))

    partial_alpha_percent = 0.0
    transparent_percent = 0.0
    background_distance = 0.0
    if preset.transparent:
        alpha = image.getchannel("A")
        histogram = alpha.histogram()
        pixel_count = width * height
        transparent_percent = round(histogram[0] / pixel_count * 100, 2)
        partial_alpha_percent = round(sum(histogram[1:255]) / pixel_count * 100, 2)
        checks.append(
            _check(
                "Transparency",
                "pass" if transparent_percent >= 3 else "fail",
                f"{transparent_percent}% of canvas is fully transparent.",
            )
        )
        halo_status: QualityStatus = "pass" if partial_alpha_percent <= 8 else "warning" if partial_alpha_percent <= 15 else "fail"
        checks.append(_check("Edge halo", halo_status, f"Partial-alpha area is {partial_alpha_percent}%."))
    else:
        background_distance = _corner_background_distance(image, preset)
        background_status: QualityStatus = "pass" if background_distance <= 4 else "warning" if background_distance <= 10 else "fail"
        checks.append(
            _check(
                "Canvas background",
                background_status,
                f"Corner color distance from target is {background_distance}.",
            )
        )

    fail_count = sum(check["status"] == "fail" for check in checks)
    warning_count = sum(check["status"] == "warning" for check in checks)
    status: QualityStatus = "fail" if fail_count else "warning" if warning_count else "pass"
    summaries = {
        "pass": "Output passed the publish-ready quality gate.",
        "warning": "Output is usable but should be reviewed before publishing.",
        "fail": "Output is blocked because one or more publish-ready checks failed.",
    }

    return {
        "status": status,
        "score": max(0, 100 - fail_count * 30 - warning_count * 8),
        "summary": summaries[status],
        "checks": checks,
        "metrics": {
            "subject_fill_percent": fill_percent,
            "edge_margin_percent": edge_margin_percent,
            "detached_foreground_percent": round(detached_ratio * 100, 2),
            "partial_alpha_percent": partial_alpha_percent,
            "transparent_percent": transparent_percent,
            "background_distance": background_distance,
        },
    }


def create_preview_data_url(image_bytes: bytes) -> str:
    with Image.open(BytesIO(image_bytes)) as source:
        preview = source.convert("RGBA" if "A" in source.getbands() else "RGB")
        preview.thumbnail((520, 520), Image.Resampling.LANCZOS)

    buffer = BytesIO()
    preview.save(buffer, "WEBP", quality=80, method=4)
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/webp;base64,{encoded}"

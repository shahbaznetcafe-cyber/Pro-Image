from io import BytesIO
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps, ImageStat

from app.image_tools.compliance import evaluate_compliance, recommended_actions
from app.utils.filenames import safe_product_name


def analyze_image(filename: str, image_bytes: bytes) -> dict[str, object]:
    with Image.open(BytesIO(image_bytes)) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")
        width, height = image.size
        preview = image.copy()
        preview.thumbnail((420, 420), Image.Resampling.LANCZOS)

    background = _estimate_background(preview)
    bounds = _estimate_product_bounds(preview, background)
    sharpness = _sharpness_score(preview)
    background_score = _background_score(background)
    centering_score, fill_percent = _composition_scores(preview, bounds)
    size_score = _size_score(width, height)
    quality_score = round(
        0.35 * sharpness
        + 0.2 * background_score
        + 0.25 * centering_score
        + 0.2 * size_score
    )

    warnings = _build_warnings(
        width=width,
        height=height,
        sharpness=sharpness,
        background_score=background_score,
        centering_score=centering_score,
        fill_percent=fill_percent,
    )
    compliance = evaluate_compliance(
        width=width,
        height=height,
        sharpness=sharpness,
        background_score=background_score,
        centering_score=centering_score,
        fill_percent=fill_percent,
    )

    product_slug = safe_product_name(Path(filename).stem)

    return {
        "filename": filename,
        "width": width,
        "height": height,
        "aspect_ratio": round(width / height, 3) if height else 0,
        "quality_score": max(0, min(100, quality_score)),
        "sharpness_score": sharpness,
        "background_score": background_score,
        "centering_score": centering_score,
        "fill_percent": fill_percent,
        "warnings": warnings,
        "compliance": compliance,
        "recommended_actions": recommended_actions(compliance),
        "compliance_rule_version": "2026.07",
        "title_suggestions": _title_suggestions(product_slug),
        "recommended_presets": _recommended_presets(width, height, warnings),
    }


def _estimate_background(image: Image.Image) -> tuple[int, int, int]:
    width, height = image.size
    sample_size = max(6, min(width, height) // 12)
    crops = [
        image.crop((0, 0, sample_size, sample_size)),
        image.crop((width - sample_size, 0, width, sample_size)),
        image.crop((0, height - sample_size, sample_size, height)),
        image.crop((width - sample_size, height - sample_size, width, height)),
    ]
    channels = [[], [], []]

    for crop in crops:
        mean = ImageStat.Stat(crop).mean
        for index, value in enumerate(mean[:3]):
            channels[index].append(value)

    return tuple(round(sum(channel) / len(channel)) for channel in channels)  # type: ignore[return-value]


def _estimate_product_bounds(
    image: Image.Image,
    background: tuple[int, int, int],
) -> tuple[int, int, int, int] | None:
    width, height = image.size
    pixels = image.load()
    xs: list[int] = []
    ys: list[int] = []

    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            distance = abs(r - background[0]) + abs(g - background[1]) + abs(b - background[2])
            if distance > 45:
                xs.append(x)
                ys.append(y)

    if not xs or not ys:
        return None

    return min(xs), min(ys), max(xs), max(ys)


def _sharpness_score(image: Image.Image) -> int:
    grayscale = image.convert("L")
    edges = grayscale.filter(ImageFilter.FIND_EDGES)
    stddev = ImageStat.Stat(edges).stddev[0]
    return max(0, min(100, round(stddev * 4)))


def _background_score(background: tuple[int, int, int]) -> int:
    whiteness = sum(background) / 3
    channel_spread = max(background) - min(background)
    score = whiteness - channel_spread * 1.5
    return max(0, min(100, round(score / 2.55)))


def _composition_scores(
    image: Image.Image,
    bounds: tuple[int, int, int, int] | None,
) -> tuple[int, int]:
    if bounds is None:
        return 35, 0

    width, height = image.size
    left, top, right, bottom = bounds
    product_width = max(1, right - left)
    product_height = max(1, bottom - top)
    product_center_x = left + product_width / 2
    product_center_y = top + product_height / 2
    canvas_center_x = width / 2
    canvas_center_y = height / 2
    offset_x = abs(product_center_x - canvas_center_x) / width
    offset_y = abs(product_center_y - canvas_center_y) / height
    centering_score = round(100 - min(90, (offset_x + offset_y) * 160))
    fill_percent = round((product_width * product_height) / (width * height) * 100)

    return max(0, min(100, centering_score)), max(0, min(100, fill_percent))


def _size_score(width: int, height: int) -> int:
    longest = max(width, height)
    shortest = min(width, height)

    if longest >= 2000 and shortest >= 1000:
        return 100

    if longest >= 1000:
        return 75

    if longest >= 600:
        return 55

    return 30


def _build_warnings(
    width: int,
    height: int,
    sharpness: int,
    background_score: int,
    centering_score: int,
    fill_percent: int,
) -> list[str]:
    warnings: list[str] = []

    if max(width, height) < 1000:
        warnings.append("Image is small. Use 1000px+ on the longest side for better zoom/detail.")

    if sharpness < 35:
        warnings.append("Image may be blurry or low-detail.")

    if background_score < 70:
        warnings.append("Background may not be clean white; marketplace main images may need cleanup.")

    if centering_score < 70:
        warnings.append("Product appears off-center.")

    if fill_percent < 30:
        warnings.append("Product may be too small in the frame.")
    elif fill_percent > 88:
        warnings.append("Product may be too tightly cropped.")

    return warnings


def _title_suggestions(product_slug: str) -> list[str]:
    words = [word for word in product_slug.replace("_", "-").split("-") if word]
    if not words:
        return ["Product photo", "Marketplace product image", "Website product image"]

    title = " ".join(word.capitalize() for word in words)
    return [
        title,
        f"{title} product photo",
        f"{title} marketplace image",
    ]


def _recommended_presets(width: int, height: int, warnings: list[str]) -> list[str]:
    presets = ["website_webp"]

    if max(width, height) >= 1000:
        presets.extend(["amazon_main", "shopify_product"])

    if width == height:
        presets.append("whatsapp_catalog")
    else:
        presets.extend(["meta_square", "meta_portrait"])

    if any("Background" in warning for warning in warnings):
        presets.append("transparent_product")

    presets.extend(["daraz_square", "google_shopping"])

    return list(dict.fromkeys(presets))

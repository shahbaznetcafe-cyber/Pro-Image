from collections import deque
from dataclasses import asdict, dataclass
from io import BytesIO

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps, ImageStat

from app.image_tools.presets import ImagePreset


@dataclass(frozen=True)
class ProcessingOptions:
    cleanup_background: bool = False
    smart_center: bool = False
    add_shadow: bool = False
    polish_output: bool = True
    subject_fill_percent: int = 84


def _estimate_background(image: Image.Image) -> tuple[int, int, int]:
    rgb = image.convert("RGB")
    width, height = rgb.size
    sample = max(4, min(width, height) // 20)
    corners = [
        rgb.crop((0, 0, sample, sample)),
        rgb.crop((width - sample, 0, width, sample)),
        rgb.crop((0, height - sample, sample, height)),
        rgb.crop((width - sample, height - sample, width, height)),
    ]
    means = [ImageStat.Stat(corner).mean[:3] for corner in corners]
    return tuple(round(sum(values) / len(values)) for values in zip(*means))  # type: ignore[return-value]


def _has_clean_source_alpha(alpha: Image.Image) -> bool:
    histogram = alpha.histogram()
    pixel_count = alpha.width * alpha.height
    transparent_ratio = histogram[0] / pixel_count
    partial_ratio = sum(histogram[1:255]) / pixel_count
    return transparent_ratio >= 0.03 and partial_ratio <= 0.08


def _fill_mask_holes(mask: Image.Image) -> Image.Image:
    outside = ImageOps.invert(mask)
    ImageDraw.floodfill(outside, (0, 0), 0)
    return ImageChops.lighter(mask, outside)


def _visible_bounds(mask: Image.Image, threshold: int = 16) -> tuple[int, int, int, int] | None:
    """Ignore the faint antialiasing pixels that should not drive the crop."""
    return mask.point(lambda value: 255 if value >= threshold else 0).getbbox()


def _largest_central_component(mask: Image.Image) -> Image.Image | None:
    width, height = mask.size
    pixels = bytearray(1 if value >= 128 else 0 for value in mask.getdata())
    visited = bytearray(width * height)
    best_component: list[int] = []
    best_score = 0.0
    center_x = width / 2
    center_y = height / 2

    for start in range(width * height):
        if not pixels[start] or visited[start]:
            continue

        queue = deque([start])
        visited[start] = 1
        component: list[int] = []
        min_x = width
        min_y = height
        max_x = 0
        max_y = 0

        while queue:
            index = queue.popleft()
            component.append(index)
            x = index % width
            y = index // width
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)

            if x > 0:
                neighbor = index - 1
                if pixels[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)
            if x + 1 < width:
                neighbor = index + 1
                if pixels[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)
            if y > 0:
                neighbor = index - width
                if pixels[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)
            if y + 1 < height:
                neighbor = index + width
                if pixels[neighbor] and not visited[neighbor]:
                    visited[neighbor] = 1
                    queue.append(neighbor)

        component_center_x = (min_x + max_x) / 2
        component_center_y = (min_y + max_y) / 2
        distance = abs(component_center_x - center_x) / width + abs(component_center_y - center_y) / height
        centrality = max(0.75, 1.15 - distance)
        score = len(component) * centrality

        if score > best_score:
            best_score = score
            best_component = component

    if len(best_component) < width * height * 0.002:
        return None

    output = bytearray(width * height)
    for index in best_component:
        output[index] = 255
    return Image.frombytes("L", (width, height), bytes(output))


def _retain_central_subject(mask: Image.Image) -> Image.Image:
    """Drop detached marks while leaving a small, soft safety envelope for the subject."""
    preview = mask.copy()
    preview.thumbnail((720, 720), Image.Resampling.LANCZOS)
    component = _largest_central_component(preview.point(lambda value: 255 if value >= 96 else 0))
    if component is None:
        return mask

    component_pixels = sum(1 for value in component.getdata() if value)
    coverage = component_pixels / (component.width * component.height)
    if not 0.002 <= coverage <= 0.72:
        return mask

    # Keep nearby anti-aliased edges and small connected product details, while
    # excluding remote logos, checkerboard remnants, and watermarks.
    envelope = component.filter(ImageFilter.MaxFilter(17)).filter(ImageFilter.GaussianBlur(1.2))
    envelope = envelope.resize(mask.size, Image.Resampling.LANCZOS)
    return ImageChops.multiply(mask, envelope)


def _neutral_background_subject_mask(image: Image.Image) -> Image.Image | None:
    preview = image.convert("RGBA")
    preview.thumbnail((720, 720), Image.Resampling.LANCZOS)
    saturation = preview.convert("HSV").split()[1]
    seed_values = bytearray()
    neutral_count = 0

    for saturation_value in saturation.getdata():
        is_background = saturation_value <= 48
        neutral_count += int(is_background)
        seed_values.append(0 if is_background else 255)

    pixel_count = preview.width * preview.height
    neutral_ratio = neutral_count / pixel_count
    foreground_ratio = 1 - neutral_ratio
    if neutral_ratio < 0.38 or not 0.004 <= foreground_ratio <= 0.58:
        return None

    seed = Image.frombytes("L", preview.size, bytes(seed_values))
    seed = seed.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    component = _largest_central_component(seed)
    if component is None:
        return None

    component = component.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    component = _fill_mask_holes(component).filter(ImageFilter.GaussianBlur(0.8))
    central_mask = component.resize(image.size, Image.Resampling.LANCZOS)

    # Saturation-only segmentation drops white product details. Recover those
    # details only inside a subject-shaped envelope; a broad rectangle can turn
    # baked checkerboard tiles around the product back into foreground.
    background = _estimate_background(image)
    background_luminance = sum(background) / 3
    if background_luminance < 160:
        threshold = min(245, round(background_luminance + 55))
        recovery_mask = image.convert("L").point(
            lambda value: 255 if value >= threshold else 0
        )
    else:
        # Light checkerboards commonly peak around 235-242. Requiring an almost
        # white value preserves eyes, labels, and white product parts without
        # preserving the grey checker tiles themselves.
        threshold = max(246, min(252, round(background_luminance + 10)))
        luminance = image.convert("L")
        saturation_full = image.convert("HSV").split()[1]
        bright = luminance.point(lambda value: 255 if value >= threshold else 0)
        neutral = saturation_full.point(lambda value: 255 if value <= 40 else 0)
        recovery_mask = ImageChops.multiply(bright, neutral)

    recovery_envelope = component.filter(ImageFilter.MaxFilter(25)).filter(
        ImageFilter.GaussianBlur(1.0)
    )
    recovery_envelope = recovery_envelope.resize(image.size, Image.Resampling.LANCZOS)
    recovery_mask = ImageChops.multiply(recovery_mask, recovery_envelope)

    # Internal neutral details are recovered by hole filling. The envelope only
    # needs to extend slightly beyond the colored seed for attached white parts.
    recovery_mask = ImageChops.multiply(
        recovery_mask,
        central_mask.filter(ImageFilter.MaxFilter(15)),
    )
    combined = ImageChops.lighter(central_mask, recovery_mask)
    return combined.filter(ImageFilter.GaussianBlur(0.8))


def _corner_color_subject_mask(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    background = Image.new("RGB", rgba.size, _estimate_background(rgba))
    difference = ImageChops.difference(rgba.convert("RGB"), background)
    red, green, blue = difference.split()
    distance = ImageChops.lighter(red, ImageChops.lighter(green, blue))

    def alpha_value(value: int) -> int:
        if value <= 12:
            return 0
        if value >= 58:
            return 255
        return round((value - 12) / 46 * 255)

    mask = distance.point(alpha_value).filter(ImageFilter.GaussianBlur(0.7))
    mask = ImageChops.multiply(mask, rgba.getchannel("A"))
    return _retain_central_subject(mask)


def _subject_mask(image: Image.Image) -> tuple[Image.Image, str]:
    rgba = image.convert("RGBA")
    source_alpha = rgba.getchannel("A")

    if _has_clean_source_alpha(source_alpha):
        return source_alpha, "source_alpha"

    neutral_mask = _neutral_background_subject_mask(rgba)
    if neutral_mask is not None:
        return ImageChops.multiply(neutral_mask, source_alpha), "central_subject"

    return _corner_color_subject_mask(rgba), "corner_color"


def _prepare_layer(image: Image.Image, options: ProcessingOptions) -> tuple[Image.Image, str]:
    layer = ImageOps.exif_transpose(image).convert("RGBA")
    mask_result = _subject_mask(layer) if options.cleanup_background or options.smart_center else None
    mask, cleanup_method = mask_result if mask_result is not None else (None, "disabled")

    if options.cleanup_background and mask is not None:
        layer.putalpha(mask)

    if options.smart_center and mask is not None:
        bounds = _visible_bounds(mask)
        if bounds:
            subject_width = bounds[2] - bounds[0]
            subject_height = bounds[3] - bounds[1]
            # A compact crop gives marketplace outputs enough breathing room
            # without reducing the requested product fill by several percent.
            padding_x = max(4, round(subject_width * 0.03))
            padding_top = max(4, round(subject_height * 0.03))
            padding_bottom = max(4, round(subject_height * 0.05))
            left = max(0, bounds[0] - padding_x)
            top = max(0, bounds[1] - padding_top)
            right = min(layer.width, bounds[2] + padding_x)
            bottom = min(layer.height, bounds[3] + padding_bottom)
            layer = layer.crop((left, top, right, bottom))

    return layer, cleanup_method


def _add_shadow(canvas: Image.Image, layer: Image.Image, x: int, y: int) -> None:
    alpha = layer.getchannel("A")
    blur_radius = max(3, round(min(canvas.size) * 0.012))
    shadow_alpha = alpha.filter(ImageFilter.GaussianBlur(blur_radius)).point(
        lambda value: round(value * 0.22)
    )
    shadow = Image.new("RGBA", layer.size, (18, 24, 19, 0))
    shadow.putalpha(shadow_alpha)
    offset = max(4, round(canvas.height * 0.018))
    canvas.alpha_composite(shadow, (x, min(canvas.height - layer.height, y + offset)))


def _polish_layer(layer: Image.Image) -> Image.Image:
    """Apply a restrained seller-ready finish while preserving source alpha."""
    alpha = layer.getchannel("A")
    rgb = layer.convert("RGB")
    rgb = ImageEnhance.Color(rgb).enhance(1.03)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.02)
    rgb = ImageEnhance.Sharpness(rgb).enhance(1.08)
    polished = rgb.convert("RGBA")
    polished.putalpha(alpha)
    return polished


def _fit_on_canvas(
    image: Image.Image,
    preset: ImagePreset,
    options: ProcessingOptions,
) -> tuple[Image.Image, dict[str, object]]:
    layer, cleanup_method = _prepare_layer(image, options)
    subject_bounds = _visible_bounds(layer.getchannel("A"))
    if subject_bounds is None:
        subject_bounds = (0, 0, layer.width, layer.height)
    subject_width = max(1, subject_bounds[2] - subject_bounds[0])
    subject_height = max(1, subject_bounds[3] - subject_bounds[1])
    requested_fill = max(65, min(95, options.subject_fill_percent))
    fill_ratio = requested_fill / 100 if options.smart_center else 1.0
    target_width = max(1, round(preset.width * fill_ratio))
    target_height = max(1, round(preset.height * fill_ratio))
    # Scale against visible product bounds, rather than transparent padding.
    # This keeps the slider honest and avoids small, under-filled products.
    scale = min(target_width / subject_width, target_height / subject_height)
    scaled_size = (
        max(1, round(layer.width * scale)),
        max(1, round(layer.height * scale)),
    )
    if scaled_size != layer.size:
        layer = layer.resize(scaled_size, Image.Resampling.LANCZOS)
    if options.polish_output:
        layer = _polish_layer(layer)

    background = (0, 0, 0, 0) if preset.transparent else (*preset.background, 255)
    canvas = Image.new("RGBA", (preset.width, preset.height), background)
    placed_bounds = _visible_bounds(layer.getchannel("A"))
    if placed_bounds is None:
        placed_bounds = (0, 0, layer.width, layer.height)
    placed_width = placed_bounds[2] - placed_bounds[0]
    placed_height = placed_bounds[3] - placed_bounds[1]
    x = round(preset.width / 2 - (placed_bounds[0] + placed_width / 2))
    y = round(preset.height / 2 - (placed_bounds[1] + placed_height / 2))

    if options.add_shadow and options.cleanup_background and not preset.transparent:
        _add_shadow(canvas, layer, x, y)

    canvas.alpha_composite(layer, (x, y))
    output = canvas if preset.transparent else canvas.convert("RGB")
    return output, {
        "cleanup_method": cleanup_method,
        "subject_fill_percent": round(max(placed_width / preset.width, placed_height / preset.height) * 100),
    }


def process_image(
    image_bytes: bytes,
    preset: ImagePreset,
    options: ProcessingOptions | None = None,
) -> tuple[bytes, dict[str, object]]:
    active_options = options or ProcessingOptions()
    with Image.open(BytesIO(image_bytes)) as source:
        original_width, original_height = source.size
        output, diagnostics = _fit_on_canvas(source, preset, active_options)

    buffer = BytesIO()
    save_kwargs: dict[str, int | bool] = {"optimize": True}

    if preset.format == "WEBP":
        save_kwargs.update({"quality": preset.quality, "method": 6})
    elif preset.format == "JPEG":
        save_kwargs.update({"quality": preset.quality, "progressive": True})
    elif preset.format == "PNG":
        save_kwargs["compress_level"] = 7

    output.save(buffer, preset.format, **save_kwargs)
    data = buffer.getvalue()

    if preset.max_file_bytes and len(data) > preset.max_file_bytes and preset.format in {"JPEG", "WEBP"}:
        for quality in range(preset.quality - 5, 54, -5):
            buffer = BytesIO()
            save_kwargs["quality"] = quality
            output.save(buffer, preset.format, **save_kwargs)
            data = buffer.getvalue()
            if len(data) <= preset.max_file_bytes:
                break

    return data, {
        "preset_id": preset.id,
        "label": preset.label,
        "filename": preset.filename,
        "format": preset.format,
        "original_width": original_width,
        "original_height": original_height,
        "output_width": preset.width,
        "output_height": preset.height,
        "output_size_kb": round(len(data) / 1024),
        "processing": asdict(active_options),
        **diagnostics,
    }

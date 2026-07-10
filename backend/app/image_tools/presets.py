from dataclasses import dataclass


@dataclass(frozen=True)
class ImagePreset:
    id: str
    label: str
    width: int
    height: int
    format: str
    quality: int
    background: tuple[int, int, int]
    filename: str
    group: str = "Marketplace"
    transparent: bool = False


PRESETS: dict[str, ImagePreset] = {
    "amazon_main": ImagePreset(
        id="amazon_main",
        label="Amazon Main",
        width=2000,
        height=2000,
        format="JPEG",
        quality=88,
        background=(255, 255, 255),
        filename="amazon-main-2000x2000.jpg",
    ),
    "etsy_listing": ImagePreset(
        id="etsy_listing",
        label="Etsy Listing",
        width=2000,
        height=2000,
        format="JPEG",
        quality=88,
        background=(255, 255, 255),
        filename="etsy-listing-2000x2000.jpg",
    ),
    "shopify_product": ImagePreset(
        id="shopify_product",
        label="Shopify Product",
        width=2048,
        height=2048,
        format="JPEG",
        quality=88,
        background=(255, 255, 255),
        filename="shopify-product-2048x2048.jpg",
    ),
    "meta_square": ImagePreset(
        id="meta_square",
        label="Meta Square",
        width=1080,
        height=1080,
        format="JPEG",
        quality=86,
        background=(255, 255, 255),
        filename="meta-feed-1080x1080.jpg",
    ),
    "meta_portrait": ImagePreset(
        id="meta_portrait",
        label="Instagram Portrait",
        width=1080,
        height=1350,
        format="JPEG",
        quality=86,
        background=(255, 255, 255),
        filename="meta-portrait-1080x1350.jpg",
    ),
    "story_reel": ImagePreset(
        id="story_reel",
        label="Story/Reel",
        width=1080,
        height=1920,
        format="JPEG",
        quality=86,
        background=(255, 255, 255),
        filename="story-reel-1080x1920.jpg",
    ),
    "whatsapp_catalog": ImagePreset(
        id="whatsapp_catalog",
        label="WhatsApp Catalog",
        width=1000,
        height=1000,
        format="JPEG",
        quality=82,
        background=(255, 255, 255),
        filename="whatsapp-catalog-1000x1000.jpg",
    ),
    "website_webp": ImagePreset(
        id="website_webp",
        label="Website WebP",
        width=1600,
        height=1600,
        format="WEBP",
        quality=82,
        background=(255, 255, 255),
        filename="website-product-1600x1600.webp",
        group="Website",
    ),
    "daraz_square": ImagePreset(
        id="daraz_square",
        label="Daraz Product",
        width=1000,
        height=1000,
        format="JPEG",
        quality=88,
        background=(255, 255, 255),
        filename="daraz-product-1000x1000.jpg",
    ),
    "google_shopping": ImagePreset(
        id="google_shopping",
        label="Google Shopping",
        width=1500,
        height=1500,
        format="JPEG",
        quality=90,
        background=(255, 255, 255),
        filename="google-shopping-1500x1500.jpg",
    ),
    "tiktok_square": ImagePreset(
        id="tiktok_square",
        label="TikTok Square",
        width=640,
        height=640,
        format="JPEG",
        quality=86,
        background=(255, 255, 255),
        filename="tiktok-square-640x640.jpg",
        group="Ads",
    ),
    "tiktok_horizontal": ImagePreset(
        id="tiktok_horizontal",
        label="TikTok Horizontal",
        width=1200,
        height=628,
        format="JPEG",
        quality=86,
        background=(255, 255, 255),
        filename="tiktok-horizontal-1200x628.jpg",
        group="Ads",
    ),
    "tiktok_vertical": ImagePreset(
        id="tiktok_vertical",
        label="TikTok Vertical",
        width=720,
        height=1280,
        format="JPEG",
        quality=86,
        background=(255, 255, 255),
        filename="tiktok-vertical-720x1280.jpg",
        group="Ads",
    ),
    "transparent_product": ImagePreset(
        id="transparent_product",
        label="Transparent Product",
        width=1600,
        height=1600,
        format="PNG",
        quality=100,
        background=(255, 255, 255),
        filename="transparent-product-1600x1600.png",
        group="Studio",
        transparent=True,
    ),
}


def get_presets(ids: list[str]) -> list[ImagePreset]:
    return [PRESETS[preset_id] for preset_id in ids if preset_id in PRESETS]

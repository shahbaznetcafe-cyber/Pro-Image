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
    marketplace: str = ""
    regions: tuple[str, ...] = ("Global",)
    role: str = "main"
    background_policy: str = "pure_white"
    fill_min: int = 75
    fill_max: int = 90
    max_file_bytes: int | None = None
    allow_shadow: bool = True
    confidence: str = "verified"
    policy_version: str = "2026-07-12"
    source_url: str = ""
    category_note: str = ""
    connector_id: str | None = None
    popular: bool = False


MB = 1024 * 1024


def _marketplace(
    id: str,
    label: str,
    size: tuple[int, int],
    filename: str,
    *,
    marketplace: str,
    regions: tuple[str, ...],
    fill: tuple[int, int] = (75, 90),
    max_mb: int | None = None,
    background_policy: str = "pure_white",
    allow_shadow: bool = False,
    confidence: str = "verified",
    source_url: str = "",
    category_note: str = "",
    connector_id: str | None = None,
    role: str = "main",
    popular: bool = False,
) -> ImagePreset:
    return ImagePreset(
        id=id,
        label=label,
        width=size[0],
        height=size[1],
        format="JPEG",
        quality=90,
        background=(255, 255, 255),
        filename=filename,
        marketplace=marketplace,
        regions=regions,
        role=role,
        background_policy=background_policy,
        fill_min=fill[0],
        fill_max=fill[1],
        max_file_bytes=max_mb * MB if max_mb else None,
        allow_shadow=allow_shadow,
        confidence=confidence,
        source_url=source_url,
        category_note=category_note,
        connector_id=connector_id,
        popular=popular,
    )


PRESETS: dict[str, ImagePreset] = {
    "amazon_main": _marketplace(
        "amazon_main", "Amazon Main", (2000, 2000), "amazon-main-2000x2000.jpg",
        marketplace="Amazon", regions=("Global", "North America", "Europe", "Asia"),
        fill=(84, 95), max_mb=10, connector_id="amazon_sp_api", popular=True,
        source_url="https://sellercentral.amazon.com/help/hub/reference/G1881",
    ),
    "walmart_main": _marketplace(
        "walmart_main", "Walmart Main", (2200, 2200), "walmart-main-2200x2200.jpg",
        marketplace="Walmart", regions=("North America",), fill=(80, 90), max_mb=5,
        connector_id="walmart_marketplace", popular=True,
        source_url="https://marketplacelearn.walmart.com/guides/Item%20setup/Content%20policy/Image-requirements",
    ),
    "ebay_main": _marketplace(
        "ebay_main", "eBay Main", (1600, 1600), "ebay-main-1600x1600.jpg",
        marketplace="eBay", regions=("Global", "North America", "Europe", "Asia-Pacific"),
        fill=(75, 90), max_mb=12, background_policy="light_neutral", connector_id="ebay_sell_api", popular=True,
        source_url="https://www.ebay.com/help/selling/listings/adding-pictures-listings?id=4148",
    ),
    "etsy_listing": _marketplace(
        "etsy_listing", "Etsy Listing", (2000, 2000), "etsy-listing-2000x2000.jpg",
        marketplace="Etsy", regions=("Global", "North America", "Europe"), fill=(70, 90), max_mb=20,
        background_policy="any", allow_shadow=True, connector_id="etsy_open_api", popular=True,
        source_url="https://help.etsy.com/hc/en-us/articles/115015663347",
    ),
    "shopify_product": _marketplace(
        "shopify_product", "Shopify Product", (2048, 2048), "shopify-product-2048x2048.jpg",
        marketplace="Shopify", regions=("Global",), fill=(70, 90), max_mb=20,
        background_policy="any", allow_shadow=True, connector_id="shopify_admin_api", popular=True,
        source_url="https://help.shopify.com/en/manual/products/product-media/product-media-types",
    ),
    "google_shopping": _marketplace(
        "google_shopping", "Google Shopping", (1500, 1500), "google-shopping-1500x1500.jpg",
        marketplace="Google Merchant Center", regions=("Global",), fill=(75, 90), max_mb=16,
        background_policy="light_neutral", connector_id="google_content_api", popular=True,
        source_url="https://support.google.com/merchants/answer/6324350",
    ),
    "tiktok_shop_main": _marketplace(
        "tiktok_shop_main", "TikTok Shop Main", (1000, 1000), "tiktok-shop-main-1000x1000.jpg",
        marketplace="TikTok Shop", regions=("North America", "Europe", "Southeast Asia"),
        fill=(75, 90), max_mb=5, connector_id="tiktok_shop_api", popular=True,
        source_url="https://seller-us.tiktok.com/university/essay?knowledge_id=6837891831248641",
    ),
    "mercadolibre_main": _marketplace(
        "mercadolibre_main", "Mercado Libre Main", (1200, 1200), "mercado-libre-main-1200x1200.jpg",
        marketplace="Mercado Libre", regions=("Latin America",), fill=(85, 95), max_mb=10,
        connector_id="mercadolibre_pictures", popular=True,
        source_url="https://developers.mercadolibre.com.ar/en_us/products-receive-notifications/pictures",
    ),
    "noon_main": _marketplace(
        "noon_main", "Noon Main", (1200, 1200), "noon-main-1200x1200.jpg",
        marketplace="Noon", regions=("Middle East",), fill=(70, 80), max_mb=10,
        background_policy="light_neutral", category_note="Fashion categories may use light grey backgrounds.",
        source_url="https://support.noon.partners/portal/en/kb/articles/product-image-guidelines",
    ),
    "allegro_main": _marketplace(
        "allegro_main", "Allegro Main", (2048, 2048), "allegro-main-2048x2048.jpg",
        marketplace="Allegro", regions=("Europe",), fill=(75, 90), max_mb=10,
        connector_id="allegro_rest_api",
        source_url="https://help.allegro.com/en/sell/a/image-requirements-5G4KqkP9MSZ",
    ),
    "kaufland_main": _marketplace(
        "kaufland_main", "Kaufland Main", (2048, 2048), "kaufland-main-2048x2048.jpg",
        marketplace="Kaufland Global Marketplace", regions=("Europe",), fill=(75, 90), max_mb=10,
        connector_id="kaufland_seller_api",
        source_url="https://sellerapi.kaufland.com/",
    ),
    "coupang_main": _marketplace(
        "coupang_main", "Coupang Main", (1000, 1000), "coupang-main-1000x1000.jpg",
        marketplace="Coupang", regions=("South Korea",), fill=(75, 90), max_mb=3,
        connector_id="coupang_open_api",
        source_url="https://developers.coupangcorp.com/hc/en-us/articles/360033877853",
    ),
    "aliexpress_square": _marketplace(
        "aliexpress_square", "AliExpress Square", (800, 800), "aliexpress-square-800x800.jpg",
        marketplace="AliExpress", regions=("Global", "Asia", "Europe"), fill=(75, 90), max_mb=5,
        connector_id="aliexpress_open_platform",
        source_url="https://openservice.aliexpress.com/doc/doc.htm",
    ),
    "aliexpress_portrait": _marketplace(
        "aliexpress_portrait", "AliExpress Portrait", (750, 1000), "aliexpress-portrait-750x1000.jpg",
        marketplace="AliExpress", regions=("Global", "Asia", "Europe"), fill=(75, 90), max_mb=5,
        connector_id="aliexpress_open_platform", role="gallery",
        source_url="https://openservice.aliexpress.com/doc/doc.htm",
    ),
    "zalando_packshot": _marketplace(
        "zalando_packshot", "Zalando Packshot", (1801, 2600), "zalando-packshot-1801x2600.jpg",
        marketplace="Zalando", regions=("Europe",), fill=(75, 90), max_mb=10,
        category_note="Fashion packshot; category and partner rules require manual review.",
        source_url="https://partner.zalando.com/university/article/content-creation-guidelines",
    ),
    "shopee_main": _marketplace(
        "shopee_main", "Shopee Main", (1024, 1024), "shopee-main-1024x1024.jpg",
        marketplace="Shopee", regions=("Southeast Asia", "Latin America"), fill=(75, 90), max_mb=5,
        confidence="regional", connector_id="shopee_open_platform",
        category_note="Requirements vary by country portal; confirm before publishing.",
    ),
    "lazada_main": _marketplace(
        "lazada_main", "Lazada Main", (1000, 1000), "lazada-main-1000x1000.jpg",
        marketplace="Lazada", regions=("Southeast Asia",), fill=(75, 90), max_mb=5,
        confidence="regional", connector_id="lazada_open_platform",
        category_note="Requirements vary by Lazada country portal.",
    ),
    "daraz_square": _marketplace(
        "daraz_square", "Daraz Product", (1000, 1000), "daraz-product-1000x1000.jpg",
        marketplace="Daraz", regions=("South Asia",), fill=(75, 90), max_mb=5,
        confidence="provisional", connector_id="daraz_open_platform",
        category_note="Seller Center category rules must be confirmed before publishing.",
    ),
    "meta_square": ImagePreset("meta_square", "Meta Feed", 1080, 1080, "JPEG", 86, (255, 255, 255), "meta-feed-1080x1080.jpg", group="Ads", marketplace="Meta", regions=("Global",), background_policy="any"),
    "meta_portrait": ImagePreset("meta_portrait", "Instagram Portrait", 1080, 1350, "JPEG", 86, (255, 255, 255), "meta-portrait-1080x1350.jpg", group="Ads", marketplace="Meta", regions=("Global",), role="ad", background_policy="any"),
    "story_reel": ImagePreset("story_reel", "Story/Reel", 1080, 1920, "JPEG", 86, (255, 255, 255), "story-reel-1080x1920.jpg", group="Ads", marketplace="Meta", regions=("Global",), role="ad", background_policy="any"),
    "whatsapp_catalog": ImagePreset("whatsapp_catalog", "WhatsApp Catalog", 1000, 1000, "JPEG", 82, (255, 255, 255), "whatsapp-catalog-1000x1000.jpg", group="Catalog", marketplace="WhatsApp", regions=("Global",), background_policy="any"),
    "website_webp": ImagePreset("website_webp", "Website WebP", 1600, 1600, "WEBP", 82, (255, 255, 255), "website-product-1600x1600.webp", group="Website", marketplace="Website", regions=("Global",), background_policy="any"),
    "tiktok_square": ImagePreset("tiktok_square", "TikTok Square", 640, 640, "JPEG", 86, (255, 255, 255), "tiktok-square-640x640.jpg", group="Ads", marketplace="TikTok Ads", regions=("Global",), role="ad", background_policy="any"),
    "tiktok_horizontal": ImagePreset("tiktok_horizontal", "TikTok Horizontal", 1200, 628, "JPEG", 86, (255, 255, 255), "tiktok-horizontal-1200x628.jpg", group="Ads", marketplace="TikTok Ads", regions=("Global",), role="ad", background_policy="any"),
    "tiktok_vertical": ImagePreset("tiktok_vertical", "TikTok Vertical", 720, 1280, "JPEG", 86, (255, 255, 255), "tiktok-vertical-720x1280.jpg", group="Ads", marketplace="TikTok Ads", regions=("Global",), role="ad", background_policy="any"),
    "transparent_product": ImagePreset("transparent_product", "Transparent Product", 1600, 1600, "PNG", 100, (255, 255, 255), "transparent-product-1600x1600.png", group="Studio", transparent=True, marketplace="Studio", regions=("Global",), background_policy="transparent", max_file_bytes=20 * MB),
}


def get_presets(ids: list[str]) -> list[ImagePreset]:
    return [PRESETS[preset_id] for preset_id in ids if preset_id in PRESETS]

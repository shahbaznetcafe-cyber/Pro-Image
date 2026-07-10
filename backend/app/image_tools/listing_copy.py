def generate_listing_copy(
    *,
    product_name: str,
    brand: str = "",
    category: str = "",
    primary_feature: str = "",
    audience: str = "",
) -> dict[str, object]:
    name = _clean(product_name, 90) or "Product"
    clean_brand = _clean(brand, 50)
    clean_category = _clean(category, 60)
    feature = _clean(primary_feature, 120) or "designed for reliable everyday use"
    clean_audience = _clean(audience, 80) or "everyday buyers"
    branded_name = f"{clean_brand} {name}".strip()
    category_phrase = f" {clean_category}" if clean_category else ""

    titles = [
        branded_name,
        f"{branded_name} - {feature.title()}",
        f"{branded_name}{category_phrase} for {clean_audience.title()}",
    ]
    bullets = [
        feature.capitalize().rstrip(".") + ".",
        f"Made for {clean_audience}.",
        "Clear product presentation for marketplace and catalog listings.",
        "Review size, material, color, and package contents before publishing.",
        "Use accurate product facts to keep the final listing compliant.",
    ]

    return {
        "titles": list(dict.fromkeys(titles)),
        "bullets": bullets,
        "description": (
            f"{branded_name} is {feature}. It is prepared for {clean_audience} and can be "
            "used across marketplace, website, and social catalog listings. Add verified "
            "material, dimensions, warranty, and package details before publishing."
        ),
        "alt_text": f"{branded_name}{category_phrase} product image on a clean background",
        "whatsapp_message": (
            f"Now available: {branded_name}. {feature.capitalize().rstrip('.')}! "
            "Message us for price, availability, and delivery details."
        ),
        "generation_mode": "template_assistant",
    }


def _clean(value: str, limit: int) -> str:
    return " ".join(value.strip().split())[:limit]

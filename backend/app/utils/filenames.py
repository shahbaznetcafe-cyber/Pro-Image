import re


def safe_product_name(value: str | None) -> str:
    if not value:
        return "product"

    cleaned = re.sub(r"[^a-zA-Z0-9_-]+", "-", value.strip().lower())
    cleaned = cleaned.strip("-")
    return cleaned[:60] or "product"

import os
from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class MarketplaceConnector:
    id: str
    label: str
    mode: str
    required_env: tuple[str, ...]
    documentation_url: str


CONNECTORS = {
    item.id: item
    for item in (
        MarketplaceConnector("amazon_sp_api", "Amazon SP-API", "image_handoff", ("AMAZON_SP_API_CLIENT_ID", "AMAZON_SP_API_CLIENT_SECRET", "AMAZON_SP_API_REFRESH_TOKEN"), "https://developer-docs.amazon.com/sp-api/"),
        MarketplaceConnector("walmart_marketplace", "Walmart Marketplace API", "image_handoff", ("WALMART_CLIENT_ID", "WALMART_CLIENT_SECRET"), "https://developer.walmart.com/"),
        MarketplaceConnector("ebay_sell_api", "eBay Sell API", "direct_upload", ("EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET", "EBAY_REFRESH_TOKEN"), "https://developer.ebay.com/api-docs/sell/static/overview.html"),
        MarketplaceConnector("etsy_open_api", "Etsy Open API", "direct_upload", ("ETSY_API_KEY", "ETSY_ACCESS_TOKEN"), "https://developers.etsy.com/documentation/"),
        MarketplaceConnector("shopify_admin_api", "Shopify Admin API", "direct_upload", ("SHOPIFY_STORE_DOMAIN", "SHOPIFY_ADMIN_ACCESS_TOKEN"), "https://shopify.dev/docs/api/admin-graphql"),
        MarketplaceConnector("google_content_api", "Google Merchant API", "feed_handoff", ("GOOGLE_MERCHANT_ID", "GOOGLE_APPLICATION_CREDENTIALS"), "https://developers.google.com/merchant/api"),
        MarketplaceConnector("tiktok_shop_api", "TikTok Shop API", "direct_upload", ("TIKTOK_SHOP_APP_KEY", "TIKTOK_SHOP_APP_SECRET", "TIKTOK_SHOP_ACCESS_TOKEN"), "https://partner.tiktokshop.com/docv2/"),
        MarketplaceConnector("mercadolibre_pictures", "Mercado Libre Pictures API", "direct_upload", ("MERCADOLIBRE_ACCESS_TOKEN",), "https://developers.mercadolibre.com.ar/en_us/products-receive-notifications/pictures"),
        MarketplaceConnector("allegro_rest_api", "Allegro REST API", "direct_upload", ("ALLEGRO_CLIENT_ID", "ALLEGRO_CLIENT_SECRET", "ALLEGRO_ACCESS_TOKEN"), "https://developer.allegro.pl/"),
        MarketplaceConnector("kaufland_seller_api", "Kaufland Seller API", "direct_upload", ("KAUFLAND_CLIENT_KEY", "KAUFLAND_SECRET_KEY"), "https://sellerapi.kaufland.com/"),
        MarketplaceConnector("coupang_open_api", "Coupang Open API", "direct_upload", ("COUPANG_ACCESS_KEY", "COUPANG_SECRET_KEY", "COUPANG_VENDOR_ID"), "https://developers.coupangcorp.com/"),
        MarketplaceConnector("aliexpress_open_platform", "AliExpress Open Platform", "direct_upload", ("ALIEXPRESS_APP_KEY", "ALIEXPRESS_APP_SECRET", "ALIEXPRESS_ACCESS_TOKEN"), "https://openservice.aliexpress.com/"),
        MarketplaceConnector("shopee_open_platform", "Shopee Open Platform", "direct_upload", ("SHOPEE_PARTNER_ID", "SHOPEE_PARTNER_KEY", "SHOPEE_SHOP_ID", "SHOPEE_ACCESS_TOKEN"), "https://open.shopee.com/"),
        MarketplaceConnector("lazada_open_platform", "Lazada Open Platform", "direct_upload", ("LAZADA_APP_KEY", "LAZADA_APP_SECRET", "LAZADA_ACCESS_TOKEN"), "https://open.lazada.com/"),
        MarketplaceConnector("daraz_open_platform", "Daraz Open Platform", "direct_upload", ("DARAZ_APP_KEY", "DARAZ_APP_SECRET", "DARAZ_ACCESS_TOKEN"), "https://open.daraz.com/"),
    )
}


def connector_status(connector: MarketplaceConnector) -> dict[str, object]:
    missing = [name for name in connector.required_env if not os.getenv(name)]
    return {
        **asdict(connector),
        "required_env": list(connector.required_env),
        "configured": not missing,
        "status": "ready" if not missing else "setup_required",
        "missing_env": missing,
    }


def list_connector_statuses() -> list[dict[str, object]]:
    return [connector_status(connector) for connector in CONNECTORS.values()]

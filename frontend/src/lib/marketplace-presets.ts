export type MarketplacePreset = {
  id: string;
  label: string;
  size: string;
  group: "Marketplace" | "Ads" | "Catalog" | "Website" | "Studio";
  description: string;
  regions: string[];
  confidence?: "verified" | "regional" | "provisional";
  popular?: boolean;
};

const marketplace = (
  id: string,
  label: string,
  size: string,
  regions: string[],
  description: string,
  options: Pick<MarketplacePreset, "confidence" | "popular"> = {},
): MarketplacePreset => ({ id, label, size, regions, description, group: "Marketplace", confidence: "verified", ...options });

export const MARKETPLACE_PRESETS: MarketplacePreset[] = [
  marketplace("amazon_main", "Amazon Main", "2000 x 2000 JPG", ["Global", "North America", "Europe", "Asia"], "White main image with 85-95% product fill.", { popular: true }),
  marketplace("walmart_main", "Walmart Main", "2200 x 2200 JPG", ["North America"], "High-resolution white-canvas primary image.", { popular: true }),
  marketplace("ebay_main", "eBay Main", "1600 x 1600 JPG", ["Global", "North America", "Europe", "Asia-Pacific"], "Large square listing image with a clean neutral canvas.", { popular: true }),
  marketplace("etsy_listing", "Etsy Listing", "2000 x 2000 JPG", ["Global", "North America", "Europe"], "High-resolution listing image; contextual backgrounds allowed.", { popular: true }),
  marketplace("shopify_product", "Shopify Product", "2048 x 2048 JPG", ["Global"], "Large storefront product image.", { popular: true }),
  marketplace("google_shopping", "Google Shopping", "1500 x 1500 JPG", ["Global"], "High-resolution shopping-feed product image.", { popular: true }),
  marketplace("tiktok_shop_main", "TikTok Shop Main", "1000 x 1000 JPG", ["North America", "Europe", "Southeast Asia"], "Clean square image for TikTok Shop catalogs.", { popular: true }),
  marketplace("mercadolibre_main", "Mercado Libre Main", "1200 x 1200 JPG", ["Latin America"], "White primary image optimized for Latin American listings.", { popular: true }),
  marketplace("noon_main", "Noon Main", "1200 x 1200 JPG", ["Middle East"], "Marketplace main image; fashion may use light grey."),
  marketplace("allegro_main", "Allegro Main", "2048 x 2048 JPG", ["Europe"], "Large European marketplace listing image."),
  marketplace("kaufland_main", "Kaufland Main", "2048 x 2048 JPG", ["Europe"], "High-resolution Kaufland marketplace image."),
  marketplace("coupang_main", "Coupang Main", "1000 x 1000 JPG", ["South Korea"], "Compressed primary image for Coupang."),
  marketplace("aliexpress_square", "AliExpress Square", "800 x 800 JPG", ["Global", "Asia", "Europe"], "Compact square product image."),
  marketplace("aliexpress_portrait", "AliExpress Portrait", "750 x 1000 JPG", ["Global", "Asia", "Europe"], "Portrait gallery image for supported categories."),
  marketplace("zalando_packshot", "Zalando Packshot", "1801 x 2600 JPG", ["Europe"], "Portrait fashion packshot; category review required."),
  marketplace("shopee_main", "Shopee Main", "1024 x 1024 JPG", ["Southeast Asia", "Latin America"], "Regional square marketplace image.", { confidence: "regional" }),
  marketplace("lazada_main", "Lazada Main", "1000 x 1000 JPG", ["Southeast Asia"], "Regional square catalog image.", { confidence: "regional" }),
  marketplace("daraz_square", "Daraz Product", "1000 x 1000 JPG", ["South Asia"], "Seller Center category rules require confirmation.", { confidence: "provisional" }),
  { id: "meta_square", label: "Meta Feed", size: "1080 x 1080 JPG", group: "Ads", description: "Facebook and Instagram square creative.", regions: ["Global"] },
  { id: "meta_portrait", label: "Instagram Portrait", size: "1080 x 1350 JPG", group: "Ads", description: "Vertical 4:5 ad and feed image.", regions: ["Global"] },
  { id: "story_reel", label: "Story/Reel", size: "1080 x 1920 JPG", group: "Ads", description: "Full-screen story and reel creative.", regions: ["Global"] },
  { id: "tiktok_square", label: "TikTok Square", size: "640 x 640 JPG", group: "Ads", description: "Square TikTok image ad output.", regions: ["Global"] },
  { id: "tiktok_horizontal", label: "TikTok Horizontal", size: "1200 x 628 JPG", group: "Ads", description: "Horizontal TikTok image ad output.", regions: ["Global"] },
  { id: "tiktok_vertical", label: "TikTok Vertical", size: "720 x 1280 JPG", group: "Ads", description: "Vertical TikTok image ad output.", regions: ["Global"] },
  { id: "whatsapp_catalog", label: "WhatsApp Catalog", size: "1000 x 1000 JPG", group: "Catalog", description: "Compressed catalog-ready product image.", regions: ["Global"] },
  { id: "website_webp", label: "Website WebP", size: "1600 x 1600 WebP", group: "Website", description: "Optimized product image for websites.", regions: ["Global"] },
  { id: "transparent_product", label: "Transparent Product", size: "1600 x 1600 PNG", group: "Studio", description: "Transparent master product cutout.", regions: ["Global"] },
];

export const MARKETPLACE_REGIONS = ["All regions", "Global", "North America", "Latin America", "Europe", "Middle East", "South Asia", "Southeast Asia", "Asia", "Asia-Pacific", "South Korea"];

export const POPULAR_STUDIO_PRESETS = MARKETPLACE_PRESETS.filter(
  (preset) => preset.popular || ["daraz_square", "transparent_product", "website_webp"].includes(preset.id),
);

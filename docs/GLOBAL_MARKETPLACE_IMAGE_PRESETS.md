# Global Marketplace Image Preset Research

Verified: 2026-07-12

This document defines marketplace image profiles for SBZ SellImage Pro. A
marketplace profile is more than a canvas size: it includes format, maximum file
size, background policy, product fill, image count, and category exceptions.

## Confidence Levels

- `verified`: backed by a current official seller, help, or developer page.
- `provisional`: useful target, but the marketplace does not expose a complete
  current public policy. Do not advertise these as guaranteed-compliant.
- `category-specific`: the marketplace applies different rules by category.

## Recommended Presets

| Preset ID | Marketplace / region | Export target | Format | Main-image policy | Limits and notes | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
| `amazon_main` | Amazon, global | 2000 x 2000 | JPG | Pure white, product 85%+, no text/logo/watermark | 1000px+ enables zoom; max longest side 10000px; category exceptions | verified, category-specific |
| `walmart_main` | Walmart, US/CA/MX/CL | 2200 x 2200 | JPG | Seamless RGB 255 white, frontal, no overlays | 1:1; 5MB max; 1500 x 1500 minimum for zoom | verified |
| `ebay_main` | eBay, global | 1600 x 1600 | JPG | Neutral background, full product, no borders/text/watermarks | 500px minimum; 12MB max; 1:1 or 16:9 work best | verified |
| `etsy_listing` | Etsy, global | 2000 x 2000 | JPG | Accurate product image; preserve consistent first-image crop | Etsy recommends width and height of at least 2000px | verified |
| `google_shopping` | Google Merchant Center, global | 1500 x 1500 | JPG | Minimal staging, no promotional overlays, borders, or watermarks | 500 x 500 minimum begins 2027-01-31; 64MP/16MB max; 75-90% fill | verified |
| `tiktok_shop_main` | TikTok Shop | 1000 x 1000 | JPG | Pure white main image, front view, no text/logo/border/watermark | 600 x 600 minimum; 1:1; up to 9 images; use 5MB conservative cap | verified |
| `shopify_product` | Shopify storefronts | 2048 x 2048 | JPG | Theme-dependent; keep featured images at one consistent ratio | 5000 x 5000 or 25MP max; under 20MB | verified |
| `aliexpress_square` | AliExpress, global | 800 x 800 | JPG | White/solid consistent background; product 70%+ | 5MB max; up to 6 legacy main images; avoid promo labels | verified |
| `aliexpress_portrait` | AliExpress marketing | 750 x 1000 | JPG | 3:4 vertical marketing image | API specifies at least 750 x 1000 | verified |
| `mercadolibre_main` | Mercado Libre, Latin America | 1200 x 1200 | JPG | RGB; product target about 95%; smart-crop aware | 500 x 500 min, 1920 x 1920 max, 10MB max; zoom above 800px | verified |
| `noon_main` | noon, Middle East | 1200 x 1200 | JPG | Pure white except fashion light grey; front view; light shadow only | Width 660px+; aspect width/height >= 0.5; 10MB max; 70-80% fill | verified, category-specific |
| `allegro_main` | Allegro, Central Europe | 2048 x 2048 | JPG | White background recommended; no seller text/logo | 500px min longest side; 2560 x 2560 display max; 26MP max | verified |
| `kaufland_main` | Kaufland Global Marketplace, Europe | 2048 x 2048 | JPG | White, full product, no collage, shadow, text, logo, or promo | 1024px standard; 2048px zoom; 10MB max; 5-10 images; alt text required | verified |
| `coupang_main` | Coupang, South Korea | 1000 x 1000 | JPG | Square representative image | 500 x 500 min, 5000 x 5000 max, 3MB max; up to 9 detail images | verified |
| `zalando_packshot` | Zalando, Europe | 1801 x 2600 | JPG | Upright 1:1.44; primary packshot white; category-specific positioning | 762 x 1100 min; 20MB max; designer minimum 1800 x 2600 | verified, category-specific |
| `shopee_main` | Shopee, Southeast Asia/LatAm | 1024 x 1024 | JPG | White/solid cover, full product, no distracting watermark | Current Brazil guidance recommends 1:1 1024; Mall rules target 60%+ fill | verified, regional |
| `lazada_main` | Lazada, Southeast Asia | 1000 x 1000 | JPG | Clean square main image; validate category rules in Seller Center | API accepts 330-5000px, JPG/PNG, 3MB max, up to 8 unique images | verified technical, provisional style |
| `daraz_main` | Daraz, South Asia | 1000 x 1000 | JPG | White square main-image target | Current public official technical policy was not found; retain as provisional | provisional |

## Official Sources

- Amazon: [Sell on Amazon image practices](https://sell.amazon.com/blog/amazon-seo) and [official category image guide](https://images-na.ssl-images-amazon.com/images/G/01/rainier/help/Home_Garden_and_Pets-Style_Guide.pdf)
- Walmart: [Marketplace item image specification](https://developer.walmart.com/ca-marketplace/docs/set-up-item-add-your-items-from-walmarts-catalog) and [content policy PDF](https://marketplace.walmart.com/wp-content/uploads/2019/06/walmart-marketplace-quickstart-item-setup-content-policies.pdf)
- eBay: [Adding pictures](https://www.ebay.com/help/selling/listings/taking-photos-your-listings?id=4148) and [picture policy](https://www.ebay.com/help/listing-policies/policies/picture-policy?id=4370)
- Etsy: [Image requirements and best practices](https://help.etsy.com/hc/en-gb/articles/115015663347-Requirements-and-Best-Practices-for-Images-in-Your-Etsy-Shop)
- Google: [Merchant Center image link specification](https://support.google.com/merchants/answer/6324350?hl=en-GB)
- TikTok Shop: [Product Listing Policy](https://seller-us.tiktok.com/university/essay?knowledge_id=3196690250417921)
- Shopify: [Product media types](https://help.shopify.com/en/manual/products/product-media/product-media-types)
- AliExpress: [Open Platform product image fields](https://open.alitrip.com/docs/api.htm?apiId=30197&scopeId=12781)
- Mercado Libre: [Pictures API and requirements](https://global-selling.mercadolibre.com/devsite/pictures)
- noon: [Seller SKU image requirements](https://helpcenter.noon.partners/en/category/product-listing/image-requirements-and-rejection-reasons-for-the-seller-sku)
- Allegro: [Rules for images](https://help.allegro.com/en/sell//c/rules-for-images)
- Kaufland: [Product data image guidelines](https://www.kauflandglobalmarketplace.com/en/seller-university/selling/product-data/product-data-guideline/)
- Coupang: [Product Creation API](https://developers.coupangcorp.com/hc/en-us/articles/360033877853-Product-Creation)
- Zalando: [Image guide and technical requirements](https://partner.zalando.com/university/article/electronics-image-guide)
- Shopee: [Current product-page image guidance](https://ads.shopee.com.br/learn/faq/323/1462) and [Seller Education Mall guide](https://cdngarenanow-a.akamaihd.net/shopee/seller/seller_cms/b71e298c6c220f22ef6f08608dbe1bd8/Mall%20Listing%20Guidelines.pdf)
- Lazada: [Image Upload API requirements](https://open.lazada.com/apps/doc/doc?docId=120947&nodeId=30718)

## Profiles Not Ready For Guaranteed Presets

Do not ship a `verified` badge yet for Meta Catalog/Marketplace, Temu, Flipkart,
Myntra, Rakuten Japan, Yahoo Shopping Japan, JD, Taobao, OTTO, Cdiscount, or
Wayfair. Their current public product-image specifications are incomplete,
login-gated, category-controlled, or not exposed consistently by region.

These can use a generic export only:

- `global_square_2000`: 2000 x 2000 JPG, white background, 80-85% fill.
- `global_square_1200`: 1200 x 1200 JPG, white background, 75-85% fill.
- `global_portrait_3_4`: 1500 x 2000 JPG, neutral background.

The UI must label these `Universal`, not marketplace-compliant.

## Required Preset Model Upgrade

The current `ImagePreset` only stores output dimensions and encoding. Add:

```text
marketplace
regions
role                    # main, gallery, portrait, ads, transparent
min_width / min_height
max_width / max_height
max_megapixels
max_file_bytes
allowed_formats
aspect_ratio
background_policy       # pure_white, light_neutral, any, transparent
fill_min / fill_max
allow_shadow
max_images
recommended_images
source_url
source_checked_at
confidence              # verified, provisional, category_specific
policy_version
```

## Quality Gate Changes

1. Validate final output against the selected profile, not a shared generic gate.
2. Block upscaling when the source lacks the marketplace minimum resolution.
3. Check exact white corners for pure-white main-image policies.
4. Use marketplace-specific fill bands: Amazon 85%+, Google 75-90%, noon
   70-80%, Mercado Libre about 95%, Shopee Mall 60%+.
5. Enforce JPEG-only profiles such as noon and Zalando.
6. Estimate encoded bytes before export and reduce JPEG quality only within a
   policy-safe floor.
7. Separate `TikTok Shop` from existing TikTok ad/social presets.
8. Show category warnings for fashion, children, electronics, jewelry, bundles,
   and used goods.
9. Store source URL and verification date in every profile so policy changes can
   be audited.

## Integration Order

### Phase A - Verified Export Profiles

Add Amazon, Walmart, eBay, Etsy, Google Shopping, TikTok Shop, Shopify,
Mercado Libre, noon, Allegro, Kaufland, and Coupang. These are high-value and fit
the existing square-image processor.

### Phase B - Special Canvas Profiles

Add AliExpress portrait and Zalando packshot. These need stronger portrait crop
logic and category-aware safe zones. Add Shopee and Lazada with regional labels.

### Phase C - Marketplace Connectors

Start with export ZIPs and feed-ready filenames. Direct publishing requires each
seller's OAuth/API approval and must be a separate connector layer. Strong API
candidates are Amazon SP-API, Walmart Marketplace API, Mercado Libre Pictures
API, Lazada UploadImage, and Coupang Open API.

## Product UI Recommendation

- Default view: `Popular` presets, no more than 8 cards.
- Filters: `North America`, `Europe`, `Asia`, `Middle East`, `Latin America`,
  `Global commerce`.
- Each card shows dimensions, main-image role, verified date, and a compliance
  badge.
- A marketplace can expose multiple roles without duplicating its name:
  `Main`, `Gallery`, `Portrait`, and `Ads`.
- Saved packs should store preset IDs plus policy versions so old jobs remain
  reproducible after a marketplace rule changes.

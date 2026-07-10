# SBZ SellImage Pro API

Phase 6 adds a versioned integration API for plugins, scripts, and future Shopify/WordPress/Chrome integrations.

Base URL:

```text
http://localhost:8000/api/v1
```

## Authentication

Set one or more API keys:

```text
SBZ_API_KEYS=key-one,key-two
```

Send either header:

```text
X-API-Key: key-one
```

or:

```text
Authorization: Bearer key-one
```

If `SBZ_API_KEYS` is empty, API-key checks are disabled for local development.

## Endpoints

### GET /api/v1/status

Returns API status and version.

### POST /api/v1/analyze-images

Analyze image quality for blur, background, centering, fill, size, title suggestions,
and platform compliance. The response includes Amazon, Google Shopping, Daraz,
and TikTok checks plus recommended correction actions.

Form data:

```text
files  one or more JPG/PNG/WebP files
```

### POST /api/v1/seller-pack

Generate a ZIP seller image pack.

Form data:

```text
files        one or more JPG/PNG/WebP files
preset_ids   comma-separated preset IDs
project_name optional folder name
cleanup_background optional true/false
smart_center       optional true/false
add_shadow         optional true/false
subject_fill_percent optional 65-92
strict_quality       optional true/false
```

Example:

```powershell
curl.exe -X POST "http://localhost:8000/api/v1/seller-pack" `
  -H "X-API-Key: dev-api-key-change-me" `
  -F "files=@product.jpg" `
  -F "preset_ids=amazon_main,shopify_product,website_webp" `
  -F "project_name=client-catalog" `
  -F "cleanup_background=true" `
  -F "smart_center=true" `
  -F "add_shadow=true" `
  --output client-catalog.zip
```

### POST /api/v1/resize

Alias for `/api/v1/seller-pack`.

## Seller Studio Tool Endpoints

The first-party frontend also uses these public tool routes:

```text
GET  /tools/presets
POST /tools/analyze-images
POST /tools/preview-seller-studio
POST /tools/generate-seller-pack
POST /tools/generate-listing-copy
```

When Supabase SaaS enforcement is configured, ZIP generation requires the signed-in
user access token:

```text
Authorization: Bearer <supabase-access-token>
```

Protected routes:

```text
POST /tools/generate-seller-pack
POST /tools/generate-batch-seller-pack
```

Public first-party routes remain available for preset discovery, analysis,
generated-output preview, and listing-copy drafting. Successful ZIP responses
include `X-SBZ-Plan`, `X-SBZ-Monthly-Limit`, `X-SBZ-Monthly-Used`, and
`X-SBZ-Monthly-Remaining` headers.

Phase 7 preset IDs:

```text
daraz_square
google_shopping
tiktok_square
tiktok_horizontal
tiktok_vertical
transparent_product
```

### POST /tools/preview-seller-studio

Generates temporary preview thumbnails and runs quality control on the final
processed outputs. The response includes pass/warning/fail counts,
`can_download`, preview data URLs, and detailed checks for every preset.

When `strict_quality=true` is sent to a seller-pack endpoint, the API returns
`422` instead of a ZIP if any generated output fails quality control.

## Observability

```text
GET /health
GET /metrics
```

`/metrics` returns in-memory request counts, status counts, top paths, and average latency.

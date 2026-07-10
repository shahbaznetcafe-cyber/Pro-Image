# SBZ SellImage Pro

Seller-focused marketplace image preparation SaaS.

Current active phase:

```text
Phase 7.2: Output Quality Gate
```

## Project Structure

```text
frontend/   Next.js App Router UI
backend/    FastAPI image processing API
docs/       Product and implementation notes
PHASES.md   Work phases
mainfest.md Product manifest
```

## Run Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Health check:

```text
http://localhost:8000/health
```

## Run Frontend

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open:

```text
http://localhost:3000
```

## Phase 1 API

```text
GET  /health
GET  /tools/presets
POST /tools/generate-seller-pack
POST /tools/generate-batch-seller-pack
POST /tools/analyze-images
POST /tools/preview-seller-studio
POST /tools/generate-listing-copy
GET  /api/v1/status
POST /api/v1/analyze-images
POST /api/v1/seller-pack
POST /api/v1/resize
```

The backend processes files in memory and writes only a temporary ZIP for download. Uploaded product images are not permanently stored.

## Phase 2 SaaS Setup

Create `frontend/.env.local`:

```powershell
Copy-Item frontend\.env.example frontend\.env.local
```

Then add your Supabase project URL and publishable key.

Run the schema in:

```text
docs/supabase-schema.sql
```

Phase 2 pages:

```text
/login
/dashboard
/dashboard/jobs
/dashboard/billing
/pricing
```

Supabase Auth is wired with cookie-based SSR. Dashboard routes are protected when Supabase env vars are configured.

## Phase 3 Operator Workflow

The homepage now supports:

- Multiple image upload
- Project/client folder naming
- Batch ZIP generation
- Per-product folders inside the ZIP
- `report.json` with product/output metadata
- Quick preset buttons
- Saved preset combinations in browser local storage
- Logged-in usage metadata for batch jobs

Batch endpoint form fields:

```text
files       multiple JPG/PNG/WebP files
preset_ids  comma-separated preset IDs
project_name optional client/project folder name
```

## Phase 4 SEO Pages

Public long-tail pages are generated from `frontend/src/lib/seo-pages.ts`.

Live routes:

```text
/marketplace-image-resizer
/amazon-product-image-resizer
/etsy-listing-image-resizer
/shopify-product-image-resizer
/facebook-ad-image-resizer
/instagram-ad-image-resizer
/whatsapp-catalog-image-resizer
/product-photo-compressor
/bulk-product-image-resizer
/website-image-optimizer
/convert-product-image-to-webp
```

SEO support:

```text
/sitemap.xml
/robots.txt
```

Set `NEXT_PUBLIC_SITE_URL` in production so sitemap URLs use the real domain.

## Phase 5 Quality Assistant

The app now includes a local, low-cost quality assistant. It does not call an
external AI model yet, so it is safe for the MVP budget.

Checks:

- Image dimensions
- Sharpness/blur risk
- Background whiteness warning
- Product centering score
- Product fill percentage
- Overall quality score
- Filename-based title suggestions
- Recommended preset hints

Endpoint:

```text
POST /tools/analyze-images
```

Form fields:

```text
files multiple JPG/PNG/WebP files
```

Later AI upgrades can add real background removal, smart product masking, and
AI-generated titles/descriptions.

## Phase 6 Integrations And Scale

New integration surface:

```text
/api-docs
GET  /api/v1/status
POST /api/v1/analyze-images
POST /api/v1/seller-pack
POST /api/v1/resize
GET  /metrics
GET  /ready
```

Docs:

```text
docs/API.md
docs/DEPLOYMENT.md
```

Deployment artifacts:

```text
backend/Dockerfile
frontend/Dockerfile
docker-compose.yml
```

## Launch Hardening

Launch readiness routes and docs:

```text
/launch-checklist
GET /ready
docs/LAUNCH_CHECKLIST.md
docs/supabase-admin.sql
frontend/.env.production.example
backend/.env.production.example
```

Use `/ready` before deploy/live testing. In production it checks:

- `APP_ENV=production`
- API keys are configured
- CORS origins are configured
- localhost is not present in production CORS
- temporary storage is writable

## Phase 7 Seller Studio

Open:

```text
/seller-studio
```

The Seller Studio supports:

- Smart cleanup for plain, neutral, and fake-checkerboard backgrounds
- Product centering and normalized canvas fill
- Optional natural shadow on white outputs
- Transparent PNG product master
- Daraz, Google Shopping, and TikTok presets
- Amazon, Google Shopping, Daraz, and TikTok compliance cards
- Recommended correction actions
- Template-based title, bullets, description, alt text, and WhatsApp copy

New processing form fields for seller-pack endpoints:

```text
cleanup_background true/false
smart_center       true/false
add_shadow         true/false
```

Background cleanup now preserves clean source alpha, isolates the largest central
subject on neutral/checkerboard backgrounds, removes disconnected artifacts, and
falls back to corner-color cleanup. Complex photographic scenes still need a
future model-based remover.

## Phase 7.2 Output Quality Gate

Seller Studio now requires a generated-output preview before ZIP download.

- Final processed files are checked, not only the source image
- Preview cards show every generated marketplace output
- Per-output pass, warning, fail, score, and detailed checks
- Dimensions, format, fill, clipping, background, artifacts, transparency, and halo checks
- Adjustable product-fill target from 65% to 92%
- Failed output blocks strict ZIP delivery
- `report.json` contains quality results for every output

New form fields:

```text
subject_fill_percent 65-92, default 84
strict_quality       true/false
```

## Phase 8 Real SaaS Activation

The local app is connected to the active Supabase project. Product data uses
isolated tables so pre-existing project records are not changed:

```text
seller_profiles
seller_image_jobs
seller_usage_logs
seller_payment_requests
seller_subscriptions
```

Generated seller-pack routes require a valid Supabase access token when the
backend has `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` configured. The public
quality preview remains available before login.

Plan limits are enforced atomically in `seller_reserve_usage`:

```text
Free     5/day, 150/month, 1 image/batch
Starter  500/month, 10 images/batch
Pro      3000/month, 30 images/batch
Agency   10000/month, 100 images/batch
```

Usage is consumed when processing starts, including failed processing attempts.
This prevents clients from releasing or rewriting their own quota records.

Manual payment approvals are available at:

```text
/dashboard/admin/payments
```

After creating the owner account through `/login`, run the one-time statement in
`docs/supabase-admin.sql` with the real owner email. Approval and rejection then
run through protected database functions with an internal admin check.

Before a production preview, `GET /ready` also checks that the seller tables and
protected payment/quota RPCs are visible through Supabase PostgREST. Use the
owner bootstrap sequence in `docs/LAUNCH_CHECKLIST.md`, then perform the live
paid-user smoke test with a separate seller account.

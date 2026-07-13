# SBZ SellImage Pro - Product Manifest

## Final Recommendation

SBZ SellImage Pro ko normal image compressor/resizer ki tarah position nahi karna. Isay ek Marketplace Image Preparation SaaS banana hai.

Core promise:

```text
Upload once. Download ready-to-upload image packs for marketplaces, ads, catalogs, and websites.
```

Roman Urdu positioning:

```text
Product photo upload karo, tool automatic Amazon, Etsy, Shopify, Facebook, Instagram, WhatsApp aur website ke liye ready image pack bana dega.
```

## Why This Idea Works

Generic image compressor market bohat crowded hai. TinyPNG, Squoosh, iLoveIMG, Adobe aur bohat se free tools already available hain.

SBZ SellImage Pro ka edge yeh hai ke yeh sirf file chhoti nahi karega. Yeh seller ke liye complete upload-ready image pack banayega:

- Amazon product image
- Etsy listing image
- Shopify product image
- Meta ads image sizes
- Instagram feed, portrait, story/reel
- WhatsApp catalog image
- Website WebP/JPG optimized image
- ZIP download with clean file names

## Target Customers

Paying audience:

| Customer | Reason to Pay |
| --- | --- |
| Amazon/Etsy/Shopify sellers | Product listing images fast ready karni hoti hain |
| Instagram/Facebook sellers | Har product ki catalog/ad image chahiye hoti hai |
| Net cafes | Local customers ke ecommerce/document/ad ka kaam kar sakte hain |
| Social media agencies | Client images multiple sizes mein chahiye hoti hain |
| Daraz/local ecommerce sellers | Product photos standardize karni hoti hain |
| Boutiques/cosmetic/mobile shops | WhatsApp catalog + FB ad images roz chahiye hoti hain |

Avoid:

- School/free-only users
- Generic compressor-only audience
- Heavy AI background removal from day one

## Killer Feature

### One-Click Seller Image Pack

User image upload kare, platforms select kare, aur tool complete ZIP generate kare.

Example output:

```text
/product-name/
  amazon-main-2000x2000.jpg
  shopify-product-2048x2048.jpg
  meta-feed-1080x1080.jpg
  meta-vertical-1080x1350.jpg
  story-reel-1080x1920.jpg
  whatsapp-catalog-1000x1000.jpg
  website-product.webp
  website-product.jpg
  report.json
```

This is the main paid feature. Is feature ki wajah se product normal compressor se different banega.

## MVP Scope

MVP ko lean rakhna hai. Pehle earning ke qareeb features build karne hain.

### Must Have

- Public homepage
- Single image upload
- Platform preset selection
- Marketplace image pack generator
- Meta ads image pack
- Website optimized image pack
- JPG, PNG, WebP conversion
- Resize to exact dimensions
- Compress image
- Before/after file size summary
- ZIP download
- Basic usage limits
- Login/register
- Pricing page
- Manual payment activation

### Should Have After MVP

- Batch upload
- Saved presets
- Job history metadata
- Custom watermark/logo
- Client/project folders
- Admin panel

### Later

- AI background cleanup
- Product centering
- Blur detection
- Quality score
- PDF report
- API access
- WordPress plugin
- Shopify app
- Chrome extension

## Free vs Paid

### Free Plan

- 5 images/day
- Single image upload
- Compress
- Resize
- Convert to JPG/WebP
- Watermark: "Made with SBZ SellImage Pro"
- No batch processing
- No ZIP pack, or limited ZIP pack

### Starter

- $6.99/month
- 300 source images/month
- ZIP download
- No watermark

### Pro

- $14.99/month
- 1500 source images/month
- Batch processing
- All marketplace packs

### Agency

- $34.99/month
- 5000 source images/month
- Branding
- Saved client presets

Launch offer wording should be clear:

```text
International launch pricing: $6.99 Starter, $14.99 Pro, and $34.99 Agency.
```

Avoid confusing lifetime pricing; use clear monthly USD pricing and time-bound promotions.

## Presets

### Marketplace Presets

| Preset | Output |
| --- | --- |
| Amazon Main | 2000x2000 JPG, white canvas/padding |
| Etsy Listing | 2000x2000 JPG |
| Shopify Product | 2048x2048 JPG/WebP |
| Facebook Feed | 1080x1080 JPG |
| Instagram Feed | 1080x1080 JPG |
| Instagram Portrait | 1080x1350 JPG |
| Story/Reel | 1080x1920 JPG |
| WhatsApp Catalog | 1000x1000 compressed JPG |
| Website Product | WebP + optimized JPG |

Important note:

White canvas/padding is not the same as true background removal. Amazon-style white background compliance is only guaranteed when source image already has clean/transparent background or when background removal is added later.

## Compliance Checker

MVP checker should be simple:

- Width/height pass/fail
- File size pass/fail
- Format pass/fail
- Aspect ratio pass/fail
- Warning for non-square image
- Warning if image is too small

Example:

```text
Amazon: Pass
Shopify: Pass
Meta Ads: Needs 4:5 crop
Website: WebP recommended
```

## Recommended Tech Stack

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- Responsive dashboard UI

### Backend

- FastAPI Python
- Pillow
- pillow-avif-plugin later
- zipfile
- Temporary file processing

### Auth and Database

- Supabase Auth
- Supabase PostgreSQL
- profiles table linked to Supabase auth.users
- Store metadata only
- Do not permanently store uploaded product images

### Deployment

- Frontend: Vercel
- Backend: Render or Railway
- Database: Supabase
- Payments first: manual PayPal/Wise/Bank transfer

## Recommended Database Tables

### profiles

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  business_name TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### image_jobs

```sql
CREATE TABLE image_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  original_filename TEXT,
  original_size_kb INTEGER,
  output_count INTEGER DEFAULT 0,
  total_output_size_kb INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### usage_logs

```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  file_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### subscriptions

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  start_date TIMESTAMP DEFAULT NOW(),
  end_date TIMESTAMP
);
```

## Backend API

```text
POST /tools/compress-image
POST /tools/resize-image
POST /tools/convert-image
POST /tools/generate-marketplace-pack
POST /tools/generate-ad-pack
POST /tools/generate-website-pack

GET  /jobs
GET  /jobs/stats
DELETE /jobs/:id

GET  /subscription/plan
POST /subscription/manual-activate
```

If Supabase Auth is used, custom `/auth/register` and `/auth/login` routes are not required in FastAPI.

## Processing Logic

### Compress to Target KB

```text
1. Validate file type and file size.
2. Open image with Pillow.
3. Normalize orientation using EXIF transpose.
4. Convert RGBA to RGB when output is JPG.
5. Resize if requested.
6. Save at quality 90.
7. Check file size.
8. Reduce quality step by step.
9. If still too large, reduce dimensions slightly.
10. Return final file.
```

### Marketplace Pack

```text
1. User uploads image.
2. User selects platforms.
3. Backend loads platform presets.
4. For each preset:
   - apply crop or padding
   - resize to exact dimensions
   - apply white/custom canvas if needed
   - convert format
   - compress
   - save output in temporary folder
5. Generate ZIP.
6. Return download link or file response.
7. Delete temporary files after expiry.
```

## Security Rules

- Validate MIME type and extension.
- Validate actual image content with Pillow.
- Set max file size.
- Use temporary folders.
- Delete uploaded and processed files.
- Do not permanently store user images.
- Store metadata only.
- Prevent path traversal.
- Sanitize output file names.
- Add rate limits.
- Add per-plan usage limits.
- Reject decompression-bomb images.
- Use HTTPS in production.

## MVP Pages

### Public

- Homepage
- Marketplace Image Pack Generator
- Image Compressor
- Meta Ads Image Resizer
- Website Image Optimizer
- Pricing
- Login/Register

### Dashboard

- Overview
- New Image Job
- Job History
- Billing/manual payment
- Settings

Saved presets and client folders can come later.

## SEO Strategy

Avoid direct fight on generic "image compressor".

Use long-tail pages:

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

Blog ideas:

```text
Amazon product image size guide
Etsy listing photo size guide
Shopify product image size guide
Facebook ad image size guide
How to make product photos ready for WhatsApp catalog
How to compress product images without losing quality
WebP vs JPG for ecommerce product images
```

## Launch Plan

### Phase 1: Core Tool

- Upload UI
- Preset cards
- Marketplace pack generation
- Meta pack generation
- Website WebP/JPG optimization
- ZIP download

### Phase 2: SaaS Layer

- Supabase Auth
- Dashboard
- Usage limits
- Job history metadata
- Pricing page
- Manual payment activation

### Phase 3: Launch

- Use Shahbaz Netcafe workflow as first real test case
- Demo videos
- Facebook posts
- WhatsApp groups
- Direct contact with sellers, net cafes, and agencies
- First 20 users free trial
- First 50 users locked-price offer

## Final Build Order

1. Build SBZ SellImage Pro MVP.
2. Build Marketplace Image Pack.
3. Add Meta Ad Image Pack.
4. Add WhatsApp Catalog Pack.
5. Add Website WebP/JPG Optimizer.
6. Add ZIP download.
7. Add login and usage limits.
8. Add manual payment activation.
9. Launch to sellers, net cafes, and agencies.
10. Add SEO pages.
11. Add batch processing.
12. Add AI/background tools later.

## Final Decision

This idea should be built as a seller-focused workflow SaaS, not as a generic image compressor.

The first version should do one thing very well:

```text
Turn one product photo into a ready-to-upload seller image pack.
```

Everything else should support that core workflow.

## Phase 7 Product Direction

Seller Studio expands the core promise without turning the product into a
generic photo editor:

```text
Clean photo -> check platform readiness -> export seller pack -> prepare listing draft
```

Implemented foundation:

- Plain-background cleanup with transparent PNG output
- Smart product centering and optional natural shadow
- Daraz, Google Shopping, and TikTok export presets
- Amazon, Google Shopping, Daraz, and TikTok compliance report
- Rule-based recommended actions
- Template-based product listing copy assistant
- Dedicated `/seller-studio` page

Future model-based background removal should be added behind a provider adapter.
The current local cleanup remains the low-cost fallback for simple backgrounds.

## Phase 7.2 Quality Gate

The product validates what it actually delivers, not only the uploaded source:

```text
Configure -> generate previews -> validate final outputs -> unlock ZIP
```

Failed dimensions, format, product fill, clipping, canvas background,
transparency, halo, or detached-artifact checks block strict Seller Studio ZIPs.

## Phase 8 SaaS Activation

The SaaS layer is now active against the Supabase `Imageresizer` project without
overwriting its existing application tables. All new product data is namespaced
with `seller_*`.

Implemented flow:

```text
Signup -> seller profile trigger -> authenticated generation request
       -> atomic plan/quota check -> server-owned usage/job record -> ZIP

Payment request -> admin review -> atomic approval
                -> plan update + 30-day subscription
```

Security decisions:

- New account passwords require at least 8 characters, one lowercase letter,
  one uppercase letter, and one digit.
- Every seller table has RLS and explicit grants.
- Normal users cannot update `plan`, `is_admin`, review fields, or usage rows.
- Admin RPCs validate `seller_profiles.is_admin` inside the transaction.
- Quota is consumed at processing start and cannot be released by the browser.
- Backend production readiness fails when Supabase enforcement is missing.

Next phase:

```text
Owner signup -> one-time admin bootstrap -> production preview deploy -> live paid-user smoke test
```

## Phase 8.1 Production Preflight

Before deployment, `/ready` now performs read-only endpoint checks for all
`seller_*` tables and protected quota/payment RPCs. This catches an incomplete
Supabase schema before owner onboarding or paid-user testing begins.

The remaining launch action is operational: create the owner account, run the
one-time bootstrap SQL, deploy the preview, and test payment approval with a
separate seller account.

## Output Polish Pass

Seller Studio now includes a restrained Light polish option that applies subtle
color, contrast, and sharpness enhancement while preserving transparency. The
same option is used by preview, single-pack, and batch-pack generation. The
checkerboard cleanup regression test confirms marketplace outputs use a real
white canvas instead of baked checkerboard pixels.

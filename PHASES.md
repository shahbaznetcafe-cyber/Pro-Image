# SBZ SellImage Pro - Work Phases

## Phase 1: Core Seller Pack MVP

Goal: One product image upload ho aur user ready-to-upload ZIP download kar sake.

Scope:

- Frontend app skeleton
- Backend API skeleton
- Single image upload
- Platform preset cards
- Marketplace pack generation
- Meta ads pack generation
- Website optimized JPG/WebP generation
- ZIP download
- Before/after file size summary
- Temporary file handling

Success criteria:

- User image select kare.
- User Amazon/Shopify/Meta/WhatsApp/Website presets choose kare.
- Backend multiple resized/compressed files generate kare.
- User ZIP download kar sake.

## Phase 2: SaaS Layer

Goal: Tool ko paid SaaS workflow mein convert karna.

Scope:

- Supabase Auth
- Dashboard
- Job history metadata
- Usage logs
- Free/Starter/Pro/Agency plan limits
- Manual payment activation
- Pricing page completion

Success criteria:

- Free users limited usage kar sakein.
- Paid plans higher limits unlock karein.
- Admin manually plan activate kar sake.

## Phase 3: Batch and Operator Workflow

Goal: Net cafes, agencies aur sellers ke liye high-volume workflow improve karna.

Scope:

- Batch upload
- Batch ZIP output
- Client/project folders
- Saved presets
- Custom logo/watermark
- Cleaner output naming
- Better progress states

Success criteria:

- 20-100 images process ho sakein.
- Agency/net cafe client-wise output manage kar sake.

## Phase 4: SEO and Public Tools

Goal: Organic traffic capture karna.

Scope:

- Amazon product image resizer page
- Etsy listing image resizer page
- Shopify product image resizer page
- Facebook/Instagram ad image resizer pages
- WhatsApp catalog image resizer page
- Website WebP optimizer page
- Blog/guide pages

Success criteria:

- Long-tail SEO pages live hon.
- Public tools visitors ko core paid seller pack flow ki taraf guide karein.

## Phase 5: AI and Advanced Automation

Goal: Premium value add karna.

Scope:

- Background cleanup
- Product centering
- Blur detection
- Image quality score
- Smart crop
- Auto title/alt text suggestions
- PDF report

Success criteria:

- Pro/Agency users ko advanced image preparation features milen.

## Phase 6: Integrations and Scale

Goal: Product ko platform ecosystem tak expand karna.

Scope:

- API access
- WordPress plugin
- Shopify app
- Chrome extension
- Queue-based processing
- Object storage for short-lived outputs
- Observability and alerts

Success criteria:

- Developers/agencies API use kar sakein.
- Processing higher volume safely handle kare.

## Phase 7: Seller Studio and Compliance

Goal: Product photo ko clean, normalize, validate, aur new sales channels ke liye export karna.

Scope:

- Smart plain/checkerboard background cleanup
- Largest central subject isolation and disconnected artifact removal
- Enforced 84% product fill after cleanup
- Product centering and normalized fill
- Optional natural shadow
- Transparent PNG master output
- Daraz product preset
- Google Shopping preset
- TikTok square, horizontal, and vertical presets
- Platform-by-platform compliance report
- Recommended correction actions
- Listing title, bullets, description, alt text, and WhatsApp draft
- Dedicated Seller Studio workflow

Success criteria:

- User one product image ka compliance report dekh sake.
- User cleanup options ke saath marketplace-ready ZIP generate kar sake.
- User basic product details se editable listing draft bana sake.

## Phase 7.2: Output Quality Gate

Goal: User final generated images ko download se pehle dekh aur validate kar sake.

Scope:

- Processed-output preview endpoint and gallery
- Per-output pass, warning, and fail status
- Dimension, format, product-fill, and clipping validation
- Canvas background, transparency, and edge-halo checks
- Detached watermark/artifact detection
- Adjustable 65-92% target fill
- Strict ZIP blocking when any output fails
- Quality results inside `report.json`

Success criteria:

- Source ke bajaye final generated outputs validate hon.
- Failed output ke saath Seller Studio ZIP download na ho.
- Settings change par old preview invalidate ho.
- User har output download se pehle inspect kar sake.

## Phase 8: Real SaaS Activation

Goal: Scaffold ko live Supabase-backed SaaS controls mein convert karna.

Scope:

- Active Supabase project connection with publishable keys
- Isolated `seller_*` tables that preserve existing project data
- Signup profile trigger and backfill
- RLS on profiles, jobs, usage, subscriptions, and payment requests
- Atomic server-side daily, monthly, and per-batch plan limits
- Supabase access-token verification in FastAPI
- Server-authoritative job and usage records
- Secure admin payment approval/rejection functions
- Admin payment console with conditional navigation
- Production readiness check for Supabase plan enforcement

Success criteria:

- Anonymous users generated ZIP access na kar saken when SaaS is configured.
- Free/Starter/Pro/Agency limits database transaction mein enforce hon.
- Browser usage ya plan rows directly manipulate na kar sake.
- Admin approval request, profile plan, aur subscription atomically update kare.
- Existing shared-project tables aur records unchanged rahen.

## Current Work

Completed:

- Phase 1 core seller pack MVP
- Phase 2 SaaS layer scaffold
- Phase 3 batch and operator workflow
- Phase 4 SEO and public tool pages
- Phase 5 AI-assist quality automation
- Phase 6 integrations and scale foundation
- Launch hardening foundation
- Phase 7 Seller Studio and compliance foundation
- Phase 7.2 processed-output quality gate
- Phase 8 real SaaS activation
- Phase 8.1 owner bootstrap and production preflight foundation
- Output polish pass: restrained enhancement toggle and checkerboard regression coverage

Next active phase:

```text
Create owner account, bootstrap admin role, and deploy production preview
```

## Phase 8.1: Owner Bootstrap And Production Preview

Goal: Owner account ko securely admin banana aur production preview se pehle
live Supabase wiring verify karna.

Completed in this phase:

- `/ready` now probes every seller table and protected RPC endpoint through
  read-only PostgREST OPTIONS requests.
- Missing or unreachable seller objects block production readiness.
- Owner bootstrap sequence is documented in `docs/LAUNCH_CHECKLIST.md`.
- Live active Supabase project preflight passed for all seller objects.

Remaining operator steps:

- Create the real owner account through `/login`.
- Run `docs/supabase-admin.sql` once with the real owner email.
- Deploy a production preview with production environment variables.
- Run a separate seller payment approval smoke test.

Current build supports:

```text
Upload image -> select packs -> process outputs -> download ZIP
Login/signup -> protected dashboard -> job metadata -> usage summary -> manual payment request
Batch images -> client/project ZIP -> saved local preset combinations
SEO pages -> public tool landing pages -> sitemap and robots
Quality assistant -> blur/background/centering/size scoring -> title suggestions
Integration API -> API key auth -> metrics -> Docker/deployment docs
Launch hardening -> /ready -> /launch-checklist -> production env examples -> admin SQL
Seller Studio -> cleanup/centering/shadow -> compliance report -> new platform ZIP -> listing draft
Output Quality Gate -> preview generated files -> per-output QA -> strict validated ZIP
Real SaaS -> Supabase Auth -> atomic quota gate -> secure payment approval -> admin console
```

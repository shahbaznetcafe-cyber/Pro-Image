# Launch Checklist

Use this before sharing SBZ SellImage Pro with real sellers.

## Required

- Supabase project created.
- `docs/supabase-schema.sql` executed.
- Supabase Auth email settings tested.
- Owner account created through `/login`.
- Owner account promoted once with `docs/supabase-admin.sql`.
- `/dashboard/admin/payments` is visible only for the owner account.
- Frontend production env set from `frontend/.env.production.example`.
- Backend production env set from `backend/.env.production.example`.
- `SBZ_API_KEYS` set to a long random value.
- `ALLOWED_ORIGINS` set to the production frontend domain only.
- `NEXT_PUBLIC_SITE_URL` set to the production domain.
- `NEXT_PUBLIC_API_URL` set to the production backend URL.
- `/health` returns `status: ok`.
- `/ready` returns `status: ready`.
- `/ready` confirms seller tables and protected RPCs are visible.
- `/sitemap.xml` includes production URLs.
- `/robots.txt` allows public pages and blocks `/dashboard`.

## Manual Payment Launch

- JazzCash/Easypaisa/bank instructions written in the billing page copy.
- Admin knows how to use `docs/supabase-admin.sql`.
- Test user can submit a payment request.
- Admin can approve request and plan changes appear in dashboard.

## Owner Bootstrap Sequence

1. Create the owner account at `/login` using the real owner email.
2. In Supabase SQL Editor, replace `owner@example.com` in
   `docs/supabase-admin.sql` and run it once.
3. Sign out and sign in again, then confirm `Payment approvals` appears in the
   dashboard navigation.
4. Create a separate test seller account. Submit a payment request from Billing
   and approve it from the owner account.
5. Confirm the seller plan changes and a new 30-day subscription row exists.

Never expose the Supabase service-role key in frontend environment variables or
in the browser. The bootstrap SQL is intentionally the only owner-promotion
step.

## Smoke Test

- Upload 1 image and download ZIP.
- Confirm Light polish keeps color natural and edges clean.
- Upload 3 images and download batch ZIP.
- Run Quality Assistant.
- Login and confirm job history metadata appears.
- Open `/pricing`.
- Open `/api-docs`.
- Open one SEO page, for example `/amazon-product-image-resizer`.

## Operational Notes

- Do not store user product images permanently.
- Keep generated ZIP files temporary.
- Rotate API keys if shared with plugin clients.
- Add Redis-backed rate limits before public API scale.

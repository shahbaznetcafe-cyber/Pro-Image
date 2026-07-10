# Deployment Notes

## Backend

Backend runs with FastAPI and Uvicorn.

Required environment variables:

```text
APP_ENV=production
ALLOWED_ORIGINS=https://your-domain.com
SBZ_API_KEYS=replace-with-strong-key
```

Local Docker:

```powershell
docker compose up --build
```

Health checks:

```text
/health
/metrics
```

## Frontend

Frontend runs with Next.js.

Production variables:

```text
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

## Scaling Path

Start simple:

- Single FastAPI service
- Temporary ZIP files
- In-memory metrics
- Supabase for auth/metadata

Upgrade when needed:

- Redis-backed rate limits
- Background workers for large batches
- Object storage for short-lived ZIP downloads
- Structured log drain
- API key table in Supabase
- Plugin-specific API scopes

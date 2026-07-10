import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Launch Checklist",
  description: "Production readiness checklist for SBZ SellImage Pro.",
};

const requiredItems = [
  "Supabase project created and schema executed",
  "Frontend production environment variables configured",
  "Backend production environment variables configured",
  "SBZ_API_KEYS set to a long random value",
  "ALLOWED_ORIGINS points only to the production frontend domain",
  "NEXT_PUBLIC_SITE_URL uses the production domain",
  "/health and /ready checked on backend",
  "Manual payment approval flow tested",
];

const smokeTests = [
  "Upload one product image and download a ZIP",
  "Upload a batch and confirm per-product folders",
  "Run Quality Assistant on selected images",
  "Submit a manual payment request",
  "Approve a payment request in Supabase",
  "Open /sitemap.xml and /robots.txt",
  "Open one SEO page from search landing routes",
  "Open /api-docs and test /api/v1/status",
];

export default function LaunchChecklistPage() {
  return (
    <main className="min-h-screen bg-[#f6f8f5] text-[#172018]">
      <div className="mx-auto w-full max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dce4d8] pb-5">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f6f4f]"
          >
            SBZ SellImage Pro
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/api-docs"
              className="rounded-md border border-[#c8d7c5] bg-white px-4 py-2 text-sm font-semibold text-[#314632] hover:bg-[#f3f6f1]"
            >
              API docs
            </Link>
            <Link
              href="/#generator"
              className="rounded-md bg-[#1f4f2a] px-4 py-2 text-sm font-semibold text-white"
            >
              Use tool
            </Link>
          </div>
        </header>

        <section className="grid gap-6 py-8 lg:grid-cols-[1fr_380px]">
          <div className="rounded-lg border border-[#dce4d8] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f6f4f]">
              Launch hardening
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Production Readiness Checklist
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#637063]">
              Use this page before sending the app to sellers, net cafes, or
              agencies. It focuses on configuration, payment activation,
              security, and smoke testing.
            </p>
          </div>

          <aside className="h-fit rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Backend checks</h2>
            <pre className="mt-3 overflow-x-auto rounded-md bg-[#172018] p-4 text-sm leading-6 text-white">
              <code>{`GET /health
GET /ready
GET /metrics`}</code>
            </pre>
          </aside>
        </section>

        <section className="grid gap-5 pb-8 lg:grid-cols-2">
          <ChecklistCard title="Required Before Launch" items={requiredItems} />
          <ChecklistCard title="Smoke Test" items={smokeTests} />
        </section>

        <section className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Production Env Files</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <CodeBlock title="Frontend" lines={[
              "frontend/.env.production.example",
              "NEXT_PUBLIC_API_URL",
              "NEXT_PUBLIC_SITE_URL",
              "NEXT_PUBLIC_SUPABASE_URL",
              "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
            ]} />
            <CodeBlock title="Backend" lines={[
              "backend/.env.production.example",
              "APP_ENV=production",
              "ALLOWED_ORIGINS=https://your-domain.com",
              "SBZ_API_KEYS=long-random-key",
            ]} />
          </div>
        </section>
      </div>
    </main>
  );
}

function ChecklistCard({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-[#314632]">
        {items.map((item) => (
          <li key={item} className="rounded-md bg-[#fbfcfa] px-4 py-3">
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

function CodeBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-md bg-[#172018] p-4 text-white">
      <p className="text-sm font-semibold">{title}</p>
      <pre className="mt-3 overflow-x-auto text-sm leading-6">
        <code>{lines.join("\n")}</code>
      </pre>
    </div>
  );
}

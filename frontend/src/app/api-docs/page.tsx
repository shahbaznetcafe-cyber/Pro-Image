import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "API Docs",
  description:
    "Developer API documentation for SBZ SellImage Pro integrations and automation.",
};

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/status",
    description: "Check API availability and version.",
  },
  {
    method: "POST",
    path: "/api/v1/analyze-images",
    description: "Analyze product image quality, blur, background, and framing.",
  },
  {
    method: "POST",
    path: "/api/v1/seller-pack",
    description: "Generate marketplace, ads, catalog, and website ZIP packs.",
  },
  {
    method: "POST",
    path: "/api/v1/resize",
    description: "Alias for seller-pack generation.",
  },
];

export default function ApiDocsPage() {
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
          <Link
            href="/#generator"
            className="rounded-md bg-[#1f4f2a] px-4 py-2 text-sm font-semibold text-white"
          >
            Use tool
          </Link>
        </header>

        <section className="grid gap-6 py-8 lg:grid-cols-[1fr_380px]">
          <div className="rounded-lg border border-[#dce4d8] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f6f4f]">
              Phase 6
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Integration API
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#637063]">
              Use the versioned API to connect SBZ SellImage Pro with scripts,
              WordPress plugins, Shopify apps, Chrome extensions, and agency
              automation.
            </p>
          </div>

          <aside className="h-fit rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Auth Header</h2>
            <pre className="mt-3 overflow-x-auto rounded-md bg-[#172018] p-4 text-sm text-white">
              <code>X-API-Key: your-api-key</code>
            </pre>
            <p className="mt-3 text-sm leading-6 text-[#637063]">
              Configure backend keys with <code>SBZ_API_KEYS</code>.
            </p>
          </aside>
        </section>

        <section className="grid gap-4 pb-8 md:grid-cols-2">
          {endpoints.map((endpoint) => (
            <article
              key={endpoint.path}
              className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#edf3eb] px-3 py-1 text-xs font-semibold text-[#314632]">
                  {endpoint.method}
                </span>
                <code className="text-sm font-semibold">{endpoint.path}</code>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#637063]">
                {endpoint.description}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Example Request</h2>
          <pre className="mt-4 overflow-x-auto rounded-md bg-[#172018] p-4 text-sm leading-6 text-white">
            <code>{`curl.exe -X POST "http://localhost:8000/api/v1/seller-pack" \\
  -H "X-API-Key: dev-api-key-change-me" \\
  -F "files=@product.jpg" \\
  -F "preset_ids=amazon_main,shopify_product,website_webp" \\
  -F "project_name=client-catalog" \\
  --output client-catalog.zip`}</code>
          </pre>
        </section>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSeoToolPage, SEO_TOOL_PAGES } from "@/lib/seo-pages";

type ToolPageProps = {
  params: Promise<{
    toolSlug: string;
  }>;
};

export function generateStaticParams() {
  return SEO_TOOL_PAGES.map((page) => ({ toolSlug: page.slug }));
}

export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const { toolSlug } = await params;
  const page = getSeoToolPage(toolSlug);

  if (!page) {
    return {};
  }

  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: `/${page.slug}`,
    },
    openGraph: {
      title: page.title,
      description: page.description,
      type: "website",
      url: `/${page.slug}`,
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { toolSlug } = await params;
  const page = getSeoToolPage(toolSlug);

  if (!page) {
    notFound();
  }

  const relatedPages = SEO_TOOL_PAGES.filter((item) => item.slug !== page.slug).slice(
    0,
    4,
  );

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
          <nav className="flex flex-wrap gap-2">
            <Link
              href="/pricing"
              className="rounded-md border border-[#c8d7c5] bg-white px-4 py-2 text-sm font-semibold text-[#314632] hover:bg-[#f3f6f1]"
            >
              Pricing
            </Link>
            <Link
              href="/#generator"
              className="rounded-md bg-[#1f4f2a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173d20]"
            >
              Use tool
            </Link>
          </nav>
        </header>

        <section className="grid gap-6 py-8 lg:grid-cols-[1fr_380px]">
          <div className="rounded-lg border border-[#dce4d8] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f6f4f]">
              {page.eyebrow}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              {page.h1}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#637063]">
              {page.intro}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/#generator"
                className="rounded-md bg-[#1f4f2a] px-5 py-3 text-sm font-semibold text-white"
              >
                Open batch generator
              </Link>
              <Link
                href="/pricing"
                className="rounded-md border border-[#c8d7c5] px-5 py-3 text-sm font-semibold text-[#314632]"
              >
                View pricing
              </Link>
            </div>
          </div>

          <aside className="h-fit rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Recommended Output</h2>
            <p className="mt-3 text-sm leading-6 text-[#637063]">
              {page.recommendedOutput}
            </p>
            <div className="mt-5 rounded-md bg-[#edf3eb] p-4">
              <p className="text-sm font-semibold text-[#314632]">Best for</p>
              <p className="mt-2 text-sm leading-6 text-[#637063]">
                {page.useCase}
              </p>
            </div>
          </aside>
        </section>

        <section className="grid gap-5 pb-8 lg:grid-cols-2">
          <div className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">What This Page Generates</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[#314632]">
              {page.outputs.map((output) => (
                <li key={output} className="rounded-md bg-[#fbfcfa] px-4 py-3">
                  {output}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">How It Works</h2>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-[#314632]">
              <li className="rounded-md bg-[#fbfcfa] px-4 py-3">
                1. Upload one or more product photos.
              </li>
              <li className="rounded-md bg-[#fbfcfa] px-4 py-3">
                2. Choose marketplace, ads, catalog, or website presets.
              </li>
              <li className="rounded-md bg-[#fbfcfa] px-4 py-3">
                3. Download a ZIP with organized product folders.
              </li>
            </ol>
          </div>
        </section>

        <section className="grid gap-5 pb-8 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">FAQ</h2>
            <div className="mt-4 space-y-4">
              {page.faqs.map((faq) => (
                <div key={faq.question} className="border-t border-[#eef2ed] pt-4">
                  <h3 className="font-semibold">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#637063]">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="h-fit rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Related Tools</h2>
            <div className="mt-4 space-y-2">
              {relatedPages.map((item) => (
                <Link
                  key={item.slug}
                  href={`/${item.slug}`}
                  className="block rounded-md border border-[#eef2ed] px-3 py-3 text-sm font-semibold hover:bg-[#f3f6f1]"
                >
                  {item.h1}
                </Link>
              ))}
            </div>

            {page.sourceLinks?.length ? (
              <div className="mt-5 border-t border-[#eef2ed] pt-4">
                <h3 className="text-sm font-semibold">Reference</h3>
                <div className="mt-2 space-y-2">
                  {page.sourceLinks.map((source) => (
                    <a
                      key={source.href}
                      href={source.href}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-sm font-medium text-[#1f4f2a] underline-offset-4 hover:underline"
                    >
                      {source.label}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </section>

        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: page.h1,
              applicationCategory: "MultimediaApplication",
              operatingSystem: "Web",
              description: page.description,
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
      </div>
    </main>
  );
}

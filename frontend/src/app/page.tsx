import type { Metadata } from "next";
import Link from "next/link";

import { PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Product Image Packs for Marketplaces and Seller Teams",
  description:
    "Clean backgrounds, improve product crops, validate final files, and export seller-ready image packs for marketplaces, ads, catalogs, and websites.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "SBZ SellImage Pro - Product Images Ready to Sell",
    description:
      "Turn one product photo into validated marketplace, ads, catalog, and website outputs.",
    type: "website",
  },
};

const platformGroups = [
  {
    eyebrow: "Marketplaces",
    title: "Amazon, Daraz, Etsy, Google Shopping",
    detail: "Clean square listing images with controlled product fill and safe edges.",
    formats: "1000px to 2048px",
  },
  {
    eyebrow: "Social ads",
    title: "Meta, Instagram, TikTok",
    detail: "Square, portrait, horizontal, and vertical assets from one product source.",
    formats: "1:1, 4:5, 16:9, 9:16",
  },
  {
    eyebrow: "Catalog",
    title: "WhatsApp and client catalogs",
    detail: "Compressed, consistent product images that are easy to share and reuse.",
    formats: "Optimized JPG",
  },
  {
    eyebrow: "Storefront",
    title: "Shopify and website WebP",
    detail: "High-resolution product files with a lightweight web-ready option.",
    formats: "JPG, PNG, WebP",
  },
];

const workflowSteps = [
  {
    number: "01",
    title: "Upload the source",
    detail: "Prepare one product in Seller Studio or add up to 30 images to a repeatable batch job.",
  },
  {
    number: "02",
    title: "Set the product standard",
    detail: "Choose background cleanup, smart crop, polish, safe product fill, and output channels.",
  },
  {
    number: "03",
    title: "Review final files",
    detail: "Preview every generated size and inspect dimensions, format, crop, edges, and artifacts.",
  },
  {
    number: "04",
    title: "Deliver one clean pack",
    detail: "Download an organized ZIP with channel-ready filenames and a quality report.",
  },
];

const comparisonRows = [
  ["Background", "Remove and inspect by hand", "Cleanup applied before export"],
  ["Cropping", "Repeat for every canvas", "Visible subject fitted per preset"],
  ["Quality check", "Open every final file", "Six output-level checks"],
  ["Delivery", "Rename and organize folders", "One structured seller ZIP"],
];

const qualityChecks = [
  "Exact dimensions",
  "Expected file format",
  "Visible product fill",
  "Safe edge margins",
  "Detached artifact scan",
  "Canvas or transparency check",
];

const useCases = [
  {
    label: "Online sellers",
    title: "Keep every listing visually consistent",
    detail: "Prepare cleaner images for multiple channels without rebuilding the same file in separate editors.",
  },
  {
    label: "Agencies and freelancers",
    title: "Turn client folders into organized packs",
    detail: "Reuse saved output combinations and deliver predictable filenames, folders, and quality reports.",
  },
  {
    label: "Catalog teams",
    title: "Standardize repeat product work",
    detail: "Apply the same crop, background, and export rules across a full product range.",
  },
];

const faqs = [
  {
    question: "Is SellImage Pro only an image resizer?",
    answer:
      "No. Resizing is only the final step. Seller Studio can clean suitable backgrounds, crop to the visible subject, control product fill, lightly polish the image, and validate each generated output.",
  },
  {
    question: "Will background cleanup work on every photo?",
    answer:
      "It works best with plain, studio, transparent, and checkerboard-style backgrounds. Complex scenes, hair, glass, and low-contrast edges should be reviewed in the final preview before publishing.",
  },
  {
    question: "Which selling channels are included?",
    answer:
      "Current presets cover Amazon, Daraz, Etsy, Google Shopping, Shopify, Meta, Instagram, TikTok, WhatsApp Catalog, website WebP, and transparent PNG output.",
  },
  {
    question: "Can I process a complete client folder?",
    answer:
      "Yes. Batch Generator applies one selected output pack and processing standard across up to 30 uploaded product images, then returns one organized ZIP.",
  },
  {
    question: "What happens when an output fails a quality check?",
    answer:
      "Seller Studio labels each output as pass, warning, or fail. Strict batch mode can block a ZIP when a generated file fails the publish-ready quality gate.",
  },
  {
    question: "Are uploaded images kept permanently?",
    answer:
      "Uploads and previews are processed temporarily by the current workflow. Generated ZIP files are removed after delivery rather than becoming a permanent media library.",
  },
];

export default function Home() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f8f4] text-[#172018]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="border-b border-[#d7e1d4] bg-[#eaf2e7] px-5 py-2.5 text-center text-xs font-semibold text-[#315438] sm:text-sm">
        Start with 5 free images per day. No payment card required.
      </div>

      <header className="sticky top-0 z-40 border-b border-[#dce4d8] bg-[#f8faf7]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/" className="text-sm font-semibold uppercase tracking-[0.18em] text-[#315c39]">
            SBZ SellImage Pro
          </Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm font-semibold text-[#425142] lg:flex">
            <a href="#outputs" className="hover:text-[#1f4f2a]">Outputs</a>
            <a href="#quality" className="hover:text-[#1f4f2a]">Quality</a>
            <a href="#workflow" className="hover:text-[#1f4f2a]">Workflow</a>
            <a href="#pricing" className="hover:text-[#1f4f2a]">Pricing</a>
            <a href="#faq" className="hover:text-[#1f4f2a]">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-md px-4 py-2 text-sm font-semibold text-[#314632] hover:bg-[#edf3eb] sm:inline-flex">
              Log in
            </Link>
            <Link href="/seller-studio" className="rounded-md bg-[#1f4f2a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#173d20]">
              Start free
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-[#dce4d8] bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-12 sm:px-8 md:py-16 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:px-10 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4b704f]">
              For sellers, agencies, and catalog teams
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
              Product image packs built for every place you sell.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#586757] sm:text-lg">
              Clean the background, improve the crop, validate the final files, and export 14 channel-ready formats from one focused seller workflow.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/seller-studio" className="rounded-md bg-[#1f4f2a] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#173d20]">
                Process a product free
              </Link>
              <Link href="/batch-generator" className="rounded-md border border-[#afc2ac] bg-white px-5 py-3 text-sm font-semibold text-[#314632] hover:bg-[#f1f5ef]">
                See batch workflow
              </Link>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-2 gap-x-5 gap-y-3 border-t border-[#e0e7dd] pt-5 text-sm text-[#526050] sm:grid-cols-3">
              <TrustPoint label="No card required" />
              <TrustPoint label="Preview before export" />
              <TrustPoint label="Temporary processing" />
            </div>
          </div>

          <ProductPreview />
        </div>
      </section>

      <section aria-label="Product proof" className="border-b border-[#dce4d8] bg-[#eef4ec]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-[#d5dfd2] px-5 sm:px-8 lg:grid-cols-4 lg:divide-y-0 lg:px-10">
          <ProofMetric value="14" label="export presets" />
          <ProofMetric value="30" label="images per batch" />
          <ProofMetric value="6" label="quality checks" />
          <ProofMetric value="1" label="organized seller ZIP" />
        </div>
      </section>

      <section id="outputs" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <SectionHeading
          eyebrow="One source, every channel"
          title="Stop rebuilding the same product photo for every platform."
          detail="Create a consistent source once, then let each preset handle its own dimensions, file format, product fill, and delivery name."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {platformGroups.map((group) => (
            <article key={group.title} className="flex min-h-64 flex-col rounded-lg border border-[#d6e0d3] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#96ad92] hover:shadow-md">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#647763]">{group.eyebrow}</p>
              <h3 className="mt-4 text-xl font-semibold leading-7">{group.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#637063]">{group.detail}</p>
              <p className="mt-auto border-t border-[#e2e8df] pt-4 text-xs font-semibold text-[#365d3b]">{group.formats}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#dce4d8] bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:px-10 lg:py-24">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4b704f]">More than a resizer</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">The repetitive work happens before the resize.</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#586757]">A professional seller pack needs a clean subject, balanced crop, controlled fill, correct format, and a final review. SellImage Pro puts those decisions into one repeatable process.</p>
            <Link href="/seller-studio" className="mt-7 inline-flex rounded-md border border-[#1f4f2a] px-5 py-3 text-sm font-semibold text-[#1f4f2a] hover:bg-[#edf7eb]">Open the quality-controlled studio</Link>
          </div>
          <div className="overflow-hidden rounded-lg border border-[#d6e0d3]">
            <div className="grid grid-cols-[0.72fr_1fr_1fr] bg-[#edf3eb] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#647763] sm:px-5">
              <span>Task</span>
              <span>Manual workflow</span>
              <span className="text-[#315c39]">SellImage Pro</span>
            </div>
            {comparisonRows.map(([task, manual, automated]) => (
              <div key={task} className="grid grid-cols-[0.72fr_1fr_1fr] border-t border-[#dce4d8] bg-white px-4 py-4 text-xs leading-5 sm:px-5 sm:text-sm">
                <span className="font-semibold text-[#263526]">{task}</span>
                <span className="pr-3 text-[#6a7469]">{manual}</span>
                <span className="font-semibold text-[#315c39]">{automated}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="quality" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-lg border border-[#d6e0d3] bg-[#1f4f2a] p-6 text-white lg:row-span-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#cde3c9]">Background and crop</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">Keep the product in control of the canvas.</h2>
            <p className="mt-4 text-sm leading-7 text-[#d5ead0]">Cleanup suitable plain or checkerboard backgrounds, crop to visible subject bounds, and scale the product toward a marketplace-safe fill target.</p>
            <div className="mt-8 rounded-md border border-[#638068] bg-[#285b32] p-4">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Product fill target</span>
                <span>84%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#173d20]">
                <div className="h-full w-[84%] rounded-full bg-[#d8ed67]" />
              </div>
              <p className="mt-3 text-xs leading-5 text-[#cde3c9]">Visible subject bounds drive the final crop, not empty source padding.</p>
            </div>
          </article>

          <article className="rounded-lg border border-[#d6e0d3] bg-white p-6 lg:col-span-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4b704f]">Output-level validation</p>
            <div className="mt-4 grid gap-7 md:grid-cols-[0.9fr_1.1fr]">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Inspect the file your customer will actually receive.</h2>
                <p className="mt-3 text-sm leading-6 text-[#637063]">Each generated preset is checked after processing, so a clean source image cannot hide a bad final crop or incorrect canvas.</p>
              </div>
              <ul className="grid grid-cols-2 gap-2">
                {qualityChecks.map((check) => (
                  <li key={check} className="rounded-md bg-[#f0f5ee] px-3 py-3 text-xs font-semibold leading-5 text-[#36513a]">{check}</li>
                ))}
              </ul>
            </div>
          </article>

          <article className="rounded-lg border border-[#d6e0d3] bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4b704f]">Warnings that mean something</p>
            <h3 className="mt-4 text-xl font-semibold">Pass, review, or block.</h3>
            <p className="mt-3 text-sm leading-6 text-[#637063]">Warnings remain downloadable for human review. Failed outputs can block strict batch delivery.</p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
              <span className="rounded-md bg-[#e4f2e1] px-2 py-3 text-[#276233]">Pass</span>
              <span className="rounded-md bg-[#fff2c7] px-2 py-3 text-[#745b12]">Review</span>
              <span className="rounded-md bg-[#fff0ec] px-2 py-3 text-[#9a3412]">Blocked</span>
            </div>
          </article>

          <article className="rounded-lg border border-[#d6e0d3] bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4b704f]">Seller-ready finishing</p>
            <h3 className="mt-4 text-xl font-semibold">Polish without changing the product.</h3>
            <p className="mt-3 text-sm leading-6 text-[#637063]">Apply restrained color, contrast, and sharpness adjustments while preserving the subject alpha and original visual identity.</p>
          </article>
        </div>
      </section>

      <section id="workflow" className="border-y border-[#dce4d8] bg-[#eaf1e7]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
          <SectionHeading
            eyebrow="A repeatable seller workflow"
            title="From a raw upload to a client-ready pack in four clear steps."
            detail="Single-product work stays focused in Seller Studio. Repeating the same standard across a client folder moves into Batch Generator."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((step) => (
              <article key={step.number} className="rounded-lg border border-[#c7d5c4] bg-[#f9fbf8] p-5">
                <p className="text-sm font-semibold text-[#3f6e45]">{step.number}</p>
                <h3 className="mt-8 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#586757]">{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <SectionHeading
          eyebrow="Fits the work you already do"
          title="One product standard, three practical workflows."
          detail="The product stays the same. The volume, output pack, and delivery method adapt to the job."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {useCases.map((useCase) => (
            <article key={useCase.label} className="rounded-lg border border-[#d6e0d3] bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#647763]">{useCase.label}</p>
              <h3 className="mt-4 text-xl font-semibold leading-7">{useCase.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#637063]">{useCase.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="border-y border-[#dce4d8] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <SectionHeading
              eyebrow="Simple monthly plans"
              title="Start free, then scale with your catalog."
              detail="Use the free workflow to test real product images before requesting a paid plan activation."
            />
            <Link href="/pricing" className="shrink-0 text-sm font-semibold text-[#315c39] underline decoration-[#9eb69b] underline-offset-4">Compare all plan details</Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => {
              const featured = plan.id === "pro";
              return (
                <article key={plan.id} className={featured ? "relative rounded-lg border border-[#1f4f2a] bg-[#edf6ea] p-5 shadow-md" : "rounded-lg border border-[#d6e0d3] bg-[#fafcf9] p-5"}>
                  {featured ? <span className="absolute right-4 top-4 rounded-full bg-[#1f4f2a] px-2.5 py-1 text-[11px] font-semibold text-white">Popular</span> : null}
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#647763]">{plan.name}</p>
                  <p className="mt-5 text-3xl font-semibold tracking-tight">{plan.price}</p>
                  <p className="mt-2 text-sm text-[#637063]">{plan.imagesPerMonth.toLocaleString()} images / month</p>
                  <div className="mt-5 border-t border-[#ccd8c9] pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#4b704f]">{plan.badge}</p>
                    <ul className="mt-3 space-y-2 text-sm text-[#405040]">
                      {plan.features.slice(0, 2).map((feature) => <li key={feature}>- {feature}</li>)}
                    </ul>
                  </div>
                  <Link href={plan.id === "free" ? "/seller-studio" : "/dashboard/billing"} className={featured ? "mt-6 inline-flex w-full justify-center rounded-md bg-[#1f4f2a] px-4 py-3 text-sm font-semibold text-white" : "mt-6 inline-flex w-full justify-center rounded-md border border-[#b9cab7] bg-white px-4 py-3 text-sm font-semibold text-[#314632] hover:bg-[#f1f5ef]"}>
                    {plan.id === "free" ? "Start free" : "Request activation"}
                  </Link>
                </article>
              );
            })}
          </div>
          <p className="mt-5 text-center text-xs leading-5 text-[#687567]">Paid plans currently use manual payment verification and admin activation.</p>
        </div>
      </section>

      <section id="faq" className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:px-10 lg:py-24">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4b704f]">Questions before you upload</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Clear expectations make better outputs.</h2>
          <p className="mt-4 max-w-md text-base leading-7 text-[#586757]">The workflow automates repeatable seller-image work and keeps a human review step where image complexity needs judgment.</p>
        </div>
        <div className="divide-y divide-[#d9e2d6] border-y border-[#d9e2d6]">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-[#263526] marker:content-none">
                {faq.question}
                <span aria-hidden="true" className="text-xl font-normal text-[#527057] transition group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-2xl pt-3 text-sm leading-7 text-[#637063]">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-[#1f4f2a] text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-5 py-14 sm:px-8 md:flex-row md:items-center lg:px-10 lg:py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#cde3c9]">Your next seller pack starts here</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Give one real product image the full workflow.</h2>
            <p className="mt-3 text-base leading-7 text-[#d5ead0]">Preview the result before you decide whether SellImage Pro belongs in your daily seller process.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/seller-studio" className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-[#1f4f2a] hover:bg-[#edf7eb]">Process a product free</Link>
            <Link href="/batch-generator" className="rounded-md border border-[#8fbb8b] px-5 py-3 text-sm font-semibold text-white hover:bg-[#275b31]">Open batch generator</Link>
          </div>
        </div>
      </section>

      <footer className="bg-[#142f1a] text-[#cde0ca]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.4fr_0.8fr_0.8fr] lg:px-10">
          <div className="max-w-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white">SBZ SellImage Pro</p>
            <p className="mt-3 text-sm leading-6">A focused product-image workflow for marketplace sellers, agencies, and catalog teams.</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Product</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/seller-studio" className="hover:text-white">Seller Studio</Link>
              <Link href="/batch-generator" className="hover:text-white">Batch generator</Link>
              <Link href="/listing-assistant" className="hover:text-white">Listing Assistant</Link>
              <Link href="/pricing" className="hover:text-white">Pricing</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Resources</p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/api-docs" className="hover:text-white">API documentation</Link>
              <Link href="/marketplace-image-resizer" className="hover:text-white">Marketplace resizer</Link>
              <Link href="/launch-checklist" className="hover:text-white">Launch checklist</Link>
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-[#2e4a33] px-5 py-5 text-xs sm:px-8 lg:px-10">
          <p>SBZ SellImage Pro</p>
          <p>Built for repeatable seller-image production.</p>
        </div>
      </footer>
    </main>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-2xl rounded-lg border border-[#c8d6c5] bg-[#e9f0e6] p-3 shadow-[0_24px_70px_rgba(31,79,42,0.16)] sm:p-5">
      <div className="rounded-md border border-[#d7e1d4] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[#e1e8de] px-4 py-3 sm:px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#657765]">Seller Studio</p>
            <p className="mt-1 text-sm font-semibold">Marketplace pack preview</p>
          </div>
          <span className="rounded-full bg-[#e4f2e1] px-3 py-1.5 text-xs font-semibold text-[#276233]">3 passed</span>
        </div>

        <div className="grid gap-0 md:grid-cols-[0.92fr_1.08fr]">
          <div className="border-b border-[#e1e8de] p-4 md:border-b-0 md:border-r sm:p-5">
            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-[linear-gradient(45deg,#e1e5df_25%,transparent_25%),linear-gradient(-45deg,#e1e5df_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e1e5df_75%),linear-gradient(-45deg,transparent_75%,#e1e5df_75%)] bg-[length:18px_18px] bg-[position:0_0,0_9px,9px_-9px,-9px_0px]">
              <div className="relative h-[72%] w-[38%] rounded-[44%_44%_24%_24%] border-[6px] border-[#2f6241] bg-[#f0bd4f] shadow-[0_8px_18px_rgba(23,32,24,0.18),inset_0_13px_0_rgba(255,255,255,0.3)]">
                <div className="absolute left-1/2 top-[38%] flex -translate-x-1/2 gap-5">
                  <span className="h-3 w-3 rounded-full bg-[#172018]" />
                  <span className="h-3 w-3 rounded-full bg-[#172018]" />
                </div>
                <span className="absolute left-1/2 top-[55%] h-2 w-10 -translate-x-1/2 rounded-full bg-[#172018]" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Source product</p>
                <p className="mt-1 text-xs text-[#637063]">Cleanup + smart crop</p>
              </div>
              <span className="rounded-full bg-[#edf3eb] px-2.5 py-1 text-xs font-semibold text-[#365d3b]">84% fill</span>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-3 gap-2">
              <OutputTile label="Daraz" size="1000" />
              <OutputTile label="Google" size="1500" />
              <OutputTile label="PNG" size="1600" transparent />
            </div>
            <div className="mt-4 rounded-md border border-[#dce4d8] bg-[#f8faf7] p-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Output quality gate</span>
                <span className="text-[#276233]">100/100</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                <span className="rounded-sm bg-white px-2 py-2 text-[#405040]">Crop safe</span>
                <span className="rounded-sm bg-white px-2 py-2 text-[#405040]">Edges clean</span>
                <span className="rounded-sm bg-white px-2 py-2 text-[#405040]">Format valid</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-md bg-[#1f4f2a] px-3 py-3 text-xs font-semibold text-white">
              <span>Validated marketplace ZIP</span>
              <span>Ready</span>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 right-5 rounded-md border border-[#d7e1d4] bg-white px-4 py-3 shadow-lg sm:right-9">
        <p className="text-xs font-semibold text-[#315c39]">Background checked</p>
        <p className="mt-1 text-[11px] text-[#637063]">No detached artifact detected</p>
      </div>
    </div>
  );
}

function OutputTile({ label, size, transparent = false }: { label: string; size: string; transparent?: boolean }) {
  return (
    <div className="rounded-md border border-[#dce4d8] bg-white p-2">
      <div className={transparent ? "flex aspect-square items-center justify-center bg-[#edf1ec]" : "flex aspect-square items-center justify-center bg-white"}>
        <div className="h-[62%] w-[40%] rounded-[44%_44%_24%_24%] border-[3px] border-[#356547] bg-[#efbd52]" />
      </div>
      <p className="mt-2 truncate text-[11px] font-semibold">{label}</p>
      <p className="mt-0.5 text-[10px] text-[#6b776a]">{size}px</p>
    </div>
  );
}

function TrustPoint({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-[#4d7e52]" />
      {label}
    </span>
  );
}

function ProofMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-4 py-6 text-center sm:px-6">
      <p className="text-2xl font-semibold tracking-tight text-[#244a2e] sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#617260]">{label}</p>
    </div>
  );
}

function SectionHeading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4b704f]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[#586757]">{detail}</p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { API_URL } from "@/lib/config";

type Status = "idle" | "working" | "done" | "error";

type ListingCopy = {
  titles: string[];
  bullets: string[];
  description: string;
  alt_text: string;
  whatsapp_message: string;
  generation_mode: string;
};

export default function ListingAssistantClient() {
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [primaryFeature, setPrimaryFeature] = useState("");
  const [audience, setAudience] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ListingCopy | null>(null);

  async function generateCopy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (productName.trim().length < 2) {
      setStatus("error");
      setMessage("Add a clear product name first.");
      return;
    }

    const formData = new FormData();
    formData.append("product_name", productName.trim());
    formData.append("brand", brand.trim());
    formData.append("category", category.trim());
    formData.append("primary_feature", primaryFeature.trim());
    formData.append("audience", audience.trim());
    setStatus("working");
    setMessage("Creating your listing draft...");

    try {
      const response = await fetch(`${API_URL}/tools/generate-listing-copy`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(readErrorDetail(data, "Listing draft generation failed."));
      }

      setResult((await response.json()) as ListingCopy);
      setStatus("done");
      setMessage("Draft ready. Review product facts before publishing.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Listing draft generation failed.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8f5] text-[#172018]">
      <div className="mx-auto w-full max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dce4d8] pb-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold uppercase tracking-[0.16em] text-[#315c39]">
              SBZ SellImage Pro
            </Link>
            <span className="hidden h-5 w-px bg-[#d4ded1] sm:block" aria-hidden="true" />
            <span className="hidden text-sm text-[#637063] sm:inline">Listing workspace</span>
          </div>
          <nav aria-label="Product navigation" className="grid w-full grid-cols-4 gap-1 rounded-lg border border-[#dce4d8] bg-white p-1 shadow-sm sm:flex sm:w-auto sm:items-center">
            <Link href="/seller-studio" className="rounded-md px-2 py-2 text-center text-xs font-semibold text-[#526052] hover:bg-[#f2f5f1] hover:text-[#1f4f2a] sm:px-3 sm:text-sm">
              Seller Studio
            </Link>
            <Link href="/batch-generator" className="rounded-md px-2 py-2 text-center text-xs font-semibold text-[#526052] hover:bg-[#f2f5f1] hover:text-[#1f4f2a] sm:px-3 sm:text-sm">
              Batch generator
            </Link>
            <Link href="/listing-assistant" aria-current="page" className="rounded-md bg-[#edf3eb] px-2 py-2 text-center text-xs font-semibold text-[#1f4f2a] sm:px-3 sm:text-sm">
              Listing
            </Link>
            <Link href="/dashboard" className="rounded-md px-2 py-2 text-center text-xs font-semibold text-[#526052] hover:bg-[#f2f5f1] hover:text-[#1f4f2a] sm:px-3 sm:text-sm">
              Dashboard
            </Link>
          </nav>
        </header>

        <section className="py-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4f6f4f]">Product content workflow</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Create a clean listing draft</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#637063] sm:text-base">
            Add verified product context, generate structured sales copy, then review and copy the sections you need.
          </p>
          <ol aria-label="Listing Assistant progress" className="mt-6 grid overflow-hidden rounded-lg border border-[#dce4d8] bg-white sm:grid-cols-3">
            <WorkflowStep number="1" label="Context" detail="Add product facts" current={!result} />
            <WorkflowStep number="2" label="Generate" detail="Build the draft" divided current={status === "working"} />
            <WorkflowStep number="3" label="Review" detail="Verify and copy" divided current={Boolean(result)} />
          </ol>
        </section>

        <section className="grid gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
          <form onSubmit={generateCopy} className="h-fit rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f6f4f]">Step 1 - Product context</p>
            <h2 className="mt-1 text-xl font-semibold">Tell us what is true</h2>
            <p className="mt-2 text-sm leading-6 text-[#637063]">More specific facts produce a more useful draft. Avoid claims you cannot verify.</p>
            <div className="mt-5 space-y-4">
              <TextField label="Product name" value={productName} onChange={setProductName} placeholder="e.g. Classic leather wallet" required />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <TextField label="Brand" value={brand} onChange={setBrand} placeholder="e.g. SBZ" />
                <TextField label="Category" value={category} onChange={setCategory} placeholder="e.g. Wallet" />
              </div>
              <TextField label="Primary feature" value={primaryFeature} onChange={setPrimaryFeature} placeholder="e.g. full-grain leather with 8 card slots" />
              <TextField label="Target audience" value={audience} onChange={setAudience} placeholder="e.g. professionals and gift buyers" />
            </div>
            <button type="submit" disabled={status === "working"} className="mt-5 w-full rounded-md bg-[#1f4f2a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#173d20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#537c55] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#9baa99]">
              {status === "working" ? "Creating draft..." : result ? "Regenerate draft" : "Generate listing draft"}
            </button>
            <StatusMessage status={status} message={message} />
          </form>

          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f6f4f]">Steps 2 and 3</p>
                <h2 className="mt-1 text-2xl font-semibold">Review your draft</h2>
              </div>
              {result ? <span className="rounded-full bg-[#edf3eb] px-3 py-1.5 text-xs font-semibold text-[#315c39]">Draft ready</span> : null}
            </div>

            {result ? (
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <CopySection title="Title options" lines={result.titles} />
                <CopySection title="Selling bullets" lines={result.bullets} />
                <CopySection title="Description" lines={[result.description]} />
                <CopySection title="Accessibility and outreach" lines={[result.alt_text, result.whatsapp_message]} />
              </div>
            ) : (
              <div className="mt-4 flex min-h-80 items-center justify-center rounded-lg border border-dashed border-[#b9c8b6] bg-white px-6 text-center">
                <div className="max-w-sm">
                  <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-[#edf3eb] text-sm font-semibold text-[#315c39]" aria-hidden="true">Aa</span>
                  <h3 className="mt-4 font-semibold">Your listing draft will appear here</h3>
                  <p className="mt-2 text-sm leading-6 text-[#637063]">Complete the product context and generate a draft to see titles, bullets, description, alt text, and outreach copy.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function WorkflowStep({ number, label, detail, current, divided = false }: { number: string; label: string; detail: string; current: boolean; divided?: boolean }) {
  return (
    <li aria-current={current ? "step" : undefined} className={`flex items-center gap-3 px-4 py-3 ${divided ? "border-t border-[#e3e9e1] sm:border-l sm:border-t-0" : ""}`}>
      <span className={current ? "flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-[#1f4f2a] text-xs font-semibold text-[#1f4f2a]" : "flex size-7 shrink-0 items-center justify-center rounded-full border border-[#c7d1c4] bg-[#f6f8f5] text-xs font-semibold text-[#7a8679]"}>{number}</span>
      <span><span className="block text-sm font-semibold text-[#314632]">{label}</span><span className="block text-xs text-[#6b776a]">{detail}</span></span>
    </li>
  );
}

function TextField({ label, value, onChange, placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; required?: boolean }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className="mt-2 w-full rounded-md border border-[#cbd8c7] bg-[#fbfcfa] px-3 py-2.5 outline-none ring-[#537c55] focus:ring-2" />
    </label>
  );
}

function StatusMessage({ status, message }: { status: Status; message: string }) {
  if (!message) return null;
  const tone = status === "error" ? "border-[#efb8ad] bg-[#fff4f1] text-[#9a3412]" : status === "done" ? "border-[#b9d9b3] bg-[#f1f8ef] text-[#276233]" : "border-[#dce4d8] bg-[#f6f8f5] text-[#637063]";
  return <p role="status" className={`mt-3 rounded-md border px-3 py-2 text-sm leading-6 ${tone}`}>{message}</p>;
}

function CopySection({ title, lines }: { title: string; lines: string[] }) {
  const [copied, setCopied] = useState(false);

  async function copySection() {
    await navigator.clipboard.writeText(lines.join("\n\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <article className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <button type="button" onClick={copySection} className="rounded-md border border-[#c8d7c5] px-2.5 py-1.5 text-xs font-semibold text-[#315c39] hover:bg-[#edf3eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#537c55]">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-6 text-[#405040]">
        {lines.map((line) => <p key={line}>{line}</p>)}
      </div>
    </article>
  );
}

function readErrorDetail(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;
  const detail = (data as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") {
    const message = (detail as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

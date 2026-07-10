"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

import { getApiAuthHeaders } from "@/lib/api-auth";
import { API_URL } from "@/lib/config";

type Status = "idle" | "working" | "done" | "error";
type CheckStatus = "pass" | "warning" | "fail";

type OutputCheck = {
  label: string;
  status: CheckStatus;
  detail: string;
};

type QualityControl = {
  status: CheckStatus;
  score: number;
  summary: string;
  checks: OutputCheck[];
  metrics: {
    subject_fill_percent: number;
    edge_margin_percent: number;
    detached_foreground_percent: number;
    partial_alpha_percent: number;
  };
};

type PreviewOutput = {
  preset_id: string;
  label: string;
  filename: string;
  format: string;
  output_width: number;
  output_height: number;
  output_size_kb: number;
  cleanup_method: string;
  preview_data_url: string;
  quality_control: QualityControl;
};

type PreviewResult = {
  original_filename: string;
  processing: {
    cleanup_background: boolean;
    smart_center: boolean;
    add_shadow: boolean;
    polish_output: boolean;
    subject_fill_percent: number;
  };
  summary: {
    pass: number;
    warning: number;
    fail: number;
    can_download: boolean;
  };
  outputs: PreviewOutput[];
};

type ListingCopy = {
  titles: string[];
  bullets: string[];
  description: string;
  alt_text: string;
  whatsapp_message: string;
  generation_mode: string;
};

const STUDIO_PRESETS = [
  { id: "daraz_square", label: "Daraz", size: "1000 x 1000", group: "Marketplace" },
  { id: "google_shopping", label: "Google Shopping", size: "1500 x 1500", group: "Marketplace" },
  { id: "amazon_main", label: "Amazon Main", size: "2000 x 2000", group: "Marketplace" },
  { id: "transparent_product", label: "Transparent PNG", size: "1600 x 1600", group: "Studio" },
  { id: "tiktok_square", label: "TikTok Square", size: "640 x 640", group: "Ads" },
  { id: "tiktok_horizontal", label: "TikTok Horizontal", size: "1200 x 628", group: "Ads" },
  { id: "tiktok_vertical", label: "TikTok Vertical", size: "720 x 1280", group: "Ads" },
  { id: "website_webp", label: "Website WebP", size: "1600 x 1600", group: "Website" },
];

const DEFAULT_PRESETS = ["daraz_square", "google_shopping", "transparent_product"];

export default function SellerStudioClient() {
  const [file, setFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState("");
  const [productName, setProductName] = useState("");
  const [selectedPresets, setSelectedPresets] = useState(DEFAULT_PRESETS);
  const [cleanupBackground, setCleanupBackground] = useState(true);
  const [smartCenter, setSmartCenter] = useState(true);
  const [addShadow, setAddShadow] = useState(false);
  const [polishOutput, setPolishOutput] = useState(true);
  const [subjectFillPercent, setSubjectFillPercent] = useState(84);
  const [previewStatus, setPreviewStatus] = useState<Status>("idle");
  const [outputPreview, setOutputPreview] = useState<PreviewResult | null>(null);
  const [previewMessage, setPreviewMessage] = useState("");
  const [packStatus, setPackStatus] = useState<Status>("idle");
  const [packMessage, setPackMessage] = useState("");

  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [primaryFeature, setPrimaryFeature] = useState("");
  const [audience, setAudience] = useState("");
  const [copyStatus, setCopyStatus] = useState<Status>("idle");
  const [copyResult, setCopyResult] = useState<ListingCopy | null>(null);
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    if (!file) return;

    const reader = new FileReader();
    let cancelled = false;
    reader.onload = () => {
      if (!cancelled && typeof reader.result === "string") {
        setSourcePreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);

    return () => {
      cancelled = true;
      reader.abort();
    };
  }, [file]);

  const canDownload = Boolean(
    outputPreview?.summary.can_download && previewStatus === "done",
  );

  function invalidatePreview() {
    setOutputPreview(null);
    setPreviewStatus("idle");
    setPreviewMessage("Settings changed. Generate a fresh preview before download.");
    setPackStatus("idle");
    setPackMessage("");
  }

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setSourcePreviewUrl("");
    setOutputPreview(null);
    setPreviewStatus("idle");
    setPreviewMessage("");
    setPackStatus("idle");
    setPackMessage("");

    if (nextFile && !productName) {
      setProductName(nextFile.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    }
  }

  function togglePreset(id: string) {
    setSelectedPresets((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
    invalidatePreview();
  }

  function updateCleanupBackground(value: boolean) {
    setCleanupBackground(value);
    invalidatePreview();
  }

  function updateSmartCenter(value: boolean) {
    setSmartCenter(value);
    invalidatePreview();
  }

  function updateShadow(value: boolean) {
    setAddShadow(value);
    invalidatePreview();
  }

  function updateFill(value: number) {
    setSubjectFillPercent(value);
    invalidatePreview();
  }

  function appendProcessingFields(formData: FormData) {
    formData.append("cleanup_background", String(cleanupBackground));
    formData.append("smart_center", String(smartCenter));
    formData.append("add_shadow", String(addShadow));
    formData.append("polish_output", String(polishOutput));
    formData.append("subject_fill_percent", String(subjectFillPercent));
  }

  async function previewAndValidateOutputs() {
    if (!file) {
      setPreviewStatus("error");
      setPreviewMessage("Select one product image first.");
      return;
    }
    if (selectedPresets.length === 0) {
      setPreviewStatus("error");
      setPreviewMessage("Select at least one output preset.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("preset_ids", selectedPresets.join(","));
    appendProcessingFields(formData);
    setPreviewStatus("working");
    setPreviewMessage(`Generating and validating ${selectedPresets.length} outputs...`);
    setOutputPreview(null);

    try {
      const response = await fetch(`${API_URL}/tools/preview-seller-studio`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(readErrorDetail(data, "Output preview failed."));
      }

      const result = (await response.json()) as PreviewResult;
      setOutputPreview(result);
      setPreviewStatus(result.summary.fail > 0 ? "error" : "done");
      setPreviewMessage(
        result.summary.fail > 0
          ? `${result.summary.fail} output failed. Download remains blocked.`
          : `${result.summary.pass} passed, ${result.summary.warning} need review. ZIP is unlocked.`,
      );
    } catch (error) {
      setPreviewStatus("error");
      setPreviewMessage(error instanceof Error ? error.message : "Output preview failed.");
    }
  }

  async function generateStudioPack() {
    if (!file || !canDownload) {
      setPackStatus("error");
      setPackMessage("Preview and pass generated-output quality checks before download.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("product_name", productName || "product");
    formData.append("preset_ids", selectedPresets.join(","));
    formData.append("strict_quality", "true");
    appendProcessingFields(formData);
    setPackStatus("working");
    setPackMessage(`Preparing ${selectedPresets.length} validated outputs...`);

    try {
      const headers = await getApiAuthHeaders();
      const response = await fetch(`${API_URL}/tools/generate-seller-pack`, {
        method: "POST",
        headers,
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(readErrorDetail(data, "Seller Studio pack failed."));
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slugify(productName || "product")}-seller-studio.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setPackStatus("done");
      setPackMessage("Validated Seller Studio ZIP downloaded successfully.");
    } catch (error) {
      setPackStatus("error");
      setPackMessage(error instanceof Error ? error.message : "Seller Studio pack failed.");
    }
  }

  async function generateCopy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (productName.trim().length < 2) {
      setCopyStatus("error");
      setCopyMessage("Add a product name first.");
      return;
    }

    const formData = new FormData();
    formData.append("product_name", productName);
    formData.append("brand", brand);
    formData.append("category", category);
    formData.append("primary_feature", primaryFeature);
    formData.append("audience", audience);
    setCopyStatus("working");
    setCopyMessage("Building listing copy...");

    try {
      const response = await fetch(`${API_URL}/tools/generate-listing-copy`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(readErrorDetail(data, "Listing copy generation failed."));
      }
      setCopyResult((await response.json()) as ListingCopy);
      setCopyStatus("done");
      setCopyMessage("Listing copy is ready for review.");
    } catch (error) {
      setCopyStatus("error");
      setCopyMessage(error instanceof Error ? error.message : "Listing copy generation failed.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8f5] text-[#172018]">
      <div className="mx-auto w-full max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dce4d8] pb-5">
          <Link href="/" className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f6f4f]">
            SBZ SellImage Pro
          </Link>
          <nav className="flex flex-wrap gap-2">
            <Link href="/" className="rounded-md border border-[#c8d7c5] bg-white px-4 py-2 text-sm font-semibold text-[#314632]">
              Batch generator
            </Link>
            <Link href="/dashboard" className="rounded-md bg-[#1f4f2a] px-4 py-2 text-sm font-semibold text-white">
              Dashboard
            </Link>
          </nav>
        </header>

        <section className="py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f6f4f]">Phase 7.2</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">Seller Studio Output Quality Gate</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#637063]">
            Prepare the product, preview every generated output, and download only after the final marketplace files pass quality control.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#4f6f4f]">1. Product photo</p>
                <h2 className="mt-1 text-2xl font-semibold">Prepare the master image</h2>
              </div>
              <span className="rounded-full bg-[#edf3eb] px-3 py-2 text-sm font-semibold text-[#314632]">
                {selectedPresets.length} outputs selected
              </span>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-[280px_1fr]">
              <label className="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#aebfac] bg-[#f3f6f1] text-center">
                {sourcePreviewUrl ? (
                  <Image src={sourcePreviewUrl} alt="Selected product preview" fill unoptimized className="object-contain p-3" sizes="280px" />
                ) : (
                  <span className="px-5 text-sm leading-6 text-[#637063]">Select JPG, PNG, or WebP product image</span>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectFile} className="sr-only" />
              </label>

              <div>
                <label className="block text-sm font-medium">
                  Product name
                  <input value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="e.g. Classic leather wallet" className="mt-2 w-full rounded-md border border-[#cbd8c7] bg-[#fbfcfa] px-3 py-2 outline-none ring-[#537c55] focus:ring-2" />
                </label>
                <div className="mt-5 grid gap-3 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
                  <OptionToggle label="Background cleanup" detail="Plain and checkerboard" checked={cleanupBackground} onChange={updateCleanupBackground} />
                  <OptionToggle label="Smart centering" detail="Normalize product position" checked={smartCenter} onChange={updateSmartCenter} />
                  <OptionToggle label="Natural shadow" detail="White outputs only" checked={addShadow} onChange={updateShadow} />
                  <OptionToggle label="Light polish" detail="Color, contrast, sharpness" checked={polishOutput} onChange={setPolishOutput} />
                </div>
                <label className="mt-5 block rounded-lg border border-[#dce4d8] p-4">
                  <span className="flex items-center justify-between gap-3 text-sm font-semibold">
                    Product fill target
                    <span>{subjectFillPercent}%</span>
                  </span>
                  <input type="range" min="65" max="92" value={subjectFillPercent} disabled={!smartCenter} onChange={(event) => updateFill(Number(event.target.value))} className="mt-3 w-full accent-[#1f4f2a] disabled:opacity-50" />
                  <span className="mt-2 block text-xs leading-5 text-[#637063]">Recommended marketplace range: 75-90% visible product fill.</span>
                </label>
              </div>
            </div>

            <div className="mt-7 border-t border-[#dce4d8] pt-5">
              <p className="text-sm font-semibold text-[#4f6f4f]">2. Output presets</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {STUDIO_PRESETS.map((preset) => {
                  const selected = selectedPresets.includes(preset.id);
                  return (
                    <button key={preset.id} type="button" onClick={() => togglePreset(preset.id)} className={selected ? "rounded-lg border border-[#1f4f2a] bg-[#edf7eb] p-4 text-left" : "rounded-lg border border-[#dce4d8] bg-white p-4 text-left hover:border-[#8eaa8b]"}>
                      <p className="text-xs font-semibold uppercase text-[#6b7b67]">{preset.group}</p>
                      <p className="mt-2 font-semibold">{preset.label}</p>
                      <p className="mt-1 text-sm text-[#637063]">{preset.size}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm lg:sticky lg:top-5">
            <h2 className="text-xl font-semibold">Quality-controlled export</h2>
            <p className="mt-2 text-sm leading-6 text-[#637063]">Preview runs checks on the final generated files. Failed outputs cannot be downloaded.</p>
            <button type="button" onClick={previewAndValidateOutputs} disabled={previewStatus === "working"} className="mt-5 w-full rounded-md border border-[#1f4f2a] px-4 py-3 text-sm font-semibold text-[#1f4f2a] disabled:opacity-60">
              {previewStatus === "working" ? "Generating preview..." : "Preview & validate outputs"}
            </button>
            <button type="button" onClick={generateStudioPack} disabled={packStatus === "working" || !canDownload} className="mt-3 w-full rounded-md bg-[#1f4f2a] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#91a392]">
              {packStatus === "working" ? "Preparing ZIP..." : "Download validated ZIP"}
            </button>
            <StatusMessage status={previewStatus} message={previewMessage} />
            <StatusMessage status={packStatus} message={packMessage} />
            {outputPreview ? <GateSummary summary={outputPreview.summary} /> : null}
            <div className="mt-5 border-t border-[#dce4d8] pt-4 text-sm text-[#637063]">
              <p>{file ? file.name : "No image selected"}</p>
              <p className="mt-2">Target fill: {subjectFillPercent}%</p>
              <p className="mt-2">Uploads and previews are processed temporarily.</p>
            </div>
          </aside>
        </section>

        {outputPreview ? <OutputPreviewReport preview={outputPreview} /> : null}

        <section className="my-8 rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#4f6f4f]">4. Listing copy</p>
              <h2 className="mt-1 text-2xl font-semibold">Create a clean listing draft</h2>
            </div>
            <span className="text-sm text-[#637063]">Template assistant, review facts before publishing</span>
          </div>
          <form onSubmit={generateCopy} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <TextField label="Brand" value={brand} onChange={setBrand} placeholder="e.g. SBZ" />
            <TextField label="Category" value={category} onChange={setCategory} placeholder="e.g. Wallet" />
            <TextField label="Primary feature" value={primaryFeature} onChange={setPrimaryFeature} placeholder="e.g. made with full-grain leather" />
            <TextField label="Audience" value={audience} onChange={setAudience} placeholder="e.g. men and gift buyers" />
            <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-4">
              <button type="submit" disabled={copyStatus === "working"} className="rounded-md bg-[#1f4f2a] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {copyStatus === "working" ? "Creating..." : "Generate listing draft"}
              </button>
              <StatusMessage status={copyStatus} message={copyMessage} compact />
            </div>
          </form>
          {copyResult ? <ListingCopyResult result={copyResult} /> : null}
        </section>
      </div>
    </main>
  );
}

function GateSummary({ summary }: { summary: PreviewResult["summary"] }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
      <div className="rounded-md bg-[#e5f4e5] p-2 text-[#276233]"><strong className="block text-base">{summary.pass}</strong>Pass</div>
      <div className="rounded-md bg-[#fff4cc] p-2 text-[#725d12]"><strong className="block text-base">{summary.warning}</strong>Review</div>
      <div className="rounded-md bg-[#fff0ec] p-2 text-[#9a3412]"><strong className="block text-base">{summary.fail}</strong>Blocked</div>
    </div>
  );
}

function OutputPreviewReport({ preview }: { preview: PreviewResult }) {
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#4f6f4f]">3. Final output preview</p>
          <h2 className="mt-1 text-2xl font-semibold">Validated marketplace files</h2>
        </div>
        <span className={preview.summary.can_download ? "rounded-full bg-[#1f4f2a] px-4 py-2 text-sm font-semibold text-white" : "rounded-full bg-[#9a3412] px-4 py-2 text-sm font-semibold text-white"}>
          {preview.summary.can_download ? "ZIP unlocked" : "ZIP blocked"}
        </span>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {preview.outputs.map((output) => (
          <article key={output.preset_id} className="overflow-hidden rounded-lg border border-[#dce4d8] bg-white shadow-sm">
            <div className="flex aspect-square items-center justify-center bg-[#eef1ec] p-3">
              <Image src={output.preview_data_url} alt={`${output.label} generated preview`} width={520} height={520} unoptimized className="max-h-full w-full object-contain" />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="font-semibold">{output.label}</h3><p className="mt-1 text-xs text-[#637063]">{output.output_width} x {output.output_height} {output.format} · {output.output_size_kb} KB</p></div>
                <StatusBadge status={output.quality_control.status} />
              </div>
              <p className="mt-3 text-sm leading-6 text-[#637063]">{output.quality_control.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#314632]">
                <span className="rounded-full bg-[#edf3eb] px-2 py-1">Fill {output.quality_control.metrics.subject_fill_percent}%</span>
                <span className="rounded-full bg-[#edf3eb] px-2 py-1">Score {output.quality_control.score}/100</span>
                <span className="rounded-full bg-[#edf3eb] px-2 py-1">{output.cleanup_method.replaceAll("_", " ")}</span>
              </div>
              <ul className="mt-4 space-y-2 border-t border-[#dce4d8] pt-3 text-xs leading-5">
                {output.quality_control.checks.map((check) => (
                  <li key={`${check.label}-${check.detail}`} className={check.status === "pass" ? "text-[#276233]" : check.status === "warning" ? "text-[#725d12]" : "text-[#9a3412]"}>
                    <strong>{check.label}:</strong> {check.detail}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function OptionToggle({ label, detail, checked, onChange }: { label: string; detail: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-lg border border-[#dce4d8] p-3">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 size-4 accent-[#1f4f2a]" />
      <span><span className="block text-sm font-semibold">{label}</span><span className="mt-1 block text-xs leading-5 text-[#637063]">{detail}</span></span>
    </label>
  );
}

function StatusMessage({ status, message, compact = false }: { status: Status; message: string; compact?: boolean }) {
  if (!message) return null;
  const tone = status === "error" ? "text-[#9a3412]" : status === "done" ? "text-[#276233]" : "text-[#637063]";
  return <p className={`${compact ? "text-sm" : "mt-3 rounded-md bg-[#f6f8f5] px-3 py-2 text-sm leading-6"} ${tone}`}>{message}</p>;
}

function StatusBadge({ status }: { status: CheckStatus }) {
  const styles = status === "pass" ? "bg-[#e5f4e5] text-[#276233]" : status === "warning" ? "bg-[#fff4cc] text-[#725d12]" : "bg-[#fff0ec] text-[#9a3412]";
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${styles}`}>{status}</span>;
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="text-sm font-medium">{label}<input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-md border border-[#cbd8c7] bg-[#fbfcfa] px-3 py-2 outline-none ring-[#537c55] focus:ring-2" /></label>;
}

function ListingCopyResult({ result }: { result: ListingCopy }) {
  return (
    <div className="mt-6 grid gap-4 border-t border-[#dce4d8] pt-5 lg:grid-cols-2">
      <CopyBlock title="Title options" lines={result.titles} />
      <CopyBlock title="Selling bullets" lines={result.bullets} />
      <CopyBlock title="Description" lines={[result.description]} />
      <CopyBlock title="Alt text & WhatsApp" lines={[result.alt_text, result.whatsapp_message]} />
    </div>
  );
}

function CopyBlock({ title, lines }: { title: string; lines: string[] }) {
  return <article className="rounded-lg bg-[#f6f8f5] p-4"><h3 className="font-semibold">{title}</h3><div className="mt-3 space-y-2 text-sm leading-6 text-[#314632]">{lines.map((line) => <p key={line}>{line}</p>)}</div></article>;
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

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "product";
}

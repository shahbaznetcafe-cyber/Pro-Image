"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

import { getApiAuthHeaders } from "@/lib/api-auth";
import { API_URL } from "@/lib/config";
import { MARKETPLACE_PRESETS, MARKETPLACE_REGIONS } from "@/lib/marketplace-presets";

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

const DEFAULT_PRESETS = ["amazon_main", "google_shopping", "transparent_product"];

export default function SellerStudioClient() {
  const [file, setFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState("");
  const [productName, setProductName] = useState("");
  const [selectedPresets, setSelectedPresets] = useState(DEFAULT_PRESETS);
  const [cleanupBackground, setCleanupBackground] = useState(true);
  const [smartCenter, setSmartCenter] = useState(true);
  const [addShadow, setAddShadow] = useState(false);
  const [polishOutput, setPolishOutput] = useState(true);
  const [subjectFillPercent, setSubjectFillPercent] = useState(85);
  const [region, setRegion] = useState("All regions");
  const [previewStatus, setPreviewStatus] = useState<Status>("idle");
  const [outputPreview, setOutputPreview] = useState<PreviewResult | null>(null);
  const [previewMessage, setPreviewMessage] = useState("");
  const [packStatus, setPackStatus] = useState<Status>("idle");
  const [packMessage, setPackMessage] = useState("");
  const studioPresets = useMemo(
    () => MARKETPLACE_PRESETS.filter((preset) => region === "All regions" || preset.regions.includes(region) || preset.regions.includes("Global")),
    [region],
  );

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

  function updatePolish(value: boolean) {
    setPolishOutput(value);
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

  return (
    <main className="min-h-screen bg-[#f6f8f5] text-[#172018]">
      <div className="mx-auto w-full max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dce4d8] pb-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold uppercase tracking-[0.16em] text-[#315c39]">
              SBZ SellImage Pro
            </Link>
            <span className="hidden h-5 w-px bg-[#d4ded1] sm:block" aria-hidden="true" />
            <span className="hidden text-sm text-[#637063] sm:inline">Single product workspace</span>
          </div>
          <nav aria-label="Product navigation" className="grid w-full grid-cols-4 gap-1 rounded-lg border border-[#dce4d8] bg-white p-1 shadow-sm sm:flex sm:w-auto sm:items-center">
            <Link href="/seller-studio" aria-current="page" className="rounded-md bg-[#edf3eb] px-2 py-2 text-center text-xs font-semibold text-[#1f4f2a] sm:px-3 sm:text-sm">
              Seller Studio
            </Link>
            <Link href="/batch-generator" className="rounded-md px-2 py-2 text-center text-xs font-semibold text-[#526052] hover:bg-[#f2f5f1] hover:text-[#1f4f2a] sm:px-3 sm:text-sm">
              Batch generator
            </Link>
            <Link href="/listing-assistant" className="rounded-md px-2 py-2 text-center text-xs font-semibold text-[#526052] hover:bg-[#f2f5f1] hover:text-[#1f4f2a] sm:px-3 sm:text-sm">
              Listing
            </Link>
            <Link href="/dashboard" className="rounded-md px-2 py-2 text-center text-xs font-semibold text-[#526052] hover:bg-[#f2f5f1] hover:text-[#1f4f2a] sm:px-3 sm:text-sm">
              Dashboard
            </Link>
          </nav>
        </header>

        <section className="py-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4f6f4f]">Single product workflow</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Create a publish-ready image pack</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#637063] sm:text-base">
                Upload once, set the product standard, review the final files, and export one validated ZIP.
              </p>
            </div>
            <span className="rounded-full border border-[#d4ded1] bg-white px-3 py-1.5 text-xs font-semibold text-[#526052]">
              Files processed temporarily
            </span>
          </div>
          <WorkflowProgress
            hasFile={Boolean(file)}
            hasPreview={Boolean(outputPreview)}
            canDownload={canDownload}
            exported={packStatus === "done"}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f6f4f]">Step 1</p>
                <h2 className="mt-1 text-2xl font-semibold">Add and prepare your product</h2>
              </div>
              <span className="rounded-full bg-[#edf3eb] px-3 py-2 text-sm font-semibold text-[#314632]">
                {selectedPresets.length} outputs selected
              </span>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-[280px_1fr]">
              <label className="group relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#aebfac] bg-[#f3f6f1] text-center transition hover:border-[#537c55] hover:bg-[#eef4ec] focus-within:ring-2 focus-within:ring-[#537c55] focus-within:ring-offset-2">
                {sourcePreviewUrl ? (
                  <>
                    <Image src={sourcePreviewUrl} alt="Selected product preview" fill unoptimized className="object-contain p-3" sizes="280px" />
                    <span className="absolute inset-x-3 bottom-3 rounded-md bg-[#172018]/85 px-3 py-2 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                      Replace image
                    </span>
                  </>
                ) : (
                  <span className="px-6">
                    <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-white text-xl text-[#315c39] shadow-sm" aria-hidden="true">+</span>
                    <span className="mt-3 block text-sm font-semibold text-[#314632]">Upload product image</span>
                    <span className="mt-1 block text-xs leading-5 text-[#637063]">JPG, PNG, or WebP</span>
                  </span>
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectFile} className="sr-only" />
              </label>

              <div>
                <label className="block text-sm font-medium">
                  Product name
                  <input value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="e.g. Classic leather wallet" className="mt-2 w-full rounded-md border border-[#cbd8c7] bg-[#fbfcfa] px-3 py-2 outline-none ring-[#537c55] focus:ring-2" />
                </label>
                <div className="mt-5 grid gap-3 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
                  <OptionToggle label="Background cleanup" detail="Clean edges and checkerboard" checked={cleanupBackground} onChange={updateCleanupBackground} />
                  <OptionToggle label="Smart centering" detail="Crop and center the product" checked={smartCenter} onChange={updateSmartCenter} />
                  <OptionToggle label="Natural shadow" detail="White outputs only" checked={addShadow} onChange={updateShadow} />
                  <OptionToggle label="Light polish" detail="Color, contrast, sharpness" checked={polishOutput} onChange={updatePolish} />
                </div>
                <label className="mt-5 block rounded-lg border border-[#dce4d8] p-4">
                  <span className="flex items-center justify-between gap-3 text-sm font-semibold">
                    Product fill target
                    <span>{subjectFillPercent}%</span>
                  </span>
                  <input type="range" min="65" max="92" value={subjectFillPercent} disabled={!smartCenter} onChange={(event) => updateFill(Number(event.target.value))} className="mt-3 w-full accent-[#1f4f2a] disabled:opacity-50" />
                  <span className="mt-2 block text-xs leading-5 text-[#637063]">85% is the safest general main-image target; each output is checked against its own marketplace policy.</span>
                </label>
              </div>
            </div>

            <div className="mt-7 border-t border-[#dce4d8] pt-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f6f4f]">Step 2 - Choose outputs</p>
                <label className="text-xs font-semibold text-[#526050]">
                  Market region
                  <select value={region} onChange={(event) => setRegion(event.target.value)} className="ml-2 rounded-md border border-[#c8d7c5] bg-white px-2 py-1.5 outline-none focus:ring-2 focus:ring-[#537c55]">
                    {MARKETPLACE_REGIONS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {studioPresets.map((preset) => {
                  const selected = selectedPresets.includes(preset.id);
                  return (
                    <button key={preset.id} type="button" aria-pressed={selected} onClick={() => togglePreset(preset.id)} className={selected ? "relative rounded-lg border border-[#1f4f2a] bg-[#edf7eb] p-4 text-left outline-none ring-[#537c55] focus-visible:ring-2 focus-visible:ring-offset-2" : "relative rounded-lg border border-[#dce4d8] bg-white p-4 text-left outline-none hover:border-[#8eaa8b] focus-visible:ring-2 focus-visible:ring-[#537c55] focus-visible:ring-offset-2"}>
                      <span className={selected ? "absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-[#1f4f2a] text-xs text-white" : "absolute right-3 top-3 size-5 rounded-full border border-[#b8c5b5]"} aria-hidden="true">{selected ? "\u2713" : ""}</span>
                      <p className="pr-7 text-xs font-semibold uppercase text-[#6b7b67]">{preset.group}</p>
                      <p className="mt-2 font-semibold">{preset.label}</p>
                      <p className="mt-1 text-sm text-[#637063]">{preset.size}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-lg border border-[#cad8c7] bg-white p-5 shadow-sm lg:sticky lg:top-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f6f4f]">Steps 3 and 4</p>
            <h2 className="mt-1 text-xl font-semibold">Review and export</h2>
            <p className="mt-2 text-sm leading-6 text-[#637063]">Generate the real files first. Every selected output is checked before download.</p>
            <ExportChecklist hasFile={Boolean(file)} hasOutputs={selectedPresets.length > 0} preview={outputPreview} />
            <button type="button" onClick={previewAndValidateOutputs} disabled={previewStatus === "working" || !file || selectedPresets.length === 0} className="mt-5 w-full rounded-md bg-[#1f4f2a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#173d20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#537c55] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#a6b3a4]">
              {previewStatus === "working" ? "Generating and checking..." : outputPreview ? "Regenerate preview" : "Generate preview"}
            </button>
            <button type="button" onClick={generateStudioPack} disabled={packStatus === "working" || !canDownload} className="mt-3 w-full rounded-md border border-[#1f4f2a] bg-white px-4 py-3 text-sm font-semibold text-[#1f4f2a] transition hover:bg-[#edf3eb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#537c55] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-[#ccd5ca] disabled:text-[#8a9689] disabled:hover:bg-white">
              {packStatus === "working" ? "Preparing ZIP..." : "Download validated ZIP"}
            </button>
            <StatusMessage status={previewStatus} message={previewMessage} />
            <StatusMessage status={packStatus} message={packMessage} />
            {outputPreview ? <GateSummary summary={outputPreview.summary} /> : null}
            <div className="mt-5 border-t border-[#dce4d8] pt-4 text-sm text-[#637063]">
              <p className="truncate font-medium text-[#405040]">{file ? file.name : "Waiting for a product image"}</p>
              <p className="mt-2">{selectedPresets.length} outputs / {subjectFillPercent}% target fill</p>
            </div>
          </aside>
        </section>

        {outputPreview ? <OutputPreviewReport preview={outputPreview} /> : null}

      </div>
    </main>
  );
}

function WorkflowProgress({
  hasFile,
  hasPreview,
  canDownload,
  exported,
}: {
  hasFile: boolean;
  hasPreview: boolean;
  canDownload: boolean;
  exported: boolean;
}) {
  const steps = [
    {
      label: "Source",
      detail: "Upload product",
      status: hasFile ? "complete" : "current",
    },
    {
      label: "Configure",
      detail: "Set outputs",
      status: hasPreview ? "complete" : hasFile ? "current" : "upcoming",
    },
    {
      label: "Review",
      detail: "Check quality",
      status: canDownload ? "complete" : hasPreview ? "current" : "upcoming",
    },
    {
      label: "Export",
      detail: "Download ZIP",
      status: exported ? "complete" : canDownload ? "current" : "upcoming",
    },
  ];

  return (
    <ol aria-label="Seller Studio progress" className="mt-6 grid grid-cols-2 overflow-hidden rounded-lg border border-[#dce4d8] bg-white sm:grid-cols-4">
      {steps.map((step, index) => {
        const complete = step.status === "complete";
        const current = step.status === "current";
        return (
          <li key={step.label} aria-current={current ? "step" : undefined} className={`relative flex items-center gap-3 px-3 py-3 sm:px-4 ${index % 2 === 1 ? "border-l border-[#e3e9e1]" : ""} ${index >= 2 ? "border-t border-[#e3e9e1]" : ""} ${index > 0 ? "sm:border-l sm:border-t-0" : ""}`}>
            <span className={complete ? "flex size-7 shrink-0 items-center justify-center rounded-full bg-[#1f4f2a] text-xs font-semibold text-white" : current ? "flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-[#1f4f2a] bg-white text-xs font-semibold text-[#1f4f2a]" : "flex size-7 shrink-0 items-center justify-center rounded-full border border-[#c7d1c4] bg-[#f6f8f5] text-xs font-semibold text-[#7a8679]"}>
              {complete ? "\u2713" : index + 1}
            </span>
            <span className="min-w-0">
              <span className={current || complete ? "block text-sm font-semibold text-[#263b29]" : "block text-sm font-semibold text-[#7a8679]"}>{step.label}</span>
              <span className="block truncate text-xs text-[#6b776a]">{step.detail}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ExportChecklist({
  hasFile,
  hasOutputs,
  preview,
}: {
  hasFile: boolean;
  hasOutputs: boolean;
  preview: PreviewResult | null;
}) {
  const qualityReady = Boolean(preview?.summary.can_download);
  const qualityDetail = preview
    ? qualityReady
      ? `${preview.summary.pass} pass, ${preview.summary.warning} review`
      : `${preview.summary.fail} blocked output${preview.summary.fail === 1 ? "" : "s"}`
    : "Preview not generated";

  return (
    <div className="mt-5 divide-y divide-[#e3e9e1] rounded-lg border border-[#e0e7de] bg-[#f8faf7] px-3">
      <ChecklistItem label="Product source" detail={hasFile ? "Image ready" : "Upload required"} complete={hasFile} />
      <ChecklistItem label="Output selection" detail={hasOutputs ? "Presets selected" : "Choose at least one"} complete={hasOutputs} />
      <ChecklistItem label="Quality gate" detail={qualityDetail} complete={qualityReady} warning={Boolean(preview && !qualityReady)} />
    </div>
  );
}

function ChecklistItem({
  label,
  detail,
  complete,
  warning = false,
}: {
  label: string;
  detail: string;
  complete: boolean;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 text-sm">
      <span className="font-medium text-[#405040]">{label}</span>
      <span className={complete ? "flex items-center gap-1.5 text-xs font-semibold text-[#276233]" : warning ? "flex items-center gap-1.5 text-xs font-semibold text-[#9a3412]" : "flex items-center gap-1.5 text-xs font-medium text-[#7a8679]"}>
        <span className={complete ? "size-2 rounded-full bg-[#3e7b47]" : warning ? "size-2 rounded-full bg-[#c2410c]" : "size-2 rounded-full bg-[#b8c4b5]"} aria-hidden="true" />
        {detail}
      </span>
    </div>
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
    <section id="output-review" className="mt-8" aria-labelledby="output-review-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4f6f4f]">Step 3 - Review</p>
          <h2 id="output-review-heading" className="mt-1 text-2xl font-semibold">Check the generated files</h2>
          <p className="mt-2 text-sm text-[#637063]">Review warnings before exporting. Failed files keep the ZIP locked.</p>
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
                <div><h3 className="font-semibold">{output.label}</h3><p className="mt-1 text-xs text-[#637063]">{output.output_width} x {output.output_height} / {output.format} / {output.output_size_kb} KB</p></div>
                <StatusBadge status={output.quality_control.status} />
              </div>
              <p className="mt-3 text-sm leading-6 text-[#637063]">{output.quality_control.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#314632]">
                <span className="rounded-full bg-[#edf3eb] px-2 py-1">Fill {output.quality_control.metrics.subject_fill_percent}%</span>
                <span className="rounded-full bg-[#edf3eb] px-2 py-1">Score {output.quality_control.score}/100</span>
                <span className="rounded-full bg-[#edf3eb] px-2 py-1">{output.cleanup_method.replaceAll("_", " ")}</span>
              </div>
              <details className="group mt-4 border-t border-[#dce4d8] pt-3" open={output.quality_control.status !== "pass"}>
                <summary className="cursor-pointer list-none text-xs font-semibold text-[#405040] outline-none focus-visible:ring-2 focus-visible:ring-[#537c55]">
                  <span className="flex items-center justify-between gap-3">
                    Quality details
                    <span className="text-[#718070] transition group-open:rotate-180" aria-hidden="true">v</span>
                  </span>
                </summary>
                <ul className="mt-3 space-y-2 text-xs leading-5">
                  {output.quality_control.checks.map((check) => (
                    <li key={`${check.label}-${check.detail}`} className={check.status === "pass" ? "text-[#276233]" : check.status === "warning" ? "text-[#725d12]" : "text-[#9a3412]"}>
                      <strong>{check.label}:</strong> {check.detail}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function OptionToggle({ label, detail, checked, onChange }: { label: string; detail: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className={checked ? "flex cursor-pointer gap-3 rounded-lg border border-[#b8cbb5] bg-[#f7faf6] p-3" : "flex cursor-pointer gap-3 rounded-lg border border-[#dce4d8] bg-white p-3"}>
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

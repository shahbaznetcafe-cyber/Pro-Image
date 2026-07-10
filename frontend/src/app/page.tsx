"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";

import { getApiAuthHeaders } from "@/lib/api-auth";
import { API_URL } from "@/lib/config";
import { SEO_TOOL_PAGES } from "@/lib/seo-pages";

type Preset = {
  id: string;
  label: string;
  size: string;
  group: string;
  description: string;
};

type SavedPreset = {
  name: string;
  ids: string[];
};

type ImageAnalysis = {
  filename: string;
  width: number;
  height: number;
  quality_score: number;
  sharpness_score: number;
  background_score: number;
  centering_score: number;
  fill_percent: number;
  warnings: string[];
  title_suggestions: string[];
  recommended_presets: string[];
};

const SAVED_PRESETS_KEY = "sbz-sellimage-saved-presets";

const PRESETS: Preset[] = [
  {
    id: "amazon_main",
    label: "Amazon Main",
    size: "2000 x 2000 JPG",
    group: "Marketplace",
    description: "Square white-canvas main product image.",
  },
  {
    id: "etsy_listing",
    label: "Etsy Listing",
    size: "2000 x 2000 JPG",
    group: "Marketplace",
    description: "High-res square listing image.",
  },
  {
    id: "shopify_product",
    label: "Shopify Product",
    size: "2048 x 2048 JPG",
    group: "Marketplace",
    description: "Large storefront product image.",
  },
  {
    id: "meta_square",
    label: "Meta Feed",
    size: "1080 x 1080 JPG",
    group: "Ads",
    description: "Facebook and Instagram square creative.",
  },
  {
    id: "meta_portrait",
    label: "Instagram Portrait",
    size: "1080 x 1350 JPG",
    group: "Ads",
    description: "Vertical 4:5 ad and feed image.",
  },
  {
    id: "story_reel",
    label: "Story/Reel",
    size: "1080 x 1920 JPG",
    group: "Ads",
    description: "Full-screen story and reel creative.",
  },
  {
    id: "whatsapp_catalog",
    label: "WhatsApp Catalog",
    size: "1000 x 1000 JPG",
    group: "Catalog",
    description: "Compressed catalog-ready product image.",
  },
  {
    id: "website_webp",
    label: "Website WebP",
    size: "1600 x 1600 WebP",
    group: "Website",
    description: "Optimized product image for websites.",
  },
  {
    id: "daraz_square",
    label: "Daraz Product",
    size: "1000 x 1000 JPG",
    group: "Marketplace",
    description: "Clean square product image for Daraz listings.",
  },
  {
    id: "google_shopping",
    label: "Google Shopping",
    size: "1500 x 1500 JPG",
    group: "Marketplace",
    description: "High-resolution shopping feed product image.",
  },
  {
    id: "tiktok_square",
    label: "TikTok Square",
    size: "640 x 640 JPG",
    group: "Ads",
    description: "Square TikTok image ad output.",
  },
  {
    id: "tiktok_horizontal",
    label: "TikTok Horizontal",
    size: "1200 x 628 JPG",
    group: "Ads",
    description: "Horizontal TikTok image ad output.",
  },
  {
    id: "tiktok_vertical",
    label: "TikTok Vertical",
    size: "720 x 1280 JPG",
    group: "Ads",
    description: "Vertical TikTok image ad output.",
  },
];

const DEFAULT_SELECTED = [
  "amazon_main",
  "shopify_product",
  "meta_square",
  "website_webp",
];

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [projectName, setProjectName] = useState("");
  const [presetName, setPresetName] = useState("");
  const [savedPresets, setSavedPresets] =
    useState<SavedPreset[]>(loadSavedPresets);
  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTED);
  const [cleanupBackground, setCleanupBackground] = useState(true);
  const [smartCenter, setSmartCenter] = useState(true);
  const [polishOutput, setPolishOutput] = useState(true);
  const [strictQuality, setStrictQuality] = useState(true);
  const [subjectFillPercent, setSubjectFillPercent] = useState(84);
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">(
    "idle",
  );
  const [analysisStatus, setAnalysisStatus] = useState<
    "idle" | "working" | "done" | "error"
  >("idle");
  const [analysisResults, setAnalysisResults] = useState<ImageAnalysis[]>([]);
  const [message, setMessage] = useState("");
  const [analysisMessage, setAnalysisMessage] = useState("");

  const selectedCount = selected.length;
  const outputCount = files.length * selectedCount;
  const totalSizeMb = useMemo(
    () => files.reduce((total, file) => total + file.size, 0) / 1024 / 1024,
    [files],
  );
  const fileSummary = useMemo(() => {
    if (files.length === 0) {
      return "JPG, PNG, or WebP. Batch limit: 30 images.";
    }

    if (files.length === 1) {
      return `${files[0].name} - ${(files[0].size / 1024 / 1024).toFixed(2)} MB`;
    }

    return `${files.length} images selected - ${totalSizeMb.toFixed(2)} MB total`;
  }, [files, totalSizeMb]);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []));
    setStatus("idle");
    setAnalysisStatus("idle");
    setAnalysisResults([]);
    setMessage("");
    setAnalysisMessage("");
  }

  function togglePreset(id: string) {
    setSelected((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      return [...current, id];
    });
  }

  function selectGroup(group: string) {
    setSelected(PRESETS.filter((preset) => preset.group === group).map((preset) => preset.id));
  }

  function saveCurrentPreset() {
    const name = presetName.trim();
    if (!name || selected.length === 0) {
      setStatus("error");
      setMessage("Add a preset name and select at least one output.");
      return;
    }

    const next = [
      ...savedPresets.filter((preset) => preset.name.toLowerCase() !== name.toLowerCase()),
      { name, ids: selected },
    ];

    setSavedPresets(next);
    window.localStorage.setItem(SAVED_PRESETS_KEY, JSON.stringify(next));
    setPresetName("");
    setStatus("done");
    setMessage(`Saved preset "${name}".`);
  }

  function applySavedPreset(name: string) {
    const saved = savedPresets.find((preset) => preset.name === name);
    if (saved) {
      setSelected(saved.ids);
    }
  }

  function deleteSavedPreset(name: string) {
    const next = savedPresets.filter((preset) => preset.name !== name);
    setSavedPresets(next);
    window.localStorage.setItem(SAVED_PRESETS_KEY, JSON.stringify(next));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (files.length === 0) {
      setStatus("error");
      setMessage("Please select at least one product image.");
      return;
    }

    if (files.length > 30) {
      setStatus("error");
      setMessage("Batch limit is 30 images for this MVP.");
      return;
    }

    if (selected.length === 0) {
      setStatus("error");
      setMessage("Select at least one output preset.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("preset_ids", selected.join(","));
    formData.append("project_name", projectName);
    formData.append("cleanup_background", String(cleanupBackground));
    formData.append("smart_center", String(smartCenter));
    formData.append("polish_output", String(polishOutput));
    formData.append("subject_fill_percent", String(subjectFillPercent));
    formData.append("strict_quality", String(strictQuality));

    setStatus("working");
    setMessage(`Generating ${outputCount} seller images...`);

    try {
      const headers = await getApiAuthHeaders();
      const response = await fetch(`${API_URL}/tools/generate-batch-seller-pack`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail ?? "Batch image pack generation failed.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slugify(projectName || "seller-pack")}-batch-seller-pack.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setStatus("done");
      setMessage(`ZIP downloaded with ${outputCount} generated outputs.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong.");
    }
  }

  async function analyzeSelectedImages() {
    if (files.length === 0) {
      setAnalysisStatus("error");
      setAnalysisMessage("Select images before running quality analysis.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    setAnalysisStatus("working");
    setAnalysisMessage("Checking blur, background, centering, and size...");

    try {
      const response = await fetch(`${API_URL}/tools/analyze-images`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail ?? "Image analysis failed.");
      }

      const data = (await response.json()) as {
        average_quality_score: number;
        results: ImageAnalysis[];
      };
      setAnalysisResults(data.results);
      setAnalysisStatus("done");
      setAnalysisMessage(`Average quality score: ${data.average_quality_score}/100`);
    } catch (error) {
      setAnalysisStatus("error");
      setAnalysisMessage(
        error instanceof Error ? error.message : "Image analysis failed.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8f5] text-[#172018]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dce4d8] pb-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f6f4f]">
              SBZ SellImage Pro
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Batch Seller Image Pack Generator
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/seller-studio"
              className="rounded-md border border-[#1f4f2a] bg-[#edf7eb] px-4 py-2 text-sm font-semibold text-[#1f4f2a] hover:bg-[#e4f1e1]"
            >
              Seller Studio
            </Link>
            <Link
              href="/pricing"
              className="rounded-md border border-[#c8d7c5] bg-white px-4 py-2 text-sm font-semibold text-[#314632] hover:bg-[#f3f6f1]"
            >
              Pricing
            </Link>
            <Link
              href="/api-docs"
              className="rounded-md border border-[#c8d7c5] bg-white px-4 py-2 text-sm font-semibold text-[#314632] hover:bg-[#f3f6f1]"
            >
              API
            </Link>
            <Link
              href="/launch-checklist"
              className="rounded-md border border-[#c8d7c5] bg-white px-4 py-2 text-sm font-semibold text-[#314632] hover:bg-[#f3f6f1]"
            >
              Launch
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md bg-[#1f4f2a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173d20]"
            >
              Dashboard
            </Link>
          </div>
        </header>

        <section id="generator" className="grid flex-1 gap-6 py-6 lg:grid-cols-[430px_1fr]">
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-5 rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm"
          >
            <div>
              <h2 className="text-xl font-semibold">Create Batch Pack</h2>
              <p className="mt-1 text-sm leading-6 text-[#637063]">
                Upload multiple product photos, choose outputs, and download one
                client-ready ZIP with organized folders.
              </p>
            </div>

            <div className="rounded-md border border-[#c8d7c5] bg-[#edf7eb] px-4 py-3 text-sm leading-6 text-[#314632]">
              {files.length === 1 ? (
                <>
                  One image selected. For deep cleanup, final previews, and
                  listing copy, use <Link href="/seller-studio" className="font-semibold underline">Seller Studio</Link>.
                </>
              ) : (
                <>
                  Batch mode is for repeating the same seller-ready settings
                  across multiple product images.
                </>
              )}
            </div>

            <label className="block">
              <span className="text-sm font-medium">Project or client folder</span>
              <input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="e.g. july-cosmetics-client"
                className="mt-2 w-full rounded-md border border-[#cbd8c7] bg-[#fbfcfa] px-3 py-2 text-sm outline-none ring-[#537c55] focus:ring-2"
              />
            </label>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#aebfac] bg-[#fbfcfa] px-4 py-8 text-center transition hover:border-[#537c55]">
              <span className="text-base font-semibold">Upload product images</span>
              <span className="mt-2 text-sm text-[#637063]">{fileSummary}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={onFileChange}
                className="sr-only"
              />
            </label>

            {files.length > 0 ? (
              <div className="rounded-md border border-[#dce4d8] bg-[#fbfcfa] p-3">
                <p className="text-sm font-semibold">Selected images</p>
                <ul className="mt-2 space-y-1 text-sm text-[#637063]">
                  {files.slice(0, 5).map((file) => (
                    <li key={`${file.name}-${file.size}`}>{file.name}</li>
                  ))}
                </ul>
                {files.length > 5 ? (
                  <p className="mt-2 text-sm text-[#637063]">
                    +{files.length - 5} more images
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <Metric label="Images" value={String(files.length)} />
              <Metric label="Outputs" value={String(outputCount)} />
            </div>

            <section className="rounded-md border border-[#dce4d8] bg-[#fbfcfa] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Processing quality</h3>
                  <p className="mt-1 text-xs leading-5 text-[#637063]">
                    Applied consistently to every image in this ZIP.
                  </p>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-[#526050]">
                  {subjectFillPercent}% fill
                </span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <BatchToggle label="Background cleanup" checked={cleanupBackground} onChange={setCleanupBackground} />
                <BatchToggle label="Smart centering" checked={smartCenter} onChange={setSmartCenter} />
                <BatchToggle label="Light polish" checked={polishOutput} onChange={setPolishOutput} />
                <BatchToggle label="Strict quality gate" checked={strictQuality} onChange={setStrictQuality} />
              </div>
              <label className="mt-4 block text-xs font-semibold text-[#314632]">
                Product fill target: {subjectFillPercent}%
                <input
                  type="range"
                  min="65"
                  max="92"
                  value={subjectFillPercent}
                  disabled={!smartCenter}
                  onChange={(event) => setSubjectFillPercent(Number(event.target.value))}
                  className="mt-2 w-full accent-[#1f4f2a] disabled:opacity-50"
                />
              </label>
            </section>

            <button
              type="button"
              onClick={analyzeSelectedImages}
              disabled={analysisStatus === "working"}
              className="rounded-md border border-[#c8d7c5] px-4 py-3 text-sm font-semibold text-[#314632] transition hover:bg-[#f3f6f1] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {analysisStatus === "working"
                ? "Analyzing..."
                : "Run Quality Assistant"}
            </button>

            <button
              type="submit"
              disabled={status === "working"}
              className="rounded-md bg-[#1f4f2a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#173d20] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === "working" ? "Generating..." : "Generate Batch ZIP"}
            </button>

            {message ? (
              <div
                className={
                  status === "error"
                    ? "rounded-md border border-[#efb8ad] bg-[#fff4f1] px-4 py-3 text-sm text-[#9a3412]"
                    : "rounded-md border border-[#b9d9b3] bg-[#f1f8ef] px-4 py-3 text-sm text-[#276233]"
                }
              >
                {message}
              </div>
            ) : null}

            {analysisMessage ? (
              <div
                className={
                  analysisStatus === "error"
                    ? "rounded-md border border-[#efb8ad] bg-[#fff4f1] px-4 py-3 text-sm text-[#9a3412]"
                    : "rounded-md border border-[#b9d9b3] bg-[#f1f8ef] px-4 py-3 text-sm text-[#276233]"
                }
              >
                {analysisMessage}
              </div>
            ) : null}
          </form>

          <div className="flex flex-col gap-5">
            <div className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Output Presets</h2>
                  <p className="mt-1 text-sm text-[#637063]">
                    Select outputs once, save the combination, and reuse it for
                    the next client.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(PRESETS.map((preset) => preset.id))}
                    className="rounded-md border border-[#c8d7c5] px-3 py-2 text-sm font-medium hover:bg-[#f3f6f1]"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected([])}
                    className="rounded-md border border-[#c8d7c5] px-3 py-2 text-sm font-medium hover:bg-[#f3f6f1]"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => selectGroup("Marketplace")}
                  className="rounded-full bg-[#edf3eb] px-3 py-2 text-sm font-semibold text-[#314632]"
                >
                  Marketplace
                </button>
                <button
                  type="button"
                  onClick={() => selectGroup("Ads")}
                  className="rounded-full bg-[#edf3eb] px-3 py-2 text-sm font-semibold text-[#314632]"
                >
                  Ads
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(["whatsapp_catalog", "website_webp"])}
                  className="rounded-full bg-[#edf3eb] px-3 py-2 text-sm font-semibold text-[#314632]"
                >
                  Catalog + Website
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(DEFAULT_SELECTED)}
                  className="rounded-full bg-[#edf3eb] px-3 py-2 text-sm font-semibold text-[#314632]"
                >
                  Default seller pack
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {PRESETS.map((preset) => {
                  const isSelected = selected.includes(preset.id);

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => togglePreset(preset.id)}
                      className={
                        isSelected
                          ? "rounded-lg border border-[#1f4f2a] bg-[#edf7eb] p-4 text-left shadow-sm"
                          : "rounded-lg border border-[#dce4d8] bg-white p-4 text-left hover:border-[#8eaa8b]"
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7b67]">
                            {preset.group}
                          </p>
                          <h3 className="mt-2 font-semibold">{preset.label}</h3>
                        </div>
                        <span
                          className={
                            isSelected
                              ? "rounded-full bg-[#1f4f2a] px-2 py-1 text-xs font-semibold text-white"
                              : "rounded-full bg-[#eef2ed] px-2 py-1 text-xs font-semibold text-[#526050]"
                          }
                        >
                          {isSelected ? "On" : "Off"}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-medium text-[#314632]">
                        {preset.size}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#637063]">
                        {preset.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Saved Presets</h2>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                  placeholder="e.g. Net cafe full pack"
                  className="min-w-0 flex-1 rounded-md border border-[#cbd8c7] bg-[#fbfcfa] px-3 py-2 text-sm outline-none ring-[#537c55] focus:ring-2"
                />
                <button
                  type="button"
                  onClick={saveCurrentPreset}
                  className="rounded-md bg-[#1f4f2a] px-4 py-2 text-sm font-semibold text-white"
                >
                  Save current
                </button>
              </div>

              {savedPresets.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {savedPresets.map((preset) => (
                    <div
                      key={preset.name}
                      className="flex items-center gap-2 rounded-full border border-[#c8d7c5] bg-[#fbfcfa] px-3 py-2 text-sm"
                    >
                      <button
                        type="button"
                        onClick={() => applySavedPreset(preset.name)}
                        className="font-semibold text-[#314632]"
                      >
                        {preset.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSavedPreset(preset.name)}
                        className="text-[#9a3412]"
                        aria-label={`Delete ${preset.name}`}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-[#637063]">
                  No saved presets yet. Save one for repeat client work.
                </p>
              )}
            </div>

            <div className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f6f4f]">
                    Phase 5
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    Quality Assistant
                  </h2>
                </div>
                <span className="rounded-full bg-[#edf3eb] px-3 py-2 text-sm font-semibold text-[#314632]">
                  Local analysis
                </span>
              </div>

              {analysisResults.length > 0 ? (
                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {analysisResults.map((result) => (
                    <article
                      key={`${result.filename}-${result.width}-${result.height}`}
                      className="rounded-lg border border-[#dce4d8] bg-[#fbfcfa] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{result.filename}</h3>
                          <p className="mt-1 text-sm text-[#637063]">
                            {result.width} x {result.height}
                          </p>
                        </div>
                        <span className={scoreBadgeClass(result.quality_score)}>
                          {result.quality_score}/100
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <MiniScore label="Sharpness" value={result.sharpness_score} />
                        <MiniScore label="Background" value={result.background_score} />
                        <MiniScore label="Centering" value={result.centering_score} />
                        <MiniScore label="Fill" value={result.fill_percent} suffix="%" />
                      </div>

                      {result.warnings.length > 0 ? (
                        <ul className="mt-4 space-y-2 text-sm leading-6 text-[#9a3412]">
                          {result.warnings.map((warning) => (
                            <li key={warning}>- {warning}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-4 rounded-md bg-[#edf3eb] px-3 py-2 text-sm text-[#276233]">
                          No major quality warnings.
                        </p>
                      )}

                      <div className="mt-4 border-t border-[#dce4d8] pt-3">
                        <p className="text-sm font-semibold">Title ideas</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {result.title_suggestions.map((title) => (
                            <span
                              key={title}
                              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#314632]"
                            >
                              {title}
                            </span>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-[#637063]">
                  Select images and run the assistant to catch blur, weak
                  background, off-center products, and low-resolution inputs
                  before generating ZIP packs.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="border-t border-[#dce4d8] py-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f6f4f]">
                Public tools
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Image resizer pages for seller search traffic
              </h2>
            </div>
            <Link
              href="/marketplace-image-resizer"
              className="rounded-md border border-[#c8d7c5] bg-white px-4 py-2 text-sm font-semibold text-[#314632] hover:bg-[#f3f6f1]"
            >
              View marketplace page
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SEO_TOOL_PAGES.slice(0, 9).map((page) => (
              <Link
                key={page.slug}
                href={`/${page.slug}`}
                className="rounded-lg border border-[#dce4d8] bg-white p-4 shadow-sm hover:border-[#8eaa8b]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7b67]">
                  {page.eyebrow}
                </p>
                <h3 className="mt-2 font-semibold">{page.h1}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#637063]">
                  {page.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#dce4d8] bg-white p-4 shadow-sm">
      <p className="text-sm text-[#637063]">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function BatchToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[#dce4d8] bg-white px-3 py-2 text-sm font-medium text-[#314632]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-[#1f4f2a]"
      />
      {label}
    </label>
  );
}

function MiniScore({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-md bg-white px-3 py-2">
      <p className="text-xs text-[#637063]">{label}</p>
      <p className="mt-1 font-semibold">
        {value}
        {suffix}
      </p>
    </div>
  );
}

function scoreBadgeClass(score: number) {
  if (score >= 80) {
    return "rounded-full bg-[#1f4f2a] px-3 py-1 text-sm font-semibold text-white";
  }

  if (score >= 60) {
    return "rounded-full bg-[#f5d36c] px-3 py-1 text-sm font-semibold text-[#3f3515]";
  }

  return "rounded-full bg-[#fff4f1] px-3 py-1 text-sm font-semibold text-[#9a3412]";
}

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "seller-pack"
  );
}

function loadSavedPresets() {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(SAVED_PRESETS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as SavedPreset[];
    return parsed.filter((item) => item.name && item.ids.length);
  } catch {
    window.localStorage.removeItem(SAVED_PRESETS_KEY);
    return [];
  }
}

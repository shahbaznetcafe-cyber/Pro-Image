/** Client for the async batch seller-pack queue, with inline fallback. */

import { API_URL } from "@/lib/config";
import { coerceDetail, sleep } from "@/lib/download";

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_MS = 10 * 60 * 1000;

type BatchJobStatus = {
  status: string;
  completed_outputs?: number;
  total_outputs?: number;
  error?: string | null;
};

export type RunBatchOptions = {
  formData: FormData;
  headers: HeadersInit;
  /** Output count used for progress messaging before the server reports one. */
  fallbackTotal: number;
  onProgress?: (message: string) => void;
};

/**
 * Submit a batch seller-pack job and resolve with the finished ZIP blob.
 *
 * Uses the async queue (`/tools/batch-jobs`) with status polling. If the queue
 * is not configured (503), it transparently falls back to the synchronous
 * `/tools/generate-batch-seller-pack` endpoint.
 */
export async function runBatchSellerPack(options: RunBatchOptions): Promise<Blob> {
  const { formData, headers, fallbackTotal, onProgress } = options;

  const submit = await fetch(`${API_URL}/tools/batch-jobs`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (submit.status === 503) {
    onProgress?.(`Generating ${fallbackTotal} seller images...`);
    const response = await fetch(`${API_URL}/tools/generate-batch-seller-pack`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(coerceDetail(data, "Batch image pack generation failed."));
    }
    return response.blob();
  }

  if (!submit.ok) {
    const data = await submit.json().catch(() => null);
    throw new Error(coerceDetail(data, "Batch job could not be queued."));
  }

  const { job_id: jobId } = (await submit.json()) as { job_id: string };
  return pollBatchJob(jobId, headers, fallbackTotal, onProgress);
}

async function pollBatchJob(
  jobId: string,
  headers: HeadersInit,
  fallbackTotal: number,
  onProgress?: (message: string) => void,
): Promise<Blob> {
  const deadline = Date.now() + MAX_POLL_MS;

  while (Date.now() < deadline) {
    const res = await fetch(`${API_URL}/tools/batch-jobs/${jobId}`, { headers });
    if (!res.ok) {
      throw new Error(
        res.status === 404
          ? "Job expired before it finished. Please try again."
          : "Could not read job status.",
      );
    }

    const job = (await res.json()) as BatchJobStatus;
    if (job.status === "completed") {
      break;
    }
    if (job.status === "blocked") {
      throw new Error(
        "Some outputs failed strict quality checks. Lower the fill target or turn off strict mode.",
      );
    }
    if (job.status === "failed") {
      throw new Error(job.error ?? "Batch processing failed.");
    }

    const done = job.completed_outputs ?? 0;
    const total = job.total_outputs ?? fallbackTotal;
    onProgress?.(`Processing ${done}/${total} outputs...`);
    await sleep(POLL_INTERVAL_MS);
  }

  const download = await fetch(`${API_URL}/tools/batch-jobs/${jobId}/download`, {
    headers,
  });
  if (!download.ok) {
    const data = await download.json().catch(() => null);
    throw new Error(coerceDetail(data, "Download failed after processing."));
  }
  return download.blob();
}

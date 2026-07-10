"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function PaymentReviewActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [message, setMessage] = useState("");

  async function review(decision: "approve" | "reject") {
    setStatus("working");
    setMessage(`${decision === "approve" ? "Approving" : "Rejecting"} request...`);

    const supabase = createClient();
    const functionName =
      decision === "approve"
        ? "seller_approve_payment_request"
        : "seller_reject_payment_request";
    const { error } = await supabase.rpc(functionName, {
      p_request_id: requestId,
      p_admin_note: note || null,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("idle");
    setMessage("Review saved.");
    router.refresh();
  }

  return (
    <div className="mt-4 border-t border-[#dce4d8] pt-4">
      <label className="block text-sm font-medium">
        Admin note
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional verification note"
          className="mt-2 w-full rounded-md border border-[#cbd8c7] px-3 py-2 text-sm outline-none ring-[#537c55] focus:ring-2"
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={status === "working"}
          onClick={() => review("approve")}
          className="rounded-md bg-[#1f4f2a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Approve & activate
        </button>
        <button
          type="button"
          disabled={status === "working"}
          onClick={() => review("reject")}
          className="rounded-md border border-[#b94a38] px-4 py-2 text-sm font-semibold text-[#9a3412] disabled:opacity-60"
        >
          Reject
        </button>
      </div>
      {message ? (
        <p className={`mt-2 text-sm ${status === "error" ? "text-[#9a3412]" : "text-[#276233]"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { FormEvent, useState } from "react";

import { PLANS, type PlanId } from "@/lib/plans";
import { createClient } from "@/lib/supabase/client";

export function ManualPaymentForm({
  userId,
  disabled = false,
}: {
  userId: string;
  disabled?: boolean;
}) {
  const [plan, setPlan] = useState<PlanId>("pro");
  const [method, setMethod] = useState("PayPal");
  const [transactionRef, setTransactionRef] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;
    setStatus("working");
    setMessage("Submitting payment request...");

    const supabase = createClient();
    const { error } = await supabase.from("seller_payment_requests").insert({
      user_id: userId,
      plan,
      method,
      transaction_ref: transactionRef,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("success");
    setMessage("Request submitted. Admin can activate your plan after review.");
    setTransactionRef("");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Plan</span>
        <select
          value={plan}
          onChange={(event) => setPlan(event.target.value as PlanId)}
          className="mt-2 w-full rounded-md border border-[#cbd8c7] px-3 py-2 text-sm outline-none ring-[#537c55] focus:ring-2"
        >
          {PLANS.filter((item) => item.id !== "free").map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} - {item.price}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Payment method</span>
        <select
          value={method}
          onChange={(event) => setMethod(event.target.value)}
          className="mt-2 w-full rounded-md border border-[#cbd8c7] px-3 py-2 text-sm outline-none ring-[#537c55] focus:ring-2"
        >
          <option>PayPal</option>
          <option>Wise</option>
          <option>Bank Transfer</option>
          <option>Other</option>
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Transaction reference</span>
        <input
          value={transactionRef}
          onChange={(event) => setTransactionRef(event.target.value)}
          required
          className="mt-2 w-full rounded-md border border-[#cbd8c7] px-3 py-2 text-sm outline-none ring-[#537c55] focus:ring-2"
          placeholder="Receipt number or sender account"
        />
      </label>

      <button disabled={disabled || status === "working"} className="rounded-md bg-[#1f4f2a] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#91a392]">
        {status === "working" ? "Submitting..." : "Submit activation request"}
      </button>

      {disabled ? (
        <p className="rounded-md bg-[#fff4cc] px-3 py-2 text-sm leading-6 text-[#725d12]">
          A payment request is already pending. Wait for admin review before
          submitting another request.
        </p>
      ) : null}

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
    </form>
  );
}

import { Children } from "react";

import { ManualPaymentForm } from "@/components/manual-payment-form";
import { createClient } from "@/lib/supabase/server";

type PaymentRequest = {
  id: string;
  plan: string;
  method: string;
  transaction_ref: string;
  status: string;
  created_at: string;
};

type Subscription = {
  plan: string;
  status: string;
  start_date: string;
  end_date: string | null;
};

export default async function BillingPage() {
  const supabase = await createClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: requests }, { data: subscriptions }] = await Promise.all([
    supabase
      .from("seller_payment_requests")
      .select("id,plan,method,transaction_ref,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<PaymentRequest[]>(),
    supabase
      .from("seller_subscriptions")
      .select("plan,status,start_date,end_date")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3)
      .returns<Subscription[]>(),
  ]);
  const hasPendingRequest = (requests ?? []).some((request) => request.status === "pending");

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Manual Payment Activation</h2>
        <p className="mt-2 text-sm leading-6 text-[#637063]">
          Pakistan launch ke liye JazzCash, Easypaisa, ya bank transfer request
          submit karen. Admin payment verify karke plan active karega.
        </p>
        <div className="mt-5">
          <ManualPaymentForm userId={user.id} disabled={hasPendingRequest} />
        </div>
      </div>

      <div className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm lg:col-span-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f6f4f]">
              Account status
            </p>
            <h2 className="mt-2 text-xl font-semibold">Activation history</h2>
          </div>
          <span className="text-sm text-[#637063]">Requests update after admin review</span>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <StatusList title="Payment requests" empty="No activation requests yet.">
            {(requests ?? []).map((request) => (
              <li key={request.id} className="rounded-md border border-[#dce4d8] p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold capitalize">{request.plan} plan</span>
                  <StatusPill status={request.status} />
                </div>
                <p className="mt-1 text-xs text-[#637063]">
                  {request.method} · {request.transaction_ref} · {new Date(request.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </StatusList>
          <StatusList title="Subscriptions" empty="No active subscription yet.">
            {(subscriptions ?? []).map((subscription, index) => (
              <li key={`${subscription.plan}-${subscription.start_date}-${index}`} className="rounded-md border border-[#dce4d8] p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold capitalize">{subscription.plan} plan</span>
                  <StatusPill status={subscription.status} />
                </div>
                <p className="mt-1 text-xs text-[#637063]">
                  Started {new Date(subscription.start_date).toLocaleDateString()}
                  {subscription.end_date ? ` · Ends ${new Date(subscription.end_date).toLocaleDateString()}` : ""}
                </p>
              </li>
            ))}
          </StatusList>
        </div>
      </div>

      <aside className="h-fit rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
        <h3 className="font-semibold">Admin process</h3>
        <ol className="mt-3 space-y-3 text-sm leading-6 text-[#637063]">
          <li>1. User payment request submit karta hai.</li>
          <li>2. Admin transaction verify karta hai.</li>
          <li>3. Secure approval plan aur subscription atomically activate karti hai.</li>
          <li>4. Nayi usage limit foran dashboard mein reflect hoti hai.</li>
        </ol>
      </aside>
    </section>
  );
}

function StatusList({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      {Children.count(children) > 0 ? <ul className="mt-3 space-y-2 text-sm">{children}</ul> : <p className="mt-3 rounded-md bg-[#fbfcfa] px-3 py-3 text-sm text-[#637063]">{empty}</p>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles = status === "approved" || status === "active"
    ? "bg-[#e5f4e5] text-[#276233]"
    : status === "rejected"
      ? "bg-[#fff0ec] text-[#9a3412]"
      : "bg-[#fff4cc] text-[#725d12]";
  return <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${styles}`}>{status}</span>;
}

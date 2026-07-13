import { redirect } from "next/navigation";

import { AdminRefreshButton } from "@/components/admin-refresh-button";
import { PaymentReviewActions } from "@/components/payment-review-actions";
import { getPlan } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

type PaymentRequest = {
  id: string;
  user_id: string;
  plan: string;
  method: string;
  transaction_ref: string;
  status: string;
  created_at: string;
};

type SellerProfile = {
  id: string;
  business_name: string | null;
};

export default async function AdminPaymentsPage() {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminProfile } = await supabase
    .from("seller_profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle<{ is_admin: boolean }>();
  if (!adminProfile?.is_admin) redirect("/dashboard");

  const { data: requests } = await supabase
    .from("seller_payment_requests")
    .select("id,user_id,plan,method,transaction_ref,status,created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .returns<PaymentRequest[]>();

  const userIds = [...new Set((requests ?? []).map((request) => request.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase
        .from("seller_profiles")
        .select("id,business_name")
        .in("id", userIds)
        .returns<SellerProfile[]>()
    : { data: [] as SellerProfile[] };
  const businessNames = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.business_name]),
  );

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f6f4f]">
            Secure admin
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Payment approvals</h2>
        </div>
        <div className="flex items-center gap-2">
          <AdminRefreshButton />
          <span className="rounded-full bg-[#edf3eb] px-3 py-2 text-sm font-semibold text-[#314632]">
            {requests?.length ?? 0} pending
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {(requests ?? []).map((request) => (
          <article key={request.id} className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">
                  {businessNames.get(request.user_id) || "Seller account"}
                </h3>
                <p className="mt-1 text-xs text-[#637063]">{request.user_id}</p>
              </div>
              <span className="rounded-full bg-[#fff4cc] px-3 py-1 text-xs font-semibold uppercase text-[#725d12]">
                {request.status}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Detail label="Plan" value={request.plan} />
              <Detail label="Expected payment" value={getPlan(request.plan).price} preserveCase />
              <Detail label="Method" value={request.method} />
              <Detail label="Transaction" value={request.transaction_ref} />
              <Detail label="Submitted" value={new Date(request.created_at).toLocaleString()} />
            </dl>
            <PaymentReviewActions requestId={request.id} />
          </article>
        ))}
      </div>

      {requests?.length === 0 ? (
        <div className="mt-5 rounded-lg border border-[#dce4d8] bg-white p-6 text-sm text-[#637063] shadow-sm">
          No pending payment requests.
        </div>
      ) : null}
    </section>
  );
}

function Detail({ label, value, preserveCase = false }: { label: string; value: string; preserveCase?: boolean }) {
  return (
    <div>
      <dt className="text-[#637063]">{label}</dt>
      <dd className={`mt-1 break-words font-semibold ${preserveCase ? "" : "capitalize"}`}>{value}</dd>
    </div>
  );
}

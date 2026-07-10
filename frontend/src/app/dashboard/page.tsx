import Link from "next/link";

import { getPlan } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  plan: string | null;
  business_name: string | null;
};

export default async function DashboardPage() {
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

  const { data: profile } = await supabase
    .from("seller_profiles")
    .select("plan,business_name")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  const plan = getPlan(profile?.plan);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: usageRows } = await supabase
    .from("seller_usage_logs")
    .select("file_count")
    .eq("user_id", user.id)
    .eq("status", "consumed")
    .gte("created_at", startOfMonth.toISOString());

  const used =
    usageRows?.reduce((total, row) => total + (row.file_count ?? 0), 0) ?? 0;
  const usagePercent = Math.min(100, Math.round((used / plan.imagesPerMonth) * 100));

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f6f4f]">
          Welcome
        </p>
        <h2 className="mt-2 text-2xl font-semibold">
          {profile?.business_name ?? user?.email}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#637063]">
          Track image jobs, monthly usage, and manual payment activation from
          here.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Current plan" value={plan.name} detail={plan.badge} />
        <Metric
          label="Monthly usage"
          value={`${used}/${plan.imagesPerMonth}`}
          detail={`${usagePercent}% used`}
        />
        <Metric label="Account" value="Active" detail={user?.email ?? ""} />
      </div>

      <div className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Next best action</h3>
            <p className="mt-1 text-sm text-[#637063]">
              Launch with manual payments first, then automate later.
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="rounded-md bg-[#1f4f2a] px-4 py-3 text-sm font-semibold text-white"
          >
            Request activation
          </Link>
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-[#dce4d8] bg-white p-4 shadow-sm">
      <p className="text-sm text-[#637063]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-[#637063]">{detail}</p>
    </div>
  );
}

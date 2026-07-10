import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/sign-out-button";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

const BASE_NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/jobs", label: "Jobs" },
  { href: "/dashboard/billing", label: "Billing" },
  { href: "/pricing", label: "Pricing" },
];

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!isSupabaseConfigured()) {
    return (
      <main className="min-h-screen bg-[#f6f8f5] px-5 py-8 text-[#172018]">
        <div className="mx-auto max-w-3xl rounded-lg border border-[#dce4d8] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f6f4f]">
            Phase 2 setup needed
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Connect Supabase</h1>
          <p className="mt-3 leading-7 text-[#637063]">
            Dashboard auth is scaffolded, but Supabase credentials are missing.
            Create <code>frontend/.env.local</code> from the example file and add
            your project URL and publishable key.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-md bg-[#1f4f2a] px-4 py-3 text-sm font-semibold text-white"
          >
            Back to generator
          </Link>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase!
    .from("seller_profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle<{ is_admin: boolean }>();
  const navItems = profile?.is_admin
    ? [
        ...BASE_NAV_ITEMS,
        { href: "/dashboard/admin/payments", label: "Payment approvals" },
      ]
    : BASE_NAV_ITEMS;

  return (
    <main className="min-h-screen bg-[#f6f8f5] text-[#172018]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dce4d8] pb-5">
          <div>
            <Link
              href="/"
              className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f6f4f]"
            >
              SBZ SellImage Pro
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Seller Dashboard
            </h1>
          </div>
          <SignOutButton />
        </header>

        <div className="grid flex-1 gap-6 py-6 lg:grid-cols-[220px_1fr]">
          <nav className="h-fit rounded-lg border border-[#dce4d8] bg-white p-3 shadow-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm font-semibold text-[#314632] hover:bg-[#edf3eb]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {children}
        </div>
      </div>
    </main>
  );
}

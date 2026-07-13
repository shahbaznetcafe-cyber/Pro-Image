import Link from "next/link";

import { PLANS } from "@/lib/plans";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#f6f8f5] px-5 py-8 text-[#172018]">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dce4d8] pb-5">
          <div>
            <Link
              href="/"
              className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4f6f4f]"
            >
              SBZ SellImage Pro
            </Link>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              International pricing
            </h1>
            <p className="mt-2 text-sm text-[#637063]">All prices are shown in USD.</p>
          </div>
          <Link
            href="/login"
            className="rounded-md bg-[#1f4f2a] px-4 py-3 text-sm font-semibold text-white"
          >
            Login
          </Link>
        </header>

        <section className="grid gap-4 py-8 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#4f6f4f]">
                {plan.badge}
              </p>
              <h2 className="mt-3 text-2xl font-semibold">{plan.name}</h2>
              <p className="mt-2 text-3xl font-semibold">{plan.price}</p>
              <p className="mt-2 text-sm text-[#637063]">
                {plan.imagesPerMonth.toLocaleString()} source images/month
              </p>
              <ul className="mt-5 space-y-2 text-sm text-[#314632]">
                {plan.features.map((feature) => (
                  <li key={feature}>- {feature}</li>
                ))}
              </ul>
              <Link
                href={plan.id === "free" ? "/seller-studio" : "/dashboard/billing"}
                className="mt-5 inline-flex rounded-md border border-[#c8d7c5] px-4 py-3 text-sm font-semibold hover:bg-[#f3f6f1]"
              >
                {plan.id === "free" ? "Try free" : "Request activation"}
              </Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

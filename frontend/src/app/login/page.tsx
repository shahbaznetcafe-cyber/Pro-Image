"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") ?? "/dashboard";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "error" | "success">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured()) {
      setStatus("error");
      setMessage("Add Supabase URL and publishable key in frontend/.env.local.");
      return;
    }

    setStatus("working");
    setMessage(mode === "login" ? "Signing in..." : "Creating account...");

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        window.location.href = redirectedFrom;
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_name: businessName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      setStatus("success");
      setMessage("Account created. Check email if confirmation is enabled.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Auth request failed.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8f5] px-5 py-8 text-[#172018]">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <section>
          <Link href="/" className="text-sm font-semibold text-[#1f4f2a]">
            SBZ SellImage Pro
          </Link>
          <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Login to manage seller image jobs, usage, and billing.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#637063]">
            Phase 2 adds the SaaS layer: account access, plan limits, job
            history metadata, and manual payment requests for Pakistan launch.
          </p>
        </section>

        <form
          onSubmit={onSubmit}
          className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm"
        >
          <div className="grid grid-cols-2 rounded-md bg-[#edf3eb] p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={
                mode === "login"
                  ? "rounded bg-white px-3 py-2 text-sm font-semibold shadow-sm"
                  : "px-3 py-2 text-sm font-semibold text-[#637063]"
              }
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={
                mode === "signup"
                  ? "rounded bg-white px-3 py-2 text-sm font-semibold shadow-sm"
                  : "px-3 py-2 text-sm font-semibold text-[#637063]"
              }
            >
              Sign up
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {mode === "signup" ? (
              <label className="block">
                <span className="text-sm font-medium">Business name</span>
                <input
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  className="mt-2 w-full rounded-md border border-[#cbd8c7] px-3 py-2 text-sm outline-none ring-[#537c55] focus:ring-2"
                  placeholder="Shahbaz Netcafe"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-2 w-full rounded-md border border-[#cbd8c7] px-3 py-2 text-sm outline-none ring-[#537c55] focus:ring-2"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="mt-2 w-full rounded-md border border-[#cbd8c7] px-3 py-2 text-sm outline-none ring-[#537c55] focus:ring-2"
                placeholder="Minimum 6 characters"
              />
            </label>
          </div>

          <button
            disabled={status === "working"}
            className="mt-5 w-full rounded-md bg-[#1f4f2a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#173d20] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "working"
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : "Create account"}
          </button>

          {message ? (
            <div
              className={
                status === "error"
                  ? "mt-4 rounded-md border border-[#efb8ad] bg-[#fff4f1] px-4 py-3 text-sm text-[#9a3412]"
                  : "mt-4 rounded-md border border-[#b9d9b3] bg-[#f1f8ef] px-4 py-3 text-sm text-[#276233]"
              }
            >
              {message}
            </div>
          ) : null}
        </form>
      </div>
    </main>
  );
}

function LoginShell() {
  return (
    <main className="min-h-screen bg-[#f6f8f5] px-5 py-8 text-[#172018]">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <section>
          <Link href="/" className="text-sm font-semibold text-[#1f4f2a]">
            SBZ SellImage Pro
          </Link>
          <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Login to manage seller image jobs, usage, and billing.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#637063]">
            Loading secure auth form...
          </p>
        </section>
        <div className="rounded-lg border border-[#dce4d8] bg-white p-5 shadow-sm">
          <div className="h-10 rounded bg-[#edf3eb]" />
          <div className="mt-5 space-y-4">
            <div className="h-16 rounded bg-[#f6f8f5]" />
            <div className="h-16 rounded bg-[#f6f8f5]" />
            <div className="h-12 rounded bg-[#1f4f2a]" />
          </div>
        </div>
      </div>
    </main>
  );
}

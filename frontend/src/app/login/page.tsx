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
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "error" | "success">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const passwordChecks = getPasswordChecks(password);
  const isStrongPassword = passwordChecks.every((check) => check.passed);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured()) {
      setStatus("error");
      setMessage("Add Supabase URL and publishable key in frontend/.env.local.");
      return;
    }

    if (mode === "signup" && !isStrongPassword) {
      setStatus("error");
      setMessage(
        "Password must be at least 8 characters and include a lowercase letter, an uppercase letter, and a digit.",
      );
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
            history metadata, and international manual payment requests.
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
              <span className="flex items-center justify-between gap-3 text-sm font-medium">
                Password
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="text-xs font-semibold text-[#315c39] hover:text-[#173d20]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={mode === "signup" ? 8 : 1}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                aria-describedby={mode === "signup" ? "password-requirements" : undefined}
                className="mt-2 w-full rounded-md border border-[#cbd8c7] px-3 py-2 text-sm outline-none ring-[#537c55] focus:ring-2"
                placeholder={mode === "signup" ? "Create a strong password" : "Enter your password"}
              />
            </label>

            {mode === "signup" ? (
              <div id="password-requirements" className="rounded-md border border-[#dce4d8] bg-[#f8faf7] p-3" aria-live="polite">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-[#405040]">Password strength</p>
                  <span className={isStrongPassword ? "text-xs font-semibold text-[#276233]" : "text-xs font-semibold text-[#7b6518]"}>
                    {isStrongPassword ? "Strong" : "Requirements pending"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  {passwordChecks.map((check) => (
                    <span key={check.label} className={check.passed ? "flex items-center gap-2 text-[#276233]" : "flex items-center gap-2 text-[#6b776a]"}>
                      <span aria-hidden="true" className={check.passed ? "size-1.5 rounded-full bg-[#3e7b47]" : "size-1.5 rounded-full bg-[#b8c4b5]"} />
                      {check.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <button
            disabled={status === "working" || (mode === "signup" && !isStrongPassword)}
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

function getPasswordChecks(password: string) {
  return [
    { label: "8+ characters", passed: password.length >= 8 },
    { label: "Lowercase letter", passed: /[a-z]/.test(password) },
    { label: "Uppercase letter", passed: /[A-Z]/.test(password) },
    { label: "Digit", passed: /\d/.test(password) },
  ];
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

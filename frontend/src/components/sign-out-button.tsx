"use client";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <button
      onClick={signOut}
      className="rounded-md border border-[#c8d7c5] px-3 py-2 text-sm font-semibold hover:bg-[#f3f6f1]"
      type="button"
    >
      Sign out
    </button>
  );
}

"use client";

import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

export async function getApiAuthHeaders(): Promise<Record<string, string>> {
  if (!isSupabaseConfigured()) {
    return {};
  }

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Login is required before generating a seller pack.");
  }

  return { Authorization: `Bearer ${session.access_token}` };
}

"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

export function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase is not configured. Add the public URL and publishable key to apps/web/.env.local.");
  return createBrowserClient(config.url, config.publishableKey);
}

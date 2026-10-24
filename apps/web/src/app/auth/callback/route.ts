import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const rawNext = requestUrl.searchParams.get("next") ?? "/app";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\") ? rawNext : "/app";
  const code = requestUrl.searchParams.get("code");
  if (!getSupabaseConfig() || !code) return NextResponse.redirect(new URL("/login?error=auth_callback", requestUrl.origin));

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=auth_callback", requestUrl.origin));
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

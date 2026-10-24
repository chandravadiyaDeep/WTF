"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

type Mode = "login" | "signup" | "forgot" | "update-password";

const copy: Record<Mode, { title: string; description: string; button: string }> = {
  login: { title: "Welcome back", description: "Sign in to continue to your workspace.", button: "Sign in" },
  signup: { title: "Create your workspace", description: "Start with a private workspace for your data projects.", button: "Create account" },
  forgot: { title: "Reset your password", description: "We’ll email you a secure link to choose a new password.", button: "Send reset link" },
  "update-password": { title: "Choose a new password", description: "Use a strong password you don’t use elsewhere.", button: "Update password" },
};

export function AuthForm({ mode, configured }: { mode: Mode; configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        router.replace("/app");
        router.refresh();
      } else if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fapp` },
        });
        if (authError) throw authError;
        if (data.session) {
          router.replace("/app");
          router.refresh();
        }
        else setMessage("Account created. Check your email to confirm your address, then sign in.");
      } else if (mode === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/callback?next=%2Fauth%2Fupdate-password`,
        });
        if (authError) throw authError;
        setMessage("If an account exists for that address, a password reset link is on its way.");
      } else {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setMessage("Password updated. You can continue to your workspace.");
        setPassword("");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We couldn’t complete that request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const info = copy[mode];
  const needsEmail = mode !== "update-password";
  return <main className="auth-page"><Link href="/" className="auth-brand"><span className="brand-mark">✦</span><span>NUMPA<span className="brand-dot">.</span></span></Link><section className="auth-card"><div className="eyebrow">YOUR PRIVATE DATA WORKSPACE</div><h1>{info.title}</h1><p className="auth-description">{info.description}</p>
    {!configured ? <div className="auth-setup" role="status"><strong>Connect Supabase to enable accounts</strong><p>Copy <code>apps/web/.env.example</code> to <code>apps/web/.env.local</code>, add your Supabase project URL and publishable key, then apply the database migration in <code>supabase/migrations</code>.</p><Link href="/demo" className="button outline">Explore the local demo</Link></div> : <form className="auth-form" onSubmit={submit}>
      {needsEmail && <label>Email address<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>}
      {mode !== "forgot" && <label>{mode === "update-password" ? "New password" : "Password"}<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>}
      {error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-success" role="status">{message}</p>}
      <button className="button primary auth-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : info.button}</button>
      {mode === "login" && <Link className="auth-inline-link" href="/forgot-password">Forgot password?</Link>}
    </form>}
    <div className="auth-switch">{mode === "login" ? <>New to NUMPA? <Link href="/signup">Create an account</Link></> : mode === "signup" ? <>Already have an account? <Link href="/login">Sign in</Link></> : mode === "forgot" ? <Link href="/login">Back to sign in</Link> : <Link href="/login">Return to sign in</Link>}</div>
    <p className="auth-privacy">Your data stays private to your workspace. Access is enforced by database row-level security.</p>
  </section><footer className="auth-footer">NUMPA · Understand your data before it shapes your models.</footer></main>;
}

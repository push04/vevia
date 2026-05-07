"use client";

import { useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

function getErrorMessage(error: unknown) {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export default function LoginPage() {
  const supabase = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createClient();
  }, []);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");

    try {
      if (!supabase) throw new Error("Supabase client not available");
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (signInError) throw signInError;
      setStatus("sent");
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus("idle");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-sm py-lg">
      <div className="w-full max-w-md bg-surface rounded-xl border border-outline-variant shadow-sm p-lg">
        <div className="mb-md">
          <h1 className="font-display text-display text-primary">Vevia</h1>
          <p className="font-body-base text-body-base text-text-secondary mt-2xs">
            Recruiter sign-in (magic link).
          </p>
        </div>

        {status === "sent" ? (
          <div className="bg-surface-container-low border border-outline-variant rounded-lg p-md">
            <p className="font-body-base text-body-base text-text-primary">
              Check your email for a sign-in link.
            </p>
            <p className="font-caption text-caption text-text-secondary mt-2xs">
              If it does not arrive, verify your Supabase Auth email settings and spam folder.
            </p>
            <button
              className="mt-sm inline-flex bg-primary text-on-primary font-label text-label px-md py-xs rounded hover:bg-surface-tint transition-colors shadow-sm"
              onClick={() => setStatus("idle")}
              type="button"
            >
              Use another email
            </button>
          </div>
        ) : (
          <form className="space-y-sm" onSubmit={onSubmit}>
            <label className="block">
              <span className="font-label text-label text-text-secondary">Email</span>
              <input
                className="mt-2xs w-full bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs outline-none focus:ring-2 focus:ring-primary-container transition"
                inputMode="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                type="email"
                value={email}
              />
            </label>

            {error ? (
              <div className="bg-error-container text-on-error-container border border-outline-variant rounded-lg p-sm font-body-base text-body-base">
                {error}
              </div>
            ) : null}

            <button
              className="w-full bg-primary text-on-primary font-label text-label py-xs rounded-lg hover:bg-surface-tint transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={status === "loading"}
              type="submit"
            >
              {status === "loading" ? "Sending link..." : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

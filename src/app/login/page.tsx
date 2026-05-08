"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function getErrorMessage(error: unknown) {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createClient();
  }, []);

  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");

    try {
      if (!supabase) throw new Error("Supabase client not available");

      if (mode === "signIn") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push("/dashboard");
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        });
        if (signUpError) throw signUpError;
        setStatus("success");
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setStatus("idle");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-sm py-lg">
      <div className="w-full max-w-[448px] bg-surface rounded-xl border border-outline-variant shadow-sm p-lg">
        <div className="mb-md">
          <h1 className="font-display text-[28px] font-bold text-primary">Vevia</h1>
          <p className="font-body-base text-body-base text-text-secondary mt-1">
            {mode === "signIn" ? "Sign in to your account." : "Create your recruiter account."}
          </p>
        </div>

        {status === "success" ? (
          <div className="bg-surface-container-low border border-outline-variant rounded-lg p-md">
            <h3 className="font-semibold text-primary mb-2xs">Check your email</h3>
            <p className="font-body-base text-body-base text-text-primary">
              We&apos;ve sent a verification link to <strong>{email}</strong>.
            </p>
            <p className="font-caption text-caption text-text-secondary mt-2xs">
              Please click the link to activate your account.
            </p>
            <button
              className="mt-sm inline-flex bg-primary text-on-primary font-label text-label px-md py-xs rounded hover:bg-surface-tint transition-colors shadow-sm"
              onClick={() => {
                setStatus("idle");
                setMode("signIn");
                setPassword("");
              }}
              type="button"
            >
              Back to sign in
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

            <label className="block mt-sm">
              <span className="font-label text-label text-text-secondary">Password</span>
              <input
                className="mt-2xs w-full bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs outline-none focus:ring-2 focus:ring-primary-container transition"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                type="password"
                value={password}
                minLength={6}
              />
            </label>

            {error ? (
              <div className="bg-error-container text-on-error-container border border-outline-variant rounded-lg p-sm font-body-base text-body-base mt-sm">
                {error}
              </div>
            ) : null}

            <button
              className="w-full mt-md bg-primary text-on-primary font-label text-label py-xs rounded-lg hover:bg-surface-tint transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={status === "loading"}
              type="submit"
            >
              {status === "loading"
                ? "Please wait..."
                : mode === "signIn"
                ? "Sign In"
                : "Create Account"}
            </button>

            <div className="mt-md text-center">
              <button
                type="button"
                className="text-primary hover:underline text-sm"
                onClick={() => {
                  setMode(mode === "signIn" ? "signUp" : "signIn");
                  setError(null);
                }}
              >
                {mode === "signIn"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

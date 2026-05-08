"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function CandidateLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get("email") ?? "";
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");
    const supabase = createClient();
    try {
      if (mode === "signIn") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        router.push("/candidate/dashboard");
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/candidate/dashboard` },
        });
        if (err) throw err;
        setStatus("success");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("idle");
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === "signIn" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {mode === "signIn" ? "Sign in to track your applications." : "Join Vevia to discover and apply to jobs."}
            </p>
          </div>

          {prefilledEmail && mode === "signIn" && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
              Create an account or sign in to track your application for <strong>{prefilledEmail}</strong>
            </div>
          )}

          {status === "success" ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-emerald-800 font-medium text-sm">Check your email!</p>
              <p className="text-emerald-700 text-sm mt-1">We sent a verification link to <strong>{email}</strong>.</p>
              <button onClick={() => { setStatus("idle"); setMode("signIn"); }} className="mt-3 text-sm text-blue-600 hover:underline">Back to sign in</button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Email</span>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Password</span>
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" minLength={6}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                />
              </label>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
              <button
                type="submit" disabled={status === "loading"}
                className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "Please wait..." : mode === "signIn" ? "Sign In" : "Create Account"}
              </button>
              <p className="text-center text-sm text-gray-500">
                {mode === "signIn" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button type="button" onClick={() => { setMode(mode === "signIn" ? "signUp" : "signIn"); setError(null); }} className="text-blue-600 hover:underline font-medium">
                  {mode === "signIn" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          Looking to hire?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">Recruiter login</Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Job = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  employment_type: string | null;
  experience_min: number | null;
  experience_max: number | null;
  requirements: string[] | null;
  screening_questions: { q: string; type: string }[];
};

export function ApplyForm({ job, slug }: { job: Job; slug: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "uploading" | "success" | "error">("form");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!mountedRef.current) return;
    setStep("uploading");
    setError(null);

    try {
      const form = e.currentTarget;
      const data = new FormData(form);
      const emailField = form.querySelector<HTMLInputElement>("input[name=email]");
      setSubmittedEmail(emailField?.value ?? "");
      const ctrl = new AbortController();
      const res = await fetch(`/api/apply/${slug}`, { method: "POST", body: data, signal: ctrl.signal });
      if (!mountedRef.current) return;
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Application failed");
      if (mountedRef.current) setStep("success");
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  }

  if (step === "success") {
    return (
      <div className="text-center py-xl">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-md">
          <span className="material-symbols-outlined text-emerald-600 text-[40px]">check_circle</span>
        </div>
        <h2 className="font-display text-[24px] font-bold text-primary mb-xs">Application submitted!</h2>
        <p className="text-text-secondary text-sm max-w-[384px] mx-auto leading-relaxed">
          Your resume has been parsed and scored by our AI.
        </p>
        <div className="mt-md p-md bg-blue-50 border border-blue-200 rounded-2xl text-left">
          <h3 className="font-semibold text-blue-800 text-sm mb-xs">Track your application</h3>
          <p className="text-blue-700 text-xs leading-relaxed">
            Create an account to view your application status, AI scores, and more.
          </p>
          <button
            onClick={() => router.push(`/candidate/login?email=${encodeURIComponent(submittedEmail)}`)}
            className="mt-sm w-full bg-blue-600 text-white font-semibold text-sm py-sm px-md rounded-xl hover:bg-blue-700 transition-colors"
          >
            Create account / Sign in
          </button>
        </div>
        <div className="mt-md flex items-center justify-center gap-xs text-text-secondary text-xs">
          <span className="material-symbols-outlined text-[16px]">smart_toy</span>
          Powered by Vevia AI
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
        <label className="block">
          <span className="text-xs text-text-secondary font-medium">Full name</span>
          <input
            name="full_name"
            placeholder="Rahul Sharma"
            className="mt-1 w-full bg-surface-container-low border border-outline-variant rounded-xl px-sm py-xs text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
          />
        </label>
        <label className="block">
          <span className="text-xs text-text-secondary font-medium">Email address</span>
          <input
            name="email"
            type="email"
            placeholder="rahul@example.com"
            className="mt-1 w-full bg-surface-container-low border border-outline-variant rounded-xl px-sm py-xs text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
        <label className="block">
          <span className="text-xs text-text-secondary font-medium">Phone</span>
          <input
            name="phone"
            type="tel"
            placeholder="+91 98765 43210"
            className="mt-1 w-full bg-surface-container-low border border-outline-variant rounded-xl px-sm py-xs text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
          />
        </label>
        <label className="block">
          <span className="text-xs text-text-secondary font-medium">Current location</span>
          <input
            name="current_location"
            placeholder="Bengaluru, Karnataka"
            className="mt-1 w-full bg-surface-container-low border border-outline-variant rounded-xl px-sm py-xs text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
          />
        </label>
      </div>

      <div>
        <span className="text-xs text-text-secondary font-medium block mb-1">LinkedIn profile URL</span>
        <input
          name="linkedin_url"
          type="url"
          placeholder="https://linkedin.com/in/your-profile"
          className="mt-1 w-full bg-surface-container-low border border-outline-variant rounded-xl px-sm py-xs text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
        />
        <p className="text-xs text-text-secondary mt-1">Optional. We will fetch additional details from your public profile.</p>
      </div>

      {/* Resume upload */}
      <div>
        <span className="text-xs text-text-secondary font-medium block mb-1">Resume (PDF or DOCX) *</span>
        <div
          className="border-2 border-dashed border-outline-variant rounded-2xl p-lg text-center hover:border-primary/40 transition-colors cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            name="resume"
            type="file"
            accept=".pdf,.docx,.doc"
            required
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          {fileName ? (
            <div className="flex items-center justify-center gap-xs text-primary">
              <span className="material-symbols-outlined">description</span>
              <span className="text-sm font-medium">{fileName}</span>
            </div>
          ) : (
            <>
              <span className="material-symbols-outlined text-text-secondary/60 text-[48px] block">upload_file</span>
              <p className="text-text-secondary text-sm mt-xs">Click to upload your resume</p>
              <p className="text-text-secondary text-xs mt-1">PDF, DOCX up to 10MB</p>
            </>
          )}
        </div>
      </div>

      {job.screening_questions?.length > 0 && (
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-md">
          <h3 className="font-semibold text-primary text-sm mb-sm">Quick screening questions</h3>
          <div className="space-y-sm">
            {job.screening_questions.slice(0, 3).map((q, i) => (
              <label key={i} className="block">
                <span className="text-xs text-text-secondary">{q.q}</span>
                {q.type === "yes_no" ? (
                  <div className="flex gap-sm mt-1">
                    {["Yes", "No"].map((opt) => (
                      <label key={opt} className="flex items-center gap-xs cursor-pointer">
                        <input type="radio" name={`sq_${i}`} value={opt.toLowerCase()} className="accent-primary" />
                        <span className="text-sm text-text-secondary">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    name={`sq_${i}`}
                    placeholder="Your answer"
                    className="mt-1 w-full bg-white border border-outline-variant rounded-xl px-sm py-xs text-sm outline-none focus:ring-2 focus:ring-primary/30 transition"
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {step === "error" && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-sm text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={step === "uploading"}
        className="w-full inline-flex justify-center items-center gap-xs bg-primary text-white font-semibold py-sm px-md rounded-xl hover:opacity-90 transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {step === "uploading" ? (
          <>
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            AI is parsing your resume...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[18px]">send</span>
            Submit Application
          </>
        )}
      </button>

      <p className="text-xs text-text-secondary text-center">
        Your resume is parsed by AI and scored against this role. No human reads it first.
      </p>
    </form>
  );
}

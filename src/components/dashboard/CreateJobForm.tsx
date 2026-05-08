"use client";

import { useState, useRef } from "react";

interface CreateJobFormProps {
  action: (data: FormData) => Promise<void>;
}

export function CreateJobForm({ action }: CreateJobFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [visibility, setVisibility] = useState<"draft" | "link_only" | "public">("draft");
  const [closingDate, setClosingDate] = useState("");
  const [aiState, setAiState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [aiError, setAiError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleGenerateWithAI() {
    if (!title.trim()) {
      setAiError("Please enter a job title first.");
      return;
    }
    setAiState("loading");
    setAiError(null);
    try {
      const res = await fetch("/api/generate-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? "Generation failed");
      setDescription(data.description ?? "");
      setRequirements(Array.isArray(data.requirements) ? data.requirements.join("\n") : "");
      setAiState("done");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to generate. Try again.");
      setAiState("error");
    }
  }

  const visibilityOptions = [
    { value: "draft",     label: "Draft",       description: "Not published", icon: "draft" },
    { value: "link_only", label: "Link Only",   description: "Active, hidden from job board", icon: "link" },
    { value: "public",    label: "Public",      description: "Listed on job board", icon: "public" },
  ] as const;

  return (
    <form ref={formRef} action={action} className="space-y-4">
      {/* Hidden fields */}
      <input type="hidden" name="visibility" value={visibility} />
      <input type="hidden" name="status" value={visibility === "draft" ? "draft" : "active"} />

      {/* Title + AI button */}
      <div>
        <label className="block">
          <span className="font-label text-label text-text-secondary">Job Title *</span>
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs outline-none focus:ring-2 focus:ring-primary-container transition text-sm"
            placeholder="Senior Frontend Engineer"
            required
          />
        </label>
        <button
          type="button"
          onClick={handleGenerateWithAI}
          disabled={aiState === "loading" || !title.trim()}
          className="mt-2 w-full inline-flex items-center justify-center gap-2 border border-primary text-primary bg-surface rounded-lg px-sm py-xs text-sm font-medium hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {aiState === "loading" ? (
            <>
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
              Generating with AI...
            </>
          ) : aiState === "done" ? (
            <>
              <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
              Generated — regenerate
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              Write with AI
            </>
          )}
        </button>
        {aiError && (
          <p className="mt-1 text-xs text-red-600">{aiError}</p>
        )}
        {aiState === "done" && (
          <p className="mt-1 text-xs text-emerald-600">AI generated description and requirements. Review and edit before publishing.</p>
        )}
      </div>

      {/* Description */}
      <label className="block">
        <span className="font-label text-label text-text-secondary">Description</span>
        <textarea
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs outline-none focus:ring-2 focus:ring-primary-container transition min-h-28 text-sm resize-y"
          placeholder="Role overview, responsibilities, and what makes this role exciting."
        />
      </label>

      {/* Requirements */}
      <label className="block">
        <span className="font-label text-label text-text-secondary">Requirements (one per line)</span>
        <textarea
          name="requirements"
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          className="mt-1 w-full bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs outline-none focus:ring-2 focus:ring-primary-container transition min-h-24 text-sm resize-y"
          placeholder={"React\nTypeScript\n5+ years experience"}
        />
      </label>

      {/* Application deadline */}
      <div>
        <span className="font-label text-label text-text-secondary block mb-1">Application deadline (optional)</span>
        <input
          type="date"
          name="application_deadline"
          value={closingDate}
          onChange={(e) => setClosingDate(e.target.value)}
          className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-sm py-xs outline-none focus:ring-2 focus:ring-primary-container transition text-sm"
          min={new Date().toISOString().split("T")[0]}
        />
        <p className="text-[11px] text-text-secondary mt-1">Job will automatically pause after this date.</p>
      </div>

      {/* Visibility selector */}
      <div>
        <span className="font-label text-label text-text-secondary block mb-1">Visibility</span>
        <div className="grid grid-cols-1 gap-2">
          {visibilityOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setVisibility(opt.value)}
              className={`flex items-center gap-3 px-sm py-xs rounded-lg border text-left transition-all ${
                visibility === opt.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-outline-variant bg-surface-container-low text-text-secondary hover:border-primary/50"
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] shrink-0 ${visibility === opt.value ? "text-primary" : "text-text-secondary"}`}>
                {opt.icon}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="text-xs opacity-70">{opt.description}</div>
              </div>
              {visibility === opt.value && (
                <span className="material-symbols-outlined text-[16px] text-primary ml-auto">radio_button_checked</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-on-primary font-label text-label py-xs rounded-lg hover:bg-surface-tint transition-colors shadow-sm"
      >
        Create Job
      </button>
    </form>
  );
}

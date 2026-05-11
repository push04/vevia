"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

type CandidateLite = {
  id: string;
  full_name: string | null;
  email: string | null;
  current_title: string | null;
  current_company: string | null;
  skills: string[] | null;
};

export type ApplicationRow = {
  id: string;
  status: string | null;
  resume_score: number | null;
  screening_score: number | null;
  test_score: number | null;
  video_score: number | null;
  composite_score: number | null;
  score_explanation: string | null;
  score_breakdown: unknown;
  candidate: CandidateLite | null;
};

function formatMaybe(v: string | null | undefined) {
  return v && v.trim() ? v : null;
}

function initials(nameOrEmail: string) {
  const parts = nameOrEmail.trim().split(/\s+/g).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return "U";
}

function RawExplanation({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 200;
  if (!isLong) {
    return (
      <div className="text-xs text-text-secondary bg-surface-container-low rounded-lg p-sm font-mono leading-relaxed whitespace-pre-wrap break-all">
        {text}
      </div>
    );
  }
  return (
    <div className="text-xs text-text-secondary bg-surface-container-low rounded-lg p-sm font-mono leading-relaxed">
      {expanded ? (
        <div className="whitespace-pre-wrap break-all">{text}</div>
      ) : (
        <div className="whitespace-pre-wrap break-all line-clamp-3">{text}</div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-1 text-primary hover:underline text-xs"
        type="button"
      >
        {expanded ? "Show less" : "Read more"}
      </button>
    </div>
  );
}

function ScorecardPanel({ selected }: { selected: ApplicationRow | null }) {
  return (
    <>
      <div className="p-md border-b border-outline-variant bg-surface-base">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-h2 font-bold text-primary">AI Scorecard</h3>
        </div>
        <p className="font-caption text-caption text-text-secondary">
          Explainable rationale for the current rank.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-md space-y-md">
        {selected ? (
          <>
            <div className="bg-surface-base rounded border border-outline-variant p-sm shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2xs">
                <h4 className="font-label text-label uppercase tracking-widest text-text-secondary flex items-center gap-2xs">
                  <span className="material-symbols-outlined text-[16px] text-semantic-success">
                    verified
                  </span>
                  Composite Score
                </h4>
                <span className="text-semantic-success font-bold text-display tabular-nums">
                  {typeof selected.composite_score === "number"
                    ? Math.round(selected.composite_score)
                    : "--"}
                </span>
              </div>
              <p className="font-caption text-caption text-text-secondary">
                {selected.candidate?.full_name ?? selected.candidate?.email ?? "Candidate"} -{" "}
                {selected.status ?? "unknown"}
              </p>
            </div>

            <div className="bg-surface-base rounded border border-outline-variant p-sm shadow-sm hover:shadow-md transition-shadow">
              <div className="font-label text-label text-text-secondary uppercase tracking-wide">
                Component scores
              </div>
              <div className="mt-sm grid grid-cols-2 gap-2xs font-caption text-caption text-text-secondary tabular-nums">
                <div>Resume: {selected.resume_score ?? "--"}</div>
                <div>Screen: {selected.screening_score ?? "--"}</div>
                <div>Test: {selected.test_score ?? "--"}</div>
                <div>Video: {selected.video_score ?? "--"}</div>
              </div>
            </div>

            <div className="bg-surface-base rounded border border-outline-variant p-sm shadow-sm hover:shadow-md transition-shadow">
              <div className="font-label text-label text-text-secondary uppercase tracking-wide">
                Explanation
              </div>
              <div className="mt-sm font-caption text-caption text-text-secondary leading-relaxed space-y-2xs">
                {(() => {
                  if (!selected.score_explanation) return <div>No explanation yet.</div>;
                  try {
                    const parsed = JSON.parse(selected.score_explanation) as {
                      summary?: string;
                      bullets?: string[];
                    };
                    return (
                      <>
                        {parsed.summary ? (
                          <div className="text-text-primary">{parsed.summary}</div>
                        ) : null}
                        {Array.isArray(parsed.bullets) && parsed.bullets.length ? (
                          <ul className="list-disc pl-md space-y-3xs">
                            {parsed.bullets.slice(0, 8).map((b) => (
                              <li key={b}>{b}</li>
                            ))}
                          </ul>
                        ) : (
                          <RawExplanation text={selected.score_explanation} />
                        )}
                      </>
                    );
                  } catch {
                    return <RawExplanation text={selected.score_explanation} />;
                  }
                })()}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-surface-container-low border border-outline-variant rounded-lg p-md">
            <p className="font-body-base text-body-base text-text-secondary">Select a candidate to view details.</p>
          </div>
        )}
      </div>
    </>
  );
}

export function PipelineView(props: {
  jobTitle: string;
  applications: ApplicationRow[];
  onScore: (applicationId: string) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    props.applications[0]?.id ?? null,
  );
  const [pending, startTransition] = useTransition();
  const [scorecardOpen, setScorecardOpen] = useState(false);

  const selected = useMemo(
    () => props.applications.find((a) => a.id === selectedId) ?? null,
    [props.applications, selectedId],
  );

  const sorted = useMemo(() => {
    const list = [...props.applications];
    list.sort((a, b) => {
      const as = typeof a.composite_score === "number" ? a.composite_score : -1;
      const bs = typeof b.composite_score === "number" ? b.composite_score : -1;
      return bs - as;
    });
    return list;
  }, [props.applications]);

  const count = props.applications.length;

  return (
    <main className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col p-md overflow-y-auto bg-surface-base">
        <div className="mb-sm flex items-start justify-between gap-sm flex-wrap">
          <div className="min-w-0">
            <h2 className="font-h1 text-h1 text-primary truncate">{props.jobTitle}</h2>
            <p className="font-body-base text-body-base text-text-secondary">
              {count} candidate{count === 1 ? "" : "s"} in pipeline
            </p>
          </div>
          <Link
            className="inline-flex border border-outline-variant text-primary font-label text-label px-md py-xs rounded hover:bg-surface-container-low transition-colors"
            href="/jobs"
          >
            All jobs
          </Link>
        </div>

        <div className="bg-surface rounded-lg border border-outline-variant shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-2xs px-2xs py-2xs bg-surface-container-low border-b border-outline-variant font-label text-label text-text-secondary uppercase tracking-wide">
            <div className="col-span-4">Candidate</div>
            <div className="col-span-3">Stage</div>
            <div className="col-span-2">AI Score</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>

          {sorted.length ? (
            <div className="divide-y divide-outline-variant">
              {sorted.map((a) => {
                const isSelected = a.id === selectedId;
                const name = a.candidate?.full_name ?? a.candidate?.email ?? "Candidate";
                const subtitle = [
                  formatMaybe(a.candidate?.current_title ?? null),
                  formatMaybe(a.candidate?.current_company ?? null),
                ]
                  .filter(Boolean)
                  .join(" - ");

                const score =
                  typeof a.composite_score === "number" ? Math.round(a.composite_score) : null;

                return (
                  <button
                    key={a.id}
                    className={[
                      "w-full text-left px-md py-sm md:px-2xs md:py-2xs transition-colors",
                      isSelected ? "bg-surface-elevated" : "hover:bg-surface-elevated",
                    ].join(" ")}
                    onClick={() => setSelectedId(a.id)}
                    type="button"
                  >
                    <div className="md:grid md:grid-cols-12 md:gap-2xs md:items-center">
                      <div className="md:col-span-4 flex items-center gap-2xs min-w-0">
                        <div className="h-9 w-9 rounded-full border border-outline-variant bg-surface-container-low flex items-center justify-center font-label text-label text-text-secondary shrink-0">
                          {initials(name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-body-base text-body-base font-medium text-primary truncate">
                            {name}
                          </div>
                          <div className="font-caption text-caption text-text-secondary truncate">
                            {subtitle || a.candidate?.email || "--"}
                          </div>
                        </div>
                      </div>

                      <div className="hidden md:block md:col-span-3 font-caption text-caption text-text-secondary truncate">
                        {a.status ?? "unknown"}
                      </div>

                      <div className="hidden md:block md:col-span-2 font-display text-h2 text-primary tabular-nums">
                        {score ?? "--"}
                      </div>

                      <div className="md:col-span-3 mt-xs md:mt-0 flex items-center justify-between md:justify-end gap-sm">
                        <div className="md:hidden font-caption text-caption text-text-secondary">
                          <span className="mr-2xs">Stage:</span>
                          <span className="text-text-primary">{a.status ?? "unknown"}</span>
                          <span className="mx-2xs">·</span>
                          <span className="mr-2xs">AI:</span>
                          <span className="text-text-primary tabular-nums">{score ?? "--"}</span>
                        </div>

                        <div className="flex items-center gap-2xs">
                          <Link
                            className={`inline-flex border border-outline-variant text-primary font-label text-label px-sm py-3xs rounded hover:bg-surface-container-low transition-colors ${!a.candidate?.id ? "pointer-events-none opacity-50" : ""}`}
                            href={a.candidate?.id ? `/candidates/${a.candidate.id}` : "#"}
                          >
                            View
                          </Link>
                          <button
                            className="inline-flex bg-primary text-on-primary font-label text-label px-sm py-3xs rounded hover:bg-surface-tint transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={pending || typeof a.composite_score === "number"}
                            onClick={(e) => {
                              e.stopPropagation();
                              startTransition(async () => {
                                try {
                                  await props.onScore(a.id);
                                } catch {
                                  // scoring failure is non-fatal
                                }
                              });
                            }}
                            type="button"
                          >
                            {typeof a.composite_score === "number" ? "Scored" : pending ? "Scoring..." : "Score"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-md">
              <div className="bg-surface-container-low border border-outline-variant rounded-lg p-md">
                <p className="font-body-base text-body-base text-text-primary">No applications yet.</p>
                <p className="font-caption text-caption text-text-secondary mt-2xs">
                  Share the apply endpoint for this job to start receiving applications.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scorecard sidebar (desktop) */}
      <aside className="hidden lg:flex w-[420px] shrink-0 border-l border-outline-variant bg-surface flex-col">
        <ScorecardPanel selected={selected} />
      </aside>

      {/* Mobile scorecard FAB */}
      <div className="fixed bottom-md right-md lg:hidden z-40">
        <button
          onClick={() => setScorecardOpen(true)}
          className="bg-primary text-white px-sm py-xs rounded-full shadow-lg flex items-center gap-xs text-xs font-semibold"
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">analytics</span>
          Scorecard
        </button>
      </div>

      {/* Mobile scorecard drawer */}
      {scorecardOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setScorecardOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[90vw] max-w-[420px] bg-surface border-l border-outline-variant flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-md border-b border-outline-variant bg-surface-base">
              <h3 className="font-display text-h2 font-bold text-primary">AI Scorecard</h3>
              <button
                onClick={() => setScorecardOpen(false)}
                className="p-1 hover:bg-surface-container-low rounded"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-md space-y-md">
              {selected ? (
                <>
                  <div className="bg-surface-base rounded border border-outline-variant p-sm shadow-sm">
                    <div className="flex items-center justify-between mb-2xs">
                      <h4 className="font-label text-label uppercase tracking-widest text-text-secondary flex items-center gap-2xs">
                        <span className="material-symbols-outlined text-[16px] text-semantic-success">verified</span>
                        Composite Score
                      </h4>
                      <span className="text-semantic-success font-bold text-display tabular-nums">
                        {typeof selected.composite_score === "number" ? Math.round(selected.composite_score) : "--"}
                      </span>
                    </div>
                    <p className="font-caption text-caption text-text-secondary">
                      {selected.candidate?.full_name ?? selected.candidate?.email ?? "Candidate"} - {selected.status ?? "unknown"}
                    </p>
                  </div>

                  <div className="bg-surface-base rounded border border-outline-variant p-sm shadow-sm">
                    <div className="font-label text-label text-text-secondary uppercase tracking-wide">Component scores</div>
                    <div className="mt-sm grid grid-cols-2 gap-2xs font-caption text-caption text-text-secondary tabular-nums">
                      <div>Resume: {selected.resume_score ?? "--"}</div>
                      <div>Screen: {selected.screening_score ?? "--"}</div>
                      <div>Test: {selected.test_score ?? "--"}</div>
                      <div>Video: {selected.video_score ?? "--"}</div>
                    </div>
                  </div>

                  <div className="bg-surface-base rounded border border-outline-variant p-sm shadow-sm">
                    <div className="font-label text-label text-text-secondary uppercase tracking-wide">Explanation</div>
                    <div className="mt-sm font-caption text-caption text-text-secondary leading-relaxed space-y-2xs">
                      {(() => {
                        if (!selected.score_explanation) return <div>No explanation yet.</div>;
                        try {
                          const parsed = JSON.parse(selected.score_explanation) as { summary?: string; bullets?: string[] };
                          return (
                            <>
                              {parsed.summary ? <div className="text-text-primary">{parsed.summary}</div> : null}
                              {Array.isArray(parsed.bullets) && parsed.bullets.length ? (
                                <ul className="list-disc pl-md space-y-3xs">
                                  {parsed.bullets.slice(0, 8).map((b) => <li key={b}>{b}</li>)}
                                </ul>
                              ) : (
                                <RawExplanation text={selected.score_explanation} />
                              )}
                            </>
                          );
                        } catch {
                          return <RawExplanation text={selected.score_explanation} />;
                        }
                      })()}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-surface-container-low border border-outline-variant rounded-lg p-md">
                  <p className="font-body-base text-body-base text-text-secondary">Select a candidate to view details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

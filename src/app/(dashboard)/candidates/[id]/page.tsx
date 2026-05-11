import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRecruiterContext } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireRecruiterContext();
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: candidate, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", id)
    .eq("org_id", ctx.orgId)
    .single();

  if (error || !candidate) notFound();

  const { data: applications } = await supabase
    .from("applications")
    .select(`
      id, status, composite_score, resume_score, screening_score, test_score, video_score,
      score_explanation, applied_at,
      job:jobs(id, title)
    `)
    .eq("candidate_id", id)
    .order("applied_at", { ascending: false });

  type Edu = { degree?: string; field?: string; institution?: string; year?: number; percentage_or_cgpa?: string };
  type Work = { company?: string; title?: string; start_date?: string; end_date?: string; duration_months?: number; key_responsibilities?: string[] };
  const education: Edu[] = Array.isArray(candidate.education) ? candidate.education as unknown as Edu[] : [];
  const workExp: Work[] = Array.isArray(candidate.work_experience) ? candidate.work_experience as unknown as Work[] : [];

  const statusColor: Record<string, string> = {
    applied: "bg-blue-100 text-blue-700",
    shortlisted: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    hired: "bg-purple-100 text-purple-700",
    screening: "bg-amber-100 text-amber-700",
  };

  function ScoreBar({ label, score }: { label: string; score: number | null }) {
    if (score == null) return null;
    const pct = Math.round(score);
    const color = pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
    return (
      <div>
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>{label}</span>
          <span className="tabular-nums font-medium text-primary">{pct}/100</span>
        </div>
        <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-surface-base p-md">
      {/* Breadcrumb */}
      <div className="flex items-center gap-xs text-text-secondary text-xs mb-md">
        <Link href="/candidates" className="hover:text-primary transition-colors">Candidates</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-primary">{candidate.full_name ?? "Candidate"}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        {/* Left: profile */}
        <div className="space-y-md">
          {/* Profile card */}
          <div className="bg-surface rounded-2xl border border-outline-variant p-md shadow-sm">
            <div className="flex items-center gap-md mb-md">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-outline-variant flex items-center justify-center text-primary font-bold text-2xl">
                {(candidate.full_name ?? "?")[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-primary text-lg truncate">{candidate.full_name ?? "Unnamed"}</h2>
                {candidate.current_title && (
                  <div className="text-text-secondary text-sm truncate">{candidate.current_title}</div>
                )}
                {candidate.current_company && (
                  <div className="text-text-secondary text-xs truncate">{candidate.current_company}</div>
                )}
              </div>
            </div>
            <dl className="space-y-xs text-sm">
              {candidate.email && (
                <div className="flex items-center gap-xs text-text-secondary">
                  <span className="material-symbols-outlined text-[16px]">email</span>
                  <span className="truncate">{candidate.email}</span>
                </div>
              )}
              {candidate.phone && (
                <div className="flex items-center gap-xs text-text-secondary">
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  {candidate.phone}
                </div>
              )}
              {candidate.current_location && (
                <div className="flex items-center gap-xs text-text-secondary">
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  {candidate.current_location}
                </div>
              )}
              {candidate.total_experience != null && (
                <div className="flex items-center gap-xs text-text-secondary">
                  <span className="material-symbols-outlined text-[16px]">work_history</span>
                  {candidate.total_experience} yrs experience
                </div>
              )}
            </dl>
            <div className="flex flex-wrap gap-2xs mt-md">
              {candidate.linkedin_url && (
                <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-sm py-1 rounded-lg border border-outline-variant text-primary text-xs hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>LinkedIn
                </a>
              )}
              {candidate.github_url && (
                <a href={candidate.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-sm py-1 rounded-lg border border-outline-variant text-primary text-xs hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-[14px]">code</span>GitHub
                </a>
              )}
              {candidate.resume_url && (
                <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-sm py-1 rounded-lg border border-outline-variant text-primary text-xs hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-[14px]">description</span>Resume
                </a>
              )}
            </div>
          </div>

          {/* Skills */}
          {(candidate.skills?.length ?? 0) > 0 && (
            <div className="bg-surface rounded-2xl border border-outline-variant p-md shadow-sm">
              <h3 className="font-semibold text-primary mb-sm">Skills</h3>
              <div className="flex flex-wrap gap-xs">
                {candidate.skills!.map((s: string) => (
                  <span key={s} className="px-sm py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {(candidate.languages?.length ?? 0) > 0 && (
            <div className="bg-surface rounded-2xl border border-outline-variant p-md shadow-sm">
              <h3 className="font-semibold text-primary mb-sm">Languages</h3>
              <div className="flex flex-wrap gap-xs">
                {candidate.languages!.map((l: string) => (
                  <span key={l} className="px-sm py-1 rounded-full bg-surface-container-low border border-outline-variant text-text-secondary text-xs">{l}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: experience, education, applications */}
        <div className="lg:col-span-2 space-y-md">
          {/* Work experience */}
          {workExp.length > 0 && (
            <div className="bg-surface rounded-2xl border border-outline-variant p-md shadow-sm">
              <h3 className="font-semibold text-primary mb-md">Work Experience</h3>
              <div className="space-y-md">
                {workExp.map((w, i) => (
                  <div key={i} className="border-l-2 border-primary/20 pl-md">
                    <div className="font-medium text-primary text-sm">{w.title}</div>
                    <div className="text-text-secondary text-xs">{w.company}</div>
                    <div className="text-text-secondary text-xs mt-0.5">
                      {w.start_date} – {w.end_date ?? "Present"}
                      {w.duration_months ? ` · ${Math.round(w.duration_months / 12 * 10) / 10} yrs` : ""}
                    </div>
                    {w.key_responsibilities?.slice(0, 3).map((r, j) => (
                      <div key={j} className="text-text-secondary text-xs mt-xs pl-sm border-l border-outline-variant">
                        {r}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {education.length > 0 && (
            <div className="bg-surface rounded-2xl border border-outline-variant p-md shadow-sm">
              <h3 className="font-semibold text-primary mb-sm">Education</h3>
              <div className="space-y-sm">
                {education.map((e, i) => (
                  <div key={i} className="flex items-start gap-sm">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[16px]">school</span>
                    </div>
                    <div>
                      <div className="font-medium text-primary text-sm">{e.degree} {e.field ? `in ${e.field}` : ""}</div>
                      <div className="text-text-secondary text-xs">{e.institution}</div>
                      <div className="text-text-secondary text-xs">{e.year}{e.percentage_or_cgpa ? ` · ${e.percentage_or_cgpa}` : ""}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Applications */}
          <div className="bg-surface rounded-2xl border border-outline-variant p-md shadow-sm">
            <h3 className="font-semibold text-primary mb-md">Applications ({applications?.length ?? 0})</h3>
            {applications?.length ? (
              <div className="space-y-md">
                {applications.map((app) => {
                  const job = app.job as { id: string; title: string } | null;
                  return (
                    <div key={app.id} className="border border-outline-variant rounded-xl p-md">
                      <div className="flex items-center justify-between gap-sm mb-sm flex-wrap">
                        <div>
                          {job && (
                            <Link href={`/jobs/${job.id}/candidates`} className="font-medium text-primary text-sm hover:underline">
                              {job.title}
                            </Link>
                          )}
                          <div className="text-text-secondary text-xs mt-0.5">
                            Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString("en-IN") : "—"}
                          </div>
                        </div>
                        <span className={`px-sm py-1 rounded-full text-xs font-medium capitalize ${statusColor[app.status ?? ""] ?? "bg-surface-container-high text-text-secondary"}`}>
                          {app.status?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="space-y-xs">
                        <ScoreBar label="Composite score" score={app.composite_score} />
                        <ScoreBar label="Resume match" score={app.resume_score} />
                        <ScoreBar label="Screening" score={app.screening_score} />
                      </div>
                      {app.score_explanation && (
                        <div className="mt-sm text-xs text-text-secondary bg-surface-container-low rounded-lg p-sm leading-relaxed">
                          {typeof app.score_explanation === "string"
                            ? (() => { try { const p = JSON.parse(app.score_explanation); return p.summary ?? app.score_explanation; } catch { return app.score_explanation; } })()
                            : "—"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-text-secondary text-sm">No applications yet.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

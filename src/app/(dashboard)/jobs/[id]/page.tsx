import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRecruiterContext } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { ShareLinkButton } from "@/components/dashboard/ShareLinkButton";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireRecruiterContext();
  const { id: jobId } = await params;
  const supabase = createAdminClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("org_id", ctx.orgId)
    .single();

  if (error || !job) notFound();

  const { count: appCount } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("job_id", jobId);

  const { data: apps } = await supabase
    .from("applications")
    .select("status, composite_score")
    .eq("job_id", jobId)
    .limit(200);

  const statusGroups: Record<string, number> = {};
  for (const a of apps ?? []) {
    const s = a.status ?? "unknown";
    statusGroups[s] = (statusGroups[s] ?? 0) + 1;
  }

  const shortlisted = statusGroups["shortlisted"] ?? 0;
  const rejected = statusGroups["rejected"] ?? 0;
  const avgScore = apps?.length
    ? Math.round((apps.filter((a) => a.composite_score != null).reduce((s, a) => s + (a.composite_score ?? 0), 0)) / Math.max(1, apps.filter(a => a.composite_score != null).length))
    : null;

  const statusBadge: Record<string, string> = {
    draft: "bg-surface-container-high text-text-secondary",
    active: "bg-emerald-100 text-emerald-700",
    paused: "bg-amber-100 text-amber-700",
    closed: "bg-red-100 text-red-700",
    archived: "bg-surface-container-high text-text-secondary",
  };

  return (
    <main className="flex-1 overflow-y-auto bg-surface-base p-md">
      {/* Breadcrumb */}
      <div className="flex items-center gap-xs text-text-secondary text-xs mb-md">
        <Link href="/jobs" className="hover:text-primary transition-colors">Jobs</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-primary">{job.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-sm flex-wrap mb-lg">
        <div>
          <h2 className="font-display text-[28px] font-bold text-primary">{job.title}</h2>
          <div className="flex items-center gap-sm mt-xs flex-wrap">
            <span className={`inline-flex items-center gap-1 px-sm py-1 rounded-full text-xs font-medium ${statusBadge[job.status ?? ""] ?? "bg-surface-container-high text-text-secondary"}`}>
              <span className="material-symbols-outlined text-[12px]">circle</span>
              {job.status}
            </span>
            {job.location && (
              <span className="flex items-center gap-1 text-text-secondary text-xs">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                {job.location}
              </span>
            )}
            {job.department && (
              <span className="flex items-center gap-1 text-text-secondary text-xs">
                <span className="material-symbols-outlined text-[14px]">business</span>
                {job.department}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-sm">
          <Link
            href={`/jobs/${job.id}/candidates`}
            className="inline-flex items-center gap-xs bg-primary text-white font-medium text-sm px-md py-xs rounded-xl hover:opacity-90 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">group</span>
            View pipeline
          </Link>
          {job.public_slug && (
            <>
              <a
                href={`/apply/${job.public_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-xs border border-outline-variant text-primary font-medium text-sm px-md py-xs rounded-xl hover:bg-surface-container-low transition-colors bg-surface shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                Preview
              </a>
              <ShareLinkButton slug={job.public_slug} />
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-sm mb-lg">
        {[
          { icon: "group", label: "Total applicants", value: appCount ?? 0, color: "text-primary" },
          { icon: "check_circle", label: "Shortlisted", value: shortlisted, color: "text-emerald-600" },
          { icon: "cancel", label: "Rejected", value: rejected, color: "text-red-500" },
          { icon: "analytics", label: "Avg score", value: avgScore != null ? `${avgScore}/100` : "—", color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="bg-surface rounded-2xl border border-outline-variant p-md shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-xs">
              <span className="text-text-secondary text-xs">{s.label}</span>
              <span className={`material-symbols-outlined text-[18px] ${s.color}`}>{s.icon}</span>
            </div>
            <div className={`font-display text-[28px] font-bold tabular-nums ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        {/* Job details */}
        <div className="lg:col-span-2 space-y-md">
          {job.description && (
            <div className="bg-surface rounded-2xl border border-outline-variant p-md shadow-sm">
              <h3 className="font-semibold text-primary mb-sm">Job Description</h3>
              <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>
          )}

          {(job.requirements?.length ?? 0) > 0 && (
            <div className="bg-surface rounded-2xl border border-outline-variant p-md shadow-sm">
              <h3 className="font-semibold text-primary mb-sm">Requirements</h3>
              <ul className="space-y-xs">
                {job.requirements!.map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-xs text-sm text-text-secondary">
                    <span className="material-symbols-outlined text-primary text-[16px] mt-0.5">check_circle</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Application funnel */}
          {Object.keys(statusGroups).length > 0 && (
            <div className="bg-surface rounded-2xl border border-outline-variant p-md shadow-sm">
              <h3 className="font-semibold text-primary mb-sm">Application funnel</h3>
              <div className="space-y-xs">
                {Object.entries(statusGroups).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                  const pct = Math.round((count / (appCount ?? 1)) * 100);
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-xs text-text-secondary mb-1">
                        <span className="capitalize">{status.replace(/_/g, " ")}</span>
                        <span className="tabular-nums">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-md">
          <div className="bg-surface rounded-2xl border border-outline-variant p-md shadow-sm">
            <h3 className="font-semibold text-primary mb-sm">Job details</h3>
            <dl className="space-y-xs text-sm">
              {[
                { label: "Type", value: job.employment_type?.replace("_", " ") },
                { label: "Experience", value: job.experience_min != null ? `${job.experience_min}–${job.experience_max ?? "+"} yrs` : null },
                { label: "CTC", value: job.ctc_min != null ? `Rs ${(job.ctc_min/100000).toFixed(1)}L – Rs ${((job.ctc_max ?? job.ctc_min)/100000).toFixed(1)}L` : null },
                { label: "Deadline", value: job.application_deadline ? new Date(job.application_deadline).toLocaleDateString("en-IN") : null },
                { label: "Public slug", value: job.public_slug ?? null },
              ].filter(d => d.value).map(d => (
                <div key={d.label} className="flex justify-between gap-sm">
                  <dt className="text-text-secondary">{d.label}</dt>
                  <dd className="text-primary font-medium text-right capitalize">{d.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {Array.isArray(job.screening_questions) && job.screening_questions.length > 0 && (
            <div className="bg-surface rounded-2xl border border-outline-variant p-md shadow-sm">
              <h3 className="font-semibold text-primary mb-sm">Screening questions</h3>
              <ul className="space-y-xs">
                {job.screening_questions.slice(0, 5).map((q: { q: string }, i: number) => (
                  <li key={i} className="text-xs text-text-secondary leading-relaxed">
                    {i + 1}. {q.q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { requireRecruiterContext } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await requireRecruiterContext();
  const supabase = createAdminClient();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: jobs },
    { data: apps },
    { data: candidates },
    { data: recentApps },
    { data: weekApps },
  ] = await Promise.all([
    supabase.from("jobs").select("id, title, status, visibility, public_slug, application_count").eq("org_id", ctx.orgId),
    supabase.from("applications").select("id, status, composite_score, applied_at").eq("org_id", ctx.orgId),
    supabase.from("candidates").select("id").eq("org_id", ctx.orgId),
    supabase
      .from("applications")
      .select(`id, status, composite_score, applied_at, candidates(full_name, email), jobs(title)`)
      .eq("org_id", ctx.orgId)
      .order("applied_at", { ascending: false })
      .limit(6),
    supabase.from("applications").select("id").eq("org_id", ctx.orgId).gte("applied_at", weekAgo),
  ]);

  const totalJobs = jobs?.length ?? 0;
  const activeJobs = jobs?.filter((j) => j.status === "active").length ?? 0;
  const totalCandidates = candidates?.length ?? 0;
  const totalApps = apps?.length ?? 0;
  const weekCount = weekApps?.length ?? 0;

  const scoredApps = (apps ?? []).filter((a) => a.composite_score != null);
  const avgScore = scoredApps.length
    ? Math.round(scoredApps.reduce((s, a) => s + (a.composite_score ?? 0), 0) / scoredApps.length)
    : null;

  // Funnel counts
  const funnel: Record<string, number> = {};
  for (const a of apps ?? []) {
    const s = (a.status ?? "applied") as string;
    funnel[s] = (funnel[s] ?? 0) + 1;
  }

  const funnelStages = [
    { key: "applied",           label: "Applied",         color: "bg-blue-500" },
    { key: "screening",         label: "Screening",       color: "bg-yellow-500" },
    { key: "shortlisted",       label: "Shortlisted",     color: "bg-emerald-500" },
    { key: "interview_pending", label: "Interview",       color: "bg-purple-500" },
    { key: "offer_sent",        label: "Offer Sent",      color: "bg-orange-500" },
    { key: "hired",             label: "Hired",           color: "bg-emerald-700" },
    { key: "rejected",          label: "Rejected",        color: "bg-red-400" },
  ];

  const topActiveJobs = (jobs ?? [])
    .filter((j) => j.status === "active")
    .sort((a, b) => (b.application_count ?? 0) - (a.application_count ?? 0))
    .slice(0, 4);

  return (
    <main className="flex-1 overflow-y-auto bg-surface-base p-md">
      {/* Page header */}
      <div className="flex items-start justify-between gap-sm flex-wrap mb-md">
        <div>
          <h2 className="font-h1 text-h1 text-primary">Dashboard</h2>
          <p className="font-body-base text-body-base text-text-secondary">
            {ctx.orgName ?? "Your organization"} · Live data
          </p>
        </div>
        <div className="flex items-center gap-xs">
          <Link
            href="/jobs#new-job"
            className="inline-flex items-center gap-xs bg-primary text-on-primary font-label text-label px-md py-xs rounded-lg hover:bg-surface-tint transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            New Job
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-sm mb-md">
        {[
          { icon: "work",        label: "Total Jobs",          value: totalJobs,       sub: `${activeJobs} active`,       color: "text-primary",    link: "/jobs" },
          { icon: "group",       label: "Candidates",          value: totalCandidates, sub: "in database",                color: "text-blue-600",   link: "/candidates" },
          { icon: "send",        label: "Applications",        value: totalApps,       sub: `+${weekCount} this week`,    color: "text-purple-600", link: null },
          { icon: "analytics",   label: "Avg AI Score",        value: avgScore != null ? `${avgScore}` : "—", sub: `${scoredApps.length} scored`, color: "text-emerald-600", link: null },
        ].map((s) => (
          <div key={s.label} className="bg-surface rounded-xl border border-outline-variant p-md shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-xs">
              <span className="font-label text-label text-text-secondary">{s.label}</span>
              <span className={`material-symbols-outlined text-[20px] ${s.color}`}>{s.icon}</span>
            </div>
            <div className={`font-display text-[32px] font-bold tabular-nums leading-none ${s.color}`}>{s.value}</div>
            <div className="flex items-center justify-between mt-xs">
              <span className="font-caption text-caption text-text-secondary">{s.sub}</span>
              {s.link && (
                <Link href={s.link} className="font-caption text-caption text-primary hover:underline">
                  View
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        {/* Application funnel */}
        <div className="lg:col-span-2 space-y-md">
          <div className="bg-surface rounded-xl border border-outline-variant shadow-sm p-md">
            <div className="flex items-center justify-between mb-md">
              <h3 className="font-semibold text-primary">Application Funnel</h3>
              <span className="font-caption text-caption text-text-secondary">{totalApps} total</span>
            </div>
            {funnelStages.some((s) => funnel[s.key]) ? (
              <div className="space-y-sm">
                {funnelStages.filter((s) => funnel[s.key]).map((stage) => {
                  const count = funnel[stage.key] ?? 0;
                  const pct = totalApps > 0 ? Math.round((count / totalApps) * 100) : 0;
                  return (
                    <div key={stage.key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-text-secondary">{stage.label}</span>
                        <span className="tabular-nums text-primary font-medium">{count} <span className="text-text-secondary font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className={`h-full ${stage.color} rounded-full transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-lg">
                <span className="material-symbols-outlined text-text-secondary/30 text-[48px] block">inbox</span>
                <p className="text-text-secondary font-caption text-caption mt-xs">No applications yet. Share your job links to get started.</p>
              </div>
            )}
          </div>

          {/* Recent applications feed */}
          <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="px-md py-sm border-b border-outline-variant flex items-center justify-between">
              <h3 className="font-semibold text-primary">Recent Applications</h3>
              <Link href="/candidates" className="text-primary text-xs hover:underline">View all</Link>
            </div>
            {recentApps?.length ? (
              <div className="divide-y divide-outline-variant">
                {recentApps.map((app) => {
                  const candidate = app.candidates as unknown as { full_name: string | null; email: string } | null;
                  const job = app.jobs as unknown as { title: string } | null;
                  const score = app.composite_score;
                  const timeAgo = (() => {
                    const diff = Date.now() - (app.applied_at ? new Date(app.applied_at).getTime() : 0);
                    const h = Math.floor(diff / 3600000);
                    if (h < 1) return "just now";
                    if (h < 24) return `${h}h ago`;
                    return `${Math.floor(h / 24)}d ago`;
                  })();
                  return (
                    <div key={app.id} className="px-md py-sm flex items-center gap-sm">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-[16px]">person</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-primary truncate">
                          {candidate?.full_name ?? candidate?.email ?? "Candidate"}
                        </div>
                        <div className="font-caption text-caption text-text-secondary truncate">
                          {job?.title ?? "Unknown role"} · {timeAgo}
                        </div>
                      </div>
                      {score != null && (
                        <div className={`text-sm font-bold tabular-nums shrink-0 ${score >= 70 ? "text-emerald-600" : score >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                          {Math.round(score)}
                        </div>
                      )}
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                        app.status === "shortlisted" ? "bg-emerald-100 text-emerald-700" :
                        app.status === "rejected" ? "bg-red-100 text-red-600" :
                        "bg-surface-container-high text-text-secondary"
                      }`}>{app.status}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-lg text-center">
                <span className="material-symbols-outlined text-text-secondary/30 text-[40px] block">group</span>
                <p className="text-text-secondary text-sm mt-xs">No applications yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-md">
          {/* Quick Actions */}
          <div className="bg-surface rounded-xl border border-outline-variant shadow-sm p-md">
            <h3 className="font-semibold text-primary mb-sm">Quick Actions</h3>
            <div className="space-y-xs">
              {[
                { icon: "add_circle",   label: "Create new job",      href: "/jobs#new-job", primary: true },
                { icon: "group",        label: "View all candidates",  href: "/candidates",   primary: false },
                { icon: "bar_chart",    label: "Analytics",            href: "/analytics",    primary: false },
                { icon: "description",  label: "Email templates",      href: "/templates",    primary: false },
                { icon: "settings",     label: "Organization settings",href: "/settings",     primary: false },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`flex items-center gap-xs px-sm py-xs rounded-lg text-sm transition-colors ${
                    action.primary
                      ? "bg-primary text-on-primary hover:bg-surface-tint font-medium"
                      : "text-text-secondary hover:bg-surface-container-low"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{action.icon}</span>
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Active jobs */}
          {topActiveJobs.length > 0 && (
            <div className="bg-surface rounded-xl border border-outline-variant shadow-sm p-md">
              <div className="flex items-center justify-between mb-sm">
                <h3 className="font-semibold text-primary">Active Jobs</h3>
                <Link href="/jobs" className="text-primary text-xs hover:underline">All</Link>
              </div>
              <div className="space-y-xs">
                {topActiveJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}/candidates`}
                    className="flex items-center justify-between gap-xs p-xs rounded-lg hover:bg-surface-container-low transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-primary truncate">{job.title}</div>
                      <div className="font-caption text-caption text-text-secondary">
                        {job.application_count ?? 0} applicant{(job.application_count ?? 0) !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-text-secondary text-[16px]">chevron_right</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Hiring health */}
          <div className="bg-gradient-to-br from-primary/5 to-blue-500/10 rounded-xl border border-primary/20 p-md">
            <h3 className="font-semibold text-primary mb-xs">Hiring Health</h3>
            <div className="space-y-xs">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Offer rate</span>
                <span className="font-medium text-primary tabular-nums">
                  {totalApps > 0 ? `${Math.round(((funnel["offer_sent"] ?? 0) + (funnel["hired"] ?? 0)) / totalApps * 100)}%` : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Shortlist rate</span>
                <span className="font-medium text-primary tabular-nums">
                  {totalApps > 0 ? `${Math.round((funnel["shortlisted"] ?? 0) / totalApps * 100)}%` : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Avg AI Score</span>
                <span className="font-medium text-primary tabular-nums">{avgScore != null ? `${avgScore}/100` : "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

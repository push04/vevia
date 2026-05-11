import { requireRecruiterContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function AnalyticsPage() {
  const ctx = await requireRecruiterContext();
  const supabase = await createClient();

  const [appsRes, jobsRes] = await Promise.all([
    supabase
      .from("applications")
      .select("status, composite_score, applied_at, job_id")
      .eq("org_id", ctx.orgId)
      .order("applied_at", { ascending: false })
      .limit(500),
    supabase
      .from("jobs")
      .select("id, title, status")
      .eq("org_id", ctx.orgId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const apps = appsRes.data ?? [];
  const jobs = jobsRes.data ?? [];

  // Funnel data
  const funnel: Record<string, number> = {};
  for (const a of apps) {
    const s = a.status ?? "unknown";
    funnel[s] = (funnel[s] ?? 0) + 1;
  }

  // Score distribution buckets
  const buckets = { "0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0 };
  for (const a of apps) {
    const s = a.composite_score ?? null;
    if (s == null) continue;
    if (s <= 25) buckets["0-25"]++;
    else if (s <= 50) buckets["26-50"]++;
    else if (s <= 75) buckets["51-75"]++;
    else buckets["76-100"]++;
  }

  // Daily volume (last 14 days)
  const dailyMap: Record<string, number> = {};
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dailyMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const a of apps) {
    const day = a.applied_at?.slice(0, 10);
    if (day && day in dailyMap) dailyMap[day]++;
  }

  const maxFunnelVal = Math.max(...Object.values(funnel), 1);
  const maxDailyVal = Math.max(...Object.values(dailyMap), 1);
  const maxBucketVal = Math.max(...Object.values(buckets), 1);

  const FUNNEL_ORDER = [
    "applied", "screening", "screened", "test_pending", "test_done",
    "interview_pending", "interview_done", "shortlisted", "hired", "rejected", "on_hold"
  ];

  const funnelEntries = FUNNEL_ORDER
    .filter((k) => funnel[k] != null)
    .map((k) => [k, funnel[k]] as [string, number]);

  const barColor = (status: string) => {
    if (status === "shortlisted" || status === "hired") return "bg-emerald-500";
    if (status === "rejected") return "bg-red-400";
    if (status === "screening" || status === "screened") return "bg-amber-400";
    return "bg-primary";
  };

  return (
    <main className="flex-1 overflow-y-auto bg-surface-base p-md">
      <div className="mb-lg">
        <h2 className="font-display text-[28px] font-bold text-primary">Analytics</h2>
        <p className="text-text-secondary text-sm mt-1">
          Real-time hiring funnel and performance metrics for{" "}
          <span className="text-primary">{ctx.orgName ?? "your org"}</span>.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-sm mb-lg">
        {[
          { icon: "inbox", label: "Total applications", value: apps.length },
          { icon: "check_circle", label: "Shortlisted", value: funnel["shortlisted"] ?? 0 },
          { icon: "work", label: "Active jobs", value: jobs.filter(j => j.status === "active").length },
          {
            icon: "analytics",
            label: "Avg score",
            value: apps.filter(a => a.composite_score != null).length
              ? Math.round(apps.filter(a => a.composite_score != null).reduce((s, a) => s + (a.composite_score ?? 0), 0) / apps.filter(a => a.composite_score != null).length) + "/100"
              : "—"
          },
        ].map((card) => (
          <div key={card.label} className="bg-surface rounded-2xl border border-outline-variant p-md shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-xs">
              <span className="text-text-secondary text-xs">{card.label}</span>
              <span className="material-symbols-outlined text-primary text-[18px]">{card.icon}</span>
            </div>
            <div className="font-display text-[28px] font-bold text-primary tabular-nums">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-md mb-md">
        {/* Application funnel */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-md shadow-sm">
          <h3 className="font-semibold text-primary mb-md">Application Funnel</h3>
          {funnelEntries.length ? (
            <div className="space-y-sm">
              {funnelEntries.map(([status, count]) => {
                const pct = Math.round((count / maxFunnelVal) * 100);
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs text-text-secondary mb-1">
                      <span className="capitalize">{status.replace(/_/g, " ")}</span>
                      <span className="tabular-nums font-medium text-primary">{count}</span>
                    </div>
                    <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor(status)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-text-secondary text-sm">No application data yet.</p>
          )}
        </div>

        {/* Score distribution */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-md shadow-sm">
          <h3 className="font-semibold text-primary mb-md">Score Distribution</h3>
          <div className="flex items-end gap-sm h-32 mt-md">
            {Object.entries(buckets).map(([range, count]) => {
              const pct = Math.round((count / maxBucketVal) * 100);
              const colors: Record<string, string> = {
                "0-25": "bg-red-400",
                "26-50": "bg-amber-400",
                "51-75": "bg-blue-400",
                "76-100": "bg-emerald-500",
              };
              return (
                <div key={range} className="flex-1 flex flex-col items-center gap-xs">
                  <span className="text-xs text-text-secondary tabular-nums">{count}</span>
                  <div className="w-full flex items-end justify-center" style={{ height: "80px" }}>
                    <div
                      className={`w-full rounded-t-lg transition-all ${colors[range]}`}
                      style={{ height: `${Math.max(4, pct * 0.8)}px` }}
                    />
                  </div>
                  <span className="text-[10px] text-text-secondary">{range}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-text-secondary text-center mt-xs">Composite score ranges</p>
        </div>
      </div>

      {/* Daily volume */}
      <div className="bg-surface rounded-2xl border border-outline-variant p-md shadow-sm mb-md">
        <h3 className="font-semibold text-primary mb-md">Daily Applications (last 14 days)</h3>
        <div className="flex items-end gap-1 h-24 overflow-x-auto">
          {Object.entries(dailyMap).map(([day, count]) => {
            const pct = Math.round((count / maxDailyVal) * 100);
            return (
              <div key={day} className="flex-1 min-w-[20px] flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: "72px" }}>
                  <div
                    className="w-full bg-primary rounded-t transition-all hover:bg-sky-600"
                    style={{ height: `${Math.max(2, pct * 0.72)}px` }}
                    title={`${day}: ${count}`}
                  />
                </div>
                <span className="text-[8px] text-text-secondary" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", height: "28px" }}>
                  {day.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top jobs table */}
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-md py-sm bg-surface-container-low border-b border-outline-variant">
          <h3 className="font-semibold text-primary text-sm">Jobs by applications</h3>
        </div>
        {jobs.length ? (
          <div className="divide-y divide-outline-variant">
            {jobs.map((job) => {
              const jobApps = apps.filter((a) => a.job_id === job.id);
              const appCount = jobApps.length;
              const shortCount = jobApps.filter((a) => a.status === "shortlisted").length;
              return (
              <div key={job.id} className="px-md py-sm flex items-center justify-between gap-sm">
                <div className="min-w-0">
                  <div className="font-medium text-primary text-sm truncate">{job.title}</div>
                  <span className={`text-xs capitalize ${job.status === "active" ? "text-emerald-600" : "text-text-secondary"}`}>
                    {job.status}
                  </span>
                </div>
                <div className="flex items-center gap-md text-xs text-text-secondary tabular-nums shrink-0">
                  <span>{appCount} apps</span>
                  <span className="text-emerald-600">{shortCount} shortlisted</span>
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div className="p-md text-text-secondary text-sm">No jobs yet.</div>
        )}
      </div>
    </main>
  );
}

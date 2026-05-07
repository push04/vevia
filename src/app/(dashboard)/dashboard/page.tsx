import Link from "next/link";

import { requireRecruiterContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const ctx = await requireRecruiterContext();
  const supabase = await createClient();

  const [{ data: jobs }, { data: apps }, { data: candidates }] = await Promise.all([
    supabase.from("jobs").select("id, status").eq("org_id", ctx.orgId),
    supabase.from("applications").select("id, status, composite_score").eq("org_id", ctx.orgId),
    supabase.from("candidates").select("id").eq("org_id", ctx.orgId),
  ]);

  const jobCount = jobs?.length ?? 0;
  const candidateCount = candidates?.length ?? 0;

  const funnel: Record<string, number> = {};
  for (const a of apps ?? []) {
    const status = (a.status ?? "unknown") as string;
    funnel[status] = (funnel[status] ?? 0) + 1;
  }

  const scoredCount = (apps ?? []).filter((a) => typeof a.composite_score === "number").length;

  return (
    <main className="flex-1 overflow-y-auto bg-surface-base p-md">
      <div className="flex flex-col gap-2xs">
        <h2 className="font-h1 text-h1 text-primary">Dashboard</h2>
        <p className="font-body-base text-body-base text-text-secondary">
          Live data from Supabase for <span className="text-text-primary">{ctx.orgName ?? "your organization"}</span>.
        </p>
      </div>

      <div className="mt-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-sm">
        <div className="bg-surface rounded-lg border border-outline-variant p-md shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="font-label text-label text-text-secondary">Jobs</div>
            <span className="material-symbols-outlined text-text-secondary">work</span>
          </div>
          <div className="mt-xs font-display text-display text-primary tabular-nums">{jobCount}</div>
          <Link className="mt-xs inline-flex text-primary font-label text-label hover:underline" href="/jobs">
            Manage jobs
          </Link>
        </div>

        <div className="bg-surface rounded-lg border border-outline-variant p-md shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="font-label text-label text-text-secondary">Candidates</div>
            <span className="material-symbols-outlined text-text-secondary">group</span>
          </div>
          <div className="mt-xs font-display text-display text-primary tabular-nums">{candidateCount}</div>
          <Link className="mt-xs inline-flex text-primary font-label text-label hover:underline" href="/candidates">
            View candidates
          </Link>
        </div>

        <div className="bg-surface rounded-lg border border-outline-variant p-md shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="font-label text-label text-text-secondary">Applications</div>
            <span className="material-symbols-outlined text-text-secondary">account_tree</span>
          </div>
          <div className="mt-xs font-display text-display text-primary tabular-nums">{apps?.length ?? 0}</div>
          <div className="mt-xs font-caption text-caption text-text-secondary">
            Scored: <span className="text-text-primary tabular-nums">{scoredCount}</span>
          </div>
        </div>

        <div className="bg-surface rounded-lg border border-outline-variant p-md shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="font-label text-label text-text-secondary">Pipeline</div>
            <span className="material-symbols-outlined text-text-secondary">insights</span>
          </div>
          <div className="mt-xs font-caption text-caption text-text-secondary">
            {Object.keys(funnel).length ? (
              <div className="space-y-2xs">
                {Object.entries(funnel)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-sm">
                      <span className="truncate">{k}</span>
                      <span className="tabular-nums text-text-primary">{v}</span>
                    </div>
                  ))}
              </div>
            ) : (
              "No application activity yet."
            )}
          </div>
        </div>
      </div>
    </main>
  );
}


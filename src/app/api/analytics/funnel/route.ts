import { NextRequest, NextResponse } from "next/server";

import { requireInternalAuth } from "@/lib/auth/internal";
import { createAdminClient } from "@/lib/supabase/admin";

const STAGES = [
  "applied",
  "screening",
  "screened",
  "shortlisted",
  "hired",
  "rejected",
  "on_hold"
];

export async function GET(req: NextRequest) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    const url = new URL(req.url);
    const orgId = url.searchParams.get("org_id");
    if (!orgId) {
      return NextResponse.json({ success: false, error: "Missing org_id" }, { status: 400 });
    }
    const jobId = url.searchParams.get("job_id");

    const supabase = createAdminClient();
    let query = supabase
      .from("applications")
      .select("status, applied_at, screened_at")
      .eq("org_id", orgId);
    if (jobId) query = query.eq("job_id", jobId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const counts: Record<string, number> = {};
    const appliedToScreenedTimes: number[] = [];
    
    for (const row of data ?? []) {
      const status = (row.status ?? "applied") as string;
      counts[status] = (counts[status] ?? 0) + 1;
      
      const applied = row.applied_at ? new Date(row.applied_at).getTime() : null;
      
      if (applied && row.screened_at) {
        const t = (new Date(row.screened_at).getTime() - applied) / (1000 * 60 * 60 * 24);
        if (t >= 0) appliedToScreenedTimes.push(t);
      }
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    
    const stages: { stage: string; count: number; percentage: number; dropOffRate: number | null }[] = [];
    let prevCount = total;
    
    for (const stage of STAGES) {
      const count = counts[stage] ?? 0;
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      const dropOffRate = prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : null;
      stages.push({ stage, count, percentage, dropOffRate });
      prevCount = count;
    }

    const avgTimeAppliedToScreened = appliedToScreenedTimes.length > 0
      ? Math.round(appliedToScreenedTimes.reduce((a, b) => a + b, 0) / appliedToScreenedTimes.length * 10) / 10
      : null;

    return NextResponse.json({
      success: true,
      total,
      stages,
      avgTimePerStage: {
        applied_to_screened: avgTimeAppliedToScreened
      },
      samples: data?.length ?? 0
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
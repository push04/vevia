import { NextRequest, NextResponse } from "next/server";

import { requireInternalAuth } from "@/lib/auth/internal";
import { createAdminClient } from "@/lib/supabase/admin";

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
      .select("applied_at, screened_at, status")
      .eq("org_id", orgId);
    if (jobId) query = query.eq("job_id", jobId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const appliedToScreenedTimes: number[] = [];
    const appliedToHiredTimes: number[] = [];
    const appliedToShortlistedTimes: number[] = [];

    for (const row of data ?? []) {
      const applied = row.applied_at ? new Date(row.applied_at).getTime() : null;
      if (!applied) continue;

      if (row.screened_at) {
        const t = (new Date(row.screened_at).getTime() - applied) / (1000 * 60 * 60 * 24);
        if (t >= 0) appliedToScreenedTimes.push(t);
      }

      if (row.status === "hired" && row.screened_at) {
        const t = (new Date(row.screened_at).getTime() - applied) / (1000 * 60 * 60 * 24);
        if (t >= 0) appliedToHiredTimes.push(t);
      }

      if (row.status === "shortlisted" && row.screened_at) {
        const t = (new Date(row.screened_at).getTime() - applied) / (1000 * 60 * 60 * 24);
        if (t >= 0) appliedToShortlistedTimes.push(t);
      }
    }

    const avgDays = (arr: number[]) => 
      arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null;

    const results = {
      average_days_applied_to_screened: avgDays(appliedToScreenedTimes),
      average_days_applied_to_shortlisted: avgDays(appliedToShortlistedTimes),
      average_days_applied_to_hired: avgDays(appliedToHiredTimes),
    };

    const samples = {
      screened: appliedToScreenedTimes.length,
      shortlisted: appliedToShortlistedTimes.length,
      hired: appliedToHiredTimes.length
    };

    const pipelineCounts: Record<string, number> = {};
    for (const row of data ?? []) {
      const status = row.status ?? "applied";
      pipelineCounts[status] = (pipelineCounts[status] ?? 0) + 1;
    }

    return NextResponse.json({
      success: true,
      metrics: results,
      samples,
      pipelineBreakdown: pipelineCounts
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
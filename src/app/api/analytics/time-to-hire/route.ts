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

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("applications")
      .select("applied_at, screened_at")
      .eq("org_id", orgId);
    if (error) throw new Error(error.message);

    const deltasDays: number[] = [];
    for (const row of data ?? []) {
      if (!row.applied_at || !row.screened_at) continue;
      const start = new Date(row.applied_at).getTime();
      const end = new Date(row.screened_at).getTime();
      if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) continue;
      deltasDays.push((end - start) / (1000 * 60 * 60 * 24));
    }

    const avgDays =
      deltasDays.length === 0
        ? null
        : deltasDays.reduce((a, b) => a + b, 0) / deltasDays.length;

    return NextResponse.json({
      success: true,
      metrics: {
        average_days_applied_to_screened: avgDays,
        samples: deltasDays.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}


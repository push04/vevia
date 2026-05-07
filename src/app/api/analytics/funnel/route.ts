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
    let query = supabase.from("applications").select("status").eq("org_id", orgId);
    if (jobId) query = query.eq("job_id", jobId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const status = (row.status ?? "unknown") as string;
      counts[status] = (counts[status] ?? 0) + 1;
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return NextResponse.json({ success: true, total, counts });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}


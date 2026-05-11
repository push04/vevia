import { NextRequest, NextResponse } from "next/server";

import { requireCronAuth } from "@/lib/auth/internal";
import { requireEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateCompositeScore } from "@/lib/scoring/engine";

export async function GET(req: NextRequest) {
  const authError = requireCronAuth(req);
  if (authError) return authError;

  try {
    requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    requireEnv("GROQ_API_KEY");
    requireEnv("GROQ_MODEL_LARGE");

    const url = new URL(req.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 25), 1), 200);
    const orgId = url.searchParams.get("org_id");

    const supabase = createAdminClient();
    let query = supabase
      .from("applications")
      .select("id, org_id")
      .is("composite_score", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (orgId) query = query.eq("org_id", orgId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const results: Array<{ applicationId: string; ok: boolean; error?: string }> = [];

    for (const { id, org_id: appOrgId } of (data ?? [])) {
      try {
        await calculateCompositeScore(id, appOrgId);
        results.push({ applicationId: id, ok: true });
      } catch (e) {
        results.push({
          applicationId: id,
          ok: false,
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}


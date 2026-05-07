import { NextRequest, NextResponse } from "next/server";

import { requireCronAuth } from "@/lib/auth/internal";
import { requireEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const authError = requireCronAuth(req);
  if (authError) return authError;

  try {
    requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createAdminClient();
    const now = new Date();
    const cutoff = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("screening_sessions")
      .update({ status: "expired", updated_at: now.toISOString() })
      .eq("status", "in_progress")
      .lt("updated_at", cutoff)
      .select("id, org_id, application_id");

    if (error) throw new Error(error.message);

    const expired = data?.length ?? 0;
    return NextResponse.json({ success: true, expired, cutoff });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

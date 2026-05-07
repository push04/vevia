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

    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 200);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);
    const q = url.searchParams.get("q")?.trim() ?? "";

    const supabase = createAdminClient();

    let query = supabase.from("candidates").select("*").eq("org_id", orgId);
    if (q) {
      const escaped = q.replaceAll("%", "\\%").replaceAll("_", "\\_");
      query = query.or(`full_name.ilike.%${escaped}%,email.ilike.%${escaped}%`);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      candidates: data ?? [],
      page: { limit, offset },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}


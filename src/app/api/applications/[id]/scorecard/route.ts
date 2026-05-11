import { NextRequest, NextResponse } from "next/server";

import { requireInternalAuth } from "@/lib/auth/internal";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("org_id");
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "Missing required query param: org_id" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("applications")
      .select(
        `
        *,
        job:jobs(id, title, description, public_slug),
        candidate:candidates(id, full_name, email, phone, resume_url)
      `,
      )
      .eq("id", id)
      .eq("org_id", orgId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, scorecard: data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}


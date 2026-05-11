import { NextRequest, NextResponse } from "next/server";

import { requireInternalAuth } from "@/lib/auth/internal";
import { createAdminClient } from "@/lib/supabase/admin";

// MVP mapping: treat session_id as application_id and return screening history.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ session_id: string }> },
) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    const { session_id } = await params;
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("org_id");
    if (!orgId) {
      return NextResponse.json({ success: false, error: "Missing required query param: org_id" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("applications")
      .select("id, screening_answers, screening_score")
      .eq("id", session_id)
      .eq("org_id", orgId)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      session: {
        applicationId: data.id,
        screeningAnswers: data.screening_answers,
        screeningScore: data.screening_score,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

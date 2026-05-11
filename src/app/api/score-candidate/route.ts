import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { requireInternalAuth } from "@/lib/auth/internal";
import { requireEnv } from "@/lib/env";
import { calculateCompositeScore } from "@/lib/scoring/engine";
import { createAdminClient } from "@/lib/supabase/admin";

const BodySchema = z.object({
  applicationId: z.string().min(1),
  org_id: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    requireEnv("GROQ_API_KEY");
    requireEnv("GROQ_MODEL_LARGE");

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid body", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const { applicationId, org_id } = parsed.data;

    const admin = createAdminClient();
    const { data: app } = await admin
      .from("applications")
      .select("id, org_id")
      .eq("id", applicationId)
      .eq("org_id", org_id)
      .single();
    if (!app) {
      return NextResponse.json(
        { success: false, error: "Application not found or access denied" },
        { status: 404 },
      );
    }

    const result = await calculateCompositeScore(applicationId, org_id);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}


import { z } from "zod";

import { NextRequest, NextResponse } from "next/server";

import { requireInternalAuth } from "@/lib/auth/internal";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

type CandidateUpdate = Database["public"]["Tables"]["candidates"]["Update"];

const CandidatePatchSchema = z
  .object({
    full_name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(3).optional(),
    current_location: z.string().min(1).optional(),
    current_company: z.string().min(1).optional(),
    current_title: z.string().min(1).optional(),
    total_experience: z.number().nonnegative().optional(),
    skills: z.array(z.string().min(1)).optional(),
    education: z.unknown().optional(),
    work_experience: z.unknown().optional(),
    linkedin_url: z.string().url().optional(),
    github_url: z.string().url().optional(),
    portfolio_url: z.string().url().optional(),
    languages: z.array(z.string().min(1)).optional(),
    whatsapp_number: z.string().min(5).optional(),
    preferred_language: z.string().min(2).optional(),
  })
  .strict();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    const url = new URL(req.url);
    const orgId = url.searchParams.get("org_id");
    if (!orgId) {
      return NextResponse.json({ success: false, error: "Missing org_id" }, { status: 400 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", id)
      .eq("org_id", orgId)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Candidate not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, candidate: data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    const url = new URL(req.url);
    const orgId = url.searchParams.get("org_id");
    if (!orgId) {
      return NextResponse.json({ success: false, error: "Missing org_id" }, { status: 400 });
    }

    const patch = CandidatePatchSchema.safeParse(await req.json());
    if (!patch.success) {
      return NextResponse.json(
        { success: false, error: "Invalid body", issues: patch.error.issues },
        { status: 400 },
      );
    }

    const { id } = await params;
    const supabase = createAdminClient();
    const update = {
      ...(patch.data as CandidateUpdate),
      updated_at: new Date().toISOString(),
    } satisfies CandidateUpdate;

    const { data, error } = await supabase
      .from("candidates")
      .update(update)
      .eq("id", id)
      .eq("org_id", orgId)
      .select()
      .single();

    if (error || !data) throw new Error(error?.message ?? "Update failed");

    return NextResponse.json({ success: true, candidate: data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

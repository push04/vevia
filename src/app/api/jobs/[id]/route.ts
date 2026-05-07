import { z } from "zod";

import { NextRequest, NextResponse } from "next/server";

import { requireInternalAuth } from "@/lib/auth/internal";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

type JobUpdate = Database["public"]["Tables"]["jobs"]["Update"];

const JobPatchSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    requirements: z.array(z.string()).optional().nullable(),
    status: z.string().optional().nullable(),
    screening_questions: z.unknown().optional().nullable(),
  })
  .strict();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    const patch = JobPatchSchema.safeParse(await req.json());
    if (!patch.success) {
      return NextResponse.json(
        { success: false, error: "Invalid body", issues: patch.error.issues },
        { status: 400 },
      );
    }

    const { id } = await params;
    const supabase = createAdminClient();
    const update = {
      ...(patch.data as JobUpdate),
      updated_at: new Date().toISOString(),
    } satisfies JobUpdate;

    const { data, error } = await supabase
      .from("jobs")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, job: data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

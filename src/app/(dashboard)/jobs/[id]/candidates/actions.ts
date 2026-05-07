"use server";

import { revalidatePath } from "next/cache";

import { requireRecruiterContext } from "@/lib/auth/session";
import { requireEnv } from "@/lib/env";
import { calculateCompositeScore } from "@/lib/scoring/engine";
import { createClient } from "@/lib/supabase/server";

export async function scoreApplicationAction(jobId: string, applicationId: string) {
  await requireRecruiterContext();

  requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  requireEnv("GROQ_API_KEY");
  requireEnv("GROQ_MODEL_LARGE");

  const supabase = await createClient();

  // Ensure the current user can see this row under RLS.
  const { data: app, error } = await supabase
    .from("applications")
    .select("id, job_id")
    .eq("id", applicationId)
    .single();
  if (error || !app) throw new Error("Application not found");
  if (app.job_id !== jobId) throw new Error("Application does not belong to this job");

  await calculateCompositeScore(applicationId);

  revalidatePath(`/jobs/${jobId}/candidates`);
}


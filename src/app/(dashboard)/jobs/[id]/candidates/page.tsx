import { notFound } from "next/navigation";

import { PipelineView, type ApplicationRow } from "@/components/pipeline/PipelineView";
import { requireRecruiterContext } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

import { scoreApplicationAction } from "./actions";

export default async function JobCandidatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireRecruiterContext();
  const { id: jobId } = await params;
  const supabase = createAdminClient();

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, title")
    .eq("id", jobId)
    .eq("org_id", ctx.orgId)
    .single();
  if (jobError || !job) notFound();

  const { data: apps, error: appsError } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      resume_score,
      screening_score,
      test_score,
      video_score,
      composite_score,
      score_explanation,
      score_breakdown,
      candidate:candidates(
        id,
        full_name,
        email,
        current_title,
        current_company,
        skills
      )
    `,
    )
    .eq("job_id", jobId)
    .eq("org_id", ctx.orgId)
    .order("applied_at", { ascending: false });

  if (appsError) throw new Error(appsError.message);

  const applications = (apps ?? []) as unknown as ApplicationRow[];

  async function onScore(applicationId: string) {
    "use server";
    return scoreApplicationAction(jobId, applicationId);
  }

  return <PipelineView jobTitle={job.title} applications={applications} onScore={onScore} />;
}


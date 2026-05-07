import { createAdminClient } from "../supabase/admin";
import { generateScoreExplanation } from "../groq/score-explanation";

type WeightConfig = {
  resume_match: number;
  screening: number;
  skills_test: number;
  video_interview: number;
};

const DEFAULT_WEIGHTS: WeightConfig = {
  resume_match: 0.3,
  screening: 0.35,
  skills_test: 0.2,
  video_interview: 0.15,
};

export function adjustWeights(
  base: WeightConfig,
  params: { testScore: number | null; videoScore: number | null },
): WeightConfig {
  const weights = { ...base };
  if (params.testScore == null) weights.skills_test = 0;
  if (params.videoScore == null) weights.video_interview = 0;

  const total =
    weights.resume_match + weights.screening + weights.skills_test + weights.video_interview;
  if (total <= 0) return weights;

  weights.resume_match /= total;
  weights.screening /= total;
  weights.skills_test /= total;
  weights.video_interview /= total;
  return weights;
}

export async function calculateCompositeScore(applicationId: string) {
  const supabase = createAdminClient();

  const { data: app, error } = await supabase
    .from("applications")
    .select(
      `
      *,
      job:jobs(id, title, description),
      candidate:candidates(id, resume_embedding, resume_raw_text)
    `,
    )
    .eq("id", applicationId)
    .single();

  if (error || !app) throw new Error(error?.message ?? "Application not found");
  if (!app.job || !app.candidate) throw new Error("Missing job/candidate");

  const { data: similarity, error: simError } = await supabase.rpc(
    "match_resume_to_jd",
    {
      resume_embedding: app.candidate.resume_embedding ?? [],
      job_id: app.job.id,
    },
  );

  if (simError) throw new Error(simError.message);

  const resumeScore = Math.max(0, Math.min(100, (similarity ?? 0) * 100));
  const screeningScore = app.screening_score ?? 0;
  const testScore = app.test_score ?? null;
  const videoScore = app.video_score ?? null;

  const weights = adjustWeights(DEFAULT_WEIGHTS, { testScore, videoScore });

  const composite =
    resumeScore * weights.resume_match +
    screeningScore * weights.screening +
    (testScore ?? 0) * weights.skills_test +
    (videoScore ?? 0) * weights.video_interview;

  const explanation = await generateScoreExplanation({
    candidate: {
      resume_raw_text: app.candidate.resume_raw_text,
    },
    job: { title: app.job.title, description: app.job.description },
    scores: { resumeScore, screeningScore, testScore, videoScore, composite },
  });

  await supabase
    .from("applications")
    .update({
      resume_score: resumeScore,
      composite_score: composite,
      score_breakdown: { resumeScore, screeningScore, testScore, videoScore, weights },
      score_explanation: JSON.stringify(explanation),
      screened_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  await supabase.from("audit_logs").insert({
    org_id: app.org_id,
    actor_type: "ai",
    actor_id: "groq-llm",
    action: "composite_score_calculated",
    target_type: "application",
    target_id: app.id,
    metadata: { composite, model: process.env.GROQ_MODEL_LARGE },
  });

  return { composite, resumeScore, screeningScore, testScore, videoScore, weights };
}

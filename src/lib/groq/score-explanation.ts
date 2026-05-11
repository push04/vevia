import { z } from "zod";

import { requireEnv } from "../env";
import { createGroqClient, withRetry } from "./client";
import { scoreExplanationPrompt } from "./prompts";

const ExplanationSchema = z.object({
  summary: z.string(),
  bullets: z.array(z.string()),
});

export type ScoreExplanation = z.infer<typeof ExplanationSchema>;

export async function generateScoreExplanation(params: {
  job: { title: string; description: string | null };
  candidate: { summary?: string | null; resume_raw_text?: string | null };
  scores: Record<string, unknown>;
}): Promise<ScoreExplanation> {
  const groq = createGroqClient();
  const model = requireEnv("GROQ_MODEL_LARGE");

  const candidateSummary =
    params.candidate.summary ??
    params.candidate.resume_raw_text?.slice(0, 500) ??
    "";

  const prompt = scoreExplanationPrompt({
    jobTitle: params.job.title,
    jobDescription: params.job.description ?? "",
    candidateSummary,
    scores: params.scores,
  });

  const result = await withRetry(() =>
    groq.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 400,
      response_format: { type: "json_object" },
    }),
  );

  const content = result.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty content");

  return ExplanationSchema.parse(JSON.parse(content));
}


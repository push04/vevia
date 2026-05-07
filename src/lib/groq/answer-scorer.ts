import { z } from "zod";

import { requireEnv } from "../env";
import { createGroqClient } from "./client";
import { answerScorePrompt } from "./prompts";

const AnswerScoreSchema = z.object({
  score: z.number().min(0).max(10),
  reasoning: z.string(),
  follow_up: z.string().nullable(),
});

export type AnswerScore = z.infer<typeof AnswerScoreSchema>;

export async function scoreAnswer(params: {
  question: string;
  questionType: string;
  candidateAnswer: string;
  idealAnswer?: string;
  weight: number;
  jobContext: string;
}): Promise<AnswerScore> {
  const groq = createGroqClient();
  const model = requireEnv("GROQ_MODEL_FAST");

  const prompt = answerScorePrompt({
    jobContext: params.jobContext,
    question: params.question,
    questionType: params.questionType,
    candidateAnswer: params.candidateAnswer,
    idealAnswer: params.idealAnswer,
  });

  const result = await groq.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 200,
    response_format: { type: "json_object" },
  });

  const content = result.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty content");

  return AnswerScoreSchema.parse(JSON.parse(content));
}


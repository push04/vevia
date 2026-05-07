import { z } from "zod";

import { requireEnv } from "../env";
import { containsProhibitedTopic } from "../compliance/pii";
import { createGroqClient } from "./client";
import { screeningQuestionPrompt } from "./prompts";

const QuestionTypeSchema = z.enum(["yes_no", "short_text", "mcq", "number"]);

const MCQOptionSchema = z.object({
  id: z.string(),
  title: z.string(),
  ideal: z.boolean().optional().default(false),
});

export const ScreeningQuestionSchema = z.object({
  q: z.string(),
  type: QuestionTypeSchema,
  weight: z.number().min(0).max(1),
  preferred_yes: z.boolean().optional(),
  options: z.array(MCQOptionSchema).optional(),
  why: z.string(),
});

export type ScreeningQuestion = z.infer<typeof ScreeningQuestionSchema>;

const QuestionsResponseSchema = z.object({
  questions: z.array(ScreeningQuestionSchema),
});

export async function generateScreeningQuestions(params: {
  jobTitle: string;
  jobDescription: string;
  requiredSkills: string[];
  experienceRange: string;
  questionCount?: number;
  language?: "en" | "hi";
}): Promise<ScreeningQuestion[]> {
  const questionCount = params.questionCount ?? 5;
  const language = params.language ?? "en";

  const groq = createGroqClient();
  const model = requireEnv("GROQ_MODEL_LARGE");

  const prompt = screeningQuestionPrompt({
    jobTitle: params.jobTitle,
    jobDescription: params.jobDescription,
    requiredSkills: params.requiredSkills,
    experienceRange: params.experienceRange,
    questionCount,
    language,
  });

  const result = await groq.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    response_format: { type: "json_object" },
  });

  const content = result.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty content");

  const parsed = QuestionsResponseSchema.parse(JSON.parse(content));
  const safe = parsed.questions.filter((q) => !containsProhibitedTopic(q.q));

  return safe.slice(0, questionCount);
}


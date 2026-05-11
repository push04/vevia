import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { requireInternalAuth } from "@/lib/auth/internal";
import { requireEnv } from "@/lib/env";
import { scoreAnswer } from "@/lib/groq/answer-scorer";

const BodySchema = z.object({
  question: z.string().min(1, "question is required"),
  questionType: z.string().min(1, "questionType is required"),
  candidateAnswer: z.string().min(1, "candidateAnswer is required"),
  idealAnswer: z.string().optional(),
  weight: z.number().min(0).max(1),
  jobContext: z.string().min(1, "jobContext is required"),
});

export async function POST(req: NextRequest) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    requireEnv("GROQ_API_KEY");
    requireEnv("GROQ_MODEL_FAST");

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid body", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const result = await scoreAnswer(parsed.data);
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


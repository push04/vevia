import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { requireInternalAuth } from "@/lib/auth/internal";
import { requireEnv } from "@/lib/env";
import { generateScreeningQuestions } from "@/lib/groq/question-generator";

const BodySchema = z.object({
  jobTitle: z.string().min(1, "jobTitle is required"),
  jobDescription: z.string().min(1, "jobDescription is required"),
  requiredSkills: z.array(z.string()).min(1, "requiredSkills must be a non-empty array"),
  experienceRange: z.string().min(1, "experienceRange is required"),
  questionCount: z.number().int().min(1).max(25).optional(),
  language: z.enum(["en", "hi"]).optional(),
});

export async function POST(req: NextRequest) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    requireEnv("GROQ_API_KEY");
    requireEnv("GROQ_MODEL_LARGE");

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid body", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const questions = await generateScreeningQuestions(parsed.data);
    return NextResponse.json({ success: true, questions });
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


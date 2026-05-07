import { NextRequest, NextResponse } from "next/server";

import { requireEnv } from "@/lib/env";
import { generateScreeningQuestions } from "@/lib/groq/question-generator";

export async function POST(req: NextRequest) {
  try {
    requireEnv("GROQ_API_KEY");
    requireEnv("GROQ_MODEL_LARGE");

    const body = (await req.json()) as {
      jobTitle: string;
      jobDescription: string;
      requiredSkills: string[];
      experienceRange: string;
      questionCount?: number;
      language?: "en" | "hi";
    };

    const questions = await generateScreeningQuestions(body);
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


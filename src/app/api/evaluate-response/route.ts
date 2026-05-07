import { NextRequest, NextResponse } from "next/server";

import { requireEnv } from "@/lib/env";
import { scoreAnswer } from "@/lib/groq/answer-scorer";

export async function POST(req: NextRequest) {
  try {
    requireEnv("GROQ_API_KEY");
    requireEnv("GROQ_MODEL_FAST");

    const body = (await req.json()) as {
      question: string;
      questionType: string;
      candidateAnswer: string;
      idealAnswer?: string;
      weight: number;
      jobContext: string;
    };

    const result = await scoreAnswer(body);
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


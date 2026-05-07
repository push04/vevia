import { NextRequest, NextResponse } from "next/server";

import { requireEnv } from "@/lib/env";
import { scoreAnswer } from "@/lib/groq/answer-scorer";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    requireEnv("GROQ_API_KEY");
    requireEnv("GROQ_MODEL_FAST");

    const body = (await req.json()) as {
      applicationId: string;
      question: string;
      questionType: string;
      candidateAnswer: string;
      weight: number;
      jobContext: string;
    };

    const supabase = createAdminClient();
    const result = await scoreAnswer(body);

    // MVP: append to screening_answers + set screening_score as average.
    const appRes = await supabase
      .from("applications")
      .select("screening_answers, screening_score")
      .eq("id", body.applicationId)
      .single();

    if (appRes.error) throw new Error(appRes.error.message);
    const app = appRes.data as unknown as {
      screening_answers: unknown;
      screening_score: number | null;
    };

    const prevAnswers = Array.isArray(app?.screening_answers)
      ? (app.screening_answers as unknown[])
      : [];
    const nextAnswers = [
      ...prevAnswers,
      {
        question: body.question,
        answer: body.candidateAnswer,
        score: result.score,
        reasoning: result.reasoning,
      },
    ];

    const scores = nextAnswers
      .map((a) => (a as { score?: number }).score)
      .filter((n): n is number => typeof n === "number");
    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) * 10 : 0;

    await supabase
      .from("applications")
      .update({ screening_answers: nextAnswers as never, screening_score: avg })
      .eq("id", body.applicationId);

    return NextResponse.json({ success: true, result, screeningScore: avg });
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

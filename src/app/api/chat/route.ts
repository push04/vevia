import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { requireInternalAuth } from "@/lib/auth/internal";
import { requireEnv } from "@/lib/env";
import { scoreAnswer } from "@/lib/groq/answer-scorer";
import { createAdminClient } from "@/lib/supabase/admin";

const ChatBodySchema = z.object({
  applicationId: z.string().min(1),
  question: z.string().min(1),
  questionType: z.string().min(1),
  candidateAnswer: z.string().min(1),
  weight: z.number().min(0).max(1),
  jobContext: z.string().min(1),
  org_id: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    requireEnv("GROQ_API_KEY");
    requireEnv("GROQ_MODEL_FAST");

    const parsed = ChatBodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
    }
    const body = parsed.data;

    const supabase = createAdminClient();
    const result = await scoreAnswer(body);

    // MVP: append to screening_answers + set screening_score as average.
    const appRes = await supabase
      .from("applications")
      .select("screening_answers, screening_score")
      .eq("id", body.applicationId)
      .eq("org_id", body.org_id)
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
      .eq("id", body.applicationId)
      .eq("org_id", body.org_id);

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

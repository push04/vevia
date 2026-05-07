import type { ScreeningQuestion } from "@/lib/groq/question-generator";
import { scoreAnswer } from "@/lib/groq/answer-scorer";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { sendWhatsAppButtons, sendWhatsAppMessage } from "@/lib/whatsapp/client";

type SessionState = {
  index: number;
  asked?: boolean;
};

function parseState(state: unknown): SessionState {
  if (!state || typeof state !== "object") return { index: 0 };
  const index = Number((state as { index?: unknown }).index ?? 0);
  const asked = Boolean((state as { asked?: unknown }).asked ?? false);
  return {
    index: Number.isFinite(index) && index >= 0 ? Math.floor(index) : 0,
    asked,
  };
}

function renderQuestion(q: ScreeningQuestion, idx: number, total: number) {
  const header = `Question ${idx + 1}/${total}`;
  return `${header}\n\n${q.q}`;
}

export async function processScreeningMessage(params: {
  orgId: string;
  from: string;
  applicationId: string;
  sessionId: string;
  text: string;
  jobContext: string;
  questions: ScreeningQuestion[];
  state: unknown;
}) {
  const supabase = createAdminClient();
  const state = parseState(params.state);
  const total = params.questions.length;

  if (total === 0) {
    await sendWhatsAppMessage(
      params.from,
      "Screening is not configured for this job yet. Please contact the recruiter.",
    );
    await supabase
      .from("screening_sessions")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", params.sessionId);
    return;
  }

  // First interaction: send the first question and wait for the next message.
  if (!state.asked) {
    const q = params.questions[state.index] ?? params.questions[0];
    await sendWhatsAppMessage(params.from, renderQuestion(q, state.index, total));
    await supabase
      .from("screening_sessions")
      .update({ state: { index: state.index, asked: true }, updated_at: new Date().toISOString() })
      .eq("id", params.sessionId);
    return;
  }

  const current = params.questions[state.index] ?? null;
  if (!current) {
    await sendWhatsAppMessage(params.from, "Screening already completed. Thank you.");
    return;
  }

  // Score the answer and persist into applications.screening_answers.
  const result = await scoreAnswer({
    question: current.q,
    questionType: current.type,
    candidateAnswer: params.text,
    weight: current.weight,
    jobContext: params.jobContext,
  });

  const appRes = await supabase
    .from("applications")
    .select("screening_answers, screening_score")
    .eq("id", params.applicationId)
    .single();

  if (appRes.error) throw new Error(appRes.error.message);

  const prevAnswers = Array.isArray(appRes.data?.screening_answers)
    ? (appRes.data.screening_answers as unknown[])
    : [];

  const nextAnswers = [
    ...prevAnswers,
    {
      question: current.q,
      answer: params.text,
      score: result.score,
      reasoning: result.reasoning,
      created_at: new Date().toISOString(),
    },
  ];

  const scores = nextAnswers
    .map((a) => (a as { score?: number }).score)
    .filter((n): n is number => typeof n === "number");
  const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) * 10 : 0;

  await supabase
    .from("applications")
    .update({
      screening_answers:
        nextAnswers as unknown as Database["public"]["Tables"]["applications"]["Update"]["screening_answers"],
      screening_score: avg,
    })
    .eq("id", params.applicationId);

  // Advance session state.
  const nextIndex = state.index + 1;
  const now = new Date().toISOString();

  if (nextIndex >= total) {
    await supabase
      .from("screening_sessions")
      .update({ status: "completed", state: { index: nextIndex, asked: true }, updated_at: now })
      .eq("id", params.sessionId);

    await sendWhatsAppMessage(
      params.from,
      `Screening completed. Thank you. Your current screening score is ${Math.round(avg)}.`,
    );
    return;
  }

  await supabase
    .from("screening_sessions")
    .update({ state: { index: nextIndex, asked: true }, updated_at: now })
    .eq("id", params.sessionId);

  const nextQ = params.questions[nextIndex];
  if (nextQ.type === "mcq" && nextQ.options?.length) {
    await sendWhatsAppButtons(
      params.from,
      renderQuestion(nextQ, nextIndex, total),
      nextQ.options.slice(0, 3).map((o) => ({ id: o.id, title: o.title })),
    );
  } else {
    await sendWhatsAppMessage(params.from, renderQuestion(nextQ, nextIndex, total));
  }
}

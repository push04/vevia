import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PostActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start") }),
  z.object({ action: z.literal("answer"), questionIndex: z.number().int().min(0), answer: z.string().min(1) }),
  z.object({ action: z.literal("complete") }),
]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { applicationId } = await params;
  const admin = createAdminClient();

  const { data: app, error } = await admin
    .from("applications")
    .select(`
      id, screening_answers, screening_score,
      candidate_id,
      candidate:candidates(email),
      job:jobs(id, title, screening_questions)
    `)
    .eq("id", applicationId)
    .single();

  if (error || !app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const candidateEmail = (app.candidate as { email: string } | null)?.email;
  if (!candidateEmail || candidateEmail !== user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: session } = await admin
    .from("screening_sessions")
    .select("*")
    .eq("application_id", applicationId)
    .eq("channel", "web")
    .maybeSingle();

  const questions = ((app.job as Record<string, unknown>)?.screening_questions ?? []) as { q: string; type: string; options?: { id: string; title: string; ideal: boolean }[] }[];
  const existingAnswers = (app.screening_answers ?? []) as { question: string }[];

  const answeredQuestions = new Set(existingAnswers.map((a: { question: string }) => a.question));
  const unansweredIndices: number[] = [];
  for (let i = 0; i < questions.length; i++) {
    if (!answeredQuestions.has(questions[i].q)) {
      unansweredIndices.push(i);
    }
  }

  return NextResponse.json({
    applicationId: app.id,
    jobTitle: (app.job as Record<string, unknown>)?.title,
    questions,
    existingAnswers,
    unansweredIndices,
    session,
    screeningScore: app.screening_score,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { applicationId } = await params;
  const parsed = PostActionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }
  const admin = createAdminClient();

  const { data: ownershipCheck } = await admin
    .from("applications")
    .select("candidate_id, candidate:candidates(email)")
    .eq("id", applicationId)
    .single();

  const candidateEmail = (ownershipCheck?.candidate as { email: string } | null)?.email;
  if (!candidateEmail || candidateEmail !== user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action } = parsed.data;

  if (action === "start") {
    const { data: existing } = await admin
      .from("screening_sessions")
      .select("id")
      .eq("application_id", applicationId)
      .eq("channel", "web")
      .maybeSingle();

    if (!existing) {
      const { data: app } = await admin
        .from("applications")
        .select("org_id")
        .eq("id", applicationId)
        .single();

      if (app) {
        await admin.from("screening_sessions").insert({
          org_id: app.org_id,
          application_id: applicationId,
          channel: "web",
          status: "in_progress",
          state: { currentIndex: 0, answers: [] },
        });
      }
    }

    return NextResponse.json({ success: true });
  }

  if (action === "answer") {
    const { questionIndex, answer } = parsed.data;
    const { data: app } = await admin
      .from("applications")
      .select("screening_answers, screening_score, job:jobs(id, screening_questions)")
      .eq("id", applicationId)
      .single();

    if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const questions = ((app.job as Record<string, unknown>)?.screening_questions ?? []) as { q: string; type: string; preferred_yes?: boolean }[];
    const q = questions[questionIndex];
    if (!q) return NextResponse.json({ error: "Invalid question" }, { status: 400 });

    let score = 5;
    let reasoning = "Saved for recruiter review";
    if (q.type === "yes_no") {
      const preferredYes = q.preferred_yes !== false;
      const isYes = String(answer).toLowerCase() === "yes";
      score = isYes === preferredYes ? 8 : 3;
      reasoning = isYes === preferredYes ? "Matches preferred answer" : "Does not match preferred answer";
    }

    const newAnswer = { question: q.q, answer, score, reasoning, created_at: new Date().toISOString() };
    const existingAnswers = (app.screening_answers ?? []) as { question: string; answer: string; score: number; reasoning: string; created_at: string }[];
    existingAnswers.push(newAnswer);

    const totalScore = existingAnswers.reduce((sum: number, a: { score: number }) => sum + (a.score ?? 0), 0);
    const avgScore = (totalScore / existingAnswers.length) * 10;

    await admin
      .from("applications")
      .update({
        screening_answers: existingAnswers as never,
        screening_score: Math.round(avgScore * 100) / 100,
      })
      .eq("id", applicationId);

    const isLast = questionIndex >= questions.length - 1;
    if (isLast) {
      await admin
        .from("screening_sessions")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("application_id", applicationId)
        .eq("channel", "web");
    } else {
      await admin
        .from("screening_sessions")
        .update({ state: { currentIndex: questionIndex + 1 }, updated_at: new Date().toISOString() })
        .eq("application_id", applicationId)
        .eq("channel", "web");
    }

    return NextResponse.json({
      success: true,
      answer: newAnswer,
      screeningScore: Math.round(avgScore * 100) / 100,
      isComplete: isLast,
    });
  }

  if (action === "complete") {
    await admin
      .from("screening_sessions")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("application_id", applicationId)
      .eq("channel", "web");

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

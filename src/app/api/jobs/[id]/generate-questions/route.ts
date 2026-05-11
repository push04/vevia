import { z } from "zod";

import { NextRequest, NextResponse } from "next/server";

import { requireInternalAuth } from "@/lib/auth/internal";
import { requireEnv } from "@/lib/env";
import { generateScreeningQuestions } from "@/lib/groq/question-generator";
import { createAdminClient } from "@/lib/supabase/admin";

const BodySchema = z
  .object({
    experienceRange: z.string().min(1),
    questionCount: z.number().int().min(1).max(25).optional(),
    language: z.enum(["en", "hi"]).optional(),
    org_id: z.string().min(1),
  })
  .strict();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    requireEnv("GROQ_API_KEY");
    requireEnv("GROQ_MODEL_LARGE");

    const body = BodySchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json(
        { success: false, error: "Invalid body", issues: body.error.issues },
        { status: 400 },
      );
    }

    const { id } = await params;
    const supabase = createAdminClient();

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, description, requirements")
      .eq("id", id)
      .eq("org_id", body.data.org_id)
      .single();
    if (jobError || !job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    const questions = await generateScreeningQuestions({
      jobTitle: job.title,
      jobDescription: job.description ?? "",
      requiredSkills: job.requirements ?? [],
      experienceRange: body.data.experienceRange,
      questionCount: body.data.questionCount,
      language: body.data.language,
    });

    const { error: updateError } = await supabase
      .from("jobs")
      .update({ screening_questions: questions })
      .eq("id", job.id)
      .eq("org_id", body.data.org_id);
    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ success: true, questions });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}


import { NextRequest, NextResponse } from "next/server";

import { requireEnv } from "@/lib/env";
import { extractTextFromFile } from "@/lib/pdf/extract";
import { parseResume } from "@/lib/groq/resume-parser";
import { generateEmbedding } from "@/lib/embeddings/generate";
import { createAdminClient } from "@/lib/supabase/admin";

export async function handleApply(req: NextRequest, slug: string) {
  try {
    requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    requireEnv("GROQ_API_KEY");
    requireEnv("GROQ_MODEL_LARGE");

    const formData = await req.formData();
    const file = formData.get("resume");
    const email = (formData.get("email") as string | null) ?? null;
    const fullName = (formData.get("full_name") as string | null) ?? null;
    const phone = (formData.get("phone") as string | null) ?? null;
    const currentLocation = (formData.get("current_location") as string | null) ?? null;
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Missing form-data field: resume (File)" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("public_slug", slug)
      .single();
    if (jobError || !job) throw new Error(jobError?.message ?? "Job not found");

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const rawText = await extractTextFromFile(fileBuffer, file.type);
    const parsed = await parseResume(rawText);
    let embedding: number[] | null = null;
    try {
      embedding = await generateEmbedding(rawText.slice(0, 2000));
    } catch {
      // embedding failure is non-fatal; resume data still stored
    }

    const resumePath = `resumes/${Date.now()}-${file.name}`;
    const uploadRes = await supabase.storage
      .from("vevia-files")
      .upload(resumePath, fileBuffer, { contentType: file.type, upsert: false });
    if (uploadRes.error) throw new Error(uploadRes.error.message);

    const candidateRes = await supabase
      .from("candidates")
      .upsert(
        {
          org_id: job.org_id,
          full_name: fullName || parsed.full_name,
          email: email || parsed.email,
          phone: phone || parsed.phone,
          current_location: currentLocation || parsed.current_location,
          current_company: parsed.current_company,
          current_title: parsed.current_title,
          total_experience: parsed.total_experience_years,
          skills: parsed.skills,
          education: parsed.education,
          work_experience: parsed.work_experience,
          resume_url: resumePath,
          resume_raw_text: rawText,
          resume_embedding: embedding ?? [],
          languages: parsed.languages,
          linkedin_url: parsed.linkedin_url,
          github_url: parsed.github_url,
          portfolio_url: parsed.portfolio_url,
        },
        { onConflict: "email" },
      )
      .select()
      .single();
    if (candidateRes.error) throw new Error(candidateRes.error.message);

    const applicationRes = await supabase
      .from("applications")
      .insert({
        org_id: job.org_id,
        job_id: job.id,
        candidate_id: candidateRes.data.id,
        status: "applied",
      })
      .select()
      .single();
    if (applicationRes.error) throw new Error(applicationRes.error.message);

    return NextResponse.json({
      success: true,
      job,
      candidate: candidateRes.data,
      application: applicationRes.data,
    });
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


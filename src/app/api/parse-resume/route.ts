import { NextRequest, NextResponse } from "next/server";

import { requireInternalAuth } from "@/lib/auth/internal";
import { requireEnv } from "@/lib/env";
import { extractTextFromFile } from "@/lib/pdf/extract";
import { parseResume } from "@/lib/groq/resume-parser";
import { generateEmbedding } from "@/lib/embeddings/generate";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    requireEnv("GROQ_API_KEY");
    requireEnv("GROQ_MODEL_LARGE");

    const formData = await req.formData();
    const file = formData.get("resume");
    const jobId = (formData.get("job_id") as string | null) ?? null;
    const orgId = (formData.get("org_id") as string | null) ?? null;
    const email = (formData.get("email") as string | null) ?? null;
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Missing form-data field: resume (File)" },
        { status: 400 },
      );
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 10MB." },
        { status: 400 },
      );
    }
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Unsupported file type. Please upload PDF, DOC, DOCX, or TXT." },
        { status: 400 },
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const rawText = await extractTextFromFile(fileBuffer, file.type);
    const parsed = await parseResume(rawText);
    let embedding: number[] | null = null;
    try {
      embedding = await generateEmbedding(rawText.slice(0, 2000));
    } catch {
      // embedding failure is non-fatal
    }

    let candidate: unknown = null;
    let resumePath: string | null = null;
    let application: unknown = null;

    // Optional: persist into Supabase (requires service role key)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      if (!orgId) {
        return NextResponse.json({ success: false, error: "Missing org_id" }, { status: 400 });
      }

      const supabase = createAdminClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      resumePath = `resumes/${orgId}/${Date.now()}-${safeName}`;

      const uploadRes = await supabase.storage
        .from("vevia-files")
        .upload(resumePath, fileBuffer, { contentType: file.type, upsert: false });
      if (uploadRes.error) throw new Error(uploadRes.error.message);

      const upsertRes = await supabase
        .from("candidates")
        .upsert(
          {
            org_id: orgId,
            full_name: parsed.full_name,
            email: email || parsed.email,
            phone: parsed.phone,
            current_location: parsed.current_location,
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
      if (upsertRes.error) throw new Error(upsertRes.error.message);
      candidate = upsertRes.data;

      // If job_id is provided, create an application row (org_id derived from job).
      if (jobId) {
        const jobRes = await supabase
          .from("jobs")
          .select("org_id")
          .eq("id", jobId)
          .single();
        if (jobRes.error) throw new Error(jobRes.error.message);

        const appRes = await supabase
          .from("applications")
          .insert({
            org_id: jobRes.data.org_id,
            job_id: jobId,
            candidate_id: (candidate as { id: string }).id,
            status: "applied",
          })
          .select()
          .single();
        if (!appRes.error) application = appRes.data;
      }
    }

    return NextResponse.json({
      success: true,
      parsed,
      embeddingDims: embedding?.length ?? 0,
      resumePath,
      candidate: candidate ? { id: (candidate as { id: string }).id } : null,
      application: application ? { id: (application as { id: string }).id } : null,
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

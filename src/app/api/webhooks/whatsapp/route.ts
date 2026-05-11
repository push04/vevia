import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

import { requireEnv } from "@/lib/env";
import { sendWhatsAppMessage } from "@/lib/whatsapp/client";
import { processScreeningMessage } from "@/lib/whatsapp/process";
import { createAdminClient } from "@/lib/supabase/admin";
import { ScreeningQuestionSchema } from "@/lib/groq/question-generator";

export async function GET(req: NextRequest) {
  const verifyToken = requireEnv("WHATSAPP_VERIFY_TOKEN");
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ status: "forbidden" }, { status: 403 });
}

function verifyWhatsAppSignature(body: string, signature: string | null, appSecret: string): boolean {
  if (!signature) return false;
  const expected = "sha256=" + createHmac("sha256", appSecret).update(body).digest("hex");
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  const appSecret = process.env.WHATSAPP_APP_SECRET ?? process.env.WHATSAPP_ACCESS_TOKEN ?? "";

  if (appSecret && !verifyWhatsAppSignature(bodyText, signature, appSecret)) {
    return NextResponse.json({ status: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ status: "bad_request" }, { status: 400 });
  }

  const parsedBody = body as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: Array<{
            from?: string;
            text?: { body?: string };
            interactive?: { button_reply?: { title?: string } };
          }>;
        };
      }>;
    }>;
  };
  const message = parsedBody?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) return NextResponse.json({ status: "ok" });

  const from = message.from ?? "";
  const text =
    message.text?.body || message.interactive?.button_reply?.title || "";

  try {
    requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    requireEnv("GROQ_API_KEY");
    requireEnv("GROQ_MODEL_FAST");

    const supabase = createAdminClient();

    const { data: candidates, error: candError } = await supabase
      .from("candidates")
      .select("id, org_id")
      .eq("whatsapp_number", from)
      .order("created_at", { ascending: false })
      .limit(1);

    if (candError) throw new Error(candError.message);
    const candidate = candidates?.[0];
    if (!candidate?.id || !candidate.org_id) {
      await sendWhatsAppMessage(
        from,
        "Namaste! Please apply via the job link to begin screening.",
      );
      return NextResponse.json({ status: "ok" });
    }

    const { data: applications, error: appError } = await supabase
      .from("applications")
      .select("id, job_id, org_id")
      .eq("candidate_id", candidate.id)
      .eq("org_id", candidate.org_id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (appError) throw new Error(appError.message);
    const application = applications?.[0];
    if (!application?.id) {
      await sendWhatsAppMessage(
        from,
        "Namaste! Please apply via the job link to begin screening.",
      );
      return NextResponse.json({ status: "ok" });
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, description, screening_questions")
      .eq("id", application.job_id)
      .single();
    if (jobError || !job) throw new Error(jobError?.message ?? "Job not found");

    const { data: sessions, error: sessError } = await supabase
      .from("screening_sessions")
      .select("id, state, status")
      .eq("application_id", application.id)
      .eq("org_id", application.org_id)
      .eq("channel", "whatsapp")
      .eq("status", "in_progress")
      .order("updated_at", { ascending: false })
      .limit(1);
    if (sessError) throw new Error(sessError.message);

    let session = sessions?.[0] ?? null;
    if (!session?.id) {
      const { data: created, error: createErr } = await supabase
        .from("screening_sessions")
        .insert({
          org_id: application.org_id,
          application_id: application.id,
          channel: "whatsapp",
          status: "in_progress",
          state: { index: 0, asked: false },
        })
        .select("id, state, status")
        .single();
      if (createErr) throw new Error(createErr.message);
      session = created;
    }

    const rawQuestions = Array.isArray(job.screening_questions) ? job.screening_questions : [];
    const questions = rawQuestions
      .map((q) => ScreeningQuestionSchema.safeParse(q))
      .filter((r) => r.success)
      .map((r) => r.data);
    const jobContext = `${job.title}\n\n${job.description ?? ""}`;

    await processScreeningMessage({
      orgId: application.org_id,
      from,
      applicationId: application.id,
      sessionId: session.id,
      text,
      jobContext,
      questions,
      state: session.state,
    });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    await sendWhatsAppMessage(
      from,
      "Namaste! Please apply via the job link to begin screening.",
    );
  }

  return NextResponse.json({ status: "ok" });
}

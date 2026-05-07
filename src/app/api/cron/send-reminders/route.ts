import { NextRequest, NextResponse } from "next/server";

import { requireCronAuth } from "@/lib/auth/internal";
import { requireEnv } from "@/lib/env";
import { sendEmail } from "@/lib/resend/send";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const authError = requireCronAuth(req);
  if (authError) return authError;

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ success: true, sent: 0, skipped: "RESEND_API_KEY not set" });
  }

  try {
    requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");

    const url = new URL(req.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 25), 1), 200);

    const supabase = createAdminClient();
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const recentCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const { data: sessions, error: sessionsError } = await supabase
      .from("screening_sessions")
      .select("id, org_id, application_id, updated_at")
      .eq("status", "in_progress")
      .lt("updated_at", cutoff)
      .order("updated_at", { ascending: true })
      .limit(limit);

    if (sessionsError) throw new Error(sessionsError.message);
    const applicationIds = (sessions ?? []).map((s) => s.application_id);
    if (!applicationIds.length) return NextResponse.json({ success: true, sent: 0 });

    const { data: alreadySent } = await supabase
      .from("email_logs")
      .select("application_id")
      .eq("template", "screening_reminder")
      .in("application_id", applicationIds)
      .gte("created_at", recentCutoff);

    const already = new Set((alreadySent ?? []).map((r) => r.application_id).filter(Boolean) as string[]);
    const toSendIds = applicationIds.filter((id) => !already.has(id));
    if (!toSendIds.length) return NextResponse.json({ success: true, sent: 0, skipped: "already sent recently" });

    const { data: apps, error: appsError } = await supabase
      .from("applications")
      .select("id, org_id, job:jobs(title), candidate:candidates(email, full_name)")
      .in("id", toSendIds);

    if (appsError) throw new Error(appsError.message);

    let sent = 0;
    for (const app of apps ?? []) {
      const email = (app.candidate as { email: string | null } | null)?.email;
      if (!email) continue;

      const jobTitle = (app.job as { title: string } | null)?.title ?? "your application";
      const subject = `Complete your screening for ${jobTitle}`;
      const html = `
        <div style="font-family: Inter, Arial, sans-serif; line-height: 1.5;">
          <p>Hello,</p>
          <p>This is a reminder to complete your screening for <strong>${jobTitle}</strong>.</p>
          <p>If you already finished, you can ignore this message.</p>
          <p>Regards,<br/>Vevia</p>
        </div>
      `;

      const result = await sendEmail({ to: email, subject, html });
      await supabase.from("email_logs").insert({
        org_id: app.org_id,
        application_id: app.id,
        recipient_email: email,
        template: "screening_reminder",
        resend_id: result.id,
        status: "sent",
        sent_at: now.toISOString(),
        created_at: now.toISOString(),
      });

      sent += 1;
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

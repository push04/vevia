import { requireEnv } from "@/lib/env";
import { withRetry } from "@/lib/groq/client";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const fromEmail = requireEnv("RESEND_FROM_EMAIL");
  const fromName = requireEnv("RESEND_FROM_NAME");

  const res = await withRetry(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [params.to],
          subject: params.subject,
          html: params.html,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const text = await response.text();
        const err = new Error(`Resend error: ${response.status} ${text}`);
        (err as Error & { status: number }).status = response.status;
        throw err;
      }
      return response;
    } finally {
      clearTimeout(timeout);
    }
  });

  return (await res.json()) as { id: string };
}


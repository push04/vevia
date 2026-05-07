import { requireEnv } from "@/lib/env";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const fromEmail = requireEnv("RESEND_FROM_EMAIL");
  const fromName = requireEnv("RESEND_FROM_NAME");

  const res = await fetch("https://api.resend.com/emails", {
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
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error: ${res.status} ${text}`);
  }

  return (await res.json()) as { id: string };
}


import { requireEnv } from "../env";
import { withRetry } from "../groq/client";

async function whatsappFetch(url: string, options: Record<string, unknown>) {
  return withRetry(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal } as RequestInit);
      if (!response.ok) {
        const text = await response.text();
        const err = new Error(`WhatsApp API error: ${response.status} ${text}`);
        (err as Error & { status: number }).status = response.status;
        throw err;
      }
      return response;
    } finally {
      clearTimeout(timeout);
    }
  });
}

export async function sendWhatsAppMessage(to: string, message: string) {
  const phoneId = requireEnv("WHATSAPP_PHONE_NUMBER_ID");
  const token = requireEnv("WHATSAPP_ACCESS_TOKEN");

  const response = await whatsappFetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    }),
  });

  return response.json();
}

export async function sendWhatsAppButtons(
  to: string,
  body: string,
  buttons: { id: string; title: string }[],
) {
  const phoneId = requireEnv("WHATSAPP_PHONE_NUMBER_ID");
  const token = requireEnv("WHATSAPP_ACCESS_TOKEN");

  const response = await whatsappFetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: body },
        action: {
          buttons: buttons.map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    }),
  });

  return response.json();
}


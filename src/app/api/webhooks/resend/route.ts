import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";

import { requireEnv } from "@/lib/env";

export async function POST(req: NextRequest) {
  try {
    const secret = requireEnv("RESEND_WEBHOOK_SECRET");

    const svixId = req.headers.get("svix-id") ?? "";
    const svixTimestamp = req.headers.get("svix-timestamp") ?? "";
    const svixSignature = req.headers.get("svix-signature") ?? "";
    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ success: false, error: "Missing signature headers" }, { status: 400 });
    }

    const payload = Buffer.from(await req.arrayBuffer()).toString("utf8");

    const wh = new Webhook(secret);
    const event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as unknown;

    return NextResponse.json({ success: true, received: true, event });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 401 },
    );
  }
}


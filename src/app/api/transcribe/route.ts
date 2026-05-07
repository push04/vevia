import { NextRequest, NextResponse } from "next/server";

import { requireEnv } from "@/lib/env";
import { createGroqClient } from "@/lib/groq/client";

export async function POST(req: NextRequest) {
  try {
    requireEnv("GROQ_API_KEY");
    const model = requireEnv("GROQ_MODEL_WHISPER");

    const formData = await req.formData();
    const file = formData.get("audio");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Missing form-data field: audio (File)" },
        { status: 400 },
      );
    }

    const groq = createGroqClient();

    // groq-sdk expects a File-like object; Next's File works here.
    const transcript = await groq.audio.transcriptions.create({
      file,
      model,
    });

    return NextResponse.json({ success: true, transcript });
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


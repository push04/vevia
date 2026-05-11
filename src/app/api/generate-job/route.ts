import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { generateJobDetails } from "@/lib/groq/job-generator";
import { requireInternalAuth } from "@/lib/auth/internal";
import { requireEnv } from "@/lib/env";

const BodySchema = z.object({
  title: z.string().min(1, "Job title is required"),
});

export async function POST(req: NextRequest) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  try {
    requireEnv("GROQ_API_KEY");

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid body" },
        { status: 400 },
      );
    }

    const result = await generateJobDetails(parsed.data.title.trim());
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

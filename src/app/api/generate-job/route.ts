import { NextRequest, NextResponse } from "next/server";
import { generateJobDetails } from "@/lib/groq/job-generator";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    // Require auth to prevent public abuse
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title } = (await req.json()) as { title?: string };
    if (!title?.trim()) {
      return NextResponse.json({ error: "Job title is required" }, { status: 400 });
    }

    const result = await generateJobDetails(title.trim());
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

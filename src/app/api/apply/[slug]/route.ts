import { NextRequest, NextResponse } from "next/server";
import { handleApply } from "@/lib/apply/handle-apply";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  const rl = rateLimit(`apply:${ip}`, 5, 60_000);
  if (rl) return rl;

  try {
    const { slug } = await params;
    return await handleApply(req, slug);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected server error",
      },
      { status: 500 },
    );
  }
}

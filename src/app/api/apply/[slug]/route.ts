import { NextRequest, NextResponse } from "next/server";
import { handleApply } from "@/lib/apply/handle-apply";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return handleApply(req, slug);
}

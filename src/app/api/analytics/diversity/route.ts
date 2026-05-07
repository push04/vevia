import { NextRequest, NextResponse } from "next/server";

import { requireInternalAuth } from "@/lib/auth/internal";

export async function GET(req: NextRequest) {
  const authError = requireInternalAuth(req);
  if (authError) return authError;

  return NextResponse.json({
    success: true,
    metrics: {
      note: "DEI metrics require demographic fields + consent. Not enabled in this schema yet.",
    },
  });
}


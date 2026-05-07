import { NextRequest, NextResponse } from "next/server";

import { requireEnv } from "@/lib/env";

export function requireInternalAuth(req: NextRequest): NextResponse | null {
  const expected = requireEnv("VEVIA_API_TOKEN");
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";

  if (!token || token !== expected) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export function requireCronAuth(req: NextRequest): NextResponse | null {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";

  if (process.env.VEVIA_API_TOKEN && token && token === process.env.VEVIA_API_TOKEN) {
    return null;
  }

  if (process.env.CRON_SECRET && token && token === process.env.CRON_SECRET) {
    return null;
  }

  if (!process.env.VEVIA_API_TOKEN && !process.env.CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: "Cron auth not configured" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

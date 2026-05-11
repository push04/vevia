import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual as cryptoTimingSafeEqual } from "crypto";

import { requireEnv } from "@/lib/env";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBytes = Buffer.from(a);
  const bBytes = Buffer.from(b);
  return cryptoTimingSafeEqual(aBytes, bBytes);
}

export function requireInternalAuth(req: NextRequest): NextResponse | null {
  const expected = requireEnv("VEVIA_API_TOKEN");
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";

  if (!token || !timingSafeEqual(token, expected)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export function requireCronAuth(req: NextRequest): NextResponse | null {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";

  if (process.env.VEVIA_API_TOKEN && token && timingSafeEqual(token, process.env.VEVIA_API_TOKEN)) {
    return null;
  }

  if (process.env.CRON_SECRET && token && timingSafeEqual(token, process.env.CRON_SECRET)) {
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

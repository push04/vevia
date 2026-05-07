import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoints: ["/api/analytics/funnel", "/api/analytics/time-to-hire", "/api/analytics/diversity"],
  });
}

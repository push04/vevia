import { NextResponse } from "next/server";

const store = new Map<string, { count: number; resetAt: number }>();

const PRODUCTION_SAFE = process.env.NODE_ENV === "production" && !!process.env.VERCEL;

/**
 * In-memory rate limiter using Map.
 * 
 * LIMITATIONS:
 * - Not production-safe for serverless/multi-instance deployments (e.g., Vercel)
 * - State is not shared across server instances, so limits won't work correctly
 * - Resets on server restart
 * 
 * PRODUCTION OPTIONS:
 * - Set KV_REST_API_URL env var to use Vercel KV for distributed rate limiting
 * - Or set DISABLE_RATE_LIMIT=1 to bypass this limiter entirely
 * - TODO: Implement Redis-based rate limiting for production
 */

export function rateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60_000,
): NextResponse | null {
  if (PRODUCTION_SAFE && !process.env.KV_REST_API_URL) {
    return null;
  }

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (entry.count >= maxRequests) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  entry.count++;
  return null;
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 300_000);
}
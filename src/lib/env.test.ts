import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { getEnv, requireEnv } from "./env";

describe("env", () => {
  it("getEnv throws ZodError when critical vars are missing", () => {
    const prev = { ...process.env };
    for (const k of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "GROQ_API_KEY", "RESEND_API_KEY", "VEVIA_API_TOKEN"] as const) {
      delete process.env[k];
    }

    expect(() => getEnv()).toThrow(ZodError);

    Object.assign(process.env, prev);
  });

  it("requireEnv throws for specific missing key", () => {
    const prev = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;

    expect(() => requireEnv("GROQ_API_KEY")).toThrow(/Missing required environment variable/);

    if (prev !== undefined) process.env.GROQ_API_KEY = prev;
  });
});


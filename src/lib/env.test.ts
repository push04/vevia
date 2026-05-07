import { describe, expect, it } from "vitest";

import { requireEnv } from "./env";

describe("env", () => {
  it("requireEnv throws when missing", () => {
    const key = "GROQ_API_KEY" as const;
    const prev = process.env[key];
    delete process.env[key];

    expect(() => requireEnv(key)).toThrow(/Missing required environment variable/);

    if (prev !== undefined) process.env[key] = prev;
  });
});


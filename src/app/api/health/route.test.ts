import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("/api/health", () => {
  it("returns ok", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
  });
});


import { describe, expect, it, vi } from "vitest";

import { POST } from "./route";

vi.mock("@/lib/groq/answer-scorer", () => {
  return {
    scoreAnswer: vi.fn(async () => ({
      score: 8,
      reasoning: "Good.",
      follow_up: null,
    })),
  };
});

describe("/api/evaluate-response", () => {
  it("returns score result", async () => {
    process.env.GROQ_API_KEY = "x";
    process.env.GROQ_MODEL_FAST = "m";

    const req = new Request("http://localhost/api/evaluate-response", {
      method: "POST",
      headers: { "Content-Type": "application/json", authorization: "Bearer test-vevia-token" },
      body: JSON.stringify({
        question: "Q",
        questionType: "short_text",
        candidateAnswer: "A",
        weight: 1,
        jobContext: "ctx",
      }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.result.score).toBe(8);
  });
});


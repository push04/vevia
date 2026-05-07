import { describe, expect, it, vi } from "vitest";

import { POST } from "./route";

vi.mock("@/lib/groq/question-generator", () => {
  return {
    generateScreeningQuestions: vi.fn(async () => [
      {
        q: "Do you have 5+ years of React?",
        type: "yes_no",
        weight: 0.5,
        preferred_yes: true,
        why: "Core requirement.",
      },
    ]),
  };
});

describe("/api/generate-questions", () => {
  it("returns questions", async () => {
    process.env.GROQ_API_KEY = "x";
    process.env.GROQ_MODEL_LARGE = "m";

    const req = new Request("http://localhost/api/generate-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobTitle: "SFE",
        jobDescription: "desc",
        requiredSkills: ["React"],
        experienceRange: "5-7",
      }),
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.questions).toHaveLength(1);
  });
});


import { describe, expect, it, vi } from "vitest";

import { POST } from "./route";

vi.mock("@/lib/groq/resume-parser", () => {
  return {
    parseResume: vi.fn(async () => ({
      full_name: "Test User",
      email: "t@example.com",
      phone: null,
      current_location: null,
      current_company: null,
      current_title: null,
      total_experience_years: 5,
      skills: ["React"],
      education: [],
      work_experience: [],
      certifications: [],
      languages: ["English"],
      linkedin_url: null,
      github_url: null,
      portfolio_url: null,
      summary: "Summary",
    })),
  };
});

vi.mock("@/lib/embeddings/generate", () => {
  return {
    generateEmbedding: vi.fn(async () => new Array<number>(384).fill(0)),
  };
});

describe("/api/parse-resume", () => {
  it("parses a text resume without Supabase persistence", async () => {
    process.env.GROQ_API_KEY = "x";
    process.env.GROQ_MODEL_LARGE = "m";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const fd = new FormData();
    fd.set(
      "resume",
      new File([Buffer.from("hello resume", "utf8")], "resume.txt", {
        type: "text/plain",
      }),
    );

    const req = new Request("http://localhost/api/parse-resume", {
      method: "POST",
      headers: { authorization: "Bearer test-vevia-token" },
      body: fd,
    });

    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.embeddingDims).toBe(384);
  });
});

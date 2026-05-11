import { describe, expect, it, vi } from "vitest";

import { generateEmbedding } from "./generate";

vi.mock("@huggingface/transformers", () => {
  const env = { cacheDir: "" };
  const pipeline = vi.fn(async () => {
    return async () => {
      const data = new Float32Array(384);
      data[0] = 1;
      return { data };
    };
  });
  return { env, pipeline };
});

describe("generateEmbedding", () => {
  it("returns 384 dims and is normalized", async () => {
    const vec = await generateEmbedding("Hello world");
    expect(vec).toHaveLength(384);
    const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0));
    expect(norm).toBeGreaterThan(0.99);
    expect(norm).toBeLessThan(1.01);
  });
});

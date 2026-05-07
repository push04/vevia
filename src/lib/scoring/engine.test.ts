import { describe, expect, it } from "vitest";

import { adjustWeights } from "./engine";

describe("adjustWeights", () => {
  const base = {
    resume_match: 0.3,
    screening: 0.35,
    skills_test: 0.2,
    video_interview: 0.15,
  };

  it("keeps weights unchanged when all scores exist", () => {
    const weights = adjustWeights(base, { testScore: 80, videoScore: 70 });
    expect(weights.resume_match).toBeCloseTo(base.resume_match);
    expect(weights.screening).toBeCloseTo(base.screening);
    expect(weights.skills_test).toBeCloseTo(base.skills_test);
    expect(weights.video_interview).toBeCloseTo(base.video_interview);
  });

  it("re-normalizes when test score is missing", () => {
    const weights = adjustWeights(base, { testScore: null, videoScore: 70 });
    expect(weights.skills_test).toBe(0);
    expect(weights.resume_match + weights.screening + weights.skills_test + weights.video_interview)
      .toBeCloseTo(1);
  });

  it("re-normalizes when video score is missing", () => {
    const weights = adjustWeights(base, { testScore: 80, videoScore: null });
    expect(weights.video_interview).toBe(0);
    expect(weights.resume_match + weights.screening + weights.skills_test + weights.video_interview)
      .toBeCloseTo(1);
  });

  it("handles when both are missing", () => {
    const weights = adjustWeights(base, { testScore: null, videoScore: null });
    expect(weights.skills_test).toBe(0);
    expect(weights.video_interview).toBe(0);
    expect(weights.resume_match + weights.screening + weights.skills_test + weights.video_interview)
      .toBeCloseTo(1);
  });
});

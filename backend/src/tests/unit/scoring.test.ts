import { describe, expect, it } from "vitest";
import {
  calculateQuizScore,
  calculateResumeReadinessScore,
  summarizeScores,
} from "../../shared/scoring.js";

describe("scoring calculations", () => {
  it("sums the four bounded resume readiness components", () => {
    expect(
      calculateResumeReadinessScore({
        keywordMatch: 20,
        clarity: 18,
        evidence: 22,
        formatting: 15,
      }),
    ).toBe(75);
  });

  it("rejects an out-of-range readiness component", () => {
    expect(() =>
      calculateResumeReadinessScore({
        keywordMatch: 26,
        clarity: 18,
        evidence: 22,
        formatting: 15,
      }),
    ).toThrow(RangeError);
  });

  it("calculates an exact percentage from recorded quiz results", () => {
    expect(
      calculateQuizScore({
        correctCount: 2,
        questionCount: 3,
      }),
    ).toBe(66.67);
  });

  it("rejects impossible quiz result counts", () => {
    expect(() =>
      calculateQuizScore({
        correctCount: 4,
        questionCount: 3,
      }),
    ).toThrow(RangeError);
  });

  it("summarizes recorded score series without fabricated defaults", () => {
    expect(summarizeScores([70, 90, 80])).toEqual({
      count: 3,
      average: 80,
      best: 90,
      latest: 70,
    });

    expect(summarizeScores([])).toEqual({
      count: 0,
      average: null,
      best: null,
      latest: null,
    });
  });
});

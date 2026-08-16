import { describe, expect, it } from "vitest";
import { quizScorePresentation } from "./quizScorePresentation";

describe("quiz score presentation", () => {
  it.each([
    [0, "needs-review", "Needs review"],
    [49.99, "needs-review", "Needs review"],
    [50, "developing", "Developing"],
    [74.99, "developing", "Developing"],
    [75, "strong", "Strong result"],
    [100, "strong", "Strong result"],
  ] as const)(
    "maps %s%% to %s",
    (scorePercent, level, label) => {
      expect(quizScorePresentation(scorePercent)).toEqual({ level, label });
    },
  );
});

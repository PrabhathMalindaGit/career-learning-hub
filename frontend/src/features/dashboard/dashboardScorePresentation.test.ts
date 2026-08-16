import { describe, expect, it } from "vitest";
import { dashboardScorePresentation } from "./dashboardScorePresentation";

describe("dashboardScorePresentation", () => {
  it.each([
    [49, "needs-review", "Needs review"],
    [50, "developing", "Developing"],
    [74, "developing", "Developing"],
    [75, "strong", "Strong result"],
  ] as const)(
    "maps %i to %s / %s",
    (score, level, label) => {
      expect(dashboardScorePresentation(score)).toEqual({
        level,
        label,
      });
    },
  );
});

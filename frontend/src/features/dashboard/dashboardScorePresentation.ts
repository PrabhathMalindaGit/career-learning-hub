export type DashboardPerformanceLevel =
  | "needs-review"
  | "developing"
  | "strong";

export type DashboardScorePresentation = {
  level: DashboardPerformanceLevel;
  label: "Needs review" | "Developing" | "Strong result";
};

export function dashboardScorePresentation(
  score: number,
): DashboardScorePresentation {
  if (score < 50) {
    return {
      level: "needs-review",
      label: "Needs review",
    };
  }

  if (score < 75) {
    return {
      level: "developing",
      label: "Developing",
    };
  }

  return {
    level: "strong",
    label: "Strong result",
  };
}

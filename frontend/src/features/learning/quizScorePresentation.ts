export type QuizPerformanceLevel =
  | "needs-review"
  | "developing"
  | "strong";

export type QuizScorePresentation = {
  level: QuizPerformanceLevel;
  label: "Needs review" | "Developing" | "Strong result";
};

export function quizScorePresentation(
  scorePercent: number,
): QuizScorePresentation {
  if (scorePercent < 50) {
    return { level: "needs-review", label: "Needs review" };
  }
  if (scorePercent < 75) {
    return { level: "developing", label: "Developing" };
  }
  return { level: "strong", label: "Strong result" };
}

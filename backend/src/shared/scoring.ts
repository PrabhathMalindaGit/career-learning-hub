export interface ResumeReadinessBreakdown {
  keywordMatch: number;
  clarity: number;
  evidence: number;
  formatting: number;
}

function assertFiniteRange(
  value: number,
  minimum: number,
  maximum: number,
  label: string,
): void {
  if (
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new RangeError(
      `${label} must be between ${minimum} and ${maximum}.`,
    );
  }
}

export function calculateResumeReadinessScore(
  breakdown: ResumeReadinessBreakdown,
): number {
  for (const [key, value] of Object.entries(breakdown)) {
    assertFiniteRange(value, 0, 25, key);
  }

  return (
    breakdown.keywordMatch +
    breakdown.clarity +
    breakdown.evidence +
    breakdown.formatting
  );
}

export function calculateQuizScore(input: {
  correctCount: number;
  questionCount: number;
}): number {
  if (
    !Number.isInteger(input.questionCount) ||
    input.questionCount <= 0
  ) {
    throw new RangeError(
      "questionCount must be a positive integer.",
    );
  }

  if (
    !Number.isInteger(input.correctCount) ||
    input.correctCount < 0 ||
    input.correctCount > input.questionCount
  ) {
    throw new RangeError(
      "correctCount must be an integer between zero and questionCount.",
    );
  }

  return Math.round(
    (input.correctCount / input.questionCount) * 10_000,
  ) / 100;
}

export function summarizeScores(
  scoresNewestFirst: number[],
): {
  count: number;
  average: number | null;
  best: number | null;
  latest: number | null;
} {
  if (scoresNewestFirst.length === 0) {
    return {
      count: 0,
      average: null,
      best: null,
      latest: null,
    };
  }

  scoresNewestFirst.forEach((score, index) =>
    assertFiniteRange(score, 0, 100, `scores[${index}]`),
  );

  const total = scoresNewestFirst.reduce(
    (sum, score) => sum + score,
    0,
  );

  return {
    count: scoresNewestFirst.length,
    average:
      Math.round(
        (total / scoresNewestFirst.length) * 100,
      ) / 100,
    best: Math.max(...scoresNewestFirst),
    latest: scoresNewestFirst[0],
  };
}

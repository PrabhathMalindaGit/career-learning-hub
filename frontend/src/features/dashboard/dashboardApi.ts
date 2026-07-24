import {
  ApiError,
  apiRequest,
} from "../../api/apiClient";
import type {
  DashboardActivityItem,
  DashboardActivityOrigin,
  DashboardActivityPage,
  DashboardActivityQuery,
  DashboardProgress,
  DashboardProgressQuery,
  LearningDocumentStatus,
} from "./types";
import {
  learningDocumentStatuses,
} from "./types";

const DEFAULT_TREND_LIMIT = 12;
const DEFAULT_RECENT_DOCUMENT_LIMIT = 6;
const DEFAULT_ACTIVITY_LIMIT = 10;

function invalidDashboardResponse(): never {
  throw new ApiError(
    200,
    "INVALID_DASHBOARD_RESPONSE",
    "The server returned an invalid dashboard response.",
  );
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function record(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    invalidDashboardResponse();
  }

  return value;
}

function stringValue(
  value: unknown,
  maximumLength = 1_000,
): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > maximumLength
  ) {
    invalidDashboardResponse();
  }

  return value;
}

function dateValue(value: unknown): string {
  const serialized = stringValue(value, 100);
  if (!Number.isFinite(Date.parse(serialized))) {
    invalidDashboardResponse();
  }

  return serialized;
}

function numberValue(
  value: unknown,
  options: {
    minimum?: number;
    maximum?: number;
    integer?: boolean;
  } = {},
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    (options.minimum !== undefined &&
      value < options.minimum) ||
    (options.maximum !== undefined &&
      value > options.maximum) ||
    (options.integer === true && !Number.isInteger(value))
  ) {
    invalidDashboardResponse();
  }

  return value;
}

function countValue(value: unknown): number {
  return numberValue(value, {
    minimum: 0,
    integer: true,
  });
}

function scoreValue(value: unknown): number {
  return numberValue(value, {
    minimum: 0,
    maximum: 100,
  });
}

function nullableScoreValue(value: unknown): number | null {
  return value === null ? null : scoreValue(value);
}

function nullableNonNegativeValue(
  value: unknown,
): number | null {
  return value === null
    ? null
    : numberValue(value, { minimum: 0 });
}

function arrayValue<T>(
  value: unknown,
  parser: (item: unknown) => T,
): T[] {
  if (!Array.isArray(value)) {
    invalidDashboardResponse();
  }

  return value.map(parser);
}

function parseResumeProgress(
  value: unknown,
): DashboardProgress["resumeReadiness"] {
  const source = record(value);
  const latestSource =
    source.latest === null ? null : record(source.latest);
  const breakdownSource = latestSource
    ? record(latestSource.scoreBreakdown)
    : null;

  return {
    latest:
      latestSource && breakdownSource
        ? {
            analysisId: stringValue(latestSource.analysisId, 200),
            resumeId: stringValue(latestSource.resumeId, 200),
            resumeVersionId: stringValue(
              latestSource.resumeVersionId,
              200,
            ),
            targetRole: stringValue(latestSource.targetRole, 200),
            score: scoreValue(latestSource.score),
            scoreBreakdown: {
              keywordMatch: numberValue(
                breakdownSource.keywordMatch,
                { minimum: 0, maximum: 25 },
              ),
              clarity: numberValue(breakdownSource.clarity, {
                minimum: 0,
                maximum: 25,
              }),
              evidence: numberValue(breakdownSource.evidence, {
                minimum: 0,
                maximum: 25,
              }),
              formatting: numberValue(
                breakdownSource.formatting,
                { minimum: 0, maximum: 25 },
              ),
            },
            createdAt: dateValue(latestSource.createdAt),
          }
        : null,
    previousScore: nullableScoreValue(source.previousScore),
    changeFromPrevious:
      source.changeFromPrevious === null
        ? null
        : numberValue(source.changeFromPrevious, {
            minimum: -100,
            maximum: 100,
          }),
    averageScoreInWindow: nullableScoreValue(
      source.averageScoreInWindow,
    ),
    analysesInWindow: countValue(source.analysesInWindow),
    analyzedResumesInWindow: countValue(
      source.analyzedResumesInWindow,
    ),
    trend: arrayValue(source.trend, (item) => {
      const point = record(item);
      return {
        analysisId: stringValue(point.analysisId, 200),
        resumeId: stringValue(point.resumeId, 200),
        targetRole: stringValue(point.targetRole, 200),
        score: scoreValue(point.score),
        createdAt: dateValue(point.createdAt),
      };
    }),
  };
}

function parseInterviewProgress(
  value: unknown,
): DashboardProgress["interviews"] {
  const source = record(value);

  return {
    attemptsInWindow: countValue(source.attemptsInWindow),
    feedbackCompletedInWindow: countValue(
      source.feedbackCompletedInWindow,
    ),
    averageFeedbackScore: nullableScoreValue(
      source.averageFeedbackScore,
    ),
    bestFeedbackScore: nullableScoreValue(
      source.bestFeedbackScore,
    ),
    latestFeedbackScore: nullableScoreValue(
      source.latestFeedbackScore,
    ),
    activeSessions: countValue(source.activeSessions),
    completedSessions: countValue(source.completedSessions),
    trend: arrayValue(source.trend, (item) => {
      const point = record(item);
      return {
        attemptId: stringValue(point.attemptId, 200),
        sessionId: stringValue(point.sessionId, 200),
        questionId: stringValue(point.questionId, 200),
        score: scoreValue(point.score),
        completedAt: dateValue(point.completedAt),
      };
    }),
  };
}

function documentStatus(
  value: unknown,
): LearningDocumentStatus {
  const status = stringValue(value, 20);
  const matchedStatus = learningDocumentStatuses.find(
    (candidate) => candidate === status,
  );

  if (!matchedStatus) {
    invalidDashboardResponse();
  }

  return matchedStatus;
}

function parseLearningProgress(
  value: unknown,
): DashboardProgress["learning"] {
  const source = record(value);
  const counts = record(source.documentCounts);
  const quiz = record(source.quizPerformance);

  return {
    documentCounts: {
      total: countValue(counts.total),
      uploaded: countValue(counts.uploaded),
      processing: countValue(counts.processing),
      ready: countValue(counts.ready),
      failed: countValue(counts.failed),
      deleting: countValue(counts.deleting),
    },
    recentDocuments: arrayValue(
      source.recentDocuments,
      (item) => {
        const document = record(item);
        const parsed = {
          documentId: stringValue(document.documentId, 200),
          title: stringValue(document.title, 200),
          status: documentStatus(document.status),
          pageCount: countValue(document.pageCount),
          chunkCount: countValue(document.chunkCount),
          updatedAt: dateValue(document.updatedAt),
        };

        if (document.processedAt === undefined) {
          return parsed;
        }

        return {
          ...parsed,
          processedAt: dateValue(document.processedAt),
        };
      },
    ),
    quizPerformance: {
      attemptsInWindow: countValue(quiz.attemptsInWindow),
      averageScore: nullableScoreValue(quiz.averageScore),
      bestScore: nullableScoreValue(quiz.bestScore),
      latestScore: nullableScoreValue(quiz.latestScore),
      totalQuestionsAnswered: countValue(
        quiz.totalQuestionsAnswered,
      ),
      totalCorrectAnswers: countValue(
        quiz.totalCorrectAnswers,
      ),
      trend: arrayValue(quiz.trend, (item) => {
        const point = record(item);
        return {
          attemptId: stringValue(point.attemptId, 200),
          quizId: stringValue(point.quizId, 200),
          documentId: stringValue(point.documentId, 200),
          scorePercent: scoreValue(point.scorePercent),
          correctCount: countValue(point.correctCount),
          questionCount: countValue(point.questionCount),
          completedAt: dateValue(point.completedAt),
        };
      }),
    },
  };
}

function parseAiUsage(
  value: unknown,
): DashboardProgress["aiUsage"] {
  const source = record(value);
  const requestCount = countValue(source.requestCount);
  const successCount = countValue(source.successCount);
  const failureCount = countValue(source.failureCount);
  const inputTokens = countValue(source.inputTokens);
  const outputTokens = countValue(source.outputTokens);
  const totalTokens = countValue(source.totalTokens);
  const estimatedCostEventCount = countValue(
    source.estimatedCostEventCount,
  );

  if (
    successCount + failureCount !== requestCount ||
    inputTokens + outputTokens !== totalTokens ||
    estimatedCostEventCount > requestCount
  ) {
    invalidDashboardResponse();
  }

  return {
    requestCount,
    successCount,
    failureCount,
    inputTokens,
    outputTokens,
    totalTokens,
    estimatedCostUsd: numberValue(
      source.estimatedCostUsd,
      { minimum: 0 },
    ),
    estimatedCostEventCount,
    averageLatencyMs: nullableNonNegativeValue(
      source.averageLatencyMs,
    ),
    byFeature: arrayValue(source.byFeature, (item) => {
      const group = record(item);
      return {
        feature: stringValue(group.feature, 120),
        requestCount: countValue(group.requestCount),
        successCount: countValue(group.successCount),
        failureCount: countValue(group.failureCount),
        inputTokens: countValue(group.inputTokens),
        outputTokens: countValue(group.outputTokens),
        estimatedCostUsd: numberValue(
          group.estimatedCostUsd,
          { minimum: 0 },
        ),
      };
    }),
    daily: arrayValue(source.daily, (item) => {
      const point = record(item);
      const date = stringValue(point.date, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        invalidDashboardResponse();
      }
      return {
        date,
        requestCount: countValue(point.requestCount),
        successCount: countValue(point.successCount),
        failureCount: countValue(point.failureCount),
        inputTokens: countValue(point.inputTokens),
        outputTokens: countValue(point.outputTokens),
        estimatedCostUsd: numberValue(
          point.estimatedCostUsd,
          { minimum: 0 },
        ),
      };
    }),
  };
}

function parseProgress(value: unknown): DashboardProgress {
  const source = record(value);
  const window = record(source.window);

  return {
    generatedAt: dateValue(source.generatedAt),
    window: {
      days: numberValue(window.days, {
        minimum: 7,
        maximum: 365,
        integer: true,
      }),
      start: dateValue(window.start),
      end: dateValue(window.end),
    },
    resumeReadiness: parseResumeProgress(
      source.resumeReadiness,
    ),
    interviews: parseInterviewProgress(source.interviews),
    learning: parseLearningProgress(source.learning),
    aiUsage: parseAiUsage(source.aiUsage),
  };
}

function activityOrigin(
  value: unknown,
): DashboardActivityOrigin {
  if (
    value !== "api" &&
    value !== "worker" &&
    value !== "system"
  ) {
    invalidDashboardResponse();
  }

  return value;
}

function parseActivityItem(
  value: unknown,
): DashboardActivityItem {
  const source = record(value);
  const parsed: DashboardActivityItem = {
    id: stringValue(source.id, 200),
    type: stringValue(source.type, 150),
    origin: activityOrigin(source.origin),
    occurredAt: dateValue(source.occurredAt),
  };

  if (source.resourceType !== undefined) {
    parsed.resourceType = stringValue(
      source.resourceType,
      100,
    );
  }

  return parsed;
}

function parseActivityPage(
  value: unknown,
): DashboardActivityPage {
  const source = record(value);
  const pagination = record(source.pagination);
  const page = numberValue(pagination.page, {
    minimum: 1,
    integer: true,
  });
  const limit = numberValue(pagination.limit, {
    minimum: 1,
    maximum: 100,
    integer: true,
  });
  const total = countValue(pagination.total);
  const pages = countValue(pagination.pages);

  if (
    pages !== Math.ceil(total / limit) ||
    (pages > 0 && page > pages)
  ) {
    invalidDashboardResponse();
  }

  return {
    events: arrayValue(source.events, parseActivityItem),
    pagination: {
      page,
      limit,
      total,
      pages,
    },
  };
}

function boundedInteger(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(
    maximum,
    Math.max(minimum, Math.trunc(value)),
  );
}

export async function fetchProgressSnapshot(
  query: DashboardProgressQuery,
  signal?: AbortSignal,
): Promise<DashboardProgress> {
  const params = new URLSearchParams();
  params.set("windowDays", String(query.windowDays));
  params.set(
    "trendLimit",
    String(
      boundedInteger(
        query.trendLimit,
        DEFAULT_TREND_LIMIT,
        3,
        30,
      ),
    ),
  );
  params.set(
    "recentDocumentLimit",
    String(
      boundedInteger(
        query.recentDocumentLimit,
        DEFAULT_RECENT_DOCUMENT_LIMIT,
        1,
        20,
      ),
    ),
  );

  const data = await apiRequest<unknown>(
    `/dashboard/progress?${params.toString()}`,
    {
      authentication: "required",
      signal,
    },
  );

  return parseProgress(data);
}

export async function fetchDashboardActivity(
  query: DashboardActivityQuery = {},
  signal?: AbortSignal,
): Promise<DashboardActivityPage> {
  const params = new URLSearchParams();
  params.set(
    "page",
    String(
      boundedInteger(
        query.page,
        1,
        1,
        Number.MAX_SAFE_INTEGER,
      ),
    ),
  );
  params.set(
    "limit",
    String(
      boundedInteger(
        query.limit,
        DEFAULT_ACTIVITY_LIMIT,
        1,
        100,
      ),
    ),
  );

  if (query.type !== undefined) {
    params.set("type", query.type);
  }
  if (query.origin !== undefined) {
    params.set("origin", query.origin);
  }
  if (query.resourceType !== undefined) {
    params.set("resourceType", query.resourceType);
  }

  const data = await apiRequest<unknown>(
    `/dashboard/activity?${params.toString()}`,
    {
      authentication: "required",
      signal,
    },
  );

  return parseActivityPage(data);
}

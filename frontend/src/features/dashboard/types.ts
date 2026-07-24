export const dashboardWindowDays = [7, 30, 90, 365] as const;

export type DashboardWindowDays =
  (typeof dashboardWindowDays)[number];

export const learningDocumentStatuses = [
  "uploaded",
  "processing",
  "ready",
  "failed",
  "deleting",
] as const;

export type LearningDocumentStatus =
  (typeof learningDocumentStatuses)[number];

export type DashboardActivityOrigin =
  | "api"
  | "worker"
  | "system";

export interface DashboardActivityItem {
  id: string;
  type: string;
  resourceType?: string;
  origin: DashboardActivityOrigin;
  occurredAt: string;
}

export interface DashboardProgress {
  generatedAt: string;
  window: {
    days: number;
    start: string;
    end: string;
  };
  resumeReadiness: {
    latest: {
      analysisId: string;
      resumeId: string;
      resumeVersionId: string;
      targetRole: string;
      score: number;
      scoreBreakdown: {
        keywordMatch: number;
        clarity: number;
        evidence: number;
        formatting: number;
      };
      createdAt: string;
    } | null;
    previousScore: number | null;
    changeFromPrevious: number | null;
    averageScoreInWindow: number | null;
    analysesInWindow: number;
    analyzedResumesInWindow: number;
    trend: Array<{
      analysisId: string;
      resumeId: string;
      targetRole: string;
      score: number;
      createdAt: string;
    }>;
  };
  interviews: {
    attemptsInWindow: number;
    feedbackCompletedInWindow: number;
    averageFeedbackScore: number | null;
    bestFeedbackScore: number | null;
    latestFeedbackScore: number | null;
    activeSessions: number;
    completedSessions: number;
    trend: Array<{
      attemptId: string;
      sessionId: string;
      questionId: string;
      score: number;
      completedAt: string;
    }>;
  };
  learning: {
    documentCounts: {
      total: number;
      uploaded: number;
      processing: number;
      ready: number;
      failed: number;
      deleting: number;
    };
    recentDocuments: Array<{
      documentId: string;
      title: string;
      status: LearningDocumentStatus;
      pageCount: number;
      chunkCount: number;
      processedAt?: string;
      updatedAt: string;
    }>;
    quizPerformance: {
      attemptsInWindow: number;
      averageScore: number | null;
      bestScore: number | null;
      latestScore: number | null;
      totalQuestionsAnswered: number;
      totalCorrectAnswers: number;
      trend: Array<{
        attemptId: string;
        quizId: string;
        documentId: string;
        scorePercent: number;
        correctCount: number;
        questionCount: number;
        completedAt: string;
      }>;
    };
  };
  aiUsage: {
    requestCount: number;
    successCount: number;
    failureCount: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    estimatedCostEventCount: number;
    averageLatencyMs: number | null;
    byFeature: Array<{
      feature: string;
      requestCount: number;
      successCount: number;
      failureCount: number;
      inputTokens: number;
      outputTokens: number;
      estimatedCostUsd: number;
    }>;
    daily: Array<{
      date: string;
      requestCount: number;
      successCount: number;
      failureCount: number;
      inputTokens: number;
      outputTokens: number;
      estimatedCostUsd: number;
    }>;
  };
}

export interface DashboardProgressQuery {
  windowDays: DashboardWindowDays;
  trendLimit?: number;
  recentDocumentLimit?: number;
}

export interface DashboardActivityQuery {
  page?: number;
  limit?: number;
  type?: string;
  origin?: DashboardActivityOrigin;
  resourceType?: string;
}

export interface DashboardActivityPage {
  events: DashboardActivityItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

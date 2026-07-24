export interface DashboardActivityItem {
  id: string;
  type: string;
  resourceType?: string;
  resourceId?: string;
  origin: "api" | "worker" | "system";
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

export interface DashboardOverview {
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
      status: string;
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
  recentActivity: DashboardActivityItem[];
}

export interface DashboardQuery {
  windowDays?: number;
  trendLimit?: number;
  activityLimit?: number;
  recentDocumentLimit?: number;
}

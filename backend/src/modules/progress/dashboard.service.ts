import { Types } from "mongoose";
import { ActivityEventModel } from "../activity/activity.model.js";
import { UsageEventModel } from "../ai/usageEvent.model.js";
import { InterviewAttemptModel } from "../interviews/interviewAttempt.model.js";
import { InterviewSessionModel } from "../interviews/interviewSession.model.js";
import { LearningDocumentModel } from "../learning/learningDocument.model.js";
import { QuizAttemptModel } from "../learning/quizAttempt.model.js";
import { ResumeAnalysisModel } from "../resume-analysis/resumeAnalysis.model.js";
import type {
  DashboardActivityItem,
  DashboardOverview,
} from "./dashboard.types.js";

function round(
  value: number | null | undefined,
  digits = 2,
): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function dateString(value: Date | string): string {
  return new Date(value).toISOString();
}

function mapActivity(
  event: {
    _id: unknown;
    type: string;
    resourceType?: string;
    resourceId?: string;
    origin: "api" | "worker" | "system";
    metadata?: Record<string, unknown>;
    occurredAt: Date;
  },
): DashboardActivityItem {
  return {
    id: String(event._id),
    type: event.type,
    resourceType: event.resourceType,
    resourceId: event.resourceId,
    origin: event.origin,
    metadata: event.metadata,
    occurredAt: dateString(event.occurredAt),
  };
}

export async function getDashboardOverview(input: {
  userId: string;
  windowDays: number;
  trendLimit: number;
  activityLimit: number;
  recentDocumentLimit: number;
  includeActivity?: boolean;
}): Promise<DashboardOverview> {
  const now = new Date();
  const windowStart = new Date(
    now.getTime() - input.windowDays * 24 * 60 * 60 * 1000,
  );
  const userObjectId = new Types.ObjectId(input.userId);

  const [
    latestResumeRows,
    resumeTrendRows,
    resumeWindowRows,
    interviewAttemptCount,
    interviewFeedbackRows,
    interviewTrendRows,
    interviewSessionRows,
    documentStatusRows,
    recentDocuments,
    quizSummaryRows,
    quizTrendRows,
    usageSummaryRows,
    usageFeatureRows,
    usageDailyRows,
    activityRows,
  ] = await Promise.all([
    ResumeAnalysisModel.find({ userId: input.userId })
      .select(
        "resumeId resumeVersionId target.role totalScore scoreBreakdown createdAt",
      )
      .sort({ createdAt: -1, _id: -1 })
      .limit(2)
      .lean(),

    ResumeAnalysisModel.find({
      userId: input.userId,
      createdAt: { $gte: windowStart, $lte: now },
    })
      .select("resumeId target.role totalScore createdAt")
      .sort({ createdAt: -1, _id: -1 })
      .limit(input.trendLimit)
      .lean(),

    ResumeAnalysisModel.aggregate<{
      analysesInWindow: number;
      averageScoreInWindow: number;
      resumeIds: Types.ObjectId[];
    }>([
      {
        $match: {
          userId: userObjectId,
          createdAt: { $gte: windowStart, $lte: now },
        },
      },
      {
        $group: {
          _id: null,
          analysesInWindow: { $sum: 1 },
          averageScoreInWindow: { $avg: "$totalScore" },
          resumeIds: { $addToSet: "$resumeId" },
        },
      },
    ]),

    InterviewAttemptModel.countDocuments({
      userId: input.userId,
      createdAt: { $gte: windowStart, $lte: now },
    }),

    InterviewAttemptModel.aggregate<{
      feedbackCompletedInWindow: number;
      averageFeedbackScore: number;
      bestFeedbackScore: number;
      latestFeedbackScore: number;
    }>([
      {
        $match: {
          userId: userObjectId,
          "feedback.completedAt": {
            $gte: windowStart,
            $lte: now,
          },
          "feedback.score": { $type: "number" },
        },
      },
      { $sort: { "feedback.completedAt": -1, _id: -1 } },
      {
        $group: {
          _id: null,
          feedbackCompletedInWindow: { $sum: 1 },
          averageFeedbackScore: { $avg: "$feedback.score" },
          bestFeedbackScore: { $max: "$feedback.score" },
          latestFeedbackScore: { $first: "$feedback.score" },
        },
      },
    ]),

    InterviewAttemptModel.find({
      userId: input.userId,
      "feedback.score": { $exists: true },
      "feedback.completedAt": {
        $gte: windowStart,
        $lte: now,
      },
    })
      .select("sessionId questionId feedback.score feedback.completedAt")
      .sort({ "feedback.completedAt": -1, _id: -1 })
      .limit(input.trendLimit)
      .lean(),

    InterviewSessionModel.aggregate<{
      _id: "active" | "completed" | "archived";
      count: number;
    }>([
      { $match: { userId: userObjectId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),

    LearningDocumentModel.aggregate<{
      _id: "uploaded" | "processing" | "ready" | "failed" | "deleting";
      count: number;
    }>([
      { $match: { userId: userObjectId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),

    LearningDocumentModel.find({ userId: input.userId })
      .select(
        "title status pageCount chunkCount processedAt updatedAt",
      )
      .sort({ updatedAt: -1, _id: -1 })
      .limit(input.recentDocumentLimit)
      .lean(),

    QuizAttemptModel.aggregate<{
      attemptsInWindow: number;
      averageScore: number;
      bestScore: number;
      latestScore: number;
      totalQuestionsAnswered: number;
      totalCorrectAnswers: number;
    }>([
      {
        $match: {
          userId: userObjectId,
          completedAt: { $gte: windowStart, $lte: now },
        },
      },
      { $sort: { completedAt: -1, _id: -1 } },
      {
        $group: {
          _id: null,
          attemptsInWindow: { $sum: 1 },
          averageScore: { $avg: "$scorePercent" },
          bestScore: { $max: "$scorePercent" },
          latestScore: { $first: "$scorePercent" },
          totalQuestionsAnswered: { $sum: "$questionCount" },
          totalCorrectAnswers: { $sum: "$correctCount" },
        },
      },
    ]),

    QuizAttemptModel.find({
      userId: input.userId,
      completedAt: { $gte: windowStart, $lte: now },
    })
      .select(
        "quizId documentId scorePercent correctCount questionCount completedAt",
      )
      .sort({ completedAt: -1, _id: -1 })
      .limit(input.trendLimit)
      .lean(),

    UsageEventModel.aggregate<{
      requestCount: number;
      successCount: number;
      failureCount: number;
      inputTokens: number;
      outputTokens: number;
      estimatedCostUsd: number;
      estimatedCostEventCount: number;
      averageLatencyMs: number;
    }>([
      {
        $match: {
          userId: userObjectId,
          createdAt: { $gte: windowStart, $lte: now },
        },
      },
      {
        $group: {
          _id: null,
          requestCount: { $sum: "$requestCount" },
          successCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "success"] }, "$requestCount", 0],
            },
          },
          failureCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "failure"] }, "$requestCount", 0],
            },
          },
          inputTokens: { $sum: "$inputTokens" },
          outputTokens: { $sum: "$outputTokens" },
          estimatedCostUsd: {
            $sum: { $ifNull: ["$estimatedCostUsd", 0] },
          },
          estimatedCostEventCount: {
            $sum: {
              $cond: [
                { $ne: [{ $ifNull: ["$estimatedCostUsd", null] }, null] },
                1,
                0,
              ],
            },
          },
          averageLatencyMs: { $avg: "$latencyMs" },
        },
      },
    ]),

    UsageEventModel.aggregate<{
      _id: string;
      requestCount: number;
      successCount: number;
      failureCount: number;
      inputTokens: number;
      outputTokens: number;
      estimatedCostUsd: number;
    }>([
      {
        $match: {
          userId: userObjectId,
          createdAt: { $gte: windowStart, $lte: now },
        },
      },
      {
        $group: {
          _id: "$feature",
          requestCount: { $sum: "$requestCount" },
          successCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "success"] }, "$requestCount", 0],
            },
          },
          failureCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "failure"] }, "$requestCount", 0],
            },
          },
          inputTokens: { $sum: "$inputTokens" },
          outputTokens: { $sum: "$outputTokens" },
          estimatedCostUsd: {
            $sum: { $ifNull: ["$estimatedCostUsd", 0] },
          },
        },
      },
      { $sort: { requestCount: -1, _id: 1 } },
      { $limit: 12 },
    ]),

    UsageEventModel.aggregate<{
      _id: string;
      requestCount: number;
      successCount: number;
      failureCount: number;
      inputTokens: number;
      outputTokens: number;
      estimatedCostUsd: number;
    }>([
      {
        $match: {
          userId: userObjectId,
          createdAt: { $gte: windowStart, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "UTC",
            },
          },
          requestCount: { $sum: "$requestCount" },
          successCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "success"] }, "$requestCount", 0],
            },
          },
          failureCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "failure"] }, "$requestCount", 0],
            },
          },
          inputTokens: { $sum: "$inputTokens" },
          outputTokens: { $sum: "$outputTokens" },
          estimatedCostUsd: {
            $sum: { $ifNull: ["$estimatedCostUsd", 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    input.includeActivity === false
      ? Promise.resolve([])
      : ActivityEventModel.find({ userId: input.userId })
          .select(
            "type resourceType resourceId origin metadata occurredAt",
          )
          .sort({ occurredAt: -1, _id: -1 })
          .limit(input.activityLimit)
          .lean(),
  ]);

  const resumeWindow = resumeWindowRows[0];
  const latestResumeAnalysis = latestResumeRows[0];
  const previousResumeAnalysis = latestResumeRows[1];
  const interviewFeedback = interviewFeedbackRows[0];
  const quizSummary = quizSummaryRows[0];
  const usageSummary = usageSummaryRows[0];

  const sessionCounts = new Map(
    interviewSessionRows.map((row) => [row._id, row.count] as const),
  );

  const documentCounts = new Map(
    documentStatusRows.map((row) => [row._id, row.count] as const),
  );

  const totalDocuments = documentStatusRows.reduce(
    (total, row) => total + row.count,
    0,
  );

  return {
    generatedAt: now.toISOString(),
    window: {
      days: input.windowDays,
      start: windowStart.toISOString(),
      end: now.toISOString(),
    },
    resumeReadiness: {
      latest: latestResumeAnalysis
        ? {
            analysisId: String(latestResumeAnalysis._id),
            resumeId: String(latestResumeAnalysis.resumeId),
            resumeVersionId: String(
              latestResumeAnalysis.resumeVersionId,
            ),
            targetRole: latestResumeAnalysis.target.role,
            score: latestResumeAnalysis.totalScore,
            scoreBreakdown: latestResumeAnalysis.scoreBreakdown,
            createdAt: dateString(latestResumeAnalysis.createdAt),
          }
        : null,
      previousScore:
        previousResumeAnalysis?.totalScore ?? null,
      changeFromPrevious:
        latestResumeAnalysis && previousResumeAnalysis
          ? round(
              latestResumeAnalysis.totalScore -
                previousResumeAnalysis.totalScore,
            )
          : null,
      averageScoreInWindow: round(
        resumeWindow?.averageScoreInWindow,
      ),
      analysesInWindow: resumeWindow?.analysesInWindow ?? 0,
      analyzedResumesInWindow:
        resumeWindow?.resumeIds.length ?? 0,
      trend: resumeTrendRows
        .slice(0, input.trendLimit)
        .reverse()
        .map((analysis) => ({
          analysisId: String(analysis._id),
          resumeId: String(analysis.resumeId),
          targetRole: analysis.target.role,
          score: analysis.totalScore,
          createdAt: dateString(analysis.createdAt),
        })),
    },
    interviews: {
      attemptsInWindow: interviewAttemptCount,
      feedbackCompletedInWindow:
        interviewFeedback?.feedbackCompletedInWindow ?? 0,
      averageFeedbackScore: round(
        interviewFeedback?.averageFeedbackScore,
      ),
      bestFeedbackScore: round(
        interviewFeedback?.bestFeedbackScore,
      ),
      latestFeedbackScore: round(
        interviewFeedback?.latestFeedbackScore,
      ),
      activeSessions: sessionCounts.get("active") ?? 0,
      completedSessions: sessionCounts.get("completed") ?? 0,
      trend: interviewTrendRows
        .reverse()
        .map((attempt) => ({
          attemptId: String(attempt._id),
          sessionId: String(attempt.sessionId),
          questionId: String(attempt.questionId),
          score: attempt.feedback!.score,
          completedAt: dateString(
            attempt.feedback!.completedAt,
          ),
        })),
    },
    learning: {
      documentCounts: {
        total: totalDocuments,
        uploaded: documentCounts.get("uploaded") ?? 0,
        processing: documentCounts.get("processing") ?? 0,
        ready: documentCounts.get("ready") ?? 0,
        failed: documentCounts.get("failed") ?? 0,
        deleting: documentCounts.get("deleting") ?? 0,
      },
      recentDocuments: recentDocuments.map((document) => ({
        documentId: String(document._id),
        title: document.title,
        status: document.status,
        pageCount: document.pageCount,
        chunkCount: document.chunkCount,
        processedAt: document.processedAt
          ? dateString(document.processedAt)
          : undefined,
        updatedAt: dateString(document.updatedAt),
      })),
      quizPerformance: {
        attemptsInWindow: quizSummary?.attemptsInWindow ?? 0,
        averageScore: round(quizSummary?.averageScore),
        bestScore: round(quizSummary?.bestScore),
        latestScore: round(quizSummary?.latestScore),
        totalQuestionsAnswered:
          quizSummary?.totalQuestionsAnswered ?? 0,
        totalCorrectAnswers:
          quizSummary?.totalCorrectAnswers ?? 0,
        trend: quizTrendRows.reverse().map((attempt) => ({
          attemptId: String(attempt._id),
          quizId: String(attempt.quizId),
          documentId: String(attempt.documentId),
          scorePercent: attempt.scorePercent,
          correctCount: attempt.correctCount,
          questionCount: attempt.questionCount,
          completedAt: dateString(attempt.completedAt),
        })),
      },
    },
    aiUsage: {
      requestCount: usageSummary?.requestCount ?? 0,
      successCount: usageSummary?.successCount ?? 0,
      failureCount: usageSummary?.failureCount ?? 0,
      inputTokens: usageSummary?.inputTokens ?? 0,
      outputTokens: usageSummary?.outputTokens ?? 0,
      totalTokens:
        (usageSummary?.inputTokens ?? 0) +
        (usageSummary?.outputTokens ?? 0),
      estimatedCostUsd:
        round(usageSummary?.estimatedCostUsd, 6) ?? 0,
      estimatedCostEventCount:
        usageSummary?.estimatedCostEventCount ?? 0,
      averageLatencyMs: round(
        usageSummary?.averageLatencyMs,
      ),
      byFeature: usageFeatureRows.map((row) => ({
        feature: row._id,
        requestCount: row.requestCount,
        successCount: row.successCount,
        failureCount: row.failureCount,
        inputTokens: row.inputTokens,
        outputTokens: row.outputTokens,
        estimatedCostUsd:
          round(row.estimatedCostUsd, 6) ?? 0,
      })),
      daily: usageDailyRows.map((row) => ({
        date: row._id,
        requestCount: row.requestCount,
        successCount: row.successCount,
        failureCount: row.failureCount,
        inputTokens: row.inputTokens,
        outputTokens: row.outputTokens,
        estimatedCostUsd:
          round(row.estimatedCostUsd, 6) ?? 0,
      })),
    },
    recentActivity: activityRows.map((event) =>
      mapActivity(
        event as unknown as Parameters<typeof mapActivity>[0],
      ),
    ),
  };
}

export async function listDashboardActivity(input: {
  userId: string;
  page: number;
  limit: number;
  type?: string;
  origin?: "api" | "worker" | "system";
  resourceType?: string;
}) {
  const filter: Record<string, unknown> = {
    userId: input.userId,
  };

  if (input.type) filter.type = input.type;
  if (input.origin) filter.origin = input.origin;
  if (input.resourceType) {
    filter.resourceType = input.resourceType;
  }

  const [events, total] = await Promise.all([
    ActivityEventModel.find(filter)
      .select(
        "type resourceType resourceId origin metadata occurredAt",
      )
      .sort({ occurredAt: -1, _id: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit)
      .lean(),
    ActivityEventModel.countDocuments(filter),
  ]);

  return {
    events: events.map((event) =>
      mapActivity(
        event as unknown as Parameters<typeof mapActivity>[0],
      ),
    ),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      pages: Math.ceil(total / input.limit),
    },
  };
}

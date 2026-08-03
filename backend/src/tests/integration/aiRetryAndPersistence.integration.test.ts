import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { afterEach, describe, expect, it, vi } from "vitest";
import { failOrRetryJob } from "../../jobs/job.queue.js";
import { JobRecordModel } from "../../jobs/job.model.js";
import {
  attachFlashcardJob,
  attachQuizJob,
  generateFlashcards,
} from "../../modules/learning/learningAssessment.service.js";
import { DocumentChunkModel } from "../../modules/learning/documentChunk.model.js";
import { FlashcardModel } from "../../modules/learning/flashcard.model.js";
import { FlashcardSetModel } from "../../modules/learning/flashcardSet.model.js";
import { LearningDocumentModel } from "../../modules/learning/learningDocument.model.js";
import { QuizModel } from "../../modules/learning/quiz.model.js";
import { generateInterviewQuestions } from "../../modules/interviews/interviewAi.service.js";
import { InterviewQuestionModel } from "../../modules/interviews/interviewQuestion.model.js";
import { InterviewSessionModel } from "../../modules/interviews/interviewSession.model.js";
import { analyzeResume } from "../../modules/resume-analysis/resumeAnalysis.service.js";
import { ResumeAnalysisModel } from "../../modules/resume-analysis/resumeAnalysis.model.js";
import { createResume } from "../../modules/resumes/resume.service.js";
import { AppError } from "../../shared/appError.js";

function mockGemini(value: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }],
          usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 5 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    ),
  );
}

describe("AI retry classification and provider-to-persistence", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("terminalizes an explicitly non-retryable error after one worker attempt", async () => {
    const job = await JobRecordModel.create({
      userId: new Types.ObjectId(),
      type: "resume.analysis",
      payload: {},
      status: "processing",
      attempts: 1,
      maxAttempts: 3,
      lockedBy: "vitest-worker",
      lockedAt: new Date(),
      lockExpiresAt: new Date(Date.now() + 60_000),
    });

    await failOrRetryJob(
      job,
      new AppError(404, "NOT_FOUND", "Synthetic missing model.", undefined, false),
    );

    await expect(JobRecordModel.findById(job._id).lean()).resolves.toMatchObject({
      status: "failed",
      attempts: 1,
      maxAttempts: 3,
      error: { code: "NOT_FOUND" },
    });
  });

  it("keeps transient errors eligible for the existing worker retry bound", async () => {
    const job = await JobRecordModel.create({
      userId: new Types.ObjectId(),
      type: "resume.analysis",
      payload: {},
      status: "processing",
      attempts: 1,
      maxAttempts: 3,
      lockedBy: "vitest-worker",
      lockedAt: new Date(),
      lockExpiresAt: new Date(Date.now() + 60_000),
    });

    await failOrRetryJob(
      job,
      new AppError(503, "UNAVAILABLE", "Synthetic overload.", undefined, true),
    );

    await expect(JobRecordModel.findById(job._id).lean()).resolves.toMatchObject({
      status: "queued",
      attempts: 1,
      maxAttempts: 3,
      error: { code: "UNAVAILABLE" },
    });
  });

  it("persists a schema-valid Resume provider response", async () => {
    const userId = new Types.ObjectId().toString();
    const created = await createResume({
      userId,
      title: "Synthetic resume",
      content: {
        basics: { fullName: "Synthetic Candidate", links: [] },
        experience: [], education: [], skills: [], projects: [],
        certifications: [], languages: [], interests: [],
      },
    });
    mockGemini({
      scoreBreakdown: { keywordMatch: 10, clarity: 10, evidence: 10, formatting: 10 },
      issues: [], strengths: [], missingKeywords: [], suggestions: [],
    });

    const analysis = await analyzeResume({
      userId,
      resumeId: created.resume._id.toString(),
      targetRole: "Synthetic Engineer",
      jobId: new Types.ObjectId().toString(),
    });

    expect(analysis.totalScore).toBe(40);
    await expect(ResumeAnalysisModel.countDocuments({ userId })).resolves.toBe(1);
  });

  it("rejects a schema-valid Resume response that violates feature semantics", async () => {
    const userId = new Types.ObjectId().toString();
    const sourceBulletId = randomUUID();
    const created = await createResume({
      userId,
      title: "Synthetic semantic validation resume",
      content: {
        basics: { fullName: "Synthetic Candidate", links: [] },
        experience: [{
          id: randomUUID(),
          employer: "Synthetic Company",
          jobTitle: "Engineer",
          isCurrent: true,
          bullets: [{ id: sourceBulletId, text: "Built a test fixture." }],
        }],
        education: [], skills: [], projects: [], certifications: [],
        languages: [], interests: [],
      },
    });
    mockGemini({
      scoreBreakdown: { keywordMatch: 10, clarity: 10, evidence: 10, formatting: 10 },
      issues: [],
      strengths: [],
      missingKeywords: [],
      suggestions: [{
        bulletId: randomUUID(),
        rewrittenText: "Built a synthetic test fixture.",
        rationale: "Synthetic rationale.",
        verificationRequired: true,
      }],
    });

    await expect(
      analyzeResume({
        userId,
        resumeId: created.resume._id.toString(),
        targetRole: "Synthetic Engineer",
        jobId: new Types.ObjectId().toString(),
      }),
    ).rejects.toMatchObject({ code: "AI_UNKNOWN_BULLET_ID" });
    await expect(ResumeAnalysisModel.countDocuments({ userId })).resolves.toBe(0);
  });

  it("persists a schema-valid Interview provider response", async () => {
    const userId = new Types.ObjectId();
    const session = await InterviewSessionModel.create({
      userId,
      title: "Synthetic interview",
      targetRole: "Synthetic Engineer",
      experienceLevel: "Junior",
      focusTopics: [],
      skillGaps: [],
      mode: "study",
    });
    mockGemini({
      questions: [{
        category: "Technical",
        difficulty: "easy",
        question: "How would you test a small function?",
        modelAnswer: "Describe inputs, outputs, edge cases, and assertions.",
      }],
    });

    const result = await generateInterviewQuestions({
      userId: userId.toString(),
      sessionId: session._id.toString(),
      count: 1,
      categories: ["Technical"],
      difficultyMix: { easy: 1, medium: 0, hard: 0 },
      jobId: new Types.ObjectId().toString(),
    });

    expect(result.insertedCount).toBe(1);
    await expect(InterviewQuestionModel.countDocuments({ userId })).resolves.toBe(1);
  });

  it("persists a schema-valid Learning provider response", async () => {
    const userId = new Types.ObjectId();
    const document = await LearningDocumentModel.create({
      userId,
      assetId: new Types.ObjectId(),
      title: "Synthetic learning document",
      originalFilename: "synthetic.pdf",
      mimeType: "application/pdf",
      status: "ready",
      pageCount: 1,
      chunkCount: 1,
    });
    await DocumentChunkModel.create({
      userId,
      documentId: document._id,
      chunkIndex: 0,
      pageStart: 1,
      pageEnd: 1,
      text: "Synthetic testing verifies expected behavior.",
      wordCount: 5,
    });
    const jobId = new Types.ObjectId();
    const set = await FlashcardSetModel.create({
      userId,
      documentId: document._id,
      requestId: randomUUID(),
      title: "Synthetic cards",
      status: "generating",
      generationJobId: jobId,
    });
    mockGemini({
      cards: [{
        cardIndex: 0,
        front: "What does synthetic testing verify?",
        back: "Expected behavior.",
        sourceChunkIndexes: [0],
      }],
    });

    const result = await generateFlashcards({
      userId: userId.toString(),
      documentId: document._id.toString(),
      setId: set._id.toString(),
      count: 1,
      jobId: jobId.toString(),
    });

    expect(result.cardCount).toBe(1);
    await expect(FlashcardModel.countDocuments({ userId })).resolves.toBe(1);
  });

  it("attaches a queued Flashcard job without turning a committed transaction into an error", async () => {
    const userId = new Types.ObjectId();
    const document = await LearningDocumentModel.create({
      userId,
      assetId: new Types.ObjectId(),
      title: "Synthetic learning document",
      originalFilename: "synthetic.pdf",
      mimeType: "application/pdf",
      status: "ready",
    });
    const set = await FlashcardSetModel.create({
      userId,
      documentId: document._id,
      requestId: randomUUID(),
      title: "Synthetic cards",
    });
    const jobId = new Types.ObjectId().toString();

    await expect(
      attachFlashcardJob({ userId: userId.toString(), setId: set._id.toString(), jobId }),
    ).resolves.toBeUndefined();
    await expect(FlashcardSetModel.findById(set._id).lean()).resolves.toMatchObject({
      generationJobId: new Types.ObjectId(jobId),
    });
  });

  it("attaches a queued Quiz job without turning a committed transaction into an error", async () => {
    const userId = new Types.ObjectId();
    const document = await LearningDocumentModel.create({
      userId,
      assetId: new Types.ObjectId(),
      title: "Synthetic learning document",
      originalFilename: "synthetic.pdf",
      mimeType: "application/pdf",
      status: "ready",
    });
    const quiz = await QuizModel.create({
      userId,
      documentId: document._id,
      requestId: randomUUID(),
      title: "Synthetic quiz",
    });
    const jobId = new Types.ObjectId().toString();

    await expect(
      attachQuizJob({ userId: userId.toString(), quizId: quiz._id.toString(), jobId }),
    ).resolves.toBeUndefined();
    await expect(QuizModel.findById(quiz._id).lean()).resolves.toMatchObject({
      generationJobId: new Types.ObjectId(jobId),
    });
  });
});

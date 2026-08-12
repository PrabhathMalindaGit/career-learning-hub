import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { env } from "../../config/env.js";
import { enqueueJob, failOrRetryJob, retryOwnedJob } from "../../jobs/job.queue.js";
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
import {
  analyzeResume,
  applyAnalysisSuggestions,
} from "../../modules/resume-analysis/resumeAnalysis.service.js";
import { ResumeAnalysisModel } from "../../modules/resume-analysis/resumeAnalysis.model.js";
import {
  createResume,
  createResumeVersion,
} from "../../modules/resumes/resume.service.js";
import { AppError } from "../../shared/appError.js";
import {
  activateProvider,
  ensureAiFoundation,
} from "../../modules/ai/aiProvider.service.js";

const originalFoundation = env.AI_ROUTING_FOUNDATION_ENABLED;
const originalAdminCompatibility = env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED;

async function connectApplicationManagedGemini(userId: string) {
  env.AI_ROUTING_FOUNDATION_ENABLED = true;
  env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED = true;
  await ensureAiFoundation(userId);
  await activateProvider({
    userId,
    provider: "gemini-direct",
    credentialSource: "administrator-managed",
    expectedRevision: 0,
  });
}

async function routedJob(userId: string, type: string) {
  await connectApplicationManagedGemini(userId);
  return enqueueJob({ userId, type, payload: {} });
}

function mockGemini(value: unknown) {
  const fetchMock = vi.fn().mockImplementation(async () =>
    new Response(
      JSON.stringify({
        candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }],
        usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 5 },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );
  vi.stubGlobal(
    "fetch",
    fetchMock,
  );
  return fetchMock;
}

function executionLifecycle() {
  return {
    signal: new AbortController().signal,
    reportPhase: vi.fn().mockResolvedValue(undefined),
    assertActive: vi.fn().mockResolvedValue(undefined),
    beginPersistence: vi.fn().mockResolvedValue(undefined),
  };
}

describe("AI retry classification and provider-to-persistence", () => {
  afterEach(() => {
    env.AI_ROUTING_FOUNDATION_ENABLED = originalFoundation;
    env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED = originalAdminCompatibility;
    vi.unstubAllGlobals();
  });

  it("terminalizes an explicitly non-retryable error after one worker attempt", async () => {
    const job = await JobRecordModel.create({
      userId: new Types.ObjectId(),
      type: "resume.analysis",
      payload: {},
      status: "processing",
      phase: "preparing",
      attempts: 1,
      executionId: randomUUID(),
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

  it("treats invalid durable job input as non-retryable", async () => {
    const job = await JobRecordModel.create({
      userId: new Types.ObjectId(),
      type: "resume.analysis",
      payload: {},
      status: "processing",
      phase: "preparing",
      attempts: 1,
      executionId: randomUUID(),
      maxAttempts: 3,
      lockedBy: "vitest-worker",
      lockedAt: new Date(),
      lockExpiresAt: new Date(Date.now() + 60_000),
    });

    const invalidInput = z.object({ resumeId: z.string().uuid() }).safeParse({});
    if (invalidInput.success) throw new Error("Expected invalid test input.");
    await failOrRetryJob(job, invalidInput.error);

    await expect(JobRecordModel.findById(job._id).lean()).resolves.toMatchObject({
      status: "failed",
      attempts: 1,
      maxAttempts: 3,
      error: {
        code: "INVALID_APPLICATION_INPUT",
        classification: "NON_RETRYABLE_REQUEST",
        retryable: false,
      },
    });
  });

  it("keeps transient errors eligible for the existing worker retry bound", async () => {
    const job = await JobRecordModel.create({
      userId: new Types.ObjectId(),
      type: "resume.analysis",
      payload: {},
      status: "processing",
      phase: "preparing",
      attempts: 1,
      executionId: randomUUID(),
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

  it("does not retry semantic application failures without positive transient evidence", async () => {
    const job = await JobRecordModel.create({
      userId: new Types.ObjectId(),
      type: "resume.analysis",
      payload: {},
      status: "processing",
      phase: "preparing",
      attempts: 1,
      executionId: randomUUID(),
      maxAttempts: 3,
      lockedBy: "vitest-worker",
      lockedAt: new Date(),
      lockExpiresAt: new Date(Date.now() + 60_000),
    });

    await failOrRetryJob(
      job,
      new AppError(502, "AI_UNKNOWN_BULLET_ID", "Synthetic semantic failure."),
    );

    await expect(JobRecordModel.findById(job._id).lean()).resolves.toMatchObject({
      status: "failed",
      attempts: 1,
      error: { code: "AI_UNKNOWN_BULLET_ID", retryable: false },
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
    const fetchMock = mockGemini({
      scoreBreakdown: { keywordMatch: 10, clarity: 10, evidence: 10, formatting: 10 },
      issues: [], strengths: [], missingKeywords: [], suggestions: [],
    });
    const job = await routedJob(userId, "resume.analyze");

    const execution = executionLifecycle();
    const analysis = await analyzeResume({
      userId,
      resumeId: created.resume._id.toString(),
      targetRole: "Synthetic Engineer",
      jobId: job._id.toString(),
      execution,
    });

    expect(analysis.totalScore).toBe(40);
    expect(execution.reportPhase).toHaveBeenCalledWith("validating");
    expect(execution.beginPersistence).toHaveBeenCalledTimes(1);
    expect(execution.assertActive).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).not.toMatch(/openrouter|[?&]key=/i);
    await expect(ResumeAnalysisModel.countDocuments({ userId })).resolves.toBe(1);
  });

  it("sends the explicitly selected current saved version with Experience and Education to assessment", async () => {
    const userId = new Types.ObjectId().toString();
    const created = await createResume({
      userId,
      title: "Synthetic assessment source",
      content: {
        basics: { fullName: "Earlier Saved Candidate", links: [] },
        experience: [
          {
            employer: "Example Systems",
            jobTitle: "Engineer",
            isCurrent: true,
            bullets: [{ text: "Built the current saved service." }],
          },
        ],
        education: [
          {
            institution: "Example University",
            qualification: "BSc",
            isCurrent: false,
            details: [{ text: "Completed the current saved project." }],
          },
        ],
        skills: [],
        projects: [],
        certifications: [],
        languages: [],
        interests: [],
      },
    });
    const currentContent = JSON.parse(
      JSON.stringify(created.version.content),
    ) as Record<string, unknown> & {
      basics: Record<string, unknown>;
    };
    currentContent.basics.fullName = "Current Saved Candidate";
    const current = await createResumeVersion({
      userId,
      resumeId: created.resume._id.toString(),
      expectedCurrentVersionId: created.version._id.toString(),
      content: currentContent,
    });
    const fetchMock = mockGemini({
      scoreBreakdown: {
        keywordMatch: 10,
        clarity: 10,
        evidence: 10,
        formatting: 10,
      },
      issues: [],
      strengths: [],
      missingKeywords: [],
      suggestions: [],
    });
    const job = await routedJob(userId, "resume.analyze");

    const analysis = await analyzeResume({
      userId,
      resumeId: created.resume._id.toString(),
      versionId: current.version._id.toString(),
      targetRole: "Synthetic Engineer",
      jobId: job._id.toString(),
    });

    const providerCall = fetchMock.mock.calls[0] as unknown as [
      RequestInfo | URL,
      RequestInit,
    ];
    const providerBody = JSON.parse(String(providerCall[1].body)) as {
      contents: Array<{ parts: Array<{ text: string }> }>;
    };
    const providerPrompt = providerBody.contents[0]?.parts[0]?.text ?? "";
    expect(analysis.resumeVersionId.toString()).toBe(
      current.version._id.toString(),
    );
    expect(providerPrompt).toContain("Current Saved Candidate");
    expect(providerPrompt).not.toContain("Earlier Saved Candidate");
    expect(providerPrompt).toContain("Example Systems");
    expect(providerPrompt).toContain("Built the current saved service.");
    expect(providerPrompt).toContain("Example University");
    expect(providerPrompt).toContain("Completed the current saved project.");
  });

  it("keeps rewrite targeting IDs internal while replacing their visible provider echoes with Resume context", async () => {
    const userId = new Types.ObjectId().toString();
    const projectId = randomUUID();
    const projectBulletId = randomUUID();
    const linkId = randomUUID();
    const unrelatedUuid = randomUUID();
    const created = await createResume({
      userId,
      title: "Synthetic identifier-safety Resume",
      content: {
        basics: {
          fullName: "Synthetic Candidate",
          links: [
            {
              id: linkId,
              label: "Portfolio",
              url: "https://example.test/portfolio",
            },
          ],
        },
        experience: [],
        education: [],
        skills: [],
        projects: [
          {
            id: projectId,
            name: "StudyShare",
            technologies: ["React"],
            links: [],
            bullets: [
              {
                id: projectBulletId,
                text: "Built a project dashboard.",
              },
            ],
          },
        ],
        certifications: [],
        languages: [],
        interests: [],
      },
    });
    const fetchMock = mockGemini({
      scoreBreakdown: {
        keywordMatch: 10,
        clarity: 10,
        evidence: 10,
        formatting: 10,
      },
      issues: [
        {
          code: "UNFILLED_PLACEHOLDER",
          severity: "medium",
          message: `Bullet ${projectBulletId} contains an unfilled [X] placeholder.`,
        },
        {
          code: "GENERIC_LINK_REVIEW",
          severity: "low",
          message: `Link ${linkId} needs review; factual reference ${unrelatedUuid} must remain.`,
        },
      ],
      strengths: [
        {
          title: `Clear project ${projectId}`,
          detail: `Bullet ${projectBulletId} has a concise action.`,
        },
      ],
      missingKeywords: [],
      suggestions: [
        {
          bulletId: projectBulletId,
          rewrittenText: "Built a clearer project dashboard.",
          rationale: `Bullet ${projectBulletId} can be clearer.`,
          verificationRequired: true,
        },
      ],
    });
    const job = await routedJob(userId, "resume.analyze");

    const analysis = await analyzeResume({
      userId,
      resumeId: created.resume._id.toString(),
      versionId: created.version._id.toString(),
      targetRole: "Synthetic Engineer",
      jobId: job._id.toString(),
    });

    const providerCall = fetchMock.mock.calls[0] as unknown as [
      RequestInfo | URL,
      RequestInit,
    ];
    const providerBody = JSON.parse(String(providerCall[1].body)) as {
      contents: Array<{ parts: Array<{ text: string }> }>;
    };
    expect(providerBody.contents[0]?.parts[0]?.text).toContain(projectBulletId);
    expect(analysis.suggestions[0]?.bulletId).toBe(projectBulletId);
    expect(analysis.issues[0]?.message).toBe(
      "StudyShare — bullet 1 contains an unfilled [X] placeholder.",
    );
    expect(analysis.issues[1]?.message).toBe(
      `Portfolio — link 1 needs review; factual reference ${unrelatedUuid} must remain.`,
    );
    expect(analysis.strengths[0]).toMatchObject({
      title: "Clear project StudyShare — project 1",
      detail: "StudyShare — bullet 1 has a concise action.",
    });
    expect(analysis.suggestions[0]?.rationale).toBe(
      "StudyShare — bullet 1 can be clearer.",
    );
    const visibleGuidance = JSON.stringify({
      issues: analysis.issues,
      strengths: analysis.strengths,
      rationale: analysis.suggestions.map((suggestion) => suggestion.rationale),
    });
    expect(visibleGuidance).not.toContain(projectId);
    expect(visibleGuidance).not.toContain(projectBulletId);
    expect(visibleGuidance).not.toContain(linkId);
    expect(visibleGuidance).toContain(unrelatedUuid);

    const applied = await applyAnalysisSuggestions({
      userId,
      resumeId: created.resume._id.toString(),
      analysisId: analysis._id.toString(),
      suggestionIds: [analysis.suggestions[0]!.id],
    });
    expect(applied.version.content.projects[0]?.bullets[0]).toMatchObject({
      id: projectBulletId,
      text: "Built a clearer project dashboard.",
    });
  });

  it("does not persist a Resume result when cancellation wins before persistence", async () => {
    const userId = new Types.ObjectId().toString();
    const created = await createResume({
      userId,
      title: "Synthetic cancelled analysis",
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
    const job = await routedJob(userId, "resume.analyze");
    const execution = executionLifecycle();
    execution.beginPersistence.mockRejectedValueOnce(
      new AppError(409, "JOB_EXECUTION_FENCE_LOST", "Synthetic cancellation."),
    );

    await expect(analyzeResume({
      userId,
      resumeId: created.resume._id.toString(),
      targetRole: "Synthetic Engineer",
      jobId: job._id.toString(),
      execution,
    })).rejects.toMatchObject({ code: "JOB_EXECUTION_FENCE_LOST" });
    await expect(ResumeAnalysisModel.countDocuments({ userId })).resolves.toBe(0);
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
    const job = await routedJob(userId, "resume.analyze");

    await expect(
      analyzeResume({
        userId,
        resumeId: created.resume._id.toString(),
        targetRole: "Synthetic Engineer",
        jobId: job._id.toString(),
      }),
    ).rejects.toMatchObject({ code: "AI_UNKNOWN_BULLET_ID" });
    await expect(ResumeAnalysisModel.countDocuments({ userId })).resolves.toBe(0);
  });

  it("persists a schema-valid typed Interview provider response", async () => {
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
    const fetchMock = mockGemini({
      questions: [{
        questionType: "technical-explanation",
        category: "Technical",
        difficulty: "easy",
        question: "How would you test a small function?",
        modelAnswer: "Describe inputs, outputs, edge cases, and assertions.",
      }],
    });
    const job = await routedJob(userId.toString(), "interview.questions.generate");

    const execution = executionLifecycle();
    const result = await generateInterviewQuestions({
      userId: userId.toString(),
      sessionId: session._id.toString(),
      count: 1,
      categories: ["Technical"],
      difficultyMix: { easy: 1, medium: 0, hard: 0 },
      questionTypes: ["technical-explanation"],
      typeCounts: {
        "technical-explanation": 1,
      },
      jobId: job._id.toString(),
      execution,
    });

    expect(result.insertedCount).toBe(1);
    expect(execution.beginPersistence).toHaveBeenCalledTimes(1);
    expect(execution.assertActive).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).not.toMatch(/openrouter|[?&]key=/i);

    await expect(
      InterviewQuestionModel.findOne({ userId }).lean(),
    ).resolves.toMatchObject({
      questionType: "technical-explanation",
    });
  });

  it("rejects Interview provider question-type drift before persistence", async () => {
    const userId = new Types.ObjectId();
    const session = await InterviewSessionModel.create({
      userId,
      title: "Synthetic type-drift interview",
      targetRole: "Synthetic Engineer",
      experienceLevel: "Junior",
      focusTopics: [],
      skillGaps: [],
      mode: "study",
    });

    mockGemini({
      questions: [
        {
          questionType: "behavioral",
          category: "Behavioral",
          difficulty: "medium",
          question:
            "Describe how you handled a disagreement.",
          modelAnswer:
            "Use a truthful situation-action-result structure.",
        },
        {
          questionType: "behavioral",
          category: "Behavioral",
          difficulty: "medium",
          question:
            "Describe how you handled an unexpected deadline.",
          modelAnswer:
            "Use a truthful situation-action-result structure.",
        },
      ],
    });

    const job = await routedJob(
      userId.toString(),
      "interview.questions.generate",
    );

    await expect(
      generateInterviewQuestions({
        userId: userId.toString(),
        sessionId: session._id.toString(),
        count: 2,
        categories: [],
        questionTypes: [
          "behavioral",
          "coding",
        ],
        typeCounts: {
          behavioral: 1,
          coding: 1,
        },
        jobId: job._id.toString(),
        execution: executionLifecycle(),
      }),
    ).rejects.toMatchObject({
      code:
        "AI_INTERVIEW_QUESTION_TYPE_MISMATCH",
    });

    await expect(
      InterviewQuestionModel.countDocuments({
        userId,
      }),
    ).resolves.toBe(0);
  });

  it("persists canonical MCQ options, mixed typed output, and same-job retry idempotency", async () => {
    const userId = new Types.ObjectId();
    const session = await InterviewSessionModel.create({
      userId,
      title: "Synthetic mixed typed interview",
      targetRole: "Synthetic Engineer",
      experienceLevel: "Junior",
      focusTopics: [],
      skillGaps: [],
      mode: "study",
    });

    const fetchMock = mockGemini({
      questions: [
        {
          questionType: "multiple-choice",
          category: "JavaScript",
          difficulty: "medium",
          question:
            "Which statement about const is correct?",
          options: [
            "A const binding cannot be reassigned.",
            "A const object can never be mutated.",
          ],
          correctOptionIndex: 0,
          modelAnswer:
            "The first option is correct.",
        },
        {
          questionType: "coding",
          category: "JavaScript",
          difficulty: "medium",
          question:
            "Write a function that reverses an array.",
          modelAnswer:
            "Show a small implementation and discuss complexity.",
        },
      ],
    });

    const job = await routedJob(
      userId.toString(),
      "interview.questions.generate",
    );

    const input = {
      userId: userId.toString(),
      sessionId: session._id.toString(),
      count: 2,
      categories: ["JavaScript"],
      questionTypes: [
        "multiple-choice",
        "coding",
      ] as const,
      typeCounts: {
        "multiple-choice": 1,
        coding: 1,
      },
      jobId: job._id.toString(),
      execution: executionLifecycle(),
    };

    const first =
      await generateInterviewQuestions(input);

    const second =
      await generateInterviewQuestions(input);

    expect(first.insertedCount).toBe(2);
    expect(second.insertedCount).toBe(2);
    expect(second.questionIds).toEqual(
      first.questionIds,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const questions =
      await InterviewQuestionModel.find({
        userId,
      })
        .sort({ createdAt: 1, _id: 1 })
        .lean();

    expect(
      questions.map(
        (question) => question.questionType,
      ),
    ).toEqual(
      expect.arrayContaining([
        "multiple-choice",
        "coding",
      ]),
    );

    const mcq = questions.find(
      (question) =>
        question.questionType ===
        "multiple-choice",
    );

    expect(mcq?.multipleChoice?.options).toHaveLength(
      2,
    );

    for (const option of
      mcq?.multipleChoice?.options ?? []) {
      expect(option.id).toMatch(
        /^[0-9a-f-]{36}$/i,
      );
    }

    expect(
      mcq?.multipleChoice?.correctOptionId,
    ).toBe(
      mcq?.multipleChoice?.options[0]?.id,
    );
  });

  it("preserves duplicate fingerprint behavior for typed generated questions", async () => {
    const userId = new Types.ObjectId();
    const session = await InterviewSessionModel.create({
      userId,
      title: "Synthetic duplicate typed interview",
      targetRole: "Synthetic Engineer",
      experienceLevel: "Junior",
      focusTopics: [],
      skillGaps: [],
      mode: "study",
    });

    mockGemini({
      questions: [
        {
          questionType: "behavioral",
          category: "Behavioral",
          difficulty: "medium",
          question:
            "Describe a time you improved a process.",
          modelAnswer:
            "Use a truthful structured example.",
        },
        {
          questionType: "behavioral",
          category: "Behavioral",
          difficulty: "medium",
          question:
            "Describe a time you improved a process.",
          modelAnswer:
            "Use a truthful structured example.",
        },
      ],
    });

    const job = await routedJob(
      userId.toString(),
      "interview.questions.generate",
    );

    const result =
      await generateInterviewQuestions({
        userId: userId.toString(),
        sessionId: session._id.toString(),
        count: 2,
        categories: ["Behavioral"],
        questionTypes: ["behavioral"],
        typeCounts: {
          behavioral: 2,
        },
        jobId: job._id.toString(),
        execution: executionLifecycle(),
      });

    expect(result).toMatchObject({
      insertedCount: 1,
      duplicateCount: 0,
    });

    await expect(
      InterviewQuestionModel.countDocuments({
        userId,
      }),
    ).resolves.toBe(1);
  });

  it("keeps typed Interview persistence behind the execution fence", async () => {
    const userId = new Types.ObjectId();
    const session = await InterviewSessionModel.create({
      userId,
      title: "Synthetic fenced typed interview",
      targetRole: "Synthetic Engineer",
      experienceLevel: "Junior",
      focusTopics: [],
      skillGaps: [],
      mode: "study",
    });

    mockGemini({
      questions: [
        {
          questionType:
            "technical-explanation",
          category: "Technical",
          difficulty: "medium",
          question:
            "Explain optimistic concurrency.",
          modelAnswer:
            "Explain version checking and conflicting writes.",
        },
      ],
    });

    const job = await routedJob(
      userId.toString(),
      "interview.questions.generate",
    );

    const execution = executionLifecycle();

    execution.beginPersistence =
      vi.fn().mockRejectedValue(
        new AppError(
          409,
          "JOB_EXECUTION_FENCE_LOST",
          "Synthetic execution fence lost.",
          undefined,
          false,
        ),
      );

    await expect(
      generateInterviewQuestions({
        userId: userId.toString(),
        sessionId: session._id.toString(),
        count: 1,
        categories: ["Technical"],
        questionTypes: [
          "technical-explanation",
        ],
        typeCounts: {
          "technical-explanation": 1,
        },
        jobId: job._id.toString(),
        execution,
      }),
    ).rejects.toMatchObject({
      code: "JOB_EXECUTION_FENCE_LOST",
    });

    await expect(
      InterviewQuestionModel.countDocuments({
        userId,
      }),
    ).resolves.toBe(0);
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
    await connectApplicationManagedGemini(userId.toString());
    const job = await enqueueJob({
      userId: userId.toString(),
      type: "learning.flashcards.generate",
      payload: {},
    });
    const set = await FlashcardSetModel.create({
      userId,
      documentId: document._id,
      requestId: randomUUID(),
      title: "Synthetic cards",
      status: "generating",
      generationJobId: job._id,
    });
    const fetchMock = mockGemini({
      cards: [{
        cardIndex: 0,
        front: "What does synthetic testing verify?",
        back: "Expected behavior.",
        sourceChunkIndexes: [0],
      }],
    });

    const execution = executionLifecycle();
    const result = await generateFlashcards({
      userId: userId.toString(),
      documentId: document._id.toString(),
      setId: set._id.toString(),
      count: 1,
      jobId: job._id.toString(),
      execution,
    });

    expect(result.cardCount).toBe(1);
    expect(execution.beginPersistence).toHaveBeenCalledTimes(1);
    expect(execution.assertActive).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).not.toMatch(/openrouter|[?&]key=/i);
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

  it("links a new Retry job to the Learning resource instead of reviving the terminal job", async () => {
    const userId = new Types.ObjectId();
    const document = await LearningDocumentModel.create({
      userId,
      assetId: new Types.ObjectId(),
      title: "Synthetic retry document",
      originalFilename: "synthetic.pdf",
      mimeType: "application/pdf",
      status: "ready",
    });
    const setId = new Types.ObjectId().toString();
    const source = await JobRecordModel.create({
      userId,
      type: "learning.flashcards.generate",
      payload: {
        userId: userId.toString(),
        documentId: document._id.toString(),
        setId,
        count: 1,
      },
      status: "cancelled",
      phase: "cancelled",
    });
    await FlashcardSetModel.create({
      _id: setId,
      userId,
      documentId: document._id,
      requestId: randomUUID(),
      title: "Synthetic retry cards",
      status: "failed",
      generationJobId: source._id,
    });

    await connectApplicationManagedGemini(userId.toString());

    const retry = await retryOwnedJob(userId.toString(), source._id.toString());

    expect(retry._id.toString()).not.toBe(source._id.toString());
    await expect(FlashcardSetModel.findById(setId).lean()).resolves.toMatchObject({
      status: "generating",
      generationJobId: retry._id,
    });
    await expect(JobRecordModel.findById(source._id).lean()).resolves.toMatchObject({
      status: "cancelled",
    });
  });

  it("deduplicates concurrent Retry creation for one owned terminal job", async () => {
    const userId = new Types.ObjectId();
    const source = await JobRecordModel.create({
      userId,
      type: "resume.analyze",
      payload: {
        userId: userId.toString(),
        resumeId: new Types.ObjectId().toString(),
        targetRole: "Synthetic Engineer",
      },
      status: "failed",
      phase: "failed",
      error: {
        code: "AI_PROVIDER_UNAVAILABLE",
        message: "The provider is temporarily unavailable.",
        retryable: true,
      },
    });
    await connectApplicationManagedGemini(userId.toString());

    const [first, second] = await Promise.all([
      retryOwnedJob(userId.toString(), source._id.toString()),
      retryOwnedJob(userId.toString(), source._id.toString()),
    ]);

    expect(second._id.toString()).toBe(first._id.toString());
    await expect(JobRecordModel.countDocuments({
      retryOfJobId: source._id,
    })).resolves.toBe(1);
  });
});

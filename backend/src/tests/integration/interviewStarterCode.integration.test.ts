import { Types } from "mongoose";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "../../app.js";
import { env } from "../../config/env.js";
import { enqueueJob } from "../../jobs/job.queue.js";
import {
  activateProvider,
  ensureAiFoundation,
} from "../../modules/ai/aiProvider.service.js";
import { generateInterviewQuestions } from "../../modules/interviews/interviewAi.service.js";
import { InterviewQuestionModel } from "../../modules/interviews/interviewQuestion.model.js";
import { generatedQuestionSetSchema } from "../../modules/interviews/interview.schemas.js";
import { serializeQuestionDetail } from "../../modules/interviews/interview.service.js";
import { InterviewSessionModel } from "../../modules/interviews/interviewSession.model.js";
import { registerTestUser } from "../helpers/auth.js";

const originalFoundation = env.AI_ROUTING_FOUNDATION_ENABLED;
const originalAdminCompatibility =
  env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED;

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

function mockGemini(value: unknown) {
  const fetchMock = vi.fn().mockImplementation(async () =>
    new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text: JSON.stringify(value) }],
            },
          },
        ],
        usageMetadata: {
          promptTokenCount: 7,
          candidatesTokenCount: 5,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
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

afterEach(() => {
  env.AI_ROUTING_FOUNDATION_ENABLED = originalFoundation;
  env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED =
    originalAdminCompatibility;
  vi.unstubAllGlobals();
});

describe("Interview Coding starter code", () => {
  it("persists generated Coding starter code through the existing Gemini transaction", async () => {
    const userId = new Types.ObjectId();
    const session = await InterviewSessionModel.create({
      userId,
      title: "Coding starter generation",
      targetRole: "Backend Engineer",
      experienceLevel: "Junior",
      focusTopics: ["Node.js"],
      skillGaps: ["Validation"],
      mode: "study",
    });
    const starterCode = [
      "export function validatePage(value: unknown) {",
      "  // TODO: return a validated page number",
      "}",
    ].join("\n");
    const fetchMock = mockGemini({
      questions: [
        {
          questionType: "coding",
          category: "Node.js",
          difficulty: "easy",
          question:
            "Write a function that validates a positive page number.",
          starterCode,
          modelAnswer:
            "Validate the input type, integer constraint, and positive range.",
        },
      ],
    });

    await connectApplicationManagedGemini(userId.toString());
    const job = await enqueueJob({
      userId: userId.toString(),
      type: "interview.questions.generate",
      payload: {},
    });
    const execution = executionLifecycle();

    const result = await generateInterviewQuestions({
      userId: userId.toString(),
      sessionId: session._id.toString(),
      count: 1,
      categories: ["Node.js"],
      difficultyMix: { easy: 1, medium: 0, hard: 0 },
      questionTypes: ["coding"],
      typeCounts: { coding: 1 },
      jobId: job._id.toString(),
      execution,
    });

    expect(result.insertedCount).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(execution.beginPersistence).toHaveBeenCalledTimes(1);

    const stored = await InterviewQuestionModel.findOne({
      userId,
      sessionId: session._id,
    });
    expect(stored).not.toBeNull();
    expect(stored?.questionType).toBe("coding");
    expect(stored?.starterCode).toBe(starterCode);

    const detail = serializeQuestionDetail(stored!, false);
    expect(detail.starterCode).toBe(starterCode);
  });

  it("requires starter code for generated Coding output and rejects it on non-Coding output", () => {
    const missingStarter = generatedQuestionSetSchema.safeParse({
      questions: [
        {
          questionType: "coding",
          category: "Node.js",
          difficulty: "easy",
          question: "Write a small validation function.",
          modelAnswer: "Validate the input before returning a value.",
        },
      ],
    });
    expect(missingStarter.success).toBe(false);

    const nonCodingStarter = generatedQuestionSetSchema.safeParse({
      questions: [
        {
          questionType: "short-answer",
          category: "Node.js",
          difficulty: "easy",
          question: "What is event-loop starvation?",
          starterCode: "// This field must not be accepted here.",
          modelAnswer: "Explain how long synchronous work delays queued tasks.",
        },
      ],
    });
    expect(nonCodingStarter.success).toBe(false);
  });

  it("accepts optional manual Coding starter code, keeps it out of summaries, and rejects it for non-Coding input", async () => {
    const owner = await registerTestUser(app, {
      email: "interview-starter-code-owner@example.com",
      displayName: "Interview Starter Code Owner",
    });
    const authorization = `Bearer ${owner.accessToken}`;
    const createdSession = await request(app)
      .post("/api/v1/interview-sessions")
      .set("Authorization", authorization)
      .send({
        title: "Manual Coding starter code",
        targetRole: "Backend Engineer",
        experienceLevel: "Junior",
        focusTopics: ["Node.js"],
        skillGaps: [],
        mode: "written-practice",
        manualQuestions: [],
      })
      .expect(201);
    const sessionId = createdSession.body.data.session._id as string;
    const starterCode = [
      "function normalizeTags(tags) {",
      "  // TODO",
      "}",
    ].join("\n");

    const created = await request(app)
      .post(`/api/v1/interview-sessions/${sessionId}/questions`)
      .set("Authorization", authorization)
      .send({
        questionType: "coding",
        category: "JavaScript",
        difficulty: "medium",
        question: "Normalize a list of user-provided tags.",
        starterCode,
        modelAnswer: "Trim values, remove blanks, and deduplicate them.",
      })
      .expect(201);

    const questionId = created.body.data.question._id as string;
    expect(created.body.data.question).toMatchObject({
      questionType: "coding",
      starterCode,
    });

    const list = await request(app)
      .get(`/api/v1/interview-sessions/${sessionId}/questions`)
      .set("Authorization", authorization)
      .expect(200);
    expect(list.body.data.questions[0]).not.toHaveProperty("starterCode");

    const detail = await request(app)
      .get(
        `/api/v1/interview-sessions/${sessionId}/questions/${questionId}`,
      )
      .set("Authorization", authorization)
      .expect(200);
    expect(detail.body.data.question.starterCode).toBe(starterCode);

    await request(app)
      .post(`/api/v1/interview-sessions/${sessionId}/questions`)
      .set("Authorization", authorization)
      .send({
        questionType: "short-answer",
        category: "JavaScript",
        difficulty: "easy",
        question: "What is closure scope in JavaScript?",
        starterCode: "const hidden = true;",
      })
      .expect(400);
  });

  it("keeps historical Coding questions without starter code compatible", async () => {
    const question = await InterviewQuestionModel.create({
      userId: new Types.ObjectId(),
      sessionId: new Types.ObjectId(),
      source: "manual",
      category: "JavaScript",
      difficulty: "medium",
      question: "Write a function that removes duplicate strings.",
      questionFingerprint: "f".repeat(64),
      questionType: "coding",
      modelAnswer: "Use a Set while preserving the required ordering.",
    });

    const detail = serializeQuestionDetail(question, true);
    expect(detail.questionType).toBe("coding");
    expect(detail).not.toHaveProperty("starterCode");
  });

  it("does not weaken Multiple Choice answer-key secrecy", async () => {
    const owner = await registerTestUser(app, {
      email: "interview-starter-code-mcq-owner@example.com",
      displayName: "Interview Starter Code MCQ Owner",
    });
    const authorization = `Bearer ${owner.accessToken}`;
    const createdSession = await request(app)
      .post("/api/v1/interview-sessions")
      .set("Authorization", authorization)
      .send({
        title: "Starter code MCQ secrecy",
        targetRole: "Backend Engineer",
        experienceLevel: "Junior",
        focusTopics: [],
        skillGaps: [],
        mode: "study",
        manualQuestions: [
          {
            questionType: "multiple-choice",
            category: "Databases",
            difficulty: "easy",
            question: "Which index can support a prefix query?",
            multipleChoice: {
              options: ["A suitable compound index", "No index can help"],
              correctOptionIndex: 0,
            },
          },
        ],
      })
      .expect(201);
    const sessionId = createdSession.body.data.session._id as string;
    const questionId = createdSession.body.data.questions[0]._id as string;

    const detail = await request(app)
      .get(
        `/api/v1/interview-sessions/${sessionId}/questions/${questionId}`,
      )
      .set("Authorization", authorization)
      .expect(200);

    expect(detail.body.data.question).not.toHaveProperty(
      "multipleChoice.correctOptionId",
    );
    expect(detail.body.data.question).not.toHaveProperty("starterCode");
  });
});

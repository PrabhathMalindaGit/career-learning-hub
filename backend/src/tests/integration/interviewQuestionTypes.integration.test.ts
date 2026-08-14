import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { app } from "../../app.js";
import { env } from "../../config/env.js";
import { JobRecordModel } from "../../jobs/job.model.js";
import {
  activateProvider,
  ensureAiFoundation,
} from "../../modules/ai/aiProvider.service.js";
import { InterviewAttemptModel } from "../../modules/interviews/interviewAttempt.model.js";
import { InterviewQuestionModel } from "../../modules/interviews/interviewQuestion.model.js";
import { interviewQuestionTypes } from "../../modules/interviews/interviewQuestion.types.js";
import { registerTestUser } from "../helpers/auth.js";

const originalFoundation =
  env.AI_ROUTING_FOUNDATION_ENABLED;
const originalAdminCompatibility =
  env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED;

async function connectApplicationManagedGemini(
  userId: string,
): Promise<void> {
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

afterEach(() => {
  env.AI_ROUTING_FOUNDATION_ENABLED =
    originalFoundation;
  env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED =
    originalAdminCompatibility;
});

describe("Interview question typed storage compatibility", () => {
  it("persists a modern Multiple Choice question without nested ObjectIds", async () => {
    const created = await InterviewQuestionModel.create({
      userId: new Types.ObjectId(),
      sessionId: new Types.ObjectId(),
      source: "manual",
      category: "JavaScript",
      difficulty: "medium",
      question: "Which statement about const is correct?",
      questionFingerprint: "a".repeat(64),
      questionType: "multiple-choice",
      multipleChoice: {
        options: [
          {
            id: "option-1",
            text: "A const binding cannot be reassigned.",
          },
          {
            id: "option-2",
            text: "A const object can never be mutated.",
          },
        ],
        correctOptionId: "option-1",
      },
    });

    const stored = (await InterviewQuestionModel.findById(
      created._id,
    ).lean()) as unknown as Record<string, unknown> | null;

    expect(stored).not.toBeNull();
    expect(stored?.questionType).toBe("multiple-choice");

    expect(stored?.multipleChoice).toEqual({
      options: [
        {
          id: "option-1",
          text: "A const binding cannot be reassigned.",
        },
        {
          id: "option-2",
          text: "A const object can never be mutated.",
        },
      ],
      correctOptionId: "option-1",
    });
  });

  it("persists a modern typed attempt without legacy answerText", async () => {
    const created = await InterviewAttemptModel.create({
      userId: new Types.ObjectId(),
      sessionId: new Types.ObjectId(),
      questionId: new Types.ObjectId(),
      answer: {
        type: "multiple-choice",
        selectedOptionId: "option-1",
      },
      evaluation: {
        kind: "multiple-choice",
        score: 100,
        correct: true,
      },
      status: "recorded",
    });

    const stored = (await InterviewAttemptModel.findById(
      created._id,
    ).lean()) as unknown as Record<string, unknown> | null;

    expect(stored).not.toBeNull();
    expect(stored?.answerText).toBeUndefined();

    expect(stored?.answer).toEqual({
      type: "multiple-choice",
      selectedOptionId: "option-1",
    });

    expect(stored?.evaluation).toEqual({
      kind: "multiple-choice",
      score: 100,
      correct: true,
    });
  });

  it("hydrates historical question and answerText-only attempt without migration writes", async () => {
    const userId = new Types.ObjectId();
    const sessionId = new Types.ObjectId();
    const questionId = new Types.ObjectId();
    const attemptId = new Types.ObjectId();
    const now = new Date();

    await InterviewQuestionModel.collection.insertOne({
      _id: questionId,
      userId,
      sessionId,
      source: "manual",
      category: "Behavioral",
      difficulty: "medium",
      question: "Tell me about a difficult project.",
      questionFingerprint: "b".repeat(64),
      explanationKeyPoints: [],
      isPinned: false,
      createdAt: now,
      updatedAt: now,
    });

    await InterviewAttemptModel.collection.insertOne({
      _id: attemptId,
      userId,
      sessionId,
      questionId,
      answerText: "I described the situation, action, and result.",
      status: "recorded",
      createdAt: now,
      updatedAt: now,
    });

    const questionBefore =
      await InterviewQuestionModel.collection.findOne({
        _id: questionId,
      });
    const attemptBefore =
      await InterviewAttemptModel.collection.findOne({
        _id: attemptId,
      });

    const historicalQuestion =
      await InterviewQuestionModel.findById(questionId);
    const historicalAttempt =
      await InterviewAttemptModel.findById(attemptId);

    expect(historicalQuestion).not.toBeNull();
    expect(historicalQuestion?.questionType).toBeUndefined();
    expect(historicalQuestion?.multipleChoice).toBeUndefined();

    expect(historicalAttempt).not.toBeNull();
    expect(historicalAttempt?.answerText).toBe(
      "I described the situation, action, and result.",
    );
    expect(historicalAttempt?.answer).toBeUndefined();
    expect(historicalAttempt?.evaluation).toBeUndefined();

    const questionAfter =
      await InterviewQuestionModel.collection.findOne({
        _id: questionId,
      });
    const attemptAfter =
      await InterviewAttemptModel.collection.findOne({
        _id: attemptId,
      });

    expect(questionAfter).toEqual(questionBefore);
    expect(attemptAfter).toEqual(attemptBefore);

    expect(questionAfter).not.toHaveProperty("questionType");
    expect(questionAfter).not.toHaveProperty("multipleChoice");
    expect(attemptAfter).not.toHaveProperty("answer");
    expect(attemptAfter).not.toHaveProperty("evaluation");
  });
});


describe("Interview question public serialization", () => {
  it("serializes historical questions as legacy-open-response in list and detail responses", async () => {
    const owner = await registerTestUser(app, {
      email: "interview-legacy-question-owner@example.com",
      displayName: "Interview Legacy Question Owner",
    });

    const createdSession = await request(app)
      .post("/api/v1/interview-sessions")
      .set(
        "Authorization",
        `Bearer ${owner.accessToken}`,
      )
      .send({
        title: "Legacy question compatibility",
        targetRole: "Software Engineer",
        experienceLevel: "Junior",
        focusTopics: [],
        skillGaps: [],
        mode: "study",
        manualQuestions: [],
      })
      .expect(201);

    const sessionId =
      createdSession.body.data.session._id as string;
    const questionId = new Types.ObjectId();
    const now = new Date();

    await InterviewQuestionModel.collection.insertOne({
      _id: questionId,
      userId: new Types.ObjectId(owner.userId),
      sessionId: new Types.ObjectId(sessionId),
      source: "manual",
      category: "Behavioral",
      difficulty: "medium",
      question: "Tell me about a difficult project.",
      questionFingerprint: "c".repeat(64),
      explanationKeyPoints: [],
      isPinned: true,
      userNotes: "Keep the answer concise.",
      createdAt: now,
      updatedAt: now,
    });

    const listResponse = await request(app)
      .get(`/api/v1/interview-sessions/${sessionId}/questions`)
      .set(
        "Authorization",
        `Bearer ${owner.accessToken}`,
      )
      .expect(200);

    expect(listResponse.body.data.questions).toHaveLength(1);

    expect(listResponse.body.data.questions[0]).toMatchObject({
      _id: questionId.toString(),
      category: "Behavioral",
      difficulty: "medium",
      question: "Tell me about a difficult project.",
      isPinned: true,
      userNotes: "Keep the answer concise.",
      questionType: "legacy-open-response",
    });

    const detailResponse = await request(app)
      .get(
        `/api/v1/interview-sessions/${sessionId}/questions/${questionId.toString()}`,
      )
      .set(
        "Authorization",
        `Bearer ${owner.accessToken}`,
      )
      .expect(200);

    expect(detailResponse.body.data.question).toMatchObject({
      _id: questionId.toString(),
      category: "Behavioral",
      difficulty: "medium",
      question: "Tell me about a difficult project.",
      isPinned: true,
      userNotes: "Keep the answer concise.",
      questionType: "legacy-open-response",
    });
  });

  it("serializes initial manual questions returned from session creation", async () => {
    const owner = await registerTestUser(app, {
      email: "interview-created-question-serialization@example.com",
      displayName: "Created Question Serialization",
    });

    const response = await request(app)
      .post("/api/v1/interview-sessions")
      .set(
        "Authorization",
        `Bearer ${owner.accessToken}`,
      )
      .send({
        title: "Created question serialization",
        targetRole: "Software Engineer",
        experienceLevel: "Junior",
        focusTopics: [],
        skillGaps: [],
        mode: "study",
        manualQuestions: [
          {
            questionType: "behavioral",
            category: "Behavioral",
            difficulty: "medium",
            question:
              "Tell me about a project that challenged you.",
            modelAnswer:
              "Use a concise situation-action-result structure.",
          },
        ],
      })
      .expect(201);

    expect(response.body.data.questions).toHaveLength(1);

    const question = response.body.data.questions[0];

    expect(question).toMatchObject({
      category: "Behavioral",
      difficulty: "medium",
      question:
        "Tell me about a project that challenged you.",
      questionType: "behavioral",
    });

    expect(question).not.toHaveProperty(
      "questionFingerprint",
    );
  });

  it("serializes a question returned from manual question creation", async () => {
    const owner = await registerTestUser(app, {
      email: "interview-added-question-serialization@example.com",
      displayName: "Added Question Serialization",
    });

    const createdSession = await request(app)
      .post("/api/v1/interview-sessions")
      .set(
        "Authorization",
        `Bearer ${owner.accessToken}`,
      )
      .send({
        title: "Added question serialization",
        targetRole: "Software Engineer",
        experienceLevel: "Junior",
        focusTopics: [],
        skillGaps: [],
        mode: "written-practice",
        manualQuestions: [],
      })
      .expect(201);

    const sessionId =
      createdSession.body.data.session._id as string;

    const response = await request(app)
      .post(
        `/api/v1/interview-sessions/${sessionId}/questions`,
      )
      .set(
        "Authorization",
        `Bearer ${owner.accessToken}`,
      )
      .send({
        questionType: "technical-explanation",
        category: "Technical",
        difficulty: "medium",
        question:
          "Explain how event-loop scheduling works.",
        modelAnswer:
          "Explain tasks, microtasks, and ordering.",
      })
      .expect(201);

    expect(response.body.data.question).toMatchObject({
      category: "Technical",
      difficulty: "medium",
      question:
        "Explain how event-loop scheduling works.",
      questionType: "technical-explanation",
    });

    expect(
      response.body.data.question,
    ).not.toHaveProperty("questionFingerprint");
  });

});


describe("Interview typed manual creation and generation request", () => {
  it("creates all six modern manual question types and canonicalizes MCQ option IDs", async () => {
    const owner = await registerTestUser(app, {
      email:
        "interview-all-manual-types-owner@example.com",
      displayName:
        "Interview All Manual Types Owner",
    });

    const createdSession = await request(app)
      .post("/api/v1/interview-sessions")
      .set(
        "Authorization",
        `Bearer ${owner.accessToken}`,
      )
      .send({
        title: "All manual question types",
        targetRole: "Software Engineer",
        experienceLevel: "Junior",
        focusTopics: [],
        skillGaps: [],
        mode: "study",
        manualQuestions: [],
      })
      .expect(201);

    const sessionId =
      createdSession.body.data.session._id as string;
    const authorization =
      `Bearer ${owner.accessToken}`;

    const mcqResponse = await request(app)
      .post(
        `/api/v1/interview-sessions/${sessionId}/questions`,
      )
      .set("Authorization", authorization)
      .send({
        questionType: "multiple-choice",
        category: "JavaScript",
        difficulty: "medium",
        question:
          "Which statement about const is correct?",
        multipleChoice: {
          options: [
            "A const binding cannot be reassigned.",
            "A const object can never be mutated.",
          ],
          correctOptionIndex: 0,
        },
      })
      .expect(201);

    expect(
      mcqResponse.body.data.question,
    ).toMatchObject({
      questionType: "multiple-choice",
      multipleChoice: {
        options: [
          {
            text:
              "A const binding cannot be reassigned.",
          },
          {
            text:
              "A const object can never be mutated.",
          },
        ],
      },
    });

    expect(
      mcqResponse.body.data.question,
    ).not.toHaveProperty(
      "multipleChoice.correctOptionId",
    );

    expect(
      mcqResponse.body.data.question,
    ).not.toHaveProperty("modelAnswer");

    const mcqId =
      mcqResponse.body.data.question._id as string;

    const storedMcq =
      await InterviewQuestionModel.findById(
        mcqId,
      ).lean();

    expect(storedMcq?.questionType).toBe(
      "multiple-choice",
    );

    expect(
      storedMcq?.multipleChoice?.options,
    ).toHaveLength(2);

    for (const option of
      storedMcq?.multipleChoice?.options ?? []) {
      expect(option.id).toMatch(
        /^[0-9a-f-]{36}$/i,
      );
    }

    expect(
      storedMcq?.multipleChoice?.correctOptionId,
    ).toBe(
      storedMcq?.multipleChoice?.options[0]?.id,
    );

    for (const [index, questionType] of
      interviewQuestionTypes
        .filter(
          (type) => type !== "multiple-choice",
        )
        .entries()) {
      const response = await request(app)
        .post(
          `/api/v1/interview-sessions/${sessionId}/questions`,
        )
        .set("Authorization", authorization)
        .send({
          questionType,
          category: "General",
          difficulty: "medium",
          question:
            `Practice question ${index + 1} for ${questionType}.`,
          modelAnswer:
            `Model structure for ${questionType}.`,
        })
        .expect(201);

      expect(
        response.body.data.question,
      ).toMatchObject({
        questionType,
        category: "General",
      });

      expect(
        response.body.data.question,
      ).not.toHaveProperty("multipleChoice");
    }
  });

  it("queues a balanced typed generation payload without changing request-id idempotency", async () => {
    const owner = await registerTestUser(app, {
      email:
        "interview-generation-types-owner@example.com",
      displayName:
        "Interview Generation Types Owner",
    });

    const createdSession = await request(app)
      .post("/api/v1/interview-sessions")
      .set(
        "Authorization",
        `Bearer ${owner.accessToken}`,
      )
      .send({
        title: "Typed generation payload",
        targetRole: "Software Engineer",
        experienceLevel: "Junior",
        focusTopics: [],
        skillGaps: [],
        mode: "study",
        manualQuestions: [],
      })
      .expect(201);

    await connectApplicationManagedGemini(
      owner.userId,
    );

    const sessionId =
      createdSession.body.data.session._id as string;
    const requestId = randomUUID();

    const first = await request(app)
      .post(
        `/api/v1/interview-sessions/${sessionId}/questions/generate`,
      )
      .set(
        "Authorization",
        `Bearer ${owner.accessToken}`,
      )
      .send({
        requestId,
        count: 5,
        categories: ["Technical"],
        questionTypes: [
          "behavioral",
          "technical-explanation",
        ],
      })
      .expect(202);

    const repeated = await request(app)
      .post(
        `/api/v1/interview-sessions/${sessionId}/questions/generate`,
      )
      .set(
        "Authorization",
        `Bearer ${owner.accessToken}`,
      )
      .send({
        requestId,
        count: 5,
        categories: ["Technical"],
        questionTypes: [
          "behavioral",
          "technical-explanation",
        ],
      })
      .expect(202);

    expect(
      repeated.body.data.job.id,
    ).toBe(first.body.data.job.id);

    const job = await JobRecordModel.findById(
      first.body.data.job.id,
    ).lean();

    expect(job?.payload).toMatchObject({
      questionTypes: [
        "behavioral",
        "technical-explanation",
      ],
      typeCounts: {
        behavioral: 3,
        "technical-explanation": 2,
      },
    });
  });
});


describe("Interview typed attempt recording and deterministic MCQ evaluation", () => {
  it("keeps legacy answerText compatibility and rejects typed answers for historical questions", async () => {
    const owner = await registerTestUser(app, {
      email: "interview-legacy-attempt-owner@example.com",
      displayName: "Interview Legacy Attempt Owner",
    });

    const createdSession = await request(app)
      .post("/api/v1/interview-sessions")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        title: "Legacy attempt compatibility",
        targetRole: "Software Engineer",
        experienceLevel: "Junior",
        focusTopics: [],
        skillGaps: [],
        mode: "written-practice",
        manualQuestions: [],
      })
      .expect(201);

    const sessionId =
      createdSession.body.data.session._id as string;
    const questionId = new Types.ObjectId();
    const now = new Date();

    await InterviewQuestionModel.collection.insertOne({
      _id: questionId,
      userId: new Types.ObjectId(owner.userId),
      sessionId: new Types.ObjectId(sessionId),
      source: "manual",
      category: "Behavioral",
      difficulty: "medium",
      question: "Tell me about a difficult project.",
      questionFingerprint: "e".repeat(64),
      explanationKeyPoints: [],
      isPinned: false,
      createdAt: now,
      updatedAt: now,
    });

    const accepted = await request(app)
      .post(
        `/api/v1/interview-sessions/${sessionId}/questions/${questionId.toString()}/attempts`,
      )
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        answerText:
          "I explained the situation, action, and result.",
      })
      .expect(201);

    expect(accepted.body.data.attempt).toMatchObject({
      questionId: questionId.toString(),
      answerText:
        "I explained the situation, action, and result.",
      status: "recorded",
    });
    expect(accepted.body.data.attempt).not.toHaveProperty(
      "answer",
    );
    expect(accepted.body.data.attempt).not.toHaveProperty(
      "evaluation",
    );

    const rejected = await request(app)
      .post(
        `/api/v1/interview-sessions/${sessionId}/questions/${questionId.toString()}/attempts`,
      )
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        answer: {
          type: "behavioral",
          text: "A typed answer must not rewrite legacy semantics.",
        },
      })
      .expect(409);

    expect(rejected.body.error).toMatchObject({
      code: "INTERVIEW_ATTEMPT_TYPE_MISMATCH",
    });
  });

  it("accepts only matching typed text answers and keeps them immutable", async () => {
    const owner = await registerTestUser(app, {
      email: "interview-typed-text-attempt-owner@example.com",
      displayName: "Interview Typed Text Attempt Owner",
    });

    const createdSession = await request(app)
      .post("/api/v1/interview-sessions")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        title: "Typed text attempt",
        targetRole: "Software Engineer",
        experienceLevel: "Junior",
        focusTopics: [],
        skillGaps: [],
        mode: "written-practice",
        manualQuestions: [
          {
            questionType: "behavioral",
            category: "Behavioral",
            difficulty: "medium",
            question:
              "Describe a time you resolved a difficult disagreement.",
          },
        ],
      })
      .expect(201);

    const sessionId =
      createdSession.body.data.session._id as string;
    const questionId =
      createdSession.body.data.questions[0]._id as string;
    const authorization =
      `Bearer ${owner.accessToken}`;
    const originalText =
      "I clarified the disagreement, gathered evidence, and aligned the team on a decision.";

    const accepted = await request(app)
      .post(
        `/api/v1/interview-sessions/${sessionId}/questions/${questionId}/attempts`,
      )
      .set("Authorization", authorization)
      .send({
        answer: {
          type: "behavioral",
          text: originalText,
        },
      })
      .expect(201);

    expect(accepted.body.data.attempt).toMatchObject({
      questionId,
      answer: {
        type: "behavioral",
        text: originalText,
      },
      status: "recorded",
    });
    expect(accepted.body.data.attempt).not.toHaveProperty(
      "answerText",
    );
    expect(accepted.body.data.attempt).not.toHaveProperty(
      "evaluation",
    );

    const legacyPayload = await request(app)
      .post(
        `/api/v1/interview-sessions/${sessionId}/questions/${questionId}/attempts`,
      )
      .set("Authorization", authorization)
      .send({ answerText: "Legacy payload." })
      .expect(409);

    expect(legacyPayload.body.error).toMatchObject({
      code: "INTERVIEW_ATTEMPT_TYPE_MISMATCH",
    });

    const wrongType = await request(app)
      .post(
        `/api/v1/interview-sessions/${sessionId}/questions/${questionId}/attempts`,
      )
      .set("Authorization", authorization)
      .send({
        answer: {
          type: "coding",
          text: "const value = 1;",
        },
      })
      .expect(409);

    expect(wrongType.body.error).toMatchObject({
      code: "INTERVIEW_ATTEMPT_TYPE_MISMATCH",
    });

    const attemptId =
      accepted.body.data.attempt._id as string;
    const stored = await InterviewAttemptModel.findById(
      attemptId,
    );

    expect(stored).not.toBeNull();
    stored!.answer = {
      type: "behavioral",
      text: "This replacement must not persist.",
    };
    await stored!.save();

    const reloaded = await InterviewAttemptModel.findById(
      attemptId,
    ).lean();

    expect(reloaded?.answer).toEqual({
      type: "behavioral",
      text: originalText,
    });
  });

  it("scores Multiple Choice deterministically, rejects invalid submissions, and reveals the owned key only through attempt responses", async () => {
    const owner = await registerTestUser(app, {
      email: "interview-mcq-attempt-owner@example.com",
      displayName: "Interview MCQ Attempt Owner",
    });

    const createdSession = await request(app)
      .post("/api/v1/interview-sessions")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        title: "Deterministic MCQ attempt",
        targetRole: "Software Engineer",
        experienceLevel: "Junior",
        focusTopics: [],
        skillGaps: [],
        mode: "written-practice",
        manualQuestions: [
          {
            questionType: "multiple-choice",
            category: "JavaScript",
            difficulty: "medium",
            question:
              "Which statement about const is correct?",
            multipleChoice: {
              options: [
                "A const object can never be mutated.",
                "A const binding cannot be reassigned.",
              ],
              correctOptionIndex: 1,
            },
          },
        ],
      })
      .expect(201);

    const sessionId =
      createdSession.body.data.session._id as string;
    const question = createdSession.body.data.questions[0];
    const questionId = question._id as string;
    const firstOptionId =
      question.multipleChoice.options[0].id as string;
    const correctOptionId =
      question.multipleChoice.options[1].id as string;
    const authorization =
      `Bearer ${owner.accessToken}`;

    const incorrect = await request(app)
      .post(
        `/api/v1/interview-sessions/${sessionId}/questions/${questionId}/attempts`,
      )
      .set("Authorization", authorization)
      .send({
        answer: {
          type: "multiple-choice",
          selectedOptionId: firstOptionId,
        },
      })
      .expect(201);

    expect(incorrect.body.data.attempt).toMatchObject({
      answer: {
        type: "multiple-choice",
        selectedOptionId: firstOptionId,
      },
      evaluation: {
        kind: "multiple-choice",
        score: 0,
        correct: false,
        correctOptionId,
      },
    });

    const correct = await request(app)
      .post(
        `/api/v1/interview-sessions/${sessionId}/questions/${questionId}/attempts`,
      )
      .set("Authorization", authorization)
      .send({
        answer: {
          type: "multiple-choice",
          selectedOptionId: correctOptionId,
        },
      })
      .expect(201);

    expect(correct.body.data.attempt).toMatchObject({
      answer: {
        type: "multiple-choice",
        selectedOptionId: correctOptionId,
      },
      evaluation: {
        kind: "multiple-choice",
        score: 100,
        correct: true,
        correctOptionId,
      },
    });

    const invalidOption = await request(app)
      .post(
        `/api/v1/interview-sessions/${sessionId}/questions/${questionId}/attempts`,
      )
      .set("Authorization", authorization)
      .send({
        answer: {
          type: "multiple-choice",
          selectedOptionId: "not-a-real-option",
        },
      })
      .expect(400);

    expect(invalidOption.body.error).toMatchObject({
      code: "INTERVIEW_MCQ_OPTION_INVALID",
    });

    const textAnswer = await request(app)
      .post(
        `/api/v1/interview-sessions/${sessionId}/questions/${questionId}/attempts`,
      )
      .set("Authorization", authorization)
      .send({
        answer: {
          type: "short-answer",
          text: "This must not be accepted for MCQ.",
        },
      })
      .expect(409);

    expect(textAnswer.body.error).toMatchObject({
      code: "INTERVIEW_ATTEMPT_TYPE_MISMATCH",
    });

    const storedAttempts = await InterviewAttemptModel.find({
      userId: new Types.ObjectId(owner.userId),
      sessionId: new Types.ObjectId(sessionId),
      questionId: new Types.ObjectId(questionId),
    }).lean();

    expect(storedAttempts).toHaveLength(2);
    expect(JSON.stringify(storedAttempts)).not.toContain(
      "correctOptionId",
    );

    const page = await request(app)
      .get(`/api/v1/interview-sessions/${sessionId}/attempts`)
      .set("Authorization", authorization)
      .expect(200);

    expect(page.body.data.attempts).toHaveLength(2);
    for (const attempt of page.body.data.attempts) {
      expect(
        attempt.evaluation.correctOptionId,
      ).toBe(correctOptionId);
    }

    const detail = await request(app)
      .get(
        `/api/v1/interview-sessions/${sessionId}/attempts/${incorrect.body.data.attempt._id}`,
      )
      .set("Authorization", authorization)
      .expect(200);

    expect(detail.body.data.attempt.evaluation).toMatchObject({
      kind: "multiple-choice",
      score: 0,
      correct: false,
      correctOptionId,
    });
  });
});

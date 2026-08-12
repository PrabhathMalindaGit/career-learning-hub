import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "../../app.js";
import { env } from "../../config/env.js";
import { enqueueJob } from "../../jobs/job.queue.js";
import { JobRecordModel } from "../../jobs/job.model.js";
import {
  activateProvider,
  ensureAiFoundation,
} from "../../modules/ai/aiProvider.service.js";
import { createQuestionFingerprint } from "../../modules/interviews/interview.fingerprint.js";
import { InterviewAttemptModel } from "../../modules/interviews/interviewAttempt.model.js";
import {
  generateAttemptFeedback,
  generateQuestionExplanation,
} from "../../modules/interviews/interviewAi.service.js";
import { InterviewQuestionModel } from "../../modules/interviews/interviewQuestion.model.js";
import type {
  EffectiveInterviewQuestionType,
  InterviewQuestionType,
} from "../../modules/interviews/interviewQuestion.types.js";
import { InterviewSessionModel } from "../../modules/interviews/interviewSession.model.js";
import { registerTestUser } from "../helpers/auth.js";

const originalFoundation = env.AI_ROUTING_FOUNDATION_ENABLED;
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

function providerPrompt(fetchMock: ReturnType<typeof mockGemini>): string {
  const call = fetchMock.mock.calls.at(-1) as unknown as
    | [RequestInfo | URL, RequestInit]
    | undefined;
  return String(call?.[1].body ?? "");
}

afterEach(() => {
  env.AI_ROUTING_FOUNDATION_ENABLED = originalFoundation;
  env.AI_ADMIN_GEMINI_COMPATIBILITY_ENABLED =
    originalAdminCompatibility;
  vi.unstubAllGlobals();
});

describe("Interview type-aware feedback and explanation", () => {
  it("uses the required feedback criteria and canonical answer for every text-based type", async () => {
    const owner = await registerTestUser(app, {
      email: "interview-task5-feedback@example.com",
      displayName: "Interview Task 5 Feedback",
    });
    await connectApplicationManagedGemini(owner.userId);

    const userId = new Types.ObjectId(owner.userId);
    const session = await InterviewSessionModel.create({
      userId,
      title: "Type-aware feedback prompts",
      targetRole: "Software Engineer",
      experienceLevel: "Junior",
      focusTopics: ["APIs"],
      skillGaps: ["Testing"],
      jobDescription: "Build reliable services.",
      mode: "written-practice",
      status: "active",
      questionCount: 6,
    });

    const cases: Array<{
      type: Exclude<EffectiveInterviewQuestionType, "multiple-choice">;
      label: string;
      answer: string;
      criteria: string[];
    }> = [
      {
        type: "legacy-open-response",
        label: "Legacy open response",
        answer: "Legacy answer with structured evidence.",
        criteria: [
          "Evaluate relevance, structure, clarity, evidence, and completeness.",
        ],
      },
      {
        type: "short-answer",
        label: "Short Answer",
        answer: "A concise answer about REST constraints.",
        criteria: [
          "Evaluate concise relevance, correctness, and completeness.",
        ],
      },
      {
        type: "coding",
        label: "Coding",
        answer: "function sum(a, b) { return a + b; }",
        criteria: [
          "Review the submitted code/text as interview practice only.",
          "Discuss reasoning, correctness risks, complexity, readability, and edge cases without claiming execution.",
        ],
      },
      {
        type: "behavioral",
        label: "Behavioral",
        answer:
          "I described the situation, action, and measurable result.",
        criteria: [
          "Evaluate truthful evidence, structure, specificity, clarity, and relevance.",
          "Do not invent candidate facts.",
        ],
      },
      {
        type: "scenario-based",
        label: "Scenario-based",
        answer:
          "I would identify risks, compare options, and sequence the rollout.",
        criteria: [
          "Evaluate assumptions, trade-offs, sequencing, risk awareness, and clarity.",
        ],
      },
      {
        type: "technical-explanation",
        label: "Technical Explanation",
        answer:
          "The event loop coordinates tasks and microtasks in ordered phases.",
        criteria: [
          "Evaluate conceptual correctness, relevance, completeness, and clarity.",
        ],
      },
    ];

    const fetchMock = mockGemini({
      score: 80,
      summary: "Solid practice answer.",
      strengths: ["Relevant"],
      improvements: ["Add one concrete detail"],
      suggestedAnswerOutline: ["Context", "Reasoning", "Result"],
    });

    for (const [index, testCase] of cases.entries()) {
      const questionId = new Types.ObjectId();
      const questionText = `Task 5 feedback practice question ${index + 1}.`;
      const commonQuestion = {
        _id: questionId,
        userId,
        sessionId: session._id,
        source: "manual" as const,
        category: "General",
        difficulty: "medium" as const,
        question: questionText,
        questionFingerprint: createQuestionFingerprint(questionText),
        modelAnswer: "Use a truthful, well-structured answer.",
        explanationKeyPoints: [],
        isPinned: false,
      };

      if (testCase.type === "legacy-open-response") {
        const now = new Date();
        await InterviewQuestionModel.collection.insertOne({
          ...commonQuestion,
          createdAt: now,
          updatedAt: now,
        });
      } else {
        await InterviewQuestionModel.create({
          ...commonQuestion,
          questionType: testCase.type,
        });
      }

      const attempt = await InterviewAttemptModel.create({
        userId,
        sessionId: session._id,
        questionId,
        ...(testCase.type === "legacy-open-response"
          ? { answerText: testCase.answer }
          : {
              answer: {
                type: testCase.type,
                text: testCase.answer,
              },
            }),
        status: "recorded",
      });

      const job = await enqueueJob({
        type: "interview.attempt.feedback",
        userId: owner.userId,
        payload: {
          userId: owner.userId,
          sessionId: session._id.toString(),
          attemptId: attempt._id.toString(),
        },
        maxAttempts: env.INTERVIEW_AI_JOB_MAX_ATTEMPTS,
        idempotencyKey: `task5-feedback-${attempt._id.toString()}-${randomUUID()}`,
      });

      await InterviewAttemptModel.updateOne(
        { _id: attempt._id },
        {
          $set: {
            status: "feedback-queued",
            feedbackJobId: job._id,
          },
        },
      );

      await generateAttemptFeedback({
        userId: owner.userId,
        sessionId: session._id.toString(),
        attemptId: attempt._id.toString(),
        jobId: job._id.toString(),
      });

      const prompt = providerPrompt(fetchMock);
      expect(prompt).toContain(`Question type: ${testCase.label}`);
      expect(prompt).toContain("<UNTRUSTED_WRITTEN_ANSWER>");
      expect(prompt).toContain(testCase.answer);
      expect(prompt).toContain("</UNTRUSTED_WRITTEN_ANSWER>");
      for (const criterion of testCase.criteria) {
        expect(prompt).toContain(criterion);
      }

      const storedAttempt = await InterviewAttemptModel.findById(
        attempt._id,
      ).lean();
      expect(storedAttempt).toMatchObject({
        status: "feedback-completed",
        feedback: {
          score: 80,
          promptVersion: "interview-written-feedback-v2",
        },
      });
    }

    expect(fetchMock).toHaveBeenCalledTimes(cases.length);
  });

  it("rejects Multiple Choice feedback before enqueuing a Gemini job", async () => {
    const owner = await registerTestUser(app, {
      email: "interview-task5-mcq-feedback@example.com",
      displayName: "Interview Task 5 MCQ Feedback",
    });

    const createdSession = await request(app)
      .post("/api/v1/interview-sessions")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        title: "MCQ feedback rejection",
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
            question: "Which value is falsy in JavaScript?",
            multipleChoice: {
              options: ["0", "1"],
              correctOptionIndex: 0,
            },
          },
        ],
      })
      .expect(201);

    const sessionId = createdSession.body.data.session._id as string;
    const question = createdSession.body.data.questions[0];
    const selectedOptionId =
      question.multipleChoice.options[0].id as string;

    const attemptResponse = await request(app)
      .post(
        `/api/v1/interview-sessions/${sessionId}/questions/${question._id}/attempts`,
      )
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        answer: {
          type: "multiple-choice",
          selectedOptionId,
        },
      })
      .expect(201);

    const attemptId = attemptResponse.body.data.attempt._id as string;
    const jobsBefore = await JobRecordModel.countDocuments({
      userId: new Types.ObjectId(owner.userId),
      type: "interview.attempt.feedback",
    });

    const response = await request(app)
      .post(
        `/api/v1/interview-sessions/${sessionId}/attempts/${attemptId}/feedback`,
      )
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(409);

    expect(response.body.error).toMatchObject({
      code: "INTERVIEW_MCQ_FEEDBACK_NOT_REQUIRED",
    });
    await expect(
      JobRecordModel.countDocuments({
        userId: new Types.ObjectId(owner.userId),
        type: "interview.attempt.feedback",
      }),
    ).resolves.toBe(jobsBefore);

    const storedAttempt = await InterviewAttemptModel.findById(
      attemptId,
    ).lean();
    expect(storedAttempt?.status).toBe("recorded");
    expect(storedAttempt?.feedbackJobId).toBeUndefined();
  });

  it("fails safely when a stored typed answer disagrees with the canonical question", async () => {
    const owner = await registerTestUser(app, {
      email: "interview-task5-mismatch@example.com",
      displayName: "Interview Task 5 Mismatch",
    });
    await connectApplicationManagedGemini(owner.userId);

    const userId = new Types.ObjectId(owner.userId);
    const session = await InterviewSessionModel.create({
      userId,
      title: "Mismatched stored feedback",
      targetRole: "Software Engineer",
      experienceLevel: "Junior",
      focusTopics: [],
      skillGaps: [],
      mode: "written-practice",
      status: "active",
      questionCount: 1,
    });
    const questionText = "Describe a time you handled ambiguity.";
    const question = await InterviewQuestionModel.create({
      userId,
      sessionId: session._id,
      source: "manual",
      category: "Behavioral",
      difficulty: "medium",
      question: questionText,
      questionFingerprint: createQuestionFingerprint(questionText),
      questionType: "behavioral",
    });
    const attempt = await InterviewAttemptModel.create({
      userId,
      sessionId: session._id,
      questionId: question._id,
      answer: {
        type: "coding",
        text: "return true;",
      },
      status: "recorded",
    });
    const job = await enqueueJob({
      type: "interview.attempt.feedback",
      userId: owner.userId,
      payload: {
        userId: owner.userId,
        sessionId: session._id.toString(),
        attemptId: attempt._id.toString(),
      },
      maxAttempts: env.INTERVIEW_AI_JOB_MAX_ATTEMPTS,
      idempotencyKey: `task5-mismatch-${attempt._id.toString()}-${randomUUID()}`,
    });
    await InterviewAttemptModel.updateOne(
      { _id: attempt._id },
      {
        $set: {
          status: "feedback-queued",
          feedbackJobId: job._id,
        },
      },
    );

    const fetchMock = mockGemini({
      score: 50,
      summary: "Should never be used.",
      strengths: [],
      improvements: [],
      suggestedAnswerOutline: [],
    });

    await expect(
      generateAttemptFeedback({
        userId: owner.userId,
        sessionId: session._id.toString(),
        attemptId: attempt._id.toString(),
        jobId: job._id.toString(),
      }),
    ).rejects.toMatchObject({
      code: "INTERVIEW_ATTEMPT_ANSWER_INVALID",
    });
    expect(fetchMock).not.toHaveBeenCalled();

    const storedAttempt = await InterviewAttemptModel.findById(
      attempt._id,
    ).lean();
    expect(storedAttempt).toMatchObject({
      status: "feedback-failed",
      feedbackError: {
        code: "INTERVIEW_ATTEMPT_ANSWER_INVALID",
      },
    });
  });

  it("makes explanation prompts type-aware without sending the MCQ answer key", async () => {
    const owner = await registerTestUser(app, {
      email: "interview-task5-explanation@example.com",
      displayName: "Interview Task 5 Explanation",
    });
    await connectApplicationManagedGemini(owner.userId);

    const userId = new Types.ObjectId(owner.userId);
    const session = await InterviewSessionModel.create({
      userId,
      title: "Type-aware explanations",
      targetRole: "Software Engineer",
      experienceLevel: "Junior",
      focusTopics: [],
      skillGaps: [],
      mode: "study",
      status: "active",
      questionCount: 3,
    });
    const cases: Array<{
      type: InterviewQuestionType;
      label: string;
      instruction: string;
    }> = [
      {
        type: "coding",
        label: "Coding",
        instruction:
          "Do not claim that submitted or example code was executed or tested.",
      },
      {
        type: "behavioral",
        label: "Behavioral",
        instruction:
          "Explain a truthful structured response approach without inventing candidate experience.",
      },
      {
        type: "multiple-choice",
        label: "Multiple Choice",
        instruction:
          "Explain the concepts needed to reason through the available choices without exposing backend answer identifiers.",
      },
    ];
    const fetchMock = mockGemini({
      explanation: "Study explanation.",
      keyPoints: ["Key point"],
      modelAnswer: "General study framework.",
    });

    for (const [index, testCase] of cases.entries()) {
      const questionText = `Task 5 explanation practice ${index + 1}.`;
      const question = await InterviewQuestionModel.create({
        userId,
        sessionId: session._id,
        source: "manual",
        category: "General",
        difficulty: "medium",
        question: questionText,
        questionFingerprint: createQuestionFingerprint(questionText),
        questionType: testCase.type,
        ...(testCase.type === "multiple-choice"
          ? {
              multipleChoice: {
                options: [
                  { id: "option-a", text: "Choice A" },
                  { id: "option-b", text: "Choice B" },
                ],
                correctOptionId: "option-b",
              },
            }
          : {}),
      });
      const job = await enqueueJob({
        type: "interview.question.explain",
        userId: owner.userId,
        payload: {
          userId: owner.userId,
          sessionId: session._id.toString(),
          questionId: question._id.toString(),
        },
        maxAttempts: env.INTERVIEW_AI_JOB_MAX_ATTEMPTS,
        idempotencyKey: `task5-explain-${question._id.toString()}-${randomUUID()}`,
      });
      await InterviewQuestionModel.updateOne(
        { _id: question._id },
        { $set: { explanationJobId: job._id } },
      );

      await generateQuestionExplanation({
        userId: owner.userId,
        sessionId: session._id.toString(),
        questionId: question._id.toString(),
        jobId: job._id.toString(),
      });

      const prompt = providerPrompt(fetchMock);
      expect(prompt).toContain(`Question type: ${testCase.label}`);
      expect(prompt).toContain(testCase.instruction);
      if (testCase.type === "multiple-choice") {
        expect(prompt).toContain(
          "<UNTRUSTED_MULTIPLE_CHOICE_OPTIONS>",
        );
        expect(prompt).not.toContain("correctOptionId");
        expect(prompt).not.toContain("option-b\",\"correct");
      }
    }

    expect(fetchMock).toHaveBeenCalledTimes(cases.length);
  });
});

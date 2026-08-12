import { Types } from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../app.js";
import { InterviewAttemptModel } from "../../modules/interviews/interviewAttempt.model.js";
import { JobRecordModel } from "../../jobs/job.model.js";
import { InterviewQuestionModel } from "../../modules/interviews/interviewQuestion.model.js";
import { registerTestUser } from "../helpers/auth.js";

const publicOptions = [
  { id: "option-a", text: "A" },
  { id: "option-b", text: "B" },
];

function expectNoMcqSecrets(value: unknown): void {
  const serialized = JSON.stringify(value);

  expect(serialized).not.toContain("correctOptionId");
  expect(serialized).not.toContain(
    "The correct option is B.",
  );
}

function expectPublicMcqQuestion(
  question: Record<string, unknown>,
): void {
  expect(question.questionType).toBe("multiple-choice");

  expect(question.multipleChoice).toEqual({
    options: publicOptions,
  });

  expectNoMcqSecrets(question);
}

async function createOwnedMcqFixture() {
  const owner = await registerTestUser(app, {
    email: "interview-mcq-secrecy-owner@example.com",
    displayName: "Interview MCQ Secrecy Owner",
  });

  const createdSession = await request(app)
    .post("/api/v1/interview-sessions")
    .set(
      "Authorization",
      `Bearer ${owner.accessToken}`,
    )
    .send({
      title: "MCQ secrecy",
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
    category: "JavaScript",
    difficulty: "medium",
    question: "Which option is correct?",
    questionFingerprint: "d".repeat(64),
    questionType: "multiple-choice",
    multipleChoice: {
      options: publicOptions,
      correctOptionId: "option-b",
    },
    modelAnswer: "The correct option is B.",
    explanationKeyPoints: [],
    isPinned: false,
    createdAt: now,
    updatedAt: now,
  });

  return {
    owner,
    sessionId,
    questionId: questionId.toString(),
  };
}

describe("Interview Multiple Choice answer-key secrecy", () => {
  it("does not expose the private answer key through question response surfaces", async () => {
    const fixture = await createOwnedMcqFixture();
    const authorization =
      `Bearer ${fixture.owner.accessToken}`;

    const listResponse = await request(app)
      .get(
        `/api/v1/interview-sessions/${fixture.sessionId}/questions`,
      )
      .set("Authorization", authorization)
      .expect(200);

    const detailResponse = await request(app)
      .get(
        `/api/v1/interview-sessions/${fixture.sessionId}/questions/${fixture.questionId}`,
      )
      .set("Authorization", authorization)
      .expect(200);

    const pinResponse = await request(app)
      .patch(
        `/api/v1/interview-sessions/${fixture.sessionId}/questions/${fixture.questionId}/pin`,
      )
      .set("Authorization", authorization)
      .send({ isPinned: true })
      .expect(200);

    const notesResponse = await request(app)
      .patch(
        `/api/v1/interview-sessions/${fixture.sessionId}/questions/${fixture.questionId}/notes`,
      )
      .set("Authorization", authorization)
      .send({ notes: "Review this question." })
      .expect(200);

    const explanationResponse = await request(app)
      .post(
        `/api/v1/interview-sessions/${fixture.sessionId}/questions/${fixture.questionId}/explanation`,
      )
      .set("Authorization", authorization);

    expect([202, 409]).toContain(
      explanationResponse.status,
    );

    expectNoMcqSecrets(explanationResponse.body);

    if (explanationResponse.status === 202) {
      const jobId =
        explanationResponse.body.data.job.id as string;

      const jobResponse = await request(app)
        .get(`/api/v1/jobs/${jobId}`)
        .set("Authorization", authorization)
        .expect(200);

      expectNoMcqSecrets(jobResponse.body);
    }

    expect(
      listResponse.body.data.questions,
    ).toHaveLength(1);

    expectPublicMcqQuestion(
      listResponse.body.data.questions[0],
    );

    expectPublicMcqQuestion(
      detailResponse.body.data.question,
    );

    expectPublicMcqQuestion(
      pinResponse.body.data.question,
    );

    expectPublicMcqQuestion(
      notesResponse.body.data.question,
    );
  });

  it("rejects an MCQ explanation request before the owner submits an attempt", async () => {
    const fixture = await createOwnedMcqFixture();
    const authorization =
      `Bearer ${fixture.owner.accessToken}`;

    const response = await request(app)
      .post(
        `/api/v1/interview-sessions/${fixture.sessionId}/questions/${fixture.questionId}/explanation`,
      )
      .set("Authorization", authorization)
      .expect(409);

    expect(response.body.error).toMatchObject({
      code: "INTERVIEW_MCQ_EXPLANATION_REQUIRES_ATTEMPT",
      message:
        "Submit an attempt before requesting the Multiple Choice explanation.",
    });

    const storedQuestion =
      await InterviewQuestionModel.findById(
        fixture.questionId,
      ).lean();

    expect(storedQuestion).not.toBeNull();
    expect(
      storedQuestion?.explanationJobId,
    ).toBeUndefined();
  });


  it("keeps foreign access hidden and does not let a foreign attempt unlock an MCQ explanation", async () => {
    const fixture = await createOwnedMcqFixture();

    const other = await registerTestUser(app, {
      email: "interview-mcq-secrecy-other@example.com",
      displayName: "Interview MCQ Secrecy Other",
    });

    await InterviewAttemptModel.create({
      userId: new Types.ObjectId(other.userId),
      sessionId: new Types.ObjectId(fixture.sessionId),
      questionId: new Types.ObjectId(fixture.questionId),
      answer: {
        type: "multiple-choice",
        selectedOptionId: "option-a",
      },
      evaluation: {
        kind: "multiple-choice",
        score: 0,
        correct: false,
      },
      status: "recorded",
    });

    const foreignAuthorization =
      `Bearer ${other.accessToken}`;

    const foreignDetailResponse = await request(app)
      .get(
        `/api/v1/interview-sessions/${fixture.sessionId}/questions/${fixture.questionId}`,
      )
      .set("Authorization", foreignAuthorization)
      .expect(404);

    expect(foreignDetailResponse.body.error).toMatchObject({
      code: "INTERVIEW_SESSION_NOT_FOUND",
      message: "Interview session not found.",
    });

    expectNoMcqSecrets(foreignDetailResponse.body);

    const foreignExplanationResponse = await request(app)
      .post(
        `/api/v1/interview-sessions/${fixture.sessionId}/questions/${fixture.questionId}/explanation`,
      )
      .set("Authorization", foreignAuthorization)
      .expect(404);

    expect(
      foreignExplanationResponse.body.error,
    ).toMatchObject({
      code: "INTERVIEW_SESSION_NOT_FOUND",
      message: "Interview session not found.",
    });

    expectNoMcqSecrets(
      foreignExplanationResponse.body,
    );

    const ownerExplanationResponse = await request(app)
      .post(
        `/api/v1/interview-sessions/${fixture.sessionId}/questions/${fixture.questionId}/explanation`,
      )
      .set(
        "Authorization",
        `Bearer ${fixture.owner.accessToken}`,
      )
      .expect(409);

    expect(
      ownerExplanationResponse.body.error,
    ).toMatchObject({
      code: "INTERVIEW_MCQ_EXPLANATION_REQUIRES_ATTEMPT",
      message:
        "Submit an attempt before requesting the Multiple Choice explanation.",
    });

    expectNoMcqSecrets(
      ownerExplanationResponse.body,
    );

    const storedQuestion =
      await InterviewQuestionModel.findById(
        fixture.questionId,
      ).lean();

    expect(storedQuestion).not.toBeNull();
    expect(
      storedQuestion?.explanationJobId,
    ).toBeUndefined();
  });


  it("does not expose MCQ secrets through an owned Interview job response", async () => {
    const fixture = await createOwnedMcqFixture();

    const job = await JobRecordModel.create({
      userId: new Types.ObjectId(
        fixture.owner.userId,
      ),
      type: "interview.question.explain",
      payload: {
        userId: fixture.owner.userId,
        sessionId: fixture.sessionId,
        questionId: fixture.questionId,
        correctOptionId: "option-b",
        modelAnswer: "The correct option is B.",
      },
      status: "queued",
      phase: "queued",
      progress: 0,
      attempts: 0,
      maxAttempts: 3,
    });

    const response = await request(app)
      .get(`/api/v1/jobs/${job._id.toString()}`)
      .set(
        "Authorization",
        `Bearer ${fixture.owner.accessToken}`,
      )
      .expect(200);

    expectNoMcqSecrets(response.body);
    expect(
      response.body.data.job,
    ).not.toHaveProperty("payload");
  });


  it("does not reveal a stored MCQ explanation before an owned attempt exists", async () => {
    const fixture = await createOwnedMcqFixture();
    const authorization =
      `Bearer ${fixture.owner.accessToken}`;

    await InterviewQuestionModel.findByIdAndUpdate(
      fixture.questionId,
      {
        $set: {
          explanation:
            "Option B is correct because it preserves the required ordering.",
          explanationKeyPoints: [
            "Option B preserves the required ordering.",
          ],
        },
      },
    );

    const detailResponse = await request(app)
      .get(
        `/api/v1/interview-sessions/${fixture.sessionId}/questions/${fixture.questionId}`,
      )
      .set("Authorization", authorization)
      .expect(200);

    expect(
      detailResponse.body.data.question,
    ).not.toHaveProperty("explanation");

    expect(
      detailResponse.body.data.question,
    ).not.toHaveProperty("explanationKeyPoints");

    const pinResponse = await request(app)
      .patch(
        `/api/v1/interview-sessions/${fixture.sessionId}/questions/${fixture.questionId}/pin`,
      )
      .set("Authorization", authorization)
      .send({ isPinned: true })
      .expect(200);

    expect(
      pinResponse.body.data.question,
    ).not.toHaveProperty("explanation");

    expect(
      pinResponse.body.data.question,
    ).not.toHaveProperty("explanationKeyPoints");

    const notesResponse = await request(app)
      .patch(
        `/api/v1/interview-sessions/${fixture.sessionId}/questions/${fixture.questionId}/notes`,
      )
      .set("Authorization", authorization)
      .send({ notes: "Still private before submission." })
      .expect(200);

    expect(
      notesResponse.body.data.question,
    ).not.toHaveProperty("explanation");

    expect(
      notesResponse.body.data.question,
    ).not.toHaveProperty("explanationKeyPoints");

    const explanationResponse = await request(app)
      .post(
        `/api/v1/interview-sessions/${fixture.sessionId}/questions/${fixture.questionId}/explanation`,
      )
      .set("Authorization", authorization)
      .expect(409);

    expect(
      explanationResponse.body.error,
    ).toMatchObject({
      code: "INTERVIEW_MCQ_EXPLANATION_REQUIRES_ATTEMPT",
      message:
        "Submit an attempt before requesting the Multiple Choice explanation.",
    });

    expectNoMcqSecrets(explanationResponse.body);
  });

  it("reveals a stored MCQ explanation only after the owner has an attempt", async () => {
    const fixture = await createOwnedMcqFixture();
    const authorization =
      `Bearer ${fixture.owner.accessToken}`;

    const explanation =
      "Option B is correct because it preserves the required ordering.";

    await InterviewQuestionModel.findByIdAndUpdate(
      fixture.questionId,
      {
        $set: {
          explanation,
          explanationKeyPoints: [
            "Option B preserves the required ordering.",
          ],
        },
      },
    );

    await InterviewAttemptModel.create({
      userId: new Types.ObjectId(
        fixture.owner.userId,
      ),
      sessionId: new Types.ObjectId(
        fixture.sessionId,
      ),
      questionId: new Types.ObjectId(
        fixture.questionId,
      ),
      answer: {
        type: "multiple-choice",
        selectedOptionId: "option-a",
      },
      evaluation: {
        kind: "multiple-choice",
        score: 0,
        correct: false,
      },
      status: "recorded",
    });

    const detailResponse = await request(app)
      .get(
        `/api/v1/interview-sessions/${fixture.sessionId}/questions/${fixture.questionId}`,
      )
      .set("Authorization", authorization)
      .expect(200);

    expect(
      detailResponse.body.data.question.explanation,
    ).toBe(explanation);

    expectNoMcqSecrets(
      detailResponse.body.data.question,
    );

    const explanationResponse = await request(app)
      .post(
        `/api/v1/interview-sessions/${fixture.sessionId}/questions/${fixture.questionId}/explanation`,
      )
      .set("Authorization", authorization)
      .expect(200);

    expect(
      explanationResponse.body.data.alreadyAvailable,
    ).toBe(true);

    expect(
      explanationResponse.body.data.question.explanation,
    ).toBe(explanation);

    expectNoMcqSecrets(
      explanationResponse.body.data.question,
    );
  });

  it("reveals the correct option only through the owner's post-submission attempt response", async () => {
    const fixture = await createOwnedMcqFixture();
    const authorization =
      `Bearer ${fixture.owner.accessToken}`;

    const recorded = await request(app)
      .post(
        `/api/v1/interview-sessions/${fixture.sessionId}/questions/${fixture.questionId}/attempts`,
      )
      .set("Authorization", authorization)
      .send({
        answer: {
          type: "multiple-choice",
          selectedOptionId: "option-a",
        },
      })
      .expect(201);

    expect(recorded.body.data.attempt.evaluation).toEqual({
      kind: "multiple-choice",
      score: 0,
      correct: false,
      correctOptionId: "option-b",
    });

    const attemptId =
      recorded.body.data.attempt._id as string;
    const stored = await InterviewAttemptModel.findById(
      attemptId,
    ).lean();

    expect(stored).not.toBeNull();
    expectNoMcqSecrets(stored);

    const other = await registerTestUser(app, {
      email: "interview-mcq-attempt-secrecy-other@example.com",
      displayName: "Interview MCQ Attempt Secrecy Other",
    });

    const foreignAttemptResponse = await request(app)
      .get(
        `/api/v1/interview-sessions/${fixture.sessionId}/attempts/${attemptId}`,
      )
      .set(
        "Authorization",
        `Bearer ${other.accessToken}`,
      )
      .expect(404);

    expect(foreignAttemptResponse.body.error).toMatchObject({
      code: "INTERVIEW_SESSION_NOT_FOUND",
      message: "Interview session not found.",
    });
    expectNoMcqSecrets(foreignAttemptResponse.body);

    const questionAfterAttempt = await request(app)
      .get(
        `/api/v1/interview-sessions/${fixture.sessionId}/questions/${fixture.questionId}`,
      )
      .set("Authorization", authorization)
      .expect(200);

    expectNoMcqSecrets(
      questionAfterAttempt.body.data.question,
    );
  });

});

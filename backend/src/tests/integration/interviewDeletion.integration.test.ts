import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../app.js";
import { JobRecordModel } from "../../jobs/job.model.js";
import { InterviewAttemptModel } from "../../modules/interviews/interviewAttempt.model.js";
import { InterviewQuestionModel } from "../../modules/interviews/interviewQuestion.model.js";
import { InterviewSessionModel } from "../../modules/interviews/interviewSession.model.js";
import { ResumeModel } from "../../modules/resumes/resume.model.js";
import { registerTestUser } from "../helpers/auth.js";

async function createSession(input: {
  userId: string;
  status?: "active" | "completed" | "archived";
  sourceResumeId?: string;
}) {
  return InterviewSessionModel.create({
    userId: input.userId,
    title: "Deletion Contract Session",
    targetRole: "Software Engineer",
    experienceLevel: "Mid-level",
    focusTopics: ["TypeScript"],
    skillGaps: [],
    mode: "written-practice",
    status: input.status ?? "active",
    questionCount: 1,
    ...(input.sourceResumeId ? { sourceResumeId: input.sourceResumeId } : {}),
  });
}

async function createQuestionAndAttempt(userId: string, sessionId: string) {
  const question = await InterviewQuestionModel.create({
    userId,
    sessionId,
    source: "manual",
    category: "TypeScript",
    difficulty: "medium",
    question: "Explain structural typing.",
    questionFingerprint: "d".repeat(64),
    questionType: "technical-explanation",
  });
  const attempt = await InterviewAttemptModel.create({
    userId,
    sessionId,
    questionId: question._id,
    answer: {
      type: "technical-explanation",
      text: "Types are compatible based on structure.",
    },
    status: "recorded",
  });
  return { question, attempt };
}

describe("Interview session permanent deletion", () => {
  it("deletes owned active, completed, and archived sessions with questions and immutable attempts", async () => {
    const owner = await registerTestUser(app, {
      email: "interview-delete-statuses@example.com",
      displayName: "Interview Delete Statuses",
    });

    for (const status of ["active", "completed", "archived"] as const) {
      const session = await createSession({ userId: owner.userId, status });
      const { question, attempt } = await createQuestionAndAttempt(
        owner.userId,
        session._id.toString(),
      );

      await request(app)
        .delete(`/api/v1/interview-sessions/${session._id.toString()}`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .expect(204);

      expect(await InterviewSessionModel.exists({ _id: session._id })).toBeFalsy();
      expect(await InterviewQuestionModel.exists({ _id: question._id })).toBeFalsy();
      expect(await InterviewAttemptModel.exists({ _id: attempt._id })).toBeFalsy();
    }
  });

  it("preserves the source Resume when its Interview session is permanently deleted", async () => {
    const owner = await registerTestUser(app, {
      email: "interview-delete-source-resume@example.com",
      displayName: "Interview Delete Source Resume",
    });
    const createdResume = await request(app)
      .post("/api/v1/resumes")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ title: "Source Resume" })
      .expect(201);
    const resumeId = createdResume.body.data.resume._id as string;
    const session = await createSession({
      userId: owner.userId,
      sourceResumeId: resumeId,
    });

    await request(app)
      .delete(`/api/v1/interview-sessions/${session._id.toString()}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(204);

    expect(await ResumeModel.exists({ _id: resumeId, userId: owner.userId })).toBeTruthy();
  });

  it("uses owner-scoped not-found behavior and leaves foreign session data untouched", async () => {
    const owner = await registerTestUser(app, {
      email: "interview-delete-private-owner@example.com",
      displayName: "Interview Delete Private Owner",
    });
    const other = await registerTestUser(app, {
      email: "interview-delete-private-other@example.com",
      displayName: "Interview Delete Private Other",
    });
    const session = await createSession({ userId: owner.userId });
    const { question, attempt } = await createQuestionAndAttempt(
      owner.userId,
      session._id.toString(),
    );

    const response = await request(app)
      .delete(`/api/v1/interview-sessions/${session._id.toString()}`)
      .set("Authorization", `Bearer ${other.accessToken}`)
      .expect(404);

    expect(response.body.error.code).toBe("INTERVIEW_SESSION_NOT_FOUND");
    expect(await InterviewSessionModel.exists({ _id: session._id })).toBeTruthy();
    expect(await InterviewQuestionModel.exists({ _id: question._id })).toBeTruthy();
    expect(await InterviewAttemptModel.exists({ _id: attempt._id })).toBeTruthy();
  });

  it("blocks deletion while any related Interview AI work is active", async () => {
    const owner = await registerTestUser(app, {
      email: "interview-delete-active-jobs@example.com",
      displayName: "Interview Delete Active Jobs",
    });

    for (const type of [
      "interview.questions.generate",
      "interview.question.explain",
      "interview.attempt.feedback",
    ] as const) {
      const session = await createSession({ userId: owner.userId });
      await JobRecordModel.create({
        userId: owner.userId,
        type,
        payload: {
          userId: owner.userId,
          sessionId: session._id.toString(),
          ...(type === "interview.questions.generate"
            ? {
                count: 1,
                categories: [],
                questionTypes: ["short-answer"],
                typeCounts: { "short-answer": 1 },
              }
            : type === "interview.question.explain"
              ? { questionId: "a".repeat(24) }
              : { attemptId: "b".repeat(24) }),
        },
        status: "processing",
      });

      const response = await request(app)
        .delete(`/api/v1/interview-sessions/${session._id.toString()}`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .expect(409);

      expect(response.body.error.code).toBe(
        "INTERVIEW_DELETE_BLOCKED_BY_ACTIVE_JOB",
      );
      expect(await InterviewSessionModel.exists({ _id: session._id })).toBeTruthy();
    }
  });

  it("removes matching completed, failed, and cancelled Interview jobs", async () => {
    const owner = await registerTestUser(app, {
      email: "interview-delete-terminal-jobs@example.com",
      displayName: "Interview Delete Terminal Jobs",
    });

    for (const status of ["completed", "failed", "cancelled"] as const) {
      const session = await createSession({ userId: owner.userId });
      const job = await JobRecordModel.create({
        userId: owner.userId,
        type: "interview.questions.generate",
        payload: {
          userId: owner.userId,
          sessionId: session._id.toString(),
          count: 1,
          categories: [],
          questionTypes: ["short-answer"],
          typeCounts: { "short-answer": 1 },
        },
        status,
      });

      await request(app)
        .delete(`/api/v1/interview-sessions/${session._id.toString()}`)
        .set("Authorization", `Bearer ${owner.accessToken}`)
        .expect(204);

      expect(await JobRecordModel.exists({ _id: job._id })).toBeFalsy();
    }
  });
});

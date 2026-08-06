import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { JobRecordModel } from "../../jobs/job.model.js";
import { InterviewQuestionModel } from "../../modules/interviews/interviewQuestion.model.js";
import { InterviewSessionModel } from "../../modules/interviews/interviewSession.model.js";
import { createQuestionFingerprint } from "../../modules/interviews/interview.fingerprint.js";
import { registerTestUser } from "../helpers/auth.js";

describe("IDOR protections", () => {
  it("keeps foreign polling, cancellation, and Retry indistinguishable from a missing job", async () => {
    const owner = await registerTestUser(app, {
      email: "job-idor-owner@example.com",
      displayName: "Job IDOR Owner",
    });
    const attacker = await registerTestUser(app, {
      email: "job-idor-attacker@example.com",
      displayName: "Job IDOR Attacker",
    });
    const job = await JobRecordModel.create({
      userId: owner.userId,
      type: "resume.analyze",
      payload: { userId: owner.userId },
      status: "cancelled",
      phase: "cancelled",
    });

    for (const action of ["poll", "cancel", "retry"] as const) {
      const call =
        action === "poll"
          ? request(app).get(`/api/v1/jobs/${job._id.toString()}`)
          : request(app).post(`/api/v1/jobs/${job._id.toString()}/${action}`);
      const response = await call
        .set("Authorization", `Bearer ${attacker.accessToken}`)
        .expect(404);
      expect(response.body.error.code).toBe("JOB_NOT_FOUND");
    }
  });

  it("does not reveal another user's interview session or question", async () => {
    const owner = await registerTestUser(app, {
      email: "interview-owner@example.com",
      displayName: "Interview Owner",
    });
    const attacker = await registerTestUser(app, {
      email: "interview-attacker@example.com",
      displayName: "Interview Attacker",
    });

    const session = await InterviewSessionModel.create({
      userId: owner.userId,
      title: "Private Interview",
      targetRole: "Backend Engineer",
      experienceLevel: "Junior",
      focusTopics: ["Node.js"],
      skillGaps: [],
      mode: "study",
      status: "active",
      questionCount: 1,
    });

    const questionText =
      "How would you secure an Express API?";
    const question = await InterviewQuestionModel.create({
      userId: owner.userId,
      sessionId: session._id,
      source: "manual",
      category: "Security",
      difficulty: "medium",
      question: questionText,
      questionFingerprint:
        createQuestionFingerprint(questionText),
      explanationKeyPoints: [],
      isPinned: false,
    });

    const sessionResponse = await request(app)
      .get(
        `/api/v1/interview-sessions/${session._id.toString()}`,
      )
      .set(
        "Authorization",
        `Bearer ${attacker.accessToken}`,
      )
      .expect(404);

    expect(sessionResponse.body.error.code).toBe(
      "INTERVIEW_SESSION_NOT_FOUND",
    );

    const questionResponse = await request(app)
      .get(
        `/api/v1/interview-sessions/${session._id.toString()}/questions/${question._id.toString()}`,
      )
      .set(
        "Authorization",
        `Bearer ${attacker.accessToken}`,
      )
      .expect(404);

    expect(questionResponse.body.error.code).toBe(
      "INTERVIEW_SESSION_NOT_FOUND",
    );
  });
});

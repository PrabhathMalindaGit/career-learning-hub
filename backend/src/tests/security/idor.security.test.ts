import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { InterviewQuestionModel } from "../../modules/interviews/interviewQuestion.model.js";
import { InterviewSessionModel } from "../../modules/interviews/interviewSession.model.js";
import { createQuestionFingerprint } from "../../modules/interviews/interview.fingerprint.js";
import { registerTestUser } from "../helpers/auth.js";

describe("IDOR protections", () => {
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

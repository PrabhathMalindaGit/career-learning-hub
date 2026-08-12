import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { InterviewAttemptModel } from "../../modules/interviews/interviewAttempt.model.js";
import { InterviewQuestionModel } from "../../modules/interviews/interviewQuestion.model.js";

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

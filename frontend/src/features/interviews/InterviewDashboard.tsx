import { useState } from "react";
import { AttemptHistory } from "./AttemptHistory";
import { QuestionPractice } from "./QuestionPractice";
import { SessionSetup } from "./SessionSetup";
import type {
  CreateInterviewSessionInput,
  InterviewAttempt,
  InterviewQuestion,
} from "./types";
import "./interviewCoach.css";

const exampleQuestion: InterviewQuestion = {
  _id: "question-placeholder",
  category: "Behavioral",
  difficulty: "medium",
  question:
    "Describe a difficult technical decision and how you evaluated the trade-offs.",
  source: "manual",
  isPinned: false,
  userNotes: "",
};

export function InterviewDashboard() {
  const [question, setQuestion] =
    useState<InterviewQuestion>(exampleQuestion);
  const [attempts, setAttempts] =
    useState<InterviewAttempt[]>([]);

  const createSession = (
    input: CreateInterviewSessionInput,
  ) => {
    console.info("Create interview session", input);
  };

  const recordAttempt = (answerText: string) => {
    setAttempts((current) => [
      {
        _id: crypto.randomUUID(),
        sessionId: "session-placeholder",
        questionId: question._id,
        answerText,
        status: "recorded",
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
  };

  return (
    <section
      className="interview-dashboard"
      aria-label="Interview Coach"
    >
      <div className="interview-dashboard-heading">
        <div>
          <p className="eyebrow">Phase 5</p>
          <h2>Interview Coach</h2>
          <p>
            Build role-specific question sets, practise written
            answers, and track feedback without exposing another
            user's sessions or questions.
          </p>
        </div>
        <button
          type="button"
          className="interview-primary-button"
        >
          Generate question set
        </button>
      </div>

      <div className="interview-dashboard-grid">
        <SessionSetup onCreate={createSession} />

        <QuestionPractice
          question={question}
          onPin={(isPinned) =>
            setQuestion((current) => ({
              ...current,
              isPinned,
            }))
          }
          onSaveNotes={(userNotes) =>
            setQuestion((current) => ({
              ...current,
              userNotes,
            }))
          }
          onSubmitAnswer={recordAttempt}
          onRequestExplanation={() =>
            console.info("Queue explanation")
          }
        />

        <AttemptHistory
          attempts={attempts}
          onRequestFeedback={(attemptId) =>
            console.info("Queue feedback", attemptId)
          }
        />
      </div>
    </section>
  );
}

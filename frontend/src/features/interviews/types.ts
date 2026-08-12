import type { PartialJobResilienceMetadata } from "../jobs/jobResilience";

export type InterviewSessionStatus =
  | "active"
  | "completed"
  | "archived";
export type InterviewMode =
  | "study"
  | "written-practice"
  | "mock-interview";
export type CreateInterviewMode = Exclude<
  InterviewMode,
  "mock-interview"
>;
export type InterviewDifficulty = "easy" | "medium" | "hard";
export type InterviewQuestionSource = "manual" | "ai-generated";
export type InterviewQuestionType =
  | "multiple-choice"
  | "short-answer"
  | "coding"
  | "behavioral"
  | "scenario-based"
  | "technical-explanation";
export type EffectiveInterviewQuestionType =
  | InterviewQuestionType
  | "legacy-open-response";
export type TypedInterviewAnswer =
  | {
      type: "multiple-choice";
      selectedOptionId: string;
    }
  | {
      type: "short-answer";
      text: string;
    }
  | {
      type: "coding";
      text: string;
    }
  | {
      type: "behavioral";
      text: string;
    }
  | {
      type: "scenario-based";
      text: string;
    }
  | {
      type: "technical-explanation";
      text: string;
    };
export type InterviewAttemptStatus =
  | "recorded"
  | "feedback-queued"
  | "feedback-processing"
  | "feedback-completed"
  | "feedback-failed";
export type InterviewJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";
export type InterviewJobType =
  | "interview.questions.generate"
  | "interview.question.explain"
  | "interview.attempt.feedback";

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface InterviewSessionSummary {
  id: string;
  title: string;
  targetRole: string;
  experienceLevel: string;
  focusTopics: string[];
  skillGaps: string[];
  mode: InterviewMode;
  status: InterviewSessionStatus;
  questionCount: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewSessionDetail
  extends InterviewSessionSummary {
  jobDescription?: string;
}

export interface InterviewSessionPage {
  sessions: InterviewSessionSummary[];
  pagination: Pagination;
}

export interface InterviewMultipleChoicePublic {
  options: Array<{
    id: string;
    text: string;
  }>;
}

export interface InterviewQuestionSummary {
  id: string;
  sessionId: string;
  source: InterviewQuestionSource;
  category: string;
  difficulty: InterviewDifficulty;
  question: string;
  questionType: EffectiveInterviewQuestionType;
  multipleChoice?: InterviewMultipleChoicePublic;
  isPinned: boolean;
  userNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewQuestionDetail
  extends InterviewQuestionSummary {
  modelAnswer?: string;
  explanation?: string;
  explanationKeyPoints: string[];
}

export interface InterviewQuestionPage {
  questions: InterviewQuestionSummary[];
  pagination: Pagination;
}

export interface InterviewFeedback {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  suggestedAnswerOutline: string[];
  completedAt: string;
}

export interface InterviewMultipleChoiceEvaluation {
  kind: "multiple-choice";
  score: 0 | 100;
  correct: boolean;
  correctOptionId: string;
}

export interface InterviewAttemptBase {
  id: string;
  sessionId: string;
  questionId: string;
  status: InterviewAttemptStatus;
  feedback?: InterviewFeedback;
  createdAt: string;
  updatedAt: string;
}

export type InterviewAttempt = InterviewAttemptBase &
  (
    | {
        answerText: string;
        answer?: never;
        evaluation?: never;
      }
    | {
        answer: TypedInterviewAnswer;
        answerText?: never;
        evaluation?: InterviewMultipleChoiceEvaluation;
      }
  );

export interface InterviewAttemptPage {
  attempts: InterviewAttempt[];
  pagination: Pagination;
}

export type InterviewJobResult =
  | {
      kind: "generation";
      insertedCount: number;
      duplicateCount: number;
      questionIds: string[];
    }
  | {
      kind: "explanation";
      questionId: string;
      explanationReady: true;
    }
  | {
      kind: "feedback";
      attemptId: string;
      score: number;
    };

export interface InterviewJob extends PartialJobResilienceMetadata {
  id: string;
  type: InterviewJobType;
  status: InterviewJobStatus;
  progress: number;
  attempts: number;
  maxAttempts: number;
  result?: InterviewJobResult;
  error?: {
    code: string;
    message: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type AcceptedInterviewJob = Pick<
  InterviewJob,
  "id" | "type" | "status"
>;

export interface CreateInterviewSessionInput {
  title: string;
  targetRole: string;
  experienceLevel: string;
  focusTopics: string[];
  skillGaps: string[];
  jobDescription?: string;
  mode: CreateInterviewMode;
}

export interface ManualInterviewQuestionInput {
  questionType: InterviewQuestionType;
  category: string;
  difficulty: InterviewDifficulty;
  question: string;
  modelAnswer?: string;
  multipleChoice?: {
    options: string[];
    correctOptionIndex: number;
  };
}

export type ExplanationRequestResult =
  | {
      kind: "available";
      question: InterviewQuestionDetail;
    }
  | {
      kind: "queued";
      job: AcceptedInterviewJob;
    };

export type FeedbackRequestResult =
  | {
      kind: "available";
      attempt: InterviewAttempt;
    }
  | {
      kind: "queued";
      attemptId: string;
      job: AcceptedInterviewJob;
    };

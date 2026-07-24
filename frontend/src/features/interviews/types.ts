export type InterviewMode =
  | "study"
  | "written-practice"
  | "mock-interview";

export type InterviewDifficulty =
  | "easy"
  | "medium"
  | "hard";

export interface InterviewSession {
  _id: string;
  title: string;
  targetRole: string;
  experienceLevel: string;
  focusTopics: string[];
  skillGaps: string[];
  mode: InterviewMode;
  status: "active" | "completed" | "archived";
  questionCount: number;
  sourceResumeId?: string;
  sourceResumeVersionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewQuestion {
  _id: string;
  category: string;
  difficulty: InterviewDifficulty;
  question: string;
  source: "manual" | "ai-generated";
  isPinned: boolean;
  userNotes?: string;
  modelAnswer?: string;
  explanation?: string;
  explanationKeyPoints?: string[];
}

export interface InterviewFeedback {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  suggestedAnswerOutline: string[];
  completedAt: string;
}

export interface InterviewAttempt {
  _id: string;
  sessionId: string;
  questionId: string;
  answerText: string;
  status:
    | "recorded"
    | "feedback-queued"
    | "feedback-processing"
    | "feedback-completed"
    | "feedback-failed";
  feedback?: InterviewFeedback;
  feedbackError?: {
    code: string;
    message: string;
  };
  createdAt: string;
}

export interface CreateInterviewSessionInput {
  title: string;
  sourceResumeId?: string;
  sourceResumeVersionId?: string;
  targetRole: string;
  experienceLevel: string;
  focusTopics: string[];
  skillGaps: string[];
  jobDescription?: string;
  mode: InterviewMode;
  manualQuestions: Array<{
    category: string;
    difficulty: InterviewDifficulty;
    question: string;
    modelAnswer?: string;
  }>;
}

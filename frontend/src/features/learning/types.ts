export type LearningDocumentStatus =
  | "uploaded"
  | "processing"
  | "ready"
  | "failed"
  | "deleting";

export interface LearningDocument {
  id: string;
  title: string;
  originalFilename: string;
  mimeType: "application/pdf";
  status: LearningDocumentStatus;
  pageCount: number;
  chunkCount: number;
  summary?: string;
  summaryKeyPoints: string[];
  processingError?: {
    code: string;
    message: string;
  };
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id: string;
  chunkIndex: number;
  pageStart: number;
  pageEnd: number;
  text: string;
  wordCount: number;
}

export interface LearningPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AcceptedLearningJob {
  id: string;
  type: "learning.document.process";
  status: "queued" | "processing";
}

export interface LearningJob {
  id: string;
  type: "learning.document.process";
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  progress: number;
  attempts: number;
  maxAttempts: number;
  result?: {
    documentId: string;
    pageCount: number;
    chunkCount: number;
  };
  error?: {
    code: string;
    message: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LearningDocumentSource {
  url: string;
  expiresAt: string;
  contentType: "application/pdf";
}

export interface LearningMessage {
  id: string;
  documentId: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  sourcePages: number[];
  createdAt: string;
  updatedAt: string;
}

export interface LearningConversation {
  id: string;
  documentId: string;
  title: string;
  messageCount: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AcceptedLearningChatJob {
  id: string;
  type: "learning.chat.respond";
  status: "queued" | "processing";
}

export interface LearningChatJob {
  id: string;
  type: "learning.chat.respond";
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  progress: number;
  attempts: number;
  maxAttempts: number;
  result?: {
    messageId: string;
    sourcePages: number[];
  };
  error?: {
    code: string;
    message: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type FlashcardSetStatus = "generating" | "ready" | "failed";

export interface FlashcardSet {
  id: string;
  documentId: string;
  title: string;
  status: FlashcardSetStatus;
  cardCount: number;
  generationError?: {
    code: string;
    message: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AcceptedLearningFlashcardJob {
  id: string;
  type: "learning.flashcards.generate";
  status: "queued" | "processing";
}

export interface LearningFlashcardJob {
  id: string;
  type: "learning.flashcards.generate";
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  progress: number;
  attempts: number;
  maxAttempts: number;
  result?: {
    setId: string;
    cardCount: number;
  };
  error?: {
    code: string;
    message: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  cardIndex: number;
  front: string;
  back: string;
  sourcePages: number[];
  createdAt: string;
}

export type QuizStatus = "generating" | "ready" | "failed";

export interface QuizSummary {
  id: string;
  documentId: string;
  title: string;
  status: QuizStatus;
  questionCount: number;
  generationError?: {
    code: string;
    message: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AcceptedLearningQuizJob {
  id: string;
  type: "learning.quiz.generate";
  status: "queued" | "processing";
}

export interface LearningQuizJob {
  id: string;
  type: "learning.quiz.generate";
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  progress: number;
  attempts: number;
  maxAttempts: number;
  result?: {
    quizId: string;
    questionCount: number;
  };
  error?: {
    code: string;
    message: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestionForTaking {
  questionIndex: number;
  prompt: string;
  choices: string[];
  sourcePages: number[];
}

export interface QuizForTaking {
  id: string;
  documentId: string;
  title: string;
  status: "ready";
  questionCount: number;
  createdAt: string;
  updatedAt: string;
  questions: QuizQuestionForTaking[];
}

export interface QuizAnswerSelection {
  questionIndex: number;
  selectedChoiceIndex: number;
}

export interface QuizAttemptSummary {
  id: string;
  documentId: string;
  quizId: string;
  correctCount: number;
  questionCount: number;
  scorePercent: number;
  completedAt: string;
  createdAt: string;
}

export interface QuizQuestionReview {
  questionIndex: number;
  prompt: string;
  choices: string[];
  selectedChoiceIndex: number;
  correctChoiceIndex: number;
  correct: boolean;
  explanation: string;
  sourcePages: number[];
}

export interface QuizAttemptReview {
  attempt: QuizAttemptSummary;
  review: QuizQuestionReview[];
}

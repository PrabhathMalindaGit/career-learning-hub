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

export interface Flashcard {
  _id: string;
  cardIndex: number;
  front: string;
  back: string;
  sourcePages: number[];
}

export interface QuizQuestion {
  questionIndex: number;
  prompt: string;
  choices: string[];
  sourcePages: number[];
}

export interface QuizAttemptReview {
  questionIndex: number;
  selectedChoiceIndex: number;
  correctChoiceIndex: number;
  correct: boolean;
  explanation: string;
  sourcePages: number[];
}

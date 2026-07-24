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
  status: LearningDocumentStatus;
  pageCount: number;
  chunkCount: number;
  summary?: string;
  summaryKeyPoints: string[];
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  _id: string;
  chunkIndex: number;
  pageStart: number;
  pageEnd: number;
  text: string;
  wordCount: number;
}

export interface LearningMessage {
  _id: string;
  role: "user" | "assistant";
  content: string;
  sourcePages: number[];
  createdAt: string;
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

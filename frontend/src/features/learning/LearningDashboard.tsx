import { useState } from "react";
import { DocumentChat } from "./DocumentChat";
import { DocumentViewer } from "./DocumentViewer";
import { FlashcardStudy } from "./FlashcardStudy";
import { QuizTaker } from "./QuizTaker";
import type {
  DocumentChunk,
  Flashcard,
  LearningDocument,
  LearningMessage,
  QuizAttemptReview,
  QuizQuestion,
} from "./types";
import "./learningWorkspace.css";

const exampleDocument: LearningDocument = {
  id: "document-placeholder",
  title: "Learning document",
  originalFilename: "learning-document.pdf",
  status: "ready",
  pageCount: 2,
  chunkCount: 2,
  summary:
    "The processed-document summary and grounded study tools appear in this workspace.",
  summaryKeyPoints: [
    "PDF text is processed asynchronously.",
    "Chat answers cite retrieved pages.",
    "Quiz answers remain hidden until submission.",
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const exampleChunks: DocumentChunk[] = [
  {
    _id: "chunk-0",
    chunkIndex: 0,
    pageStart: 1,
    pageEnd: 1,
    text:
      "Document chunks preserve their source page number and are stored independently for pagination and retrieval.",
    wordCount: 16,
  },
  {
    _id: "chunk-1",
    chunkIndex: 1,
    pageStart: 2,
    pageEnd: 2,
    text:
      "Flashcards, quiz questions, conversations, and messages use separate collections rather than growing inside one document record.",
    wordCount: 17,
  },
];

const exampleCards: Flashcard[] = [
  {
    _id: "card-0",
    cardIndex: 0,
    front: "Why are document chunks stored separately?",
    back:
      "To support bounded documents, pagination, retrieval, indexing, and strict cascading deletion.",
    sourcePages: [1, 2],
  },
];

const exampleQuestions: QuizQuestion[] = [
  {
    questionIndex: 0,
    prompt:
      "Which design prevents a conversation record from growing without bound?",
    choices: [
      "Embed every message in the conversation",
      "Store messages in a separate collection",
      "Store messages in browser memory only",
    ],
    sourcePages: [2],
  },
];

export function LearningDashboard() {
  const [messages, setMessages] = useState<LearningMessage[]>([]);
  const [review, setReview] = useState<QuizAttemptReview[]>();

  const sendMessage = (content: string) => {
    setMessages((current) => [
      ...current,
      {
        _id: crypto.randomUUID(),
        role: "user",
        content,
        sourcePages: [],
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  return (
    <section
      className="learning-dashboard"
      aria-label="Learning Workspace"
    >
      <div className="learning-dashboard-heading">
        <div>
          <p className="eyebrow">Phase 6</p>
          <h2>Learning Workspace</h2>
          <p>
            Upload private PDFs, review page-preserving chunks,
            ask grounded questions, study flashcards, and complete
            assessments without fabricated streaks.
          </p>
        </div>

        <label className="learning-upload-button">
          Upload PDF
          <input
            type="file"
            accept="application/pdf"
            onChange={(event) =>
              console.info(
                "Connect uploadLearningDocument",
                event.target.files?.[0],
              )
            }
          />
        </label>
      </div>

      <div className="learning-dashboard-grid">
        <DocumentViewer
          document={exampleDocument}
          chunks={exampleChunks}
          onSelectPage={(page) =>
            console.info("Open PDF page", page)
          }
        />

        <DocumentChat
          messages={messages}
          onSend={sendMessage}
        />

        <FlashcardStudy cards={exampleCards} />

        <QuizTaker
          questions={exampleQuestions}
          review={review}
          onSubmit={(answers) => {
            const selected = answers[0]?.selectedChoiceIndex ?? -1;
            setReview([
              {
                questionIndex: 0,
                selectedChoiceIndex: selected,
                correctChoiceIndex: 1,
                correct: selected === 1,
                explanation:
                  "Messages are separate documents, so the conversation record remains bounded.",
                sourcePages: [2],
              },
            ]);
          }}
        />
      </div>
    </section>
  );
}

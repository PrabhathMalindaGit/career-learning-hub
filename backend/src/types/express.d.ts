import type { UserDocument } from "../modules/users/user.model.js";
import type { InterviewSessionDocument } from "../modules/interviews/interviewSession.model.js";
import type { InterviewQuestionDocument } from "../modules/interviews/interviewQuestion.model.js";
import type { InterviewAttemptDocument } from "../modules/interviews/interviewAttempt.model.js";
import type { LearningDocumentDocument } from "../modules/learning/learningDocument.model.js";
import type { ConversationDocument } from "../modules/learning/conversation.model.js";
import type { FlashcardSetDocument } from "../modules/learning/flashcardSet.model.js";
import type { QuizDocument } from "../modules/learning/quiz.model.js";
import type { QuizAttemptDocument } from "../modules/learning/quizAttempt.model.js";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: {
        userId: string;
        sessionId: string;
      };
      user?: UserDocument;
      interviewSession?: InterviewSessionDocument;
      interviewQuestion?: InterviewQuestionDocument;
      interviewAttempt?: InterviewAttemptDocument;
      learningDocument?: LearningDocumentDocument;
      learningConversation?: ConversationDocument;
      flashcardSet?: FlashcardSetDocument;
      learningQuiz?: QuizDocument;
      quizAttempt?: QuizAttemptDocument;
    }
  }
}

export {};

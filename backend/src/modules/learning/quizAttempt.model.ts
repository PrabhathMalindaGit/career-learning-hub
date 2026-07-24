import { Schema, Types, model, type HydratedDocument } from "mongoose";

export interface QuizAttemptAnswer {
  questionId: Types.ObjectId;
  questionIndex: number;
  selectedChoiceIndex: number;
  correct: boolean;
}

export interface QuizAttempt {
  userId: Types.ObjectId;
  documentId: Types.ObjectId;
  quizId: Types.ObjectId;
  answers: QuizAttemptAnswer[];
  correctCount: number;
  questionCount: number;
  scorePercent: number;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type QuizAttemptDocument =
  HydratedDocument<QuizAttempt>;

const answerSchema = new Schema<QuizAttemptAnswer>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "QuizQuestion",
      required: true,
    },
    questionIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    selectedChoiceIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 7,
    },
    correct: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false },
);

const quizAttemptSchema = new Schema<QuizAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "LearningDocument",
      required: true,
    },
    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    answers: {
      type: [answerSchema],
      required: true,
      validate: [
        {
          validator: (value: QuizAttemptAnswer[]) =>
            value.length >= 1 && value.length <= 500,
          message: "A quiz attempt must contain 1–500 answers.",
        },
        {
          validator: (value: QuizAttemptAnswer[]) =>
            new Set(value.map((answer) => answer.questionIndex)).size ===
            value.length,
          message:
            "A quiz attempt cannot contain duplicate question indexes.",
        },
      ],
    },
    correctCount: {
      type: Number,
      required: true,
      min: 0,
    },
    questionCount: {
      type: Number,
      required: true,
      min: 1,
    },
    scorePercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    completedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

quizAttemptSchema.index({
  userId: 1,
  quizId: 1,
  completedAt: -1,
});
quizAttemptSchema.index({ userId: 1, completedAt: -1 });
quizAttemptSchema.index({
  userId: 1,
  documentId: 1,
  completedAt: -1,
});

export const QuizAttemptModel = model<QuizAttempt>(
  "QuizAttempt",
  quizAttemptSchema,
);

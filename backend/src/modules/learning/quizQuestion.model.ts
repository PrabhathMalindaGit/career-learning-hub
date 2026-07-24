import { Schema, Types, model, type HydratedDocument } from "mongoose";

export interface QuizQuestion {
  userId: Types.ObjectId;
  documentId: Types.ObjectId;
  quizId: Types.ObjectId;
  questionIndex: number;
  prompt: string;
  choices: string[];
  correctChoiceIndex: number;
  explanation: string;
  sourceChunkIds: Types.ObjectId[];
  sourcePages: number[];
  createdAt: Date;
  updatedAt: Date;
}

export type QuizQuestionDocument =
  HydratedDocument<QuizQuestion>;

const quizQuestionSchema = new Schema<QuizQuestion>(
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
    questionIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 4_000,
    },
    choices: {
      type: [{ type: String, trim: true, minlength: 1, maxlength: 2_000 }],
      required: true,
      validate: {
        validator: (value: string[]) =>
          value.length >= 2 &&
          value.length <= 8 &&
          new Set(value.map((item) => item.toLowerCase())).size ===
            value.length,
        message:
          "Quiz questions require 2–8 unique answer choices.",
      },
    },
    correctChoiceIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 7,
    },
    explanation: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 8_000,
    },
    sourceChunkIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "DocumentChunk" }],
      default: [],
      validate: {
        validator: (value: Types.ObjectId[]) => value.length <= 20,
        message: "A quiz question can reference at most 20 chunks.",
      },
    },
    sourcePages: {
      type: [{ type: Number, min: 1 }],
      default: [],
      validate: {
        validator: (value: number[]) => value.length <= 50,
        message: "A quiz question can reference at most 50 pages.",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

quizQuestionSchema.pre(
  "validate",
  function validateCorrectChoice(this: QuizQuestionDocument) {
    if (
      this.correctChoiceIndex >= 0 &&
      this.correctChoiceIndex >= this.choices.length
    ) {
      this.invalidate(
        "correctChoiceIndex",
        "The correct choice index is outside the choices array.",
      );
    }
  },
);

quizQuestionSchema.index(
  { quizId: 1, questionIndex: 1 },
  {
    unique: true,
    name: "quiz_question_index_unique",
  },
);
quizQuestionSchema.index({
  userId: 1,
  documentId: 1,
  quizId: 1,
  questionIndex: 1,
});

export const QuizQuestionModel = model<QuizQuestion>(
  "QuizQuestion",
  quizQuestionSchema,
);

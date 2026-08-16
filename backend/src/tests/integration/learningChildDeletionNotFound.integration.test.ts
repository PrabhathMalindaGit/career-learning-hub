import { Types } from "mongoose";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../app.js";
import { LearningDocumentModel } from "../../modules/learning/learningDocument.model.js";
import { registerTestUser } from "../helpers/auth.js";

describe("Learning child deletion not-found behavior", () => {
  it("returns the canonical 404 when an owned document has no matching conversation", async () => {
    const owner = await registerTestUser(app, {
      email: "learning-child-delete-missing-chat@example.com",
      displayName: "Learning Child Missing Chat",
    });
    const document = await LearningDocumentModel.create({
      userId: owner.userId,
      assetId: new Types.ObjectId(),
      title: "Missing conversation",
      originalFilename: "missing-conversation.pdf",
      mimeType: "application/pdf",
      status: "ready",
      pageCount: 1,
      chunkCount: 1,
    });

    const response = await request(app)
      .delete(
        `/api/v1/learning-documents/${document._id.toString()}/conversations/${new Types.ObjectId().toString()}`,
      )
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(404);

    expect(response.body.error.code).toBe("LEARNING_CONVERSATION_NOT_FOUND");
  });

  it("returns the canonical 404 for a missing flashcard set", async () => {
    const owner = await registerTestUser(app, {
      email: "learning-child-delete-missing-flashcards@example.com",
      displayName: "Learning Child Missing Flashcards",
    });

    const response = await request(app)
      .delete(`/api/v1/flashcard-sets/${new Types.ObjectId().toString()}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(404);

    expect(response.body.error.code).toBe("FLASHCARD_SET_NOT_FOUND");
  });

  it("returns the canonical 404 for a missing quiz", async () => {
    const owner = await registerTestUser(app, {
      email: "learning-child-delete-missing-quiz@example.com",
      displayName: "Learning Child Missing Quiz",
    });

    const response = await request(app)
      .delete(`/api/v1/quizzes/${new Types.ObjectId().toString()}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(404);

    expect(response.body.error.code).toBe("QUIZ_NOT_FOUND");
  });
});

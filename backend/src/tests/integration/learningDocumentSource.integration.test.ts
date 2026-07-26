import { Readable } from "node:stream";
import { Types } from "mongoose";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { app } from "../../app.js";
import { env } from "../../config/env.js";
import { AssetModel } from "../../modules/assets/asset.model.js";
import { createAsset } from "../../modules/assets/asset.service.js";
import { signAccessToken } from "../../modules/auth/token.service.js";
import { LearningDocumentModel } from "../../modules/learning/learningDocument.model.js";
import { UserModel } from "../../modules/users/user.model.js";

const syntheticPdf = Buffer.from(
  "%PDF-1.4\n% Synthetic Phase 12A private PDF\n%%EOF\n",
);

interface TestUser {
  accessToken: string;
  userId: string;
}

async function createTestUser(input: {
  email: string;
  displayName: string;
}): Promise<TestUser> {
  const user = await UserModel.create({
    email: input.email,
    passwordHash: "SyntheticPassword1",
    profile: {
      displayName: input.displayName,
    },
    roles: ["user"],
    accountStatus: "active",
  });

  return {
    accessToken: signAccessToken(
      user._id.toString(),
      new Types.ObjectId().toString(),
    ),
    userId: user._id.toString(),
  };
}

function pdfUpload(filename = "private-source.pdf"): Express.Multer.File {
  return {
    fieldname: "file",
    originalname: filename,
    encoding: "7bit",
    mimetype: "application/pdf",
    size: syntheticPdf.byteLength,
    buffer: syntheticPdf,
    stream: Readable.from(syntheticPdf),
    destination: "",
    filename: "",
    path: "",
  };
}

async function createLearningFixture(
  user: TestUser,
  title = "Private Source",
) {
  const asset = await createAsset({
    userId: user.userId,
    purpose: "learning-document",
    file: pdfUpload(),
  });
  const document = await LearningDocumentModel.create({
    userId: user.userId,
    assetId: asset._id,
    title,
    originalFilename: asset.originalFilename,
    mimeType: "application/pdf",
    status: "ready",
  });

  asset.metadata = {
    learningDocumentId: document._id.toString(),
  };
  await asset.save();

  return { asset, document };
}

function authorize(user: TestUser) {
  return {
    Authorization: `Bearer ${user.accessToken}`,
  };
}

function targetPath(targetUrl: string): string {
  const url = new URL(targetUrl);
  return `${url.pathname}${url.search}`;
}

function publicError(response: request.Response) {
  return {
    code: response.body.error.code,
    message: response.body.error.message,
  };
}

describe("Learning Document private source contract", () => {
  it("allows only the authenticated owner to request the source target", async () => {
    const owner = await createTestUser({
      email: "source-owner@test.example",
      displayName: "Source Owner",
    });
    const { document } = await createLearningFixture(owner);

    const response = await request(app)
      .get(
        `/api/v1/learning-documents/${document._id.toString()}/source`,
      )
      .set(authorize(owner))
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: {
        source: {
          url: expect.any(String),
          expiresAt: expect.any(String),
          contentType: "application/pdf",
        },
      },
    });
  });

  it("rejects unauthenticated source requests through existing authentication", async () => {
    const owner = await createTestUser({
      email: "source-unauthenticated@test.example",
      displayName: "Unauthenticated Source",
    });
    const { document } = await createLearningFixture(owner);

    const response = await request(app)
      .get(
        `/api/v1/learning-documents/${document._id.toString()}/source`,
      )
      .expect(401);

    expect(response.body.error.code).toBe(
      "AUTHENTICATION_REQUIRED",
    );
  });

  it("returns the same safe owned 404 for missing and foreign documents", async () => {
    const owner = await createTestUser({
      email: "source-owned-404@test.example",
      displayName: "Owned 404 Owner",
    });
    const otherUser = await createTestUser({
      email: "source-owned-404-other@test.example",
      displayName: "Owned 404 Other",
    });
    const { document } = await createLearningFixture(owner);

    const foreign = await request(app)
      .get(
        `/api/v1/learning-documents/${document._id.toString()}/source`,
      )
      .set(authorize(otherUser))
      .expect(404);
    const missing = await request(app)
      .get(
        `/api/v1/learning-documents/${new Types.ObjectId().toString()}/source`,
      )
      .set(authorize(otherUser))
      .expect(404);

    expect(publicError(foreign)).toEqual(publicError(missing));
    expect(publicError(foreign)).toEqual({
      code: "LEARNING_DOCUMENT_NOT_FOUND",
      message: "Learning document not found.",
    });
  });

  it("does not let a client-supplied userId override authenticated ownership", async () => {
    const owner = await createTestUser({
      email: "source-userid-owner@test.example",
      displayName: "User ID Owner",
    });
    const otherUser = await createTestUser({
      email: "source-userid-other@test.example",
      displayName: "User ID Other",
    });
    const { document } = await createLearningFixture(owner);
    const documentId = document._id.toString();

    await request(app)
      .get(
        `/api/v1/learning-documents/${documentId}/source?userId=${otherUser.userId}`,
      )
      .set(authorize(owner))
      .expect(200);

    await request(app)
      .get(
        `/api/v1/learning-documents/${documentId}/source?userId=${owner.userId}`,
      )
      .set(authorize(otherUser))
      .expect(404);
  });

  it("fails safely when the source Asset is missing, foreign, or incorrectly associated", async () => {
    const owner = await createTestUser({
      email: "source-invalid-owner@test.example",
      displayName: "Invalid Source Owner",
    });
    const otherUser = await createTestUser({
      email: "source-invalid-other@test.example",
      displayName: "Invalid Source Other",
    });

    const missingFixture = await createLearningFixture(
      owner,
      "Missing Asset",
    );
    await AssetModel.deleteOne({
      _id: missingFixture.asset._id,
    });

    const missing = await request(app)
      .get(
        `/api/v1/learning-documents/${missingFixture.document._id.toString()}/source`,
      )
      .set(authorize(owner))
      .expect(404);

    const foreignFixture = await createLearningFixture(
      owner,
      "Foreign Asset",
    );
    const otherAsset = await createAsset({
      userId: otherUser.userId,
      purpose: "learning-document",
      file: pdfUpload("other-user.pdf"),
    });
    foreignFixture.document.assetId = otherAsset._id;
    await foreignFixture.document.save();

    const foreign = await request(app)
      .get(
        `/api/v1/learning-documents/${foreignFixture.document._id.toString()}/source`,
      )
      .set(authorize(owner))
      .expect(404);

    const mismatchedFixture = await createLearningFixture(
      owner,
      "Mismatched Asset",
    );
    mismatchedFixture.asset.metadata = {
      learningDocumentId: new Types.ObjectId().toString(),
    };
    await mismatchedFixture.asset.save();

    const mismatched = await request(app)
      .get(
        `/api/v1/learning-documents/${mismatchedFixture.document._id.toString()}/source`,
      )
      .set(authorize(owner))
      .expect(404);

    expect(publicError(missing)).toEqual(
      publicError(foreign),
    );
    expect(publicError(foreign)).toEqual(
      publicError(mismatched),
    );
    expect(publicError(missing)).toEqual({
      code: "LEARNING_DOCUMENT_SOURCE_NOT_FOUND",
      message: "Learning document source not found.",
    });
  });

  it("rejects a non-PDF source Asset safely", async () => {
    const owner = await createTestUser({
      email: "source-non-pdf@test.example",
      displayName: "Non PDF Source",
    });
    const { asset, document } =
      await createLearningFixture(owner);
    asset.mimeType = "image/png";
    await asset.save();

    const response = await request(app)
      .get(
        `/api/v1/learning-documents/${document._id.toString()}/source`,
      )
      .set(authorize(owner))
      .expect(404);

    expect(publicError(response)).toEqual({
      code: "LEARNING_DOCUMENT_SOURCE_NOT_FOUND",
      message: "Learning document source not found.",
    });
  });

  it("returns an exact allowlist with bounded future expiry and no private Asset fields", async () => {
    const owner = await createTestUser({
      email: "source-allowlist@test.example",
      displayName: "Source Allowlist",
    });
    const { asset, document } =
      await createLearningFixture(owner);
    const before = Date.now();

    const response = await request(app)
      .get(
        `/api/v1/learning-documents/${document._id.toString()}/source`,
      )
      .set(authorize(owner))
      .expect(200);

    const source = response.body.data.source;
    const expiresAt = new Date(source.expiresAt).getTime();

    expect(Object.keys(source).sort()).toEqual([
      "contentType",
      "expiresAt",
      "url",
    ]);
    expect(expiresAt).toBeGreaterThan(before);
    expect(expiresAt).toBeLessThanOrEqual(
      before + env.ASSET_SIGNED_URL_TTL_SECONDS * 1_000 + 1_000,
    );
    expect(source).not.toHaveProperty("assetId");
    expect(source).not.toHaveProperty("storageKey");
    expect(source).not.toHaveProperty("storageProvider");
    expect(source).not.toHaveProperty("provider");
    expect(source).not.toHaveProperty("checksumSha256");
    expect(source).not.toHaveProperty("path");
    expect(source).not.toHaveProperty("metadata");
    expect(source).not.toHaveProperty("userId");
    expect(response.text).not.toContain(asset.storageKey);
    expect(response.text).not.toContain(
      asset.checksumSha256,
    );
  });

  it("preserves private no-store and request IDs for success and error responses", async () => {
    const owner = await createTestUser({
      email: "source-request-id@test.example",
      displayName: "Source Request ID",
    });
    const { document } = await createLearningFixture(owner);
    const successRequestId = "phase12a-success-request";
    const errorRequestId = "phase12a-error-request";

    const success = await request(app)
      .get(
        `/api/v1/learning-documents/${document._id.toString()}/source`,
      )
      .set(authorize(owner))
      .set("x-request-id", successRequestId)
      .expect(200);
    const error = await request(app)
      .get(
        `/api/v1/learning-documents/${new Types.ObjectId().toString()}/source`,
      )
      .set(authorize(owner))
      .set("x-request-id", errorRequestId)
      .expect(404);

    expect(success.headers["cache-control"]).toBe(
      "private, no-store",
    );
    expect(error.headers["cache-control"]).toBe(
      "private, no-store",
    );
    expect(success.headers["x-request-id"]).toBe(
      successRequestId,
    );
    expect(error.headers["x-request-id"]).toBe(
      errorRequestId,
    );
    expect(error.body.error.requestId).toBe(errorRequestId);
  });

  it("resolves the local target to the PDF with no-store and requires fresh authorization after expiry", async () => {
    const owner = await createTestUser({
      email: "source-expiry@test.example",
      displayName: "Source Expiry",
    });
    const { document } = await createLearningFixture(owner);
    const now = Date.now();
    const clock = vi
      .spyOn(Date, "now")
      .mockReturnValue(now);

    const sourceResponse = await request(app)
      .get(
        `/api/v1/learning-documents/${document._id.toString()}/source`,
      )
      .set(authorize(owner))
      .expect(200);
    const firstSource = sourceResponse.body.data.source;

    const resolved = await request(app)
      .get(targetPath(firstSource.url))
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () =>
          callback(null, Buffer.concat(chunks)),
        );
      })
      .expect(200);

    expect(resolved.headers["content-type"]).toMatch(
      /^application\/pdf\b/,
    );
    expect(resolved.headers["cache-control"]).toBe(
      "private, no-store",
    );
    expect(resolved.body).toEqual(syntheticPdf);

    clock.mockReturnValue(
      new Date(firstSource.expiresAt).getTime() + 1_000,
    );

    const expired = await request(app)
      .get(targetPath(firstSource.url))
      .expect(401);
    expect(expired.body.error.code).toBe(
      "INVALID_ASSET_SIGNATURE",
    );

    const refreshed = await request(app)
      .get(
        `/api/v1/learning-documents/${document._id.toString()}/source`,
      )
      .set(authorize(owner))
      .expect(200);

    expect(
      new Date(
        refreshed.body.data.source.expiresAt,
      ).getTime(),
    ).toBeGreaterThan(
      new Date(firstSource.expiresAt).getTime(),
    );
  });

  it("does not add a permanent source URL to existing Learning Document DTOs and preserves Asset signed targets", async () => {
    const owner = await createTestUser({
      email: "source-compatibility@test.example",
      displayName: "Source Compatibility",
    });
    const { asset, document } =
      await createLearningFixture(owner);

    const detail = await request(app)
      .get(
        `/api/v1/learning-documents/${document._id.toString()}`,
      )
      .set(authorize(owner))
      .expect(200);
    const list = await request(app)
      .get("/api/v1/learning-documents")
      .set(authorize(owner))
      .expect(200);
    const assetTarget = await request(app)
      .post(
        `/api/v1/assets/${asset._id.toString()}/signed-url`,
      )
      .set(authorize(owner))
      .send({})
      .expect(200);

    for (const documentDto of [
      detail.body.data.document,
      list.body.data.documents[0],
    ]) {
      expect(documentDto).not.toHaveProperty("source");
      expect(documentDto).not.toHaveProperty("sourceUrl");
      expect(documentDto).not.toHaveProperty("url");
      expect(documentDto).not.toHaveProperty("assetId");
    }
    expect(assetTarget.body).toEqual({
      success: true,
      data: {
        url: expect.any(String),
        expiresAt: expect.any(String),
      },
    });
  });

  it("does not log the target URL or private Asset metadata", async () => {
    const owner = await createTestUser({
      email: "source-logging@test.example",
      displayName: "Source Logging",
    });
    const { asset, document } =
      await createLearningFixture(owner);
    const previousLogLevel = process.env.LOG_LEVEL;
    const previousRequestLogging =
      process.env.REQUEST_LOGGING_ENABLED;
    process.env.LOG_LEVEL = "info";
    process.env.REQUEST_LOGGING_ENABLED = "true";
    const writes: string[] = [];
    const writeSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation((chunk) => {
        writes.push(String(chunk));
        return true;
      });

    try {
      const response = await request(app)
        .get(
          `/api/v1/learning-documents/${document._id.toString()}/source`,
        )
        .set(authorize(owner))
        .expect(200);
      const logged = writes.join("");

      expect(logged).not.toContain(
        response.body.data.source.url,
      );
      expect(logged).not.toContain(asset.storageKey);
      expect(logged).not.toContain(asset.storageProvider);
      expect(logged).not.toContain(asset.checksumSha256);
      expect(logged).not.toContain("signature=");
    } finally {
      writeSpy.mockRestore();
      process.env.LOG_LEVEL = previousLogLevel;
      process.env.REQUEST_LOGGING_ENABLED =
        previousRequestLogging;
    }
  });
});

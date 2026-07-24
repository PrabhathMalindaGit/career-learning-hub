import { beforeAll, describe, expect, it } from "vitest";
import { Types } from "mongoose";
import { createBlankResumeContent } from "../../modules/resumes/resume.validation.js";
import { ResumeVersionModel } from "../../modules/resumes/resumeVersion.model.js";

function createVersionInput(input: {
  userId: Types.ObjectId;
  resumeId: Types.ObjectId;
  versionNumber: number;
  sourceAssetId?: Types.ObjectId | null;
}) {
  return {
    userId: input.userId,
    resumeId: input.resumeId,
    versionNumber: input.versionNumber,
    source: input.sourceAssetId ? "pdf-import" as const : "manual" as const,
    sourceAssetId: input.sourceAssetId,
    content: createBlankResumeContent(),
  };
}

describe("ResumeVersion source asset index", () => {
  beforeAll(async () => {
    await ResumeVersionModel.init();
  });

  it("permits multiple manual versions when sourceAssetId is absent or null", async () => {
    const userId = new Types.ObjectId();
    const resumeId = new Types.ObjectId();

    await ResumeVersionModel.create(
      createVersionInput({
        userId,
        resumeId,
        versionNumber: 1,
      }),
    );
    await ResumeVersionModel.create(
      createVersionInput({
        userId,
        resumeId,
        versionNumber: 2,
      }),
    );
    await ResumeVersionModel.create(
      createVersionInput({
        userId,
        resumeId,
        versionNumber: 3,
        sourceAssetId: null,
      }),
    );

    await expect(
      ResumeVersionModel.countDocuments({ userId, resumeId }),
    ).resolves.toBe(3);
  });

  it("rejects the same imported sourceAssetId twice for one user", async () => {
    const userId = new Types.ObjectId();
    const sourceAssetId = new Types.ObjectId();

    await ResumeVersionModel.create(
      createVersionInput({
        userId,
        resumeId: new Types.ObjectId(),
        versionNumber: 1,
        sourceAssetId,
      }),
    );

    await expect(
      ResumeVersionModel.create(
        createVersionInput({
          userId,
          resumeId: new Types.ObjectId(),
          versionNumber: 1,
          sourceAssetId,
        }),
      ),
    ).rejects.toMatchObject({
      code: 11_000,
      keyPattern: {
        userId: 1,
        sourceAssetId: 1,
      },
    });
  });

  it("permits different users to use the same imported sourceAssetId", async () => {
    const sourceAssetId = new Types.ObjectId();

    await ResumeVersionModel.create(
      createVersionInput({
        userId: new Types.ObjectId(),
        resumeId: new Types.ObjectId(),
        versionNumber: 1,
        sourceAssetId,
      }),
    );
    await ResumeVersionModel.create(
      createVersionInput({
        userId: new Types.ObjectId(),
        resumeId: new Types.ObjectId(),
        versionNumber: 1,
        sourceAssetId,
      }),
    );

    await expect(
      ResumeVersionModel.countDocuments({ sourceAssetId }),
    ).resolves.toBe(2);
  });
});

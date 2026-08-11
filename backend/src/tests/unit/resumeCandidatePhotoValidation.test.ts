import { describe, expect, it } from "vitest";
import {
  candidatePhotoMutationBodySchema,
  candidatePhotoUploadBodySchema,
} from "../../modules/resumes/resume.validation.js";

const assetId = "64b64c8d8c6f8b0012345678";

describe("Candidate Photo request validation", () => {
  it.each([
    [{ expectedCandidatePhotoAssetId: "none" }],
    [{ expectedCandidatePhotoAssetId: assetId }],
  ])("accepts explicit expected attachment state", (input) => {
    expect(candidatePhotoUploadBodySchema.parse(input)).toEqual(input);
    expect(candidatePhotoMutationBodySchema.parse(input)).toEqual(input);
  });

  it.each([
    {},
    { expectedCandidatePhotoAssetId: "" },
    { expectedCandidatePhotoAssetId: "not-an-object-id" },
    { expectedCandidatePhotoAssetId: assetId, userId: assetId },
    { expectedCandidatePhotoAssetId: assetId, storageKey: "private/path" },
  ])("rejects omitted, malformed, or mass-assigned state", (input) => {
    expect(candidatePhotoUploadBodySchema.safeParse(input).success).toBe(false);
    expect(candidatePhotoMutationBodySchema.safeParse(input).success).toBe(false);
  });
});

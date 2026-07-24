import { describe, expect, it, vi } from "vitest";
import { ResumeModel } from "../../modules/resumes/resume.model.js";
import { requireOwnedResume } from "../../modules/resumes/resume.service.js";

describe("ownership services", () => {
  it("queries a resume with both resource ID and authenticated user ID", async () => {
    const fakeResume = {
      _id: "507f1f77bcf86cd799439011",
    };
    const findOne = vi
      .spyOn(ResumeModel, "findOne")
      .mockReturnValue(
        Promise.resolve(fakeResume) as never,
      );

    const result = await requireOwnedResume(
      "507f1f77bcf86cd799439012",
      "507f1f77bcf86cd799439011",
    );

    expect(result).toBe(fakeResume);
    expect(findOne).toHaveBeenCalledWith({
      _id: "507f1f77bcf86cd799439011",
      userId: "507f1f77bcf86cd799439012",
    });
  });

  it("returns the same not-found error for an unowned resume", async () => {
    vi.spyOn(ResumeModel, "findOne").mockReturnValue(
      Promise.resolve(null) as never,
    );

    await expect(
      requireOwnedResume(
        "507f1f77bcf86cd799439012",
        "507f1f77bcf86cd799439011",
      ),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: "RESUME_NOT_FOUND",
    });
  });
});

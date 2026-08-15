import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResumeImportPhotoChoices } from "./ResumeImportPhotoChoices";
import * as candidatePhoto from "./resumeCandidatePhoto";
import * as resumeApi from "./resumeApi";

vi.mock("./resumeApi", () => ({
  fetchResumeImportPhotoCandidateSource: vi.fn(),
}));

vi.mock("./resumeCandidatePhoto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./resumeCandidatePhoto")>();
  return {
    ...actual,
    loadCanonicalCandidatePhoto: vi.fn(),
  };
});

const firstAssetId = "507f1f77bcf86cd799439015";
const secondAssetId = "507f1f77bcf86cd799439016";

function candidates() {
  return [{ assetId: firstAssetId }, { assetId: secondAssetId }];
}

describe("ResumeImportPhotoChoices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resumeApi.fetchResumeImportPhotoCandidateSource).mockImplementation(
      async (assetId) => ({
        url: `https://example.test/${assetId}`,
        expiresAt: "2026-08-15T01:00:00.000Z",
      }),
    );
    vi.mocked(candidatePhoto.loadCanonicalCandidatePhoto).mockImplementation(
      async (source) => `blob:${source.url}`,
    );
  });

  it("defaults to no photo and never auto-selects an extracted image", async () => {
    const onChange = vi.fn();
    render(
      <ResumeImportPhotoChoices
        candidates={candidates()}
        selectedAssetId={undefined}
        disabled={false}
        onChange={onChange}
      />,
    );

    expect(
      screen.getByRole("group", { name: "Possible candidate photo from PDF" }),
    ).not.toBeNull();
    const none = screen.getByRole("radio", { name: "Do not import a photo" });
    expect((none as HTMLInputElement).checked).toBe(true);
    expect(
      (screen.getByRole("radio", { name: "Use extracted photo 1" }) as HTMLInputElement)
        .checked,
    ).toBe(false);
    expect(onChange).not.toHaveBeenCalled();

    expect(await screen.findByAltText("Extracted PDF image 1")).not.toBeNull();
    expect(await screen.findByAltText("Extracted PDF image 2")).not.toBeNull();
    expect(resumeApi.fetchResumeImportPhotoCandidateSource).toHaveBeenCalledTimes(2);
  });

  it("reports one explicit mutually exclusive selection", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <ResumeImportPhotoChoices
        candidates={candidates()}
        selectedAssetId={undefined}
        disabled={false}
        onChange={onChange}
      />,
    );

    await user.click(
      screen.getByRole("radio", { name: "Use extracted photo 2" }),
    );
    expect(onChange).toHaveBeenLastCalledWith(secondAssetId);

    rerender(
      <ResumeImportPhotoChoices
        candidates={candidates()}
        selectedAssetId={secondAssetId}
        disabled={false}
        onChange={onChange}
      />,
    );
    expect(
      (screen.getByRole("radio", { name: "Use extracted photo 2" }) as HTMLInputElement)
        .checked,
    ).toBe(true);

    await user.click(screen.getByRole("radio", { name: "Do not import a photo" }));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });

  it("keeps a candidate selectable even when its preview is unavailable", async () => {
    vi.mocked(candidatePhoto.loadCanonicalCandidatePhoto).mockRejectedValueOnce(
      new Error("preview unavailable"),
    );
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <ResumeImportPhotoChoices
        candidates={[{ assetId: firstAssetId }]}
        selectedAssetId={undefined}
        disabled={false}
        onChange={onChange}
      />,
    );

    expect(await screen.findByText("Preview unavailable")).not.toBeNull();
    const candidate = screen.getByRole("radio", { name: "Use extracted photo 1" });
    await user.click(candidate);
    expect(onChange).toHaveBeenCalledWith(firstAssetId);
  });

  it("disables all choices while confirmation is busy", () => {
    render(
      <ResumeImportPhotoChoices
        candidates={candidates()}
        selectedAssetId={undefined}
        disabled
        onChange={vi.fn()}
      />,
    );

    for (const radio of screen.getAllByRole("radio")) {
      expect((radio as HTMLInputElement).disabled).toBe(true);
    }
  });

  it("revokes loaded object URLs when candidates leave the review", async () => {
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const { unmount } = render(
      <ResumeImportPhotoChoices
        candidates={[{ assetId: firstAssetId }]}
        selectedAssetId={undefined}
        disabled={false}
        onChange={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByAltText("Extracted PDF image 1").getAttribute("src"),
      ).toContain("blob:"),
    );
    unmount();
    expect(revoke).toHaveBeenCalledWith(`blob:https://example.test/${firstAssetId}`);
    revoke.mockRestore();
  });
});

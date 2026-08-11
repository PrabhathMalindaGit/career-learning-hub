import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResumeCandidatePhotoControls } from "./ResumeCandidatePhotoControls";

function renderControls(
  overrides: Partial<React.ComponentProps<typeof ResumeCandidatePhotoControls>> = {},
) {
  const props: React.ComponentProps<typeof ResumeCandidatePhotoControls> = {
    hasPhoto: false,
    visible: false,
    sourceLoading: false,
    busy: false,
    onSelectFile: vi.fn(),
    onShow: vi.fn(),
    onHide: vi.fn(),
    onRemove: vi.fn(),
    onRetrySource: vi.fn(),
    ...overrides,
  };
  render(<ResumeCandidatePhotoControls {...props} />);
  return props;
}

describe("ResumeCandidatePhotoControls", () => {
  it("offers an optional local file chooser when no photo exists", () => {
    renderControls();
    expect(screen.getByRole("heading", { name: "Candidate photo" })).toBeTruthy();
    expect(screen.getByText("Not added")).toBeTruthy();
    expect(screen.getByLabelText("Choose photo")).toHaveAttribute(
      "accept",
      "image/jpeg,image/png,image/webp",
    );
    expect(screen.queryByRole("button", { name: "Remove photo" })).toBeNull();
  });

  it("submits the exact selected File", () => {
    const onSelectFile = vi.fn();
    renderControls({ onSelectFile });
    const input = screen.getByLabelText("Choose photo") as HTMLInputElement;
    const file = new File([new Uint8Array(16)], "candidate.png", {
      type: "image/png",
    });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onSelectFile).toHaveBeenCalledWith(file);
  });

  it("shows a non-redundant thumbnail and Hide when the photo is visible", () => {
    renderControls({
      hasPhoto: true,
      visible: true,
      sourceUrl: "blob:canonical",
    });
    expect(screen.getByAltText("Candidate photo preview")).toHaveAttribute(
      "src",
      "blob:canonical",
    );
    expect(screen.getByRole("button", { name: "Hide from Resume" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Show on Resume" })).toBeNull();
  });

  it("offers Show for a stored hidden photo", () => {
    const onShow = vi.fn();
    renderControls({ hasPhoto: true, visible: false, onShow });
    fireEvent.click(screen.getByRole("button", { name: "Show on Resume" }));
    expect(onShow).toHaveBeenCalledTimes(1);
  });

  it("confirms Remove before invoking the destructive action", () => {
    const onRemove = vi.fn();
    renderControls({ hasPhoto: true, visible: true, onRemove });
    fireEvent.click(screen.getByRole("button", { name: "Remove photo" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove photo" }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("surfaces source failure with bounded retry", () => {
    const onRetrySource = vi.fn();
    renderControls({
      hasPhoto: true,
      visible: true,
      error: "The saved candidate photo could not be loaded.",
      requestId: "request_1234567890",
      onRetrySource,
    });
    expect(screen.getByRole("alert").textContent).toContain(
      "The saved candidate photo could not be loaded.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry saved photo" }));
    expect(onRetrySource).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LearningGenerationJobStatus } from "./LearningGenerationJobStatus";

describe("LearningGenerationJobStatus", () => {
  it.each([
    ["queued", "Flashcard generation is queued."],
    ["processing", "Quiz generation is processing."],
    ["cancelled", "Flashcard generation was cancelled."],
    ["completed", "Canonical quiz questions are ready."],
  ] as const)("renders %s updates with status semantics", (status, message) => {
    render(
      <LearningGenerationJobStatus
        status={status}
        message={message}
      />,
    );

    expect(screen.getByRole("status").textContent).toBe(message);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps paused copy, request ID, and recovery action caller-owned", async () => {
    const onResume = vi.fn();
    render(
      <LearningGenerationJobStatus
        status="paused"
        message="Caller-owned paused explanation."
        requestId="request-job-0001"
        actions={
          <button type="button" onClick={onResume}>
            Resume caller checks
          </button>
        }
      />,
    );

    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(
      screen.getByText("Request ID: request-job-0001"),
    ).not.toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "Resume caller checks" }),
    );
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it.each(["failed", "unavailable"] as const)(
    "renders %s only as an explicit alert",
    (status) => {
      render(
        <LearningGenerationJobStatus
          status={status}
          message="Caller-owned generation failure."
          requestId="request-failure-0001"
        />,
      );

      expect(screen.getByRole("alert").textContent).toContain(
        "Caller-owned generation failure.",
      );
      expect(screen.getByRole("alert").textContent).toContain(
        "request-failure-0001",
      );
    },
  );
});

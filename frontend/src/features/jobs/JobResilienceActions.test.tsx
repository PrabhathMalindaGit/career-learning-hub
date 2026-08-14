import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JobResilienceActions } from "./JobResilienceActions";

const activeJob = {
  id: "507f1f77bcf86cd799439014",
  type: "resume.analyze",
  status: "processing" as const,
  phase: "waiting_for_first_response" as const,
  phaseSequence: 3,
  progress: 40,
  attempts: 1,
  maxAttempts: 3,
  canRetry: false,
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-08-06T00:00:01.000Z",
};

describe("JobResilienceActions", () => {
  it("announces safe progress and suppresses duplicate Cancel clicks", async () => {
    let release!: () => void;
    const onCancel = vi.fn(() => new Promise<void>((resolve) => {
      release = resolve;
    }));
    render(<JobResilienceActions job={activeJob} onCancel={onCancel} />);

    expect(screen.getByRole("status").textContent).toContain("Waiting for response");
    const cancel = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancel);
    fireEvent.click(cancel);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(cancel.getAttribute("aria-busy")).toBe("true");
    release();
    await waitFor(() => expect((cancel as HTMLButtonElement).disabled).toBe(false));
  });

  it("shows Retry only for eligible terminal jobs and suppresses duplicate clicks", async () => {
    const onRetry = vi.fn().mockResolvedValue(undefined);
    render(
      <JobResilienceActions
        job={{
          ...activeJob,
          status: "failed",
          phase: "failed",
          canRetry: true,
        }}
        onRetry={onRetry}
      />,
    );
    const retry = screen.getByRole("button", { name: "Retry" });
    fireEvent.click(retry);
    fireEvent.click(retry);
    await waitFor(() => expect(onRetry).toHaveBeenCalledTimes(1));
  });

  it("does not offer cancellation once persistence has linearized", () => {
    render(
      <JobResilienceActions
        job={{ ...activeJob, phase: "persisting" }}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Saving");
  });

  it("exposes safe job type and status for scoped status presentation", () => {
    const view = render(
      <JobResilienceActions
        job={{
          ...activeJob,
          type: "interview.questions.generate",
          status: "completed",
          phase: "completed",
          progress: 100,
        }}
      />,
    );

    const root = view.container.querySelector(".job-resilience-actions");
    expect(root?.getAttribute("data-job-type")).toBe(
      "interview.questions.generate",
    );
    expect(root?.getAttribute("data-job-status")).toBe("completed");
    expect(screen.getByRole("status").textContent).toContain(
      "Questions generated successfully",
    );
  });

  it("announces a compact completed explanation success state", () => {
    const view = render(
      <JobResilienceActions
        job={{
          ...activeJob,
          type: "interview.question.explain",
          status: "completed",
          phase: "completed",
          progress: 100,
        }}
      />,
    );

    const root = view.container.querySelector(".job-resilience-actions");
    expect(root?.getAttribute("data-job-type")).toBe(
      "interview.question.explain",
    );
    expect(root?.getAttribute("data-job-status")).toBe("completed");
    expect(screen.getByRole("status").textContent).toBe("✓ Explanation ready");
  });

  it("announces action errors", async () => {
    render(
      <JobResilienceActions
        job={activeJob}
        onCancel={vi.fn().mockRejectedValue(new Error("Status refresh required."))}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Status refresh required.",
    );
  });

  it("aborts an in-flight action when unmounted", () => {
    let observedSignal: AbortSignal | undefined;
    const view = render(
      <JobResilienceActions
        job={activeJob}
        onCancel={vi.fn((signal) => {
          observedSignal = signal;
          return new Promise(() => undefined);
        })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(observedSignal?.aborted).toBe(false);
    view.unmount();
    expect(observedSignal?.aborted).toBe(true);
  });
});

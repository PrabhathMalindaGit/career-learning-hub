import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/apiClient";
import { InterviewDeleteDialog } from "./InterviewDeleteDialog";
import * as deletionApi from "./interviewDeletionApi";

vi.mock("./interviewDeletionApi", () => ({
  deleteInterviewSession: vi.fn(),
}));

const session = {
  id: "507f1f77bcf86cd799439011",
  title: "Senior Frontend Practice",
  targetRole: "Senior Frontend Engineer",
};

function renderDialog(onDeleted = vi.fn(), onRequestClose = vi.fn()) {
  const returnFocusRef = createRef<HTMLElement>();
  render(
    <InterviewDeleteDialog
      session={session}
      open
      returnFocusRef={returnFocusRef}
      onRequestClose={onRequestClose}
      onDeleted={onDeleted}
    />,
  );
  return { onDeleted, onRequestClose };
}

describe("InterviewDeleteDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires exact case-sensitive title confirmation and submits once", async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    vi.mocked(deletionApi.deleteInterviewSession).mockResolvedValue();
    renderDialog(onDeleted);

    expect(
      screen.getByRole("heading", { name: `Delete “${session.title}”?` }),
    ).not.toBeNull();
    expect(screen.getByText("This action cannot be undone.")).not.toBeNull();
    expect(
      screen.getByText("The Resume used to create this session is not deleted."),
    ).not.toBeNull();

    const input = screen.getByRole("textbox", {
      name: `Type ${session.title} exactly to confirm`,
    });
    const submit = screen.getByRole("button", {
      name: "Delete permanently",
    }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    await user.type(input, session.title.toLocaleLowerCase());
    expect(submit.disabled).toBe(true);
    await user.clear(input);
    await user.type(input, session.title);
    expect(submit.disabled).toBe(false);
    await user.click(submit);

    await waitFor(() =>
      expect(deletionApi.deleteInterviewSession).toHaveBeenCalledTimes(1),
    );
    expect(onDeleted).toHaveBeenCalledWith(session.id);
  });

  it("shows active-job conflicts without altering the confirmation surface", async () => {
    const user = userEvent.setup();
    vi.mocked(deletionApi.deleteInterviewSession).mockRejectedValue(
      new ApiError(
        409,
        "INTERVIEW_DELETE_BLOCKED_BY_ACTIVE_JOB",
        "Finish or cancel the current Interview AI work before permanently deleting this session.",
        "interview-delete-request-1",
      ),
    );
    renderDialog();

    await user.type(
      screen.getByRole("textbox", {
        name: `Type ${session.title} exactly to confirm`,
      }),
      session.title,
    );
    await user.click(screen.getByRole("button", { name: "Delete permanently" }));

    expect(
      await screen.findByText(
        "Finish or cancel the current Interview AI work before permanently deleting this session.",
      ),
    ).not.toBeNull();
    expect(
      screen.getByText("Request ID: interview-delete-request-1"),
    ).not.toBeNull();
    expect(screen.getByRole("dialog")).not.toBeNull();
  });
});

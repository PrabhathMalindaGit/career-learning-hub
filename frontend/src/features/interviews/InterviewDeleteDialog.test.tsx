import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("InterviewDeleteDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires exact title confirmation and submits once", async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    vi.mocked(deletionApi.deleteInterviewSession).mockResolvedValue();
    render(<InterviewDeleteDialog session={session} onDeleted={onDeleted} />);

    await user.click(
      screen.getByRole("button", { name: "Delete permanently" }),
    );
    const input = screen.getByRole("textbox", {
      name: "Type the session title exactly to confirm",
    });
    const submit = screen.getByRole("button", {
      name: "Permanently delete session",
    });
    expect(submit).toBeDisabled();

    await user.type(input, session.title);
    expect(submit).toBeEnabled();
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
    render(<InterviewDeleteDialog session={session} onDeleted={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: "Delete permanently" }),
    );
    await user.type(
      screen.getByRole("textbox", {
        name: "Type the session title exactly to confirm",
      }),
      session.title,
    );
    await user.click(
      screen.getByRole("button", { name: "Permanently delete session" }),
    );

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

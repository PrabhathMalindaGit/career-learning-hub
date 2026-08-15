import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/apiClient";
import { ResumeDeleteDialog } from "./ResumeDeleteDialog";
import * as resumeApi from "./resumeApi";

vi.mock("./resumeApi", () => ({
  deleteResume: vi.fn(),
}));

const resume = {
  id: "507f1f77bcf86cd799439011",
  title: "Platform Engineer Resume",
};

function Harness({ onDeleted = vi.fn() }: { onDeleted?: (resumeId: string) => void }) {
  const [actionsOpen, setActionsOpen] = useState(false);
  return (
    <ResumeDeleteDialog
      resume={resume}
      onDeleted={onDeleted}
      actionsOpen={actionsOpen}
      onActionsOpenChange={setActionsOpen}
    />
  );
}

async function openDeleteDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", { name: `More actions for ${resume.title}` }),
  );
  await user.click(screen.getByRole("button", { name: "Delete resume" }));
}

describe("ResumeDeleteDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires the exact stored title and submits deletion once", async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    vi.mocked(resumeApi.deleteResume).mockResolvedValue();
    render(<Harness onDeleted={onDeleted} />);

    await openDeleteDialog(user);

    expect(screen.getByRole("heading", { name: `Delete “${resume.title}”?` })).not.toBeNull();
    expect(screen.getByText("This action cannot be undone.")).not.toBeNull();

    const confirmation = screen.getByRole("textbox", {
      name: `Type ${resume.title} exactly to confirm`,
    });
    const submit = screen.getByRole("button", {
      name: "Delete permanently",
    }) as HTMLButtonElement;

    expect(submit.disabled).toBe(true);
    await user.type(confirmation, "platform engineer resume");
    expect(submit.disabled).toBe(true);
    await user.clear(confirmation);
    await user.type(confirmation, resume.title);
    expect(submit.disabled).toBe(false);

    await user.click(submit);

    await waitFor(() => expect(resumeApi.deleteResume).toHaveBeenCalledTimes(1));
    expect(resumeApi.deleteResume).toHaveBeenCalledWith(
      resume.id,
      expect.any(AbortSignal),
    );
    expect(onDeleted).toHaveBeenCalledWith(resume.id);
  });

  it("keeps an active-job error actionable and preserves its request ID", async () => {
    const user = userEvent.setup();
    vi.mocked(resumeApi.deleteResume).mockRejectedValue(
      new ApiError(
        409,
        "RESUME_DELETE_BLOCKED_BY_ACTIVE_JOB",
        "Finish or cancel the current Resume AI work before deleting this Resume.",
        "resume-delete-request-1",
      ),
    );
    render(<Harness />);

    await openDeleteDialog(user);
    await user.type(
      screen.getByRole("textbox", {
        name: `Type ${resume.title} exactly to confirm`,
      }),
      resume.title,
    );
    await user.click(screen.getByRole("button", { name: "Delete permanently" }));

    expect(
      await screen.findByText(
        "Finish or cancel the current Resume AI work before deleting this Resume.",
      ),
    ).not.toBeNull();
    expect(screen.getByText("Request ID: resume-delete-request-1")).not.toBeNull();
    expect(screen.getByRole("dialog")).not.toBeNull();
  });

  it("returns focus to More actions when cancellation closes the dialog", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const trigger = screen.getByRole("button", {
      name: `More actions for ${resume.title}`,
    });
    await openDeleteDialog(user);
    expect(screen.getByRole("dialog")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});

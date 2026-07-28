import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";

function DialogHarness({
  canDismissOnBackdrop = false,
  canDismissOnEscape = true,
  onSubmit = vi.fn(),
}: {
  canDismissOnBackdrop?: boolean;
  canDismissOnEscape?: boolean;
  onSubmit?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const invokerRef = useRef<HTMLButtonElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={invokerRef}
        type="button"
        onClick={() => setOpen(true)}
      >
        Open dialog
      </button>
      <Dialog
        open={open}
        labelledBy="test-dialog-title"
        describedBy="test-dialog-description"
        initialFocusRef={initialFocusRef}
        returnFocusRef={invokerRef}
        onCancel={() => setOpen(false)}
        canDismissOnBackdrop={canDismissOnBackdrop}
        canDismissOnEscape={canDismissOnEscape}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <h2 id="test-dialog-title">Review changes</h2>
          <p id="test-dialog-description">
            Confirm the caller-owned changes.
          </p>
          <button
            ref={initialFocusRef}
            type="button"
            onClick={() => setOpen(false)}
          >
            Keep editing
          </button>
          <button type="button" className="destructive-button">
            Delete changes
          </button>
          <button type="submit">Save changes</button>
        </form>
      </Dialog>
    </>
  );
}

describe("Dialog", () => {
  it("uses native accessible semantics, safe initial focus, focus containment, Escape, and exact focus return", async () => {
    render(<DialogHarness />);
    const invoker = screen.getByRole("button", {
      name: "Open dialog",
    });
    expect(screen.queryByRole("dialog")).toBeNull();

    await userEvent.click(invoker);
    const dialog = await screen.findByRole("dialog", {
      name: "Review changes",
      description: "Confirm the caller-owned changes.",
    });
    const keepEditing = screen.getByRole("button", {
      name: "Keep editing",
    });
    const deleteChanges = screen.getByRole("button", {
      name: "Delete changes",
    });
    const saveChanges = screen.getByRole("button", {
      name: "Save changes",
    });

    expect(dialog.tagName).toBe("DIALOG");
    expect(document.activeElement).toBe(keepEditing);
    expect(document.activeElement).not.toBe(deleteChanges);

    keepEditing.focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(saveChanges);
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(document.activeElement).toBe(keepEditing);

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(invoker);
  });

  it("keeps Escape and backdrop policy caller-owned while preserving nested form submission", async () => {
    const onSubmit = vi.fn();
    render(
      <DialogHarness
        canDismissOnBackdrop
        canDismissOnEscape={false}
        onSubmit={onSubmit}
      />,
    );
    const invoker = screen.getByRole("button", {
      name: "Open dialog",
    });
    await userEvent.click(invoker);
    const dialog = await screen.findByRole("dialog", {
      name: "Review changes",
    });

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.getByRole("dialog")).not.toBeNull();

    await userEvent.click(
      screen.getByRole("button", { name: "Save changes" }),
    );
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).not.toBeNull();

    vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      right: 100,
      bottom: 100,
      left: 0,
      width: 100,
      height: 100,
      toJSON: () => ({}),
    });
    fireEvent.mouseDown(dialog, { clientX: 50, clientY: 50 });
    expect(screen.getByRole("dialog")).not.toBeNull();

    fireEvent.mouseDown(dialog, { clientX: 120, clientY: 120 });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(invoker);
  });

  it("does not let a handled Escape reach an underlying document listener", async () => {
    const onDocumentEscape = vi.fn();
    const handleDocumentKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onDocumentEscape();
    };
    document.addEventListener("keydown", handleDocumentKeyDown);
    render(<DialogHarness />);
    await userEvent.click(
      screen.getByRole("button", { name: "Open dialog" }),
    );

    fireEvent.keyDown(
      screen.getByRole("dialog", { name: "Review changes" }),
      { key: "Escape" },
    );
    document.removeEventListener("keydown", handleDocumentKeyDown);

    expect(onDocumentEscape).not.toHaveBeenCalled();
  });
});

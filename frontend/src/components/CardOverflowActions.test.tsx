import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  CardOverflowActions,
  type CardOverflowAction,
} from "./CardOverflowActions";

function Harness({ actions }: { actions: readonly CardOverflowAction[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <CardOverflowActions
        ariaLabel="More actions for Test record"
        open={open}
        onOpenChange={setOpen}
        actions={actions}
      />
      <button type="button">Outside</button>
    </div>
  );
}

describe("CardOverflowActions", () => {
  it("opens with a record-specific accessible trigger and reports expanded state", async () => {
    const user = userEvent.setup();
    render(<Harness actions={[]} />);

    const trigger = screen.getByRole("button", {
      name: "More actions for Test record",
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.textContent).toContain("⋯");

    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        actions={[{ id: "delete", label: "Delete", onSelect: vi.fn() }]}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: "More actions for Test record",
    });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("closes when the user points outside", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        actions={[{ id: "delete", label: "Delete", onSelect: vi.fn() }]}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: "More actions for Test record",
    });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes before selecting an action and passes the trigger element", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Harness
        actions={[
          {
            id: "delete",
            label: "Delete record",
            destructive: true,
            onSelect,
          },
        ]}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: "More actions for Test record",
    });
    await user.click(trigger);
    const action = screen.getByRole("button", { name: "Delete record" });
    expect(action.className).toContain(
      "card-overflow-actions__action--destructive",
    );

    await user.click(action);

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(trigger);
  });

  it("renders a visual separator without ARIA menu semantics", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        actions={[
          { id: "restore", label: "Restore session", onSelect: vi.fn() },
          {
            id: "delete",
            label: "Delete permanently",
            destructive: true,
            separatorBefore: true,
            onSelect: vi.fn(),
          },
        ]}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "More actions for Test record" }),
    );

    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.queryByRole("menuitem")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Delete permanently" }).parentElement
        ?.className,
    ).toContain("card-overflow-actions__group--separated");
  });
});

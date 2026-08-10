import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ResumeAchievementBuilder } from "./ResumeAchievementBuilder";

describe("ResumeAchievementBuilder", () => {
  it("starts collapsed and composes only user-provided facts", async () => {
    render(<ResumeAchievementBuilder onAdd={vi.fn()} />);
    const user = userEvent.setup();
    const disclosure = screen.getByText("Build an achievement");
    expect(disclosure.closest("details")?.open).toBe(false);
    await user.click(disclosure);

    await user.selectOptions(screen.getByRole("combobox", { name: "Action" }), "Built");
    await user.type(screen.getByRole("textbox", { name: "What did you do?" }), "a job tracking dashboard");
    await user.type(screen.getByRole("textbox", { name: "Technology (optional)" }), "React and Node.js");
    await user.type(screen.getByRole("textbox", { name: "Result (optional)" }), "used by 25 testers");
    expect((screen.getByRole("textbox", { name: "Achievement preview" }) as HTMLTextAreaElement).value).toBe(
      "Built a job tracking dashboard using React and Node.js — used by 25 testers.",
    );
  });

  it("preserves an edited preview, inserts it once, and resets", async () => {
    const onAdd = vi.fn();
    render(<ResumeAchievementBuilder onAdd={onAdd} />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Build an achievement"));
    await user.selectOptions(screen.getByRole("combobox", { name: "Action" }), "Built");
    await user.type(screen.getByRole("textbox", { name: "What did you do?" }), "a dashboard");
    const preview = screen.getByRole("textbox", { name: "Achievement preview" });
    await user.clear(preview);
    await user.type(preview, "Edited factual bullet.");
    await user.type(screen.getByRole("textbox", { name: "Technology (optional)" }), "React");
    expect((preview as HTMLTextAreaElement).value).toBe("Edited factual bullet.");
    await user.click(screen.getByRole("button", { name: "Add achievement bullet" }));
    await user.click(screen.getByRole("button", { name: "Add achievement bullet" }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith("Edited factual bullet.");
    expect((screen.getByRole("textbox", { name: "What did you do?" }) as HTMLInputElement).value).toBe("");
    expect((preview as HTMLTextAreaElement).value).toBe("");
  });

  it("requires Action and Work and blocks whitespace preview", async () => {
    const onAdd = vi.fn();
    render(<ResumeAchievementBuilder onAdd={onAdd} />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Build an achievement"));
    await user.click(screen.getByRole("button", { name: "Add achievement bullet" }));
    expect(screen.getByRole("alert").textContent).toContain("Action and What did you do are required");
    expect(onAdd).not.toHaveBeenCalled();
    const preview = screen.getByRole("textbox", { name: "Achievement preview" });
    await user.type(preview, "   ");
    await user.click(screen.getByRole("button", { name: "Add achievement bullet" }));
    expect(onAdd).not.toHaveBeenCalled();
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ResumeSuggestionComparison } from "./ResumeSuggestionComparison";
import type { ResumeSuggestion } from "./types";

const suggestion: ResumeSuggestion = {
  id: "123e4567-e89b-42d3-a456-426614174001",
  bulletId: "123e4567-e89b-42d3-a456-426614174000",
  originalText: "Built a slow service.",
  rewrittenText: "Built a reliable service.",
  rationale: "Adds useful specificity.",
  verificationRequired: true,
};

describe("ResumeSuggestionComparison", () => {
  it("renders a semantic, ordered, non-color-only comparison and selection", async () => {
    const onToggle = vi.fn();
    const { container } = render(
      <ResumeSuggestionComparison
        suggestion={suggestion}
        position={1}
        selected={false}
        onToggle={onToggle}
      />,
    );
    const user = userEvent.setup();
    const checkbox = screen.getByRole("checkbox", {
      name: "Select suggestion 1",
    });

    expect(screen.getByRole("heading", { name: "Original" })).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Suggested rewrite" }),
    ).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Reason" })).not.toBeNull();
    expect(container.textContent).toContain("Built a slow service.");
    expect(screen.getByText("Adds useful specificity.")).not.toBeNull();
    expect(
      screen.getByText("Verify facts and placeholders before accepting."),
    ).not.toBeNull();
    expect(screen.getByText("Removed")).not.toBeNull();
    expect(screen.getByText("Added")).not.toBeNull();
    expect(container.querySelector("del")?.textContent).toBe(" slow");
    expect(container.querySelector("ins")?.textContent).toBe(" reliable");
    expect(
      container.querySelector(".resume-suggestion-comparison"),
    ).not.toBeNull();
    expect(
      container.querySelector(".resume-suggestion-copy"),
    ).not.toBeNull();

    const text = container.textContent ?? "";
    expect(text.indexOf("Original")).toBeLessThan(
      text.indexOf("Suggested rewrite"),
    );
    expect(text.indexOf("Suggested rewrite")).toBeLessThan(
      text.indexOf("Reason"),
    );
    expect(text.indexOf("Reason")).toBeLessThan(
      text.indexOf("Verify facts"),
    );
    expect(text).not.toContain(suggestion.id);
    expect(text).not.toContain(suggestion.bulletId);

    await user.click(checkbox);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("renders attempted markup as text and disables unavailable selection", () => {
    const markupSuggestion: ResumeSuggestion = {
      ...suggestion,
      originalText: "<strong>Original</strong>",
      rewrittenText: "<script>alert('added')</script>",
      rationale: "<img src=x onerror=alert(1)>",
      verificationRequired: false,
    };
    const { container } = render(
      <ResumeSuggestionComparison
        suggestion={markupSuggestion}
        position={2}
        selected
        disabled
        onToggle={vi.fn()}
      />,
    );

    expect(
      (
        screen.getByRole("checkbox", {
          name: "Select suggestion 2",
        }) as HTMLInputElement
      ).disabled,
    ).toBe(true);
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<strong>");
    expect(container.textContent).toContain("<script>");
    expect(container.textContent).toContain("<img");
    expect(
      screen.queryByText("Verify facts and placeholders before accepting."),
    ).toBeNull();
  });
});

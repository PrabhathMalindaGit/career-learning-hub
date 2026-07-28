import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AiRecommendations } from "./AiRecommendations";
import type { ResumeAnalysis } from "./types";

const suggestionId = "123e4567-e89b-42d3-a456-426614174001";

const analysis: ResumeAnalysis = {
  id: "507f1f77bcf86cd799439014",
  resumeId: "507f1f77bcf86cd799439011",
  resumeVersionId: "507f1f77bcf86cd799439012",
  target: { role: "Platform Engineer" },
  scoreBreakdown: {
    keywordMatch: 20,
    clarity: 21,
    evidence: 22,
    formatting: 23,
  },
  totalScore: 86,
  issues: [],
  strengths: [],
  missingKeywords: [],
  suggestions: [
    {
      id: suggestionId,
      bulletId: "123e4567-e89b-42d3-a456-426614174000",
      originalText: "Built a service.",
      rewrittenText: "Built a reliable service.",
      rationale: "Adds specificity.",
      verificationRequired: true,
    },
  ],
  createdAt: "2026-07-24T10:00:00.000Z",
  updatedAt: "2026-07-24T10:00:00.000Z",
};

describe("AiRecommendations confirmation", () => {
  it("preserves copy, action order, caller behavior, and native focus semantics", async () => {
    const onConfirmApply = vi.fn();
    render(
      <AiRecommendations
        analysis={analysis}
        selectedSuggestionIds={new Set([suggestionId])}
        onToggleSuggestion={vi.fn()}
        onConfirmApply={onConfirmApply}
      />,
    );
    const user = userEvent.setup();
    const invoker = screen.getByRole("button", {
      name: "Apply selected suggestions",
    });

    await user.click(invoker);
    const dialog = screen.getByRole("dialog", {
      name: "Apply selected suggestions",
      description:
        "This creates a new immutable resume version. Review the resulting content for accuracy; this assessment will become stale.",
    });
    const actions = Array.from(dialog.querySelectorAll("button"));
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const confirm = screen.getByRole("button", {
      name: "Create new version",
    });

    expect(dialog.tagName).toBe("DIALOG");
    expect(actions).toEqual([cancel, confirm]);
    expect(document.activeElement).toBe(cancel);

    await user.tab({ shift: true });
    expect(document.activeElement).toBe(confirm);
    await user.tab();
    expect(document.activeElement).toBe(cancel);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(invoker);

    await user.click(invoker);
    await user.click(
      screen.getByRole("button", {
        name: "Create new version",
      }),
    );
    expect(onConfirmApply).toHaveBeenCalledTimes(1);
  });
});

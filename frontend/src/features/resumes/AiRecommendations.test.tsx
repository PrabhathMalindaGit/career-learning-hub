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
  it("binds the assessment gauge only to the validated total score and renders four real categories", () => {
    const scoreMismatchAnalysis: ResumeAnalysis = {
      ...analysis,
      totalScore: 37,
      scoreBreakdown: {
        keywordMatch: 20,
        clarity: 21,
        evidence: 22,
        formatting: 23,
      },
    };
    const { container } = render(
      <AiRecommendations
        analysis={scoreMismatchAnalysis}
        selectedSuggestionIds={new Set()}
        onToggleSuggestion={vi.fn()}
        onConfirmApply={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("img", {
        name: "Resume assessment score: 37 out of 100",
      }),
    ).not.toBeNull();
    expect(
      container
        .querySelector("[data-assessment-score-arc]")
        ?.getAttribute("stroke-dasharray"),
    ).toBe("37 100");

    const expectedCategories = [
      ["Keyword match", "20"],
      ["Clarity", "21"],
      ["Evidence", "22"],
      ["Formatting", "23"],
    ] as const;
    for (const [name, value] of expectedCategories) {
      const progress = screen.getByRole("progressbar", { name });
      expect(progress.getAttribute("aria-valuenow")).toBe(value);
      expect(progress.getAttribute("aria-valuemax")).toBe("25");
    }

    expect(container.textContent).not.toMatch(
      /delta|trend|recruiter approval|certified ATS|employment probability|job-success/i,
    );
  });

  it("renders validated strengths, issues, and missing terms without exposing internal IDs or legacy branding", () => {
    const richAnalysis: ResumeAnalysis = {
      ...analysis,
      issues: [
        {
          code: "MISSING_OUTCOME",
          severity: "high",
          message: "Add a verifiable outcome to the first experience bullet.",
        },
      ],
      strengths: [
        {
          title: "Clear scope",
          detail: "The role and area of responsibility are easy to identify.",
        },
      ],
      missingKeywords: ["observability", "incident response"],
    };
    const { container } = render(
      <AiRecommendations
        analysis={richAnalysis}
        selectedSuggestionIds={new Set()}
        onToggleSuggestion={vi.fn()}
        onConfirmApply={vi.fn()}
      />,
    );

    expect(screen.getByText("Clear scope")).not.toBeNull();
    expect(
      screen.getByText(
        "The role and area of responsibility are easy to identify.",
      ),
    ).not.toBeNull();
    expect(
      screen.getByText(
        "Add a verifiable outcome to the first experience bullet.",
      ),
    ).not.toBeNull();
    expect(screen.getByText("High severity")).not.toBeNull();
    expect(screen.getByText("observability")).not.toBeNull();
    expect(screen.getByText("incident response")).not.toBeNull();
    expect(
      container.querySelectorAll(".resume-keyword-chip"),
    ).toHaveLength(2);
    expect(container.textContent).toContain(
      "Review these terms against your actual experience",
    );

    const text = container.textContent ?? "";
    for (const id of [
      richAnalysis.id,
      richAnalysis.resumeId,
      richAnalysis.resumeVersionId,
      richAnalysis.suggestions[0].id,
      richAnalysis.suggestions[0].bulletId,
    ]) {
      expect(text).not.toContain(id);
    }
    expect(text).not.toMatch(/AI Resume Analyser|AI Resume Tracker|Resumind/i);
  });

  it("renders truthful empty and running states without fabricated result data", () => {
    const { container, rerender } = render(
      <AiRecommendations
        selectedSuggestionIds={new Set()}
        onToggleSuggestion={vi.fn()}
        onConfirmApply={vi.fn()}
      />,
    );

    expect(screen.getByText("No assessment yet")).not.toBeNull();
    expect(container.querySelector("[data-assessment-score-arc]")).toBeNull();
    expect(screen.queryAllByRole("progressbar")).toHaveLength(0);
    expect(container.textContent).not.toContain("/25");

    rerender(
      <AiRecommendations
        analysis={analysis}
        loading
        selectedSuggestionIds={new Set()}
        onToggleSuggestion={vi.fn()}
        onConfirmApply={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("status", { name: "Assessment running" }),
    ).not.toBeNull();
    expect(container.querySelector("[data-assessment-score-arc]")).toBeNull();
    expect(screen.queryAllByRole("progressbar")).toHaveLength(0);
    expect(container.textContent).not.toContain("/25");
  });

  it("renders explicit contract-valid empty groups without fabricating keywords", () => {
    const { container } = render(
      <AiRecommendations
        analysis={analysis}
        selectedSuggestionIds={new Set()}
        onToggleSuggestion={vi.fn()}
        onConfirmApply={vi.fn()}
      />,
    );

    expect(screen.getByText("No strengths were returned.")).not.toBeNull();
    expect(screen.getByText("No review points were returned.")).not.toBeNull();
    expect(screen.getByText("No missing terms were returned.")).not.toBeNull();
    expect(container.querySelectorAll(".resume-keyword-chip")).toHaveLength(0);
  });

  it("requires explicit selection and renders the stored comparison without exposing IDs", async () => {
    const onToggleSuggestion = vi.fn();
    const { container } = render(
      <AiRecommendations
        analysis={analysis}
        selectedSuggestionIds={new Set()}
        onToggleSuggestion={onToggleSuggestion}
        onConfirmApply={vi.fn()}
      />,
    );
    const user = userEvent.setup();
    const checkbox = screen.getByRole("checkbox", {
      name: "Select suggestion 1",
    });

    expect((checkbox as HTMLInputElement).checked).toBe(false);
    expect(
      (
        screen.getByRole("button", {
          name: "Apply selected suggestions",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(screen.getByRole("heading", { name: "Original" })).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Suggested rewrite" }),
    ).not.toBeNull();
    expect(container.textContent).not.toContain(suggestionId);

    await user.click(checkbox);
    expect(onToggleSuggestion).toHaveBeenCalledWith(suggestionId);
  });

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
    expect(
      (
        screen.getByRole("checkbox", {
          name: "Select suggestion 1",
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);

    await user.click(invoker);
    await user.click(
      screen.getByRole("button", {
        name: "Create new version",
      }),
    );
    expect(onConfirmApply).toHaveBeenCalledTimes(1);
  });
});

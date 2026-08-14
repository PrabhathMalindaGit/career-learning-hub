import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  InterviewQuestionTypeControls,
  QUESTION_TYPE_OPTIONS,
} from "./InterviewQuestionTypeControls";
import type { InterviewQuestionType } from "./types";

function Harness({ initialCount = 4 }: { initialCount?: number }) {
  const [count, setCount] = useState(initialCount);
  const [selected, setSelected] = useState<InterviewQuestionType[]>([
    "short-answer",
  ]);
  const [explicitCounts, setExplicitCounts] = useState<
    Partial<Record<InterviewQuestionType, number>> | undefined
  >();
  return (
    <>
      <button type="button" onClick={() => setCount(5)}>
        Change question count
      </button>
      <output aria-label="Selected order">{selected.join(",")}</output>
      <output aria-label="Distribution mode">
        {explicitCounts === undefined ? "implicit" : "explicit"}
      </output>
      <InterviewQuestionTypeControls
        count={count}
        selected={selected}
        explicitCounts={explicitCounts}
        onSelectedChange={setSelected}
        onExplicitCountsChange={setExplicitCounts}
      />
    </>
  );
}

describe("InterviewQuestionTypeControls", () => {
  it("renders the six exact accessible type labels", () => {
    render(
      <InterviewQuestionTypeControls
        count={4}
        selected={["short-answer"]}
        onSelectedChange={vi.fn()}
        onExplicitCountsChange={vi.fn()}
      />,
    );

    expect(QUESTION_TYPE_OPTIONS.map((option) => option.label)).toEqual([
      "Multiple Choice",
      "Short Answer",
      "Coding",
      "Behavioral",
      "Scenario-based",
      "Technical Explanation",
    ]);
    for (const option of QUESTION_TYPE_OPTIONS) {
      expect(
        screen.getByRole("checkbox", { name: option.label }),
      ).not.toBeNull();
    }
  });

  it("presents balanced distribution as part of the Question types control", () => {
    render(
      <InterviewQuestionTypeControls
        count={6}
        selected={["multiple-choice", "short-answer"]}
        onSelectedChange={vi.fn()}
        onExplicitCountsChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Distribution")).not.toBeNull();
    expect(screen.getByText("Balanced automatically")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Set exact counts" }),
    ).not.toBeNull();
  });

  it("simplifies distribution for one selected type and tracks Question count", async () => {
    const user = userEvent.setup();
    render(<Harness initialCount={1} />);

    expect(screen.getByText("Distribution")).not.toBeNull();
    expect(
      screen.getByText("All 1 question will be Short Answer."),
    ).not.toBeNull();
    expect(
      screen.queryByRole("button", { name: "Set exact counts" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Use balanced distribution" }),
    ).toBeNull();
    expect(screen.queryByRole("spinbutton")).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Change question count" }),
    );
    expect(
      screen.getByText("All 5 questions will be Short Answer."),
    ).not.toBeNull();
  });

  it("requires at least one selected type and preserves selected order", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const shortAnswer = screen.getByRole("checkbox", { name: "Short Answer" });
    await user.click(shortAnswer);
    expect(screen.getByRole("alert").textContent).toMatch(/at least one/i);
    expect((shortAnswer as HTMLInputElement).checked).toBe(true);

    await user.click(screen.getByRole("checkbox", { name: "Coding" }));
    await user.click(screen.getByRole("checkbox", { name: "Behavioral" }));
    expect(screen.getByLabelText("Selected order").textContent).toBe(
      "short-answer,coding,behavioral",
    );

    await user.click(shortAnswer);
    expect(screen.getByLabelText("Selected order").textContent).toBe(
      "coding,behavioral",
    );
  });

  it("uses balanced mode by default and exposes exact counts only for selected types", async () => {
    const user = userEvent.setup();
    const onExplicitCountsChange = vi.fn();
    render(
      <InterviewQuestionTypeControls
        count={4}
        selected={["short-answer", "coding"]}
        onSelectedChange={vi.fn()}
        onExplicitCountsChange={onExplicitCountsChange}
      />,
    );

    expect(screen.queryByRole("spinbutton")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Set exact counts" }));
    expect(onExplicitCountsChange).toHaveBeenCalledWith({
      "short-answer": 2,
      coding: 2,
    });
  });

  it("clears exact-count state when the selection returns to one type", async () => {
    const user = userEvent.setup();
    render(<Harness initialCount={4} />);

    const coding = screen.getByRole("checkbox", { name: "Coding" });
    await user.click(coding);
    expect(screen.getByText("Balanced automatically")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Set exact counts" }),
    ).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Set exact counts" }));
    expect(screen.getByLabelText("Distribution mode").textContent).toBe(
      "explicit",
    );
    expect(
      screen.getByRole("spinbutton", { name: "Short Answer count" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("spinbutton", { name: "Coding count" }),
    ).not.toBeNull();

    await user.click(coding);
    expect(screen.getByLabelText("Selected order").textContent).toBe(
      "short-answer",
    );
    expect(screen.getByLabelText("Distribution mode").textContent).toBe(
      "implicit",
    );
    expect(
      screen.getByText("All 4 questions will be Short Answer."),
    ).not.toBeNull();
    expect(screen.queryByRole("spinbutton")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Set exact counts" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Use balanced distribution" }),
    ).toBeNull();
  });

  it("resets exact counts to balanced when Question count changes", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("checkbox", { name: "Coding" }));
    await user.click(screen.getByRole("button", { name: "Set exact counts" }));

    const controls = screen.getByRole("group", { name: "Question types" });
    expect(
      within(controls).getByRole("spinbutton", { name: "Short Answer count" }),
    ).not.toBeNull();
    expect(
      within(controls).getByRole("spinbutton", { name: "Coding count" }),
    ).not.toBeNull();
    expect(screen.getByText("Exact counts · 4 total")).not.toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Change question count" }),
    );

    expect(screen.getByLabelText("Distribution mode").textContent).toBe(
      "implicit",
    );
    expect(screen.queryByRole("spinbutton")).toBeNull();
    expect(screen.getByText("Balanced automatically")).not.toBeNull();
    expect(screen.queryByText(/Exact counts · 4 of 5/)).toBeNull();
    expect(
      screen.queryByText(/must equal Question count 5/i),
    ).toBeNull();
    expect(
      screen.getByText(
        "Question count changed. Distribution reset to balanced.",
      ),
    ).not.toBeNull();
    expect(screen.getByLabelText("Selected order").textContent).toBe(
      "short-answer,coding",
    );

    await user.click(screen.getByRole("button", { name: "Set exact counts" }));
    const shortAnswerCount = screen.getByRole("spinbutton", {
      name: "Short Answer count",
    }) as HTMLInputElement;
    const codingCount = screen.getByRole("spinbutton", {
      name: "Coding count",
    }) as HTMLInputElement;
    expect(shortAnswerCount.value).toBe("3");
    expect(codingCount.value).toBe("2");
    expect(screen.getByText("Exact counts · 5 total")).not.toBeNull();
    expect(
      screen.queryByText(
        "Question count changed. Distribution reset to balanced.",
      ),
    ).toBeNull();
  });

  it("does not announce a distribution reset when count changes in balanced mode", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("checkbox", { name: "Coding" }));
    await user.click(
      screen.getByRole("button", { name: "Change question count" }),
    );

    expect(screen.getByText("Balanced automatically")).not.toBeNull();
    expect(
      screen.queryByText(
        "Question count changed. Distribution reset to balanced.",
      ),
    ).toBeNull();
  });

  it("updates exact counts with native number inputs and can return to balanced mode", async () => {
    const user = userEvent.setup();
    render(<Harness initialCount={4} />);

    await user.click(screen.getByRole("checkbox", { name: "Coding" }));
    await user.click(screen.getByRole("button", { name: "Set exact counts" }));
    const shortCount = screen.getByRole("spinbutton", {
      name: "Short Answer count",
    });
    await user.clear(shortCount);
    await user.type(shortCount, "3");
    expect(screen.getByText("Exact counts · 5 of 4")).not.toBeNull();
    expect(screen.getByRole("alert").textContent).toMatch(/total 5/i);

    await user.click(
      screen.getByRole("button", { name: "Use balanced distribution" }),
    );
    expect(screen.queryByRole("spinbutton")).toBeNull();
    expect(screen.getByText("Balanced automatically")).not.toBeNull();
  });
});

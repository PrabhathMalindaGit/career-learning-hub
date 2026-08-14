import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InterviewAnswerControl } from "./InterviewAnswerControl";
import type { StructuredAnswerDraft } from "./interviewStructuredAnswer";
import type {
  EffectiveInterviewQuestionType,
  InterviewQuestionDetail,
} from "./types";

const timestamp = "2026-08-14T00:00:00.000Z";

function question(
  questionType: EffectiveInterviewQuestionType,
  extra: Partial<InterviewQuestionDetail> = {},
): InterviewQuestionDetail {
  return {
    id: "507f1f77bcf86cd799439012",
    sessionId: "507f1f77bcf86cd799439011",
    source: "manual",
    category: "General",
    difficulty: "medium",
    question: "A practice question.",
    questionType,
    ...(questionType === "multiple-choice"
      ? {
          multipleChoice: {
            options: [
              { id: "option-a", text: "First option" },
              { id: "option-b", text: "Second option" },
              { id: "option-c", text: "Third option" },
            ],
          },
        }
      : {}),
    isPinned: false,
    explanationKeyPoints: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    ...extra,
  };
}

function renderControl(
  interviewQuestion: InterviewQuestionDetail,
  options: {
    textValue?: string;
    structuredValue?: StructuredAnswerDraft;
    selectedOptionId?: string;
    onTextChange?: (value: string) => void;
    onStructuredChange?: (value: StructuredAnswerDraft) => void;
    onSelectedOptionChange?: (optionId: string) => void;
  } = {},
) {
  return render(
    <InterviewAnswerControl
      question={interviewQuestion}
      textValue={options.textValue ?? ""}
      structuredValue={options.structuredValue ?? {}}
      selectedOptionId={options.selectedOptionId ?? ""}
      onTextChange={options.onTextChange ?? vi.fn()}
      onStructuredChange={options.onStructuredChange ?? vi.fn()}
      onSelectedOptionChange={options.onSelectedOptionChange ?? vi.fn()}
      onSubmit={vi.fn()}
    />,
  );
}

describe("InterviewAnswerControl practice experience", () => {
  it("renders positional MCQ badges while preserving native radio selection", async () => {
    const onSelectedOptionChange = vi.fn();
    const { container } = renderControl(question("multiple-choice"), {
      onSelectedOptionChange,
    });
    expect(
      Array.from(
        container.querySelectorAll(".interview-answer-option__letter"),
      ).map((node) => node.textContent),
    ).toEqual(["A", "B", "C"]);

    await userEvent
      .setup()
      .click(screen.getByRole("radio", { name: "Second option" }));
    expect(onSelectedOptionChange).toHaveBeenCalledWith("option-b");
  });

  it("gives Short Answer a compact focused prompt", () => {
    renderControl(question("short-answer"));
    const textarea = screen.getByRole("textbox", {
      name: /Your short answer/i,
    });
    expect(textarea.getAttribute("rows")).toBe("5");
    expect(textarea.getAttribute("placeholder")).toContain("concise");
    expect(screen.getByText("Answer directly.")).not.toBeNull();
    expect(screen.getByText("Aim for 2–4 focused sentences.")).not.toBeNull();
  });

  it("uses real STAR fields instead of Behavioral cue chips", () => {
    renderControl(question("behavioral"));
    expect(screen.getByRole("group", { name: "Behavioral response" })).not.toBeNull();
    for (const label of ["Situation", "Task", "Action", "Result"]) {
      expect(screen.getByRole("textbox", { name: label })).not.toBeNull();
    }
    expect(screen.queryByLabelText("Answer structure guidance")).toBeNull();
  });

  it("uses real reasoning fields for Scenario-Based", () => {
    renderControl(question("scenario-based"));
    for (const label of ["Assessment", "Approach", "Trade-offs", "Decision"]) {
      expect(screen.getByRole("textbox", { name: label })).not.toBeNull();
    }
  });

  it("uses real explanation fields for Technical Explanation", () => {
    renderControl(question("technical-explanation"));
    for (const label of [
      "Concept",
      "How it works",
      "Example",
      "Trade-offs / limitations",
    ]) {
      expect(screen.getByRole("textbox", { name: label })).not.toBeNull();
    }
  });

  it("renders Coding starter code and inserts it only into an empty draft", async () => {
    const starterCode = [
      "function solve(input) {",
      "  // TODO",
      "}",
    ].join("\n");
    const onTextChange = vi.fn();
    const { container, rerender } = renderControl(
      question("coding", { starterCode }),
      { onTextChange },
    );

    expect(screen.getByText("Starter code")).not.toBeNull();
    expect(
      container.querySelector(".interview-starter-code__code")?.textContent,
    ).toBe(starterCode);
    const insert = screen.getByRole("button", { name: "Insert into answer" });
    expect((insert as HTMLButtonElement).disabled).toBe(false);

    await userEvent.setup().click(insert);
    expect(onTextChange).toHaveBeenCalledWith(starterCode);

    rerender(
      <InterviewAnswerControl
        question={question("coding", { starterCode })}
        textValue="const existing = true;"
        structuredValue={{}}
        selectedOptionId=""
        onTextChange={onTextChange}
        onStructuredChange={vi.fn()}
        onSelectedOptionChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      (screen.getByRole("button", {
        name: "Insert into answer",
      }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      screen.getByText(/Clear your current draft before inserting starter code/i),
    ).not.toBeNull();
  });

  it("copies exactly the Coding starter scaffold", async () => {
    const starterCode = "function solve(input) {\n  // TODO\n}";
    const writeText = vi.fn().mockResolvedValue(undefined);
    const originalClipboard = Object.getOwnPropertyDescriptor(
      navigator,
      "clipboard",
    );
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    try {
      renderControl(question("coding", { starterCode }));
      await userEvent
        .setup()
        .click(screen.getByRole("button", { name: "Copy starter code" }));
      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith(starterCode);
      });
    } finally {
      if (originalClipboard) {
        Object.defineProperty(navigator, "clipboard", originalClipboard);
      } else {
        Reflect.deleteProperty(navigator, "clipboard");
      }
    }
  });

  it("omits an empty starter-code surface for Coding questions without a scaffold", () => {
    renderControl(question("coding"));
    expect(screen.queryByText("Starter code")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Insert into answer" }),
    ).toBeNull();
  });
});

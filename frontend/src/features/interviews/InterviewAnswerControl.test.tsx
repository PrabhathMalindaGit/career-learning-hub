import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InterviewAnswerControl } from "./InterviewAnswerControl";
import type { StructuredAnswerDraft } from "./interviewStructuredAnswer";
import type {
  EffectiveInterviewQuestionType,
  InterviewQuestionDetail,
} from "./types";

const timestamp = "2026-08-13T00:00:00.000Z";

function question(
  questionType: EffectiveInterviewQuestionType,
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
            ],
          },
        }
      : {}),
    isPinned: false,
    explanationKeyPoints: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function renderControl(options: {
  questionType: EffectiveInterviewQuestionType;
  textValue?: string;
  structuredValue?: StructuredAnswerDraft;
  selectedOptionId?: string;
  onTextChange?: (value: string) => void;
  onStructuredChange?: (value: StructuredAnswerDraft) => void;
  onSelectedOptionChange?: (optionId: string) => void;
  onSubmit?: () => void;
}) {
  return render(
    <InterviewAnswerControl
      question={question(options.questionType)}
      textValue={options.textValue ?? ""}
      structuredValue={options.structuredValue ?? {}}
      selectedOptionId={options.selectedOptionId ?? ""}
      onTextChange={options.onTextChange ?? vi.fn()}
      onStructuredChange={options.onStructuredChange ?? vi.fn()}
      onSelectedOptionChange={options.onSelectedOptionChange ?? vi.fn()}
      onSubmit={options.onSubmit ?? vi.fn()}
    />,
  );
}

describe("InterviewAnswerControl", () => {
  it("renders canonical MCQ radios and requires a selection before submit", async () => {
    const user = userEvent.setup();
    const onSelectedOptionChange = vi.fn();
    const onSubmit = vi.fn();
    const { rerender } = renderControl({
      questionType: "multiple-choice",
      onSelectedOptionChange,
      onSubmit,
    });

    expect(screen.getByRole("radio", { name: "First option" })).not.toBeNull();
    expect(screen.getByRole("radio", { name: "Second option" })).not.toBeNull();
    expect(
      (screen.getByRole("button", { name: "Save attempt" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    await user.click(screen.getByRole("radio", { name: "Second option" }));
    expect(onSelectedOptionChange).toHaveBeenCalledWith("option-b");

    rerender(
      <InterviewAnswerControl
        question={question("multiple-choice")}
        textValue=""
        structuredValue={{}}
        selectedOptionId="option-b"
        onTextChange={vi.fn()}
        onStructuredChange={vi.fn()}
        onSelectedOptionChange={onSelectedOptionChange}
        onSubmit={onSubmit}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Save attempt" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("keeps Short Answer and legacy Open Response on single textareas", () => {
    const { rerender } = renderControl({
      questionType: "short-answer",
      textValue: "answer",
    });
    expect(
      screen.getByRole("textbox", { name: /Short answer/i }).getAttribute("rows"),
    ).toBe("5");

    rerender(
      <InterviewAnswerControl
        question={question("legacy-open-response")}
        textValue="answer"
        structuredValue={{}}
        selectedOptionId=""
        onTextChange={vi.fn()}
        onStructuredChange={vi.fn()}
        onSelectedOptionChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole("textbox", { name: /Written answer/i })).not.toBeNull();
    expect(screen.getByText("Open response")).not.toBeNull();
  });

  it("keeps Coding as a text-only code-entry surface", () => {
    renderControl({
      questionType: "coding",
      textValue: "const value = 1;",
    });
    const textarea = screen.getByRole("textbox", { name: /Your code/i });
    expect(textarea.className).toContain("interview-answer-control__coding");
    expect(textarea.getAttribute("rows")).toBe("12");
    expect(textarea.getAttribute("spellcheck")).toBe("false");
    expect(screen.queryByRole("button", { name: /run|execute/i })).toBeNull();
  });

  it.each([
    ["behavioral", "Behavioral response", ["Situation", "Task", "Action", "Result"]],
    ["scenario-based", "Scenario response", ["Assessment", "Approach", "Trade-offs", "Decision"]],
    [
      "technical-explanation",
      "Technical explanation",
      ["Concept", "How it works", "Example", "Trade-offs / limitations"],
    ],
  ] as const)("renders %s as structured fields rather than one generic textarea", (type, groupName, fields) => {
    renderControl({ questionType: type });
    const group = screen.getByRole("group", { name: groupName });
    for (const field of fields) {
      expect(screen.getByRole("textbox", { name: field })).not.toBeNull();
    }
    expect(group).not.toBeNull();
    expect(screen.queryByLabelText("Answer structure guidance")).toBeNull();
  });

  it("enables Save attempt when one structured subsection has content", () => {
    const { rerender } = renderControl({ questionType: "behavioral" });
    expect(
      (screen.getByRole("button", { name: "Save attempt" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    rerender(
      <InterviewAnswerControl
        question={question("behavioral")}
        textValue=""
        structuredValue={{ situation: "Context" }}
        selectedOptionId=""
        onTextChange={vi.fn()}
        onStructuredChange={vi.fn()}
        onSelectedOptionChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(
      (screen.getByRole("button", { name: "Save attempt" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it("shows safe errors without changing structured draft ownership", () => {
    render(
      <InterviewAnswerControl
        question={question("behavioral")}
        textValue=""
        structuredValue={{ situation: "Context" }}
        selectedOptionId=""
        error={{ message: "Answer could not be saved.", requestId: "request-id-00000001" }}
        onTextChange={vi.fn()}
        onStructuredChange={vi.fn()}
        onSelectedOptionChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "Answer could not be saved.",
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "request-id-00000001",
    );
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InterviewAnswerControl } from "./InterviewAnswerControl";
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
  selectedOptionId?: string;
  onTextChange?: (value: string) => void;
  onSelectedOptionChange?: (optionId: string) => void;
  onSubmit?: () => void;
}) {
  return render(
    <InterviewAnswerControl
      question={question(options.questionType)}
      textValue={options.textValue ?? ""}
      selectedOptionId={options.selectedOptionId ?? ""}
      onTextChange={options.onTextChange ?? vi.fn()}
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
        selectedOptionId="option-b"
        onTextChange={vi.fn()}
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
        selectedOptionId=""
        onTextChange={vi.fn()}
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
    expect(screen.getByRole("group", { name: groupName })).not.toBeNull();
    for (const field of fields) {
      expect(screen.getByRole("textbox", { name: field })).not.toBeNull();
    }
    expect(screen.queryByLabelText("Answer structure guidance")).toBeNull();
  });

  it("serializes structured edits through the existing text callback and enables Save", async () => {
    const user = userEvent.setup();
    const onTextChange = vi.fn();
    renderControl({ questionType: "behavioral", onTextChange });

    expect(
      (screen.getByRole("button", { name: "Save attempt" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    await user.type(screen.getByRole("textbox", { name: "Situation" }), "Context");
    expect(onTextChange).toHaveBeenLastCalledWith("Situation:\nContext");
    expect(
      (screen.getByRole("button", { name: "Save attempt" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it("clears local structured fields when the parent text draft resets", async () => {
    const user = userEvent.setup();
    const onTextChange = vi.fn();
    const { rerender } = renderControl({
      questionType: "behavioral",
      onTextChange,
    });
    const situation = screen.getByRole("textbox", { name: "Situation" });
    await user.type(situation, "Context");

    rerender(
      <InterviewAnswerControl
        question={question("behavioral")}
        textValue=""
        selectedOptionId=""
        onTextChange={onTextChange}
        onSelectedOptionChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect((situation as HTMLTextAreaElement).value).toBe("");
  });

  it("shows safe errors without changing structured field ownership", () => {
    render(
      <InterviewAnswerControl
        question={question("behavioral")}
        textValue="Situation:\nContext"
        selectedOptionId=""
        error={{ message: "Answer could not be saved.", requestId: "request-id-00000001" }}
        onTextChange={vi.fn()}
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

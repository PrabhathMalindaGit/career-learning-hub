import { fireEvent, render, screen } from "@testing-library/react";
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

describe("InterviewAnswerControl", () => {
  it("renders canonical MCQ radios and requires a selection before submit", async () => {
    const user = userEvent.setup();
    const onSelectedOptionChange = vi.fn();
    const onSubmit = vi.fn();
    const { rerender } = render(
      <InterviewAnswerControl
        question={question("multiple-choice")}
        textValue=""
        selectedOptionId=""
        onTextChange={vi.fn()}
        onSelectedOptionChange={onSelectedOptionChange}
        onSubmit={onSubmit}
      />,
    );

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

  it("renders compact Short Answer and legacy Written answer semantics", () => {
    const { rerender } = render(
      <InterviewAnswerControl
        question={question("short-answer")}
        textValue="answer"
        selectedOptionId=""
        onTextChange={vi.fn()}
        onSelectedOptionChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(
      screen
        .getByRole("textbox", { name: /Short answer/ })
        .getAttribute("rows"),
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
    expect(screen.getByRole("textbox", { name: /Written answer/ })).not.toBeNull();
    expect(screen.getByText("Open response")).not.toBeNull();
  });

  it("renders Coding as a clearer code-entry surface with no execution control", () => {
    render(
      <InterviewAnswerControl
        question={question("coding")}
        textValue="const value = 1;"
        selectedOptionId=""
        onTextChange={vi.fn()}
        onSelectedOptionChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const textarea = screen.getByRole("textbox", { name: /Your code/ });
    expect(textarea.className).toContain("interview-answer-control__coding");
    expect(textarea.getAttribute("rows")).toBe("12");
    expect(textarea.getAttribute("placeholder")).toBe(
      "Write or paste the code you would submit in an interview…",
    );
    expect(textarea.getAttribute("spellcheck")).toBe("false");
    expect(
      screen.getByText(
        /Complete only the function or solution requested by the question/i,
      ),
    ).not.toBeNull();
    expect(
      screen.getByText(/reviewed as text and is not executed/i),
    ).not.toBeNull();
    expect(screen.queryByRole("button", { name: /run|execute/i })).toBeNull();
  });

  it.each([
    ["behavioral", "Behavioral answer"],
    ["scenario-based", "Scenario response"],
    ["technical-explanation", "Technical explanation"],
  ] as const)("renders %s with a multiline text control", (type, label) => {
    render(
      <InterviewAnswerControl
        question={question(type)}
        textValue="structured answer"
        selectedOptionId=""
        onTextChange={vi.fn()}
        onSelectedOptionChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(
      screen
        .getByRole("textbox", { name: new RegExp(label, "i") })
        .getAttribute("rows"),
    ).toBe("9");
  });

  it("keeps text submit disabled for blank or over-bound content and shows safe errors", () => {
    const onTextChange = vi.fn();
    const { rerender } = render(
      <InterviewAnswerControl
        question={question("behavioral")}
        textValue="   "
        selectedOptionId=""
        onTextChange={onTextChange}
        onSelectedOptionChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(
      (screen.getByRole("button", { name: "Save attempt" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    rerender(
      <InterviewAnswerControl
        question={question("behavioral")}
        textValue={"x".repeat(12_001)}
        selectedOptionId=""
        error={{ message: "Answer is too long.", requestId: "request-id-00000001" }}
        onTextChange={onTextChange}
        onSelectedOptionChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain("Answer is too long.");
    expect(screen.getByRole("alert").textContent).toContain("request-id-00000001");
    expect(
      (screen.getByRole("button", { name: "Save attempt" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    fireEvent.change(screen.getByRole("textbox", { name: /Behavioral answer/ }), {
      target: { value: "new value" },
    });
    expect(onTextChange).toHaveBeenCalledWith("new value");
  });
});

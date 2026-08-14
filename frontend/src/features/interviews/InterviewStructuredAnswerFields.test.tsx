import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { InterviewStructuredAnswerFields } from "./InterviewStructuredAnswerFields";
import {
  STRUCTURED_ANSWER_MAX_LENGTH,
  serializeStructuredAnswer,
  type StructuredAnswerDraft,
  type StructuredInterviewQuestionType,
} from "./interviewStructuredAnswer";

function Harness({
  questionType = "behavioral",
}: {
  questionType?: StructuredInterviewQuestionType;
}) {
  const [value, setValue] = useState<StructuredAnswerDraft>({});
  return (
    <>
      <InterviewStructuredAnswerFields
        questionType={questionType}
        value={value}
        onChange={setValue}
      />
      <output aria-label="Serialized answer">
        {serializeStructuredAnswer(questionType, value)}
      </output>
    </>
  );
}

describe("InterviewStructuredAnswerFields", () => {
  it("renders Behavioral STAR fields as one accessible vertical group", () => {
    render(<Harness />);
    const group = screen.getByRole("group", { name: "Behavioral response" });
    for (const label of ["Situation", "Task", "Action", "Result"]) {
      expect(within(group).getByRole("textbox", { name: label })).not.toBeNull();
    }
    expect(
      within(group).getByText(
        "Use the STAR structure to keep your example clear and evidence-based.",
      ),
    ).not.toBeNull();
  });

  it("renders the approved Scenario-Based field labels", () => {
    render(<Harness questionType="scenario-based" />);
    const group = screen.getByRole("group", { name: "Scenario response" });
    for (const label of ["Assessment", "Approach", "Trade-offs", "Decision"]) {
      expect(within(group).getByRole("textbox", { name: label })).not.toBeNull();
    }
  });

  it("renders the approved Technical Explanation field labels", () => {
    render(<Harness questionType="technical-explanation" />);
    const group = screen.getByRole("group", { name: "Technical explanation" });
    for (const label of [
      "Concept",
      "How it works",
      "Example",
      "Trade-offs / limitations",
    ]) {
      expect(within(group).getByRole("textbox", { name: label })).not.toBeNull();
    }
  });

  it("updates sections independently and counts exact serialized characters", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByRole("textbox", { name: "Situation" }), "Context");
    await user.type(screen.getByRole("textbox", { name: "Action" }), "Worked");

    expect(screen.getByLabelText("Serialized answer").textContent).toBe(
      "Situation:\nContext\n\nAction:\nWorked",
    );
    expect(screen.getByRole("textbox", { name: "Task" })).toHaveProperty(
      "value",
      "",
    );
    expect(screen.getByText("34 / 12,000")).not.toBeNull();
  });

  it("rejects an edit that would exceed the combined serialized limit", () => {
    render(<Harness />);
    const situation = screen.getByRole("textbox", { name: "Situation" });
    const acceptedText = "x".repeat(
      STRUCTURED_ANSWER_MAX_LENGTH - "Situation:\n".length,
    );
    fireEvent.change(situation, { target: { value: acceptedText } });
    expect((situation as HTMLTextAreaElement).value).toBe(acceptedText);
    expect(screen.getByText("12,000 / 12,000")).not.toBeNull();

    fireEvent.change(situation, { target: { value: `${acceptedText}x` } });
    expect((situation as HTMLTextAreaElement).value).toBe(acceptedText);
    expect(
      screen.getByText(
        "Answer limit reached. Remove some text before adding more.",
      ),
    ).not.toBeNull();
  });

  it("does not create a nested form", () => {
    const { container } = render(
      <form>
        <Harness />
      </form>,
    );
    expect(container.querySelector("form form")).toBeNull();
  });
});

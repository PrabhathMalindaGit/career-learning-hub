import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { QuizTaker } from "./QuizTaker";
import type {
  QuizAnswerSelection,
  QuizQuestionForTaking,
} from "./types";

const documentId = "507f1f77bcf86cd799439011";

const questions: QuizQuestionForTaking[] = [
  {
    questionIndex: 0,
    prompt: "**Which** boundary is <canonical>?",
    choices: ["The server boundary", "<script>Browser guess</script>"],
    sourcePages: [1],
  },
  {
    questionIndex: 1,
    prompt: "Where are drafts kept?",
    choices: ["React memory", "Persistent storage"],
    sourcePages: [],
  },
];

function Harness({
  onSubmit,
  submitting = false,
}: {
  onSubmit(answers: QuizAnswerSelection[]): void;
  submitting?: boolean;
}) {
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());
  return (
    <QuizTaker
      documentId={documentId}
      questions={questions}
      answers={answers}
      submitting={submitting}
      onSelect={(questionIndex, selectedChoiceIndex) =>
        setAnswers((current) => {
          const next = new Map(current);
          next.set(questionIndex, selectedChoiceIndex);
          return next;
        })
      }
      onSubmit={onSubmit}
    />
  );
}

function renderTaker(
  onSubmit = vi.fn(),
  submitting = false,
) {
  const router = createMemoryRouter(
    [
      {
        path: "/quiz",
        element: <Harness onSubmit={onSubmit} submitting={submitting} />,
      },
      {
        path: "/learning/documents/:documentId",
        element: <h1>Document workspace</h1>,
      },
    ],
    { initialEntries: ["/quiz"] },
  );
  render(<RouterProvider router={router} />);
  return { onSubmit, router };
}

describe("Quiz taker", () => {
  it("renders canonical prompts and choices as plain text without review data", () => {
    renderTaker();

    expect(screen.getByText("**Which** boundary is <canonical>?")).not.toBeNull();
    expect(
      screen.getByText("<script>Browser guess</script>"),
    ).not.toBeNull();
    expect(screen.queryByText(/correct answer/i)).toBeNull();
    expect(screen.queryByText(/explanation/i)).toBeNull();
    expect(screen.getAllByRole("group")).toHaveLength(2);
  });

  it("allows exactly one choice per question and submits only when complete", async () => {
    const onSubmit = vi.fn();
    renderTaker(onSubmit);
    const submit = screen.getByRole("button", {
      name: "Submit quiz answers",
    });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("0 of 2 questions answered")).not.toBeNull();

    await userEvent.click(
      screen.getByRole("radio", { name: "The server boundary" }),
    );
    await userEvent.click(
      screen.getByRole("radio", {
        name: "<script>Browser guess</script>",
      }),
    );
    expect(
      (
        screen.getByRole("radio", {
          name: "The server boundary",
        }) as HTMLInputElement
      ).checked,
    ).toBe(false);
    expect(screen.getByText("1 of 2 questions answered")).not.toBeNull();

    await userEvent.click(
      screen.getByRole("radio", { name: "React memory" }),
    );
    expect((submit as HTMLButtonElement).disabled).toBe(false);
    await userEvent.click(submit);

    expect(onSubmit).toHaveBeenCalledWith([
      { questionIndex: 0, selectedChoiceIndex: 1 },
      { questionIndex: 1, selectedChoiceIndex: 0 },
    ]);
  });

  it("shows only canonical source pages and disables interaction while submitting", () => {
    renderTaker(vi.fn(), true);

    expect(
      screen
        .getByRole("link", { name: "Review source page 1" })
        .getAttribute("href"),
    ).toBe(`/learning/documents/${documentId}`);
    expect(screen.getByText(/open Extracted Content/i)).not.toBeNull();
    expect(
      (
        screen.getByRole("radio", {
          name: "The server boundary",
        }) as HTMLInputElement
      ).disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Submitting quiz answers…",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});

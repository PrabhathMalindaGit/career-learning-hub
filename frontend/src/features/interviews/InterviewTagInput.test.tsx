import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import {
  INTERVIEW_TAG_MAX_ITEMS,
  INTERVIEW_TAG_MAX_LENGTH,
  InterviewTagInput,
  mergeInterviewTags,
} from "./InterviewTagInput";

interface HarnessProps {
  initialValues?: string[];
  initialDraft?: string;
}

function Harness({
  initialValues = [],
  initialDraft = "",
}: HarnessProps) {
  const [values, setValues] = useState(initialValues);
  const [draft, setDraft] = useState(initialDraft);
  const [error, setError] = useState<string | undefined>();

  return (
    <>
      <InterviewTagInput
        id="focus-topics"
        label="Focus topics"
        values={values}
        draft={draft}
        error={error}
        placeholder="Add a focus topic"
        helpText="Press Enter or comma to add a topic."
        onValuesChange={setValues}
        onDraftChange={setDraft}
        onError={setError}
      />
      <output data-testid="tag-values">{JSON.stringify(values)}</output>
      <output data-testid="tag-draft">{draft}</output>
    </>
  );
}

function readValues(): string[] {
  return JSON.parse(
    screen.getByTestId("tag-values").textContent ?? "[]",
  ) as string[];
}

describe("mergeInterviewTags", () => {
  it("merges trimmed comma-separated values in first-seen order and suppresses exact duplicates", () => {
    expect(
      mergeInterviewTags(
        ["Reliability"],
        " API design, Reliability ",
      ),
    ).toEqual({
      values: ["Reliability", "API design"],
    });
  });

  it("ignores blank tokens without changing existing values", () => {
    expect(
      mergeInterviewTags(["Reliability"], " ,   ,  "),
    ).toEqual({
      values: ["Reliability"],
    });
  });

  it("rejects a token longer than the existing 120-character bound without mutating values", () => {
    const current = ["Reliability"];
    const result = mergeInterviewTags(
      current,
      "x".repeat(INTERVIEW_TAG_MAX_LENGTH + 1),
    );

    expect(result.values).toEqual(current);
    expect(result.error).toEqual(expect.any(String));
    expect(result.error).toMatch(/120/);
  });

  it("rejects a merge beyond the existing 50-item bound without mutating values", () => {
    const current = Array.from(
      { length: INTERVIEW_TAG_MAX_ITEMS },
      (_, index) => `Topic ${index + 1}`,
    );
    const result = mergeInterviewTags(current, "One more topic");

    expect(result.values).toEqual(current);
    expect(result.error).toEqual(expect.any(String));
    expect(result.error).toMatch(/50/);
  });
});

describe("InterviewTagInput", () => {
  it("commits a trimmed draft with Enter and clears the text input", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = screen.getByRole("textbox", {
      name: "Focus topics",
    });
    await user.type(input, "  API design  ");
    await user.keyboard("{Enter}");

    expect(readValues()).toEqual(["API design"]);
    expect(input).toHaveValue("");
    expect(screen.getByText("API design")).not.toBeNull();
  });

  it("commits the current draft when comma is pressed", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = screen.getByRole("textbox", {
      name: "Focus topics",
    });
    await user.type(input, "Reliability,");

    expect(readValues()).toEqual(["Reliability"]);
    expect(input).toHaveValue("");
  });

  it("handles comma-separated paste as one bounded merge", async () => {
    const user = userEvent.setup();
    render(<Harness initialValues={["Reliability"]} />);

    const input = screen.getByRole("textbox", {
      name: "Focus topics",
    });
    await user.click(input);
    await user.paste(" API design, Reliability, Communication ");

    expect(readValues()).toEqual([
      "Reliability",
      "API design",
      "Communication",
    ]);
    expect(input).toHaveValue("");
  });

  it("does not create a chip for whitespace-only input", async () => {
    const user = userEvent.setup();
    render(<Harness initialValues={["Reliability"]} />);

    const input = screen.getByRole("textbox", {
      name: "Focus topics",
    });
    await user.type(input, "   ");
    await user.keyboard("{Enter}");

    expect(readValues()).toEqual(["Reliability"]);
    expect(input).toHaveValue("");
  });

  it("suppresses exact duplicate chips", async () => {
    const user = userEvent.setup();
    render(<Harness initialValues={["Reliability"]} />);

    const input = screen.getByRole("textbox", {
      name: "Focus topics",
    });
    await user.type(input, "Reliability");
    await user.keyboard("{Enter}");

    expect(readValues()).toEqual(["Reliability"]);
    expect(
      screen.getAllByRole("button", {
        name: "Remove Reliability",
      }),
    ).toHaveLength(1);
  });

  it("removes chips only through explicit accessible Remove controls", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initialValues={["Reliability", "API design"]}
      />,
    );

    const group = screen.getByRole("group", {
      name: "Focus topics",
    });
    expect(
      within(group).getByRole("button", {
        name: "Remove Reliability",
      }),
    ).not.toBeNull();
    expect(
      within(group).getByRole("button", {
        name: "Remove API design",
      }),
    ).not.toBeNull();

    await user.click(
      within(group).getByRole("button", {
        name: "Remove Reliability",
      }),
    );

    expect(readValues()).toEqual(["API design"]);
    expect(
      screen.queryByRole("button", {
        name: "Remove Reliability",
      }),
    ).toBeNull();
  });

  it("keeps all chips when Backspace is pressed on an empty input", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initialValues={["Reliability", "API design"]}
      />,
    );

    const input = screen.getByRole("textbox", {
      name: "Focus topics",
    });
    await user.click(input);
    await user.keyboard("{Backspace}");

    expect(readValues()).toEqual([
      "Reliability",
      "API design",
    ]);
    expect(
      screen.getByRole("button", {
        name: "Remove API design",
      }),
    ).not.toBeNull();
  });

  it("shows an explicit error and preserves values when a token exceeds 120 characters", async () => {
    const user = userEvent.setup();
    render(<Harness initialValues={["Reliability"]} />);

    const input = screen.getByRole("textbox", {
      name: "Focus topics",
    });
    await user.type(
      input,
      "x".repeat(INTERVIEW_TAG_MAX_LENGTH + 1),
    );
    await user.keyboard("{Enter}");

    expect(readValues()).toEqual(["Reliability"]);
    expect(screen.getByRole("alert")).toHaveTextContent(/120/);
  });

  it("shows an explicit error and preserves all 50 values when another unique chip would exceed the item limit", async () => {
    const user = userEvent.setup();
    const initialValues = Array.from(
      { length: INTERVIEW_TAG_MAX_ITEMS },
      (_, index) => `Topic ${index + 1}`,
    );
    render(<Harness initialValues={initialValues} />);

    const input = screen.getByRole("textbox", {
      name: "Focus topics",
    });
    await user.type(input, "One more topic");
    await user.keyboard("{Enter}");

    expect(readValues()).toEqual(initialValues);
    expect(screen.getByRole("alert")).toHaveTextContent(/50/);
  });
});

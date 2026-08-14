import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { InterviewSuggestedTagInput } from "./InterviewSuggestedTagInput";

function Harness() {
  const [values, setValues] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([
    "REST APIs",
    "Databases",
  ]);
  const [error, setError] = useState<string>();

  return (
    <form>
      <button
        type="button"
        onClick={() => setSuggestions(["Machine Learning", "LLMs"])}
      >
        Change suggestions
      </button>
      <InterviewSuggestedTagInput
        id="focus-topics"
        label="Focus topics · Optional"
        suggestions={suggestions}
        values={values}
        draft={draft}
        placeholder="Add custom topic…"
        helpText="Choose suggestions or add your own."
        error={error}
        onValuesChange={setValues}
        onDraftChange={setDraft}
        onError={setError}
      />
      <output aria-label="Selected values">{values.join("|")}</output>
      <output aria-label="Current draft">{draft}</output>
    </form>
  );
}

describe("InterviewSuggestedTagInput", () => {
  it("starts suggestions unselected and toggles them deliberately", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const api = screen.getByRole("button", { name: "REST APIs" });
    expect(api.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("0 selected")).not.toBeNull();

    await user.click(api);
    expect(api.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByLabelText("Selected values").textContent).toBe(
      "REST APIs",
    );
    expect(screen.getByText("1 selected")).not.toBeNull();

    await user.click(api);
    expect(api.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByLabelText("Selected values").textContent).toBe("");
  });

  it("adds custom values with Enter and Add without nesting another form", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    const outerForm = container.querySelector("form");
    expect(outerForm?.querySelector("form")).toBeNull();

    const input = screen.getByRole("textbox", { name: "Custom Focus topics" });
    await user.type(input, "GraphQL{Enter}");

    const custom = screen.getByRole("button", { name: "GraphQL" });
    expect(custom.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByLabelText("Selected values").textContent).toBe("GraphQL");
    expect(screen.getByLabelText("Current draft").textContent).toBe("");

    await user.type(input, "Caching");
    expect(screen.getByLabelText("Current draft").textContent).toBe("Caching");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByLabelText("Selected values").textContent).toBe(
      "GraphQL|Caching",
    );

    await user.click(custom);
    expect(screen.getByLabelText("Selected values").textContent).toBe(
      "Caching",
    );
  });

  it("preserves selected values when the role suggestion set changes", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "REST APIs" }));
    await user.click(screen.getByRole("button", { name: "Change suggestions" }));

    const retained = screen.getByRole("button", { name: "REST APIs" });
    expect(retained.getAttribute("aria-pressed")).toBe("true");
    expect(
      screen.getByRole("button", { name: "Machine Learning" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("false");
  });

  it("does not duplicate an existing value", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "REST APIs" }));
    const input = screen.getByRole("textbox", { name: "Custom Focus topics" });
    await user.type(input, "REST APIs{Enter}");

    expect(screen.getAllByRole("button", { name: "REST APIs" })).toHaveLength(1);
    expect(screen.getByLabelText("Selected values").textContent).toBe(
      "REST APIs",
    );
  });

  it("surfaces the existing 120-character item limit", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = screen.getByRole("textbox", { name: "Custom Focus topics" });
    await user.type(input, "x".repeat(121));
    await user.keyboard("{Enter}");

    expect(screen.getByRole("alert").textContent).toContain(
      "Each item must be 120 characters or fewer.",
    );
    expect(screen.getByLabelText("Selected values").textContent).toBe("");
  });

  it("respects disabled state", () => {
    const onValuesChange = vi.fn();
    render(
      <InterviewSuggestedTagInput
        id="skill-gaps"
        label="Skill gaps · Optional"
        suggestions={["System Design"]}
        values={[]}
        draft=""
        disabled
        placeholder="Add custom skill gap…"
        helpText="Choose suggestions or add your own."
        onValuesChange={onValuesChange}
        onDraftChange={vi.fn()}
        onError={vi.fn()}
      />,
    );

    expect(
      (screen.getByRole("button", { name: "System Design" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Add" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(onValuesChange).not.toHaveBeenCalled();
  });
});

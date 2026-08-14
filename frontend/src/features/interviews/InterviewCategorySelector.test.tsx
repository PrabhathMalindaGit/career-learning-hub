import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  InterviewCategorySelector,
  canonicalInterviewCategorySuggestions,
} from "./InterviewCategorySelector";

function Harness({
  contextCategories,
  initialSelected,
}: {
  contextCategories: string[];
  initialSelected: string[];
}) {
  const [selected, setSelected] = useState(initialSelected);
  return (
    <>
      <InterviewCategorySelector
        contextCategories={contextCategories}
        selected={selected}
        onSelectedChange={setSelected}
      />
      <output aria-label="Selected categories">{selected.join("|")}</output>
    </>
  );
}

describe("InterviewCategorySelector", () => {
  it("builds stable session-context suggestions from focus topics then skill gaps", () => {
    expect(
      canonicalInterviewCategorySuggestions(
        [" MongoDB ", "Node.js", "mongodb", ""],
        [" System Design ", "node.JS", "API Security"],
      ),
    ).toEqual(["MongoDB", "Node.js", "System Design", "API Security"]);
  });

  it("does not render a nested form when used inside the generation form", () => {
    const { container } = render(
      <form>
        <InterviewCategorySelector
          contextCategories={["MongoDB"]}
          selected={["MongoDB"]}
          onSelectedChange={vi.fn()}
        />
      </form>,
    );

    expect(container.querySelector("form form")).toBeNull();
  });

  it("renders supplied context selections as accessible pressed chips", () => {
    const categories = ["MongoDB", "System Design"];
    render(
      <Harness
        contextCategories={categories}
        initialSelected={categories}
      />,
    );

    expect(
      screen.getByRole("button", { name: "MongoDB" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: "System Design" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    expect(screen.getByText("2 categories selected")).not.toBeNull();
  });

  it("allows deselection, canonical custom additions, removal, and an empty selection", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        contextCategories={["MongoDB", "System Design"]}
        initialSelected={["MongoDB", "System Design"]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "System Design" }));
    expect(
      screen.getByRole("button", { name: "System Design" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("false");
    expect(screen.getByLabelText("Selected categories").textContent).toBe(
      "MongoDB",
    );

    const custom = screen.getByLabelText("Custom categories");
    await user.type(custom, " API Security ");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByLabelText("Selected categories").textContent).toBe(
      "MongoDB|API Security",
    );

    await user.type(custom, "api security");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByLabelText("Selected categories").textContent).toBe(
      "MongoDB|API Security",
    );

    await user.click(
      screen.getByRole("button", { name: "Remove API Security" }),
    );
    await user.click(screen.getByRole("button", { name: "MongoDB" }));
    expect(screen.getByLabelText("Selected categories").textContent).toBe("");
    expect(screen.getByText("0 categories selected")).not.toBeNull();
  });

  it("selects the canonical context spelling when custom input matches an unselected suggestion", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        contextCategories={["MongoDB"]}
        initialSelected={[]}
      />,
    );

    await user.type(screen.getByLabelText("Custom categories"), " mongodb ");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByLabelText("Selected categories").textContent).toBe(
      "MongoDB",
    );
    expect(
      screen.getByRole("button", { name: "MongoDB" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
  });

  it("respects the disabled state without changing the controlled selection", async () => {
    const onSelectedChange = vi.fn();
    render(
      <InterviewCategorySelector
        contextCategories={["MongoDB"]}
        selected={["MongoDB"]}
        disabled
        onSelectedChange={onSelectedChange}
      />,
    );

    const contextButton = screen.getByRole("button", { name: "MongoDB" });
    expect((contextButton as HTMLButtonElement).disabled).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Add" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(onSelectedChange).not.toHaveBeenCalled();
  });
});

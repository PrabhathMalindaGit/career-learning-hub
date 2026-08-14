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

    for (const category of categories) {
      const chip = screen.getByRole("button", { name: category });
      expect(chip.getAttribute("aria-pressed")).toBe("true");
      expect(chip.className).toContain("interview-category-chip");
    }
    expect(screen.getByText("2 categories selected")).not.toBeNull();
  });

  it("shows a custom category as the same selected chip and removes it by toggling", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        contextCategories={["MongoDB", "System Design"]}
        initialSelected={["MongoDB", "System Design"]}
      />,
    );

    const customInput = screen.getByLabelText("Custom categories");
    await user.type(customInput, " API Security ");
    await user.click(screen.getByRole("button", { name: "Add" }));

    const customChip = screen.getByRole("button", { name: "API Security" });
    expect(customChip.getAttribute("aria-pressed")).toBe("true");
    expect(customChip.className).toContain("interview-category-chip");
    expect(screen.getByText("3 categories selected")).not.toBeNull();
    expect(screen.getByLabelText("Selected categories").textContent).toBe(
      "MongoDB|System Design|API Security",
    );

    await user.click(customChip);
    expect(
      screen.queryByRole("button", { name: "API Security" }),
    ).toBeNull();
    expect(screen.getByText("2 categories selected")).not.toBeNull();
  });

  it("keeps context suggestions available after deselection and allows an empty selection", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        contextCategories={["MongoDB", "System Design"]}
        initialSelected={["MongoDB", "System Design"]}
      />,
    );

    const systemDesign = screen.getByRole("button", { name: "System Design" });
    await user.click(systemDesign);
    expect(systemDesign.getAttribute("aria-pressed")).toBe("false");
    await user.click(screen.getByRole("button", { name: "MongoDB" }));

    expect(screen.getByLabelText("Selected categories").textContent).toBe("");
    expect(screen.getByText("0 categories selected")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "MongoDB" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("false");
  });

  it("selects canonical context spelling instead of duplicating custom input", async () => {
    const user = userEvent.setup();
    render(
      <Harness contextCategories={["MongoDB"]} initialSelected={[]} />,
    );

    await user.type(screen.getByLabelText("Custom categories"), " mongodb ");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByLabelText("Selected categories").textContent).toBe(
      "MongoDB",
    );
    expect(screen.getAllByRole("button", { name: "MongoDB" })).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "MongoDB" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
  });

  it("respects disabled state without changing the controlled selection", () => {
    const onSelectedChange = vi.fn();
    render(
      <InterviewCategorySelector
        contextCategories={["MongoDB"]}
        selected={["MongoDB"]}
        disabled
        onSelectedChange={onSelectedChange}
      />,
    );

    expect(
      (screen.getByRole("button", { name: "MongoDB" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Add" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(onSelectedChange).not.toHaveBeenCalled();
  });
});

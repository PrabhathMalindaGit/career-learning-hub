import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Breadcrumbs } from "./Breadcrumbs";

describe("Breadcrumbs", () => {
  it("renders prepared route labels with one current page", () => {
    render(
      <MemoryRouter>
        <Breadcrumbs
          items={[
            { label: "Learning", to: "/learning" },
            {
              label: "Synthetic systems notes",
              to: "/learning/documents/document-id",
            },
            { label: "Systems quiz" },
          ]}
        />
      </MemoryRouter>,
    );

    const navigation = screen.getByRole("navigation", {
      name: "Breadcrumb",
    });
    const items = within(navigation).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(
      within(navigation)
        .getByRole("link", { name: "Learning" })
        .getAttribute("href"),
    ).toBe("/learning");
    expect(
      within(navigation)
        .getByText("Systems quiz")
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(navigation.textContent).not.toContain("document-id");
  });
});

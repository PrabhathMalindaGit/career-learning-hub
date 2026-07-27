import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("renders the caller-supplied heading with caller-owned semantics", () => {
    render(
      <section>
        <PageHeader
          heading={<h2 id="caller-heading">Caller heading</h2>}
        />
      </section>,
    );

    expect(
      screen
        .getByRole("heading", {
          level: 2,
          name: "Caller heading",
        })
        .getAttribute("id"),
    ).toBe("caller-heading");
  });

  it("renders optional caller-supplied supporting copy", () => {
    render(
      <section>
        <PageHeader
          heading={<h1>Page title</h1>}
          description={
            <p>Supporting copy remains owned by the caller.</p>
          }
        />
      </section>,
    );

    expect(
      screen.getByText(
        "Supporting copy remains owned by the caller.",
      ),
    ).not.toBeNull();
  });

  it("preserves caller-owned action behavior and accessible names", () => {
    render(
      <section>
        <PageHeader
          heading={<h1>Page title</h1>}
          actions={
            <>
              <a
                href="/caller-owned-route"
                aria-label="Open caller-owned route"
              >
                Open
              </a>
              <button type="button" aria-label="Caller-owned action">
                Run
              </button>
            </>
          }
        />
      </section>,
    );

    expect(
      screen
        .getByRole("link", {
          name: "Open caller-owned route",
        })
        .getAttribute("href"),
    ).toBe("/caller-owned-route");
    expect(
      screen.getByRole("button", {
        name: "Caller-owned action",
      }),
    ).not.toBeNull();
  });

  it("provides a wrapping action container without caller markup", () => {
    const { container } = render(
      <section>
        <PageHeader
          heading={<h1>Page title</h1>}
          actions={<button type="button">Action</button>}
        />
      </section>,
    );

    expect(
      container
        .querySelector(".page-header__actions")
        ?.contains(screen.getByRole("button", { name: "Action" })),
    ).toBe(true);
  });

  it("does not invent landmarks, routing, domain state, or status semantics", () => {
    const { container } = render(
      <section>
        <PageHeader heading={<h1>Page title</h1>} />
      </section>,
    );

    expect(screen.queryByRole("banner")).toBeNull();
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(
      container.querySelector(".page-header__description"),
    ).toBeNull();
    expect(
      container.querySelector(".page-header__actions"),
    ).toBeNull();
  });
});

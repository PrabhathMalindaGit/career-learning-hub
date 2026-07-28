import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StateSurface } from "./StateSurface";

describe("StateSurface", () => {
  it("renders caller-owned heading, body, actions, and request ID", () => {
    render(
      <StateSurface
        mode="static"
        heading={<h2>Caller-owned state</h2>}
        body={<p>Caller-owned explanation.</p>}
        actions={<button type="button">Caller-owned action</button>}
        requestId="request-state-0001"
      />,
    );

    const heading = screen.getByRole("heading", {
      name: "Caller-owned state",
    });
    expect(screen.getByText("Caller-owned explanation.")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Caller-owned action" }),
    ).not.toBeNull();
    expect(heading.textContent).not.toContain("request-state-0001");
    expect(
      screen.getByText("Request ID: request-state-0001"),
    ).not.toBeNull();
  });

  it("keeps static presentation outside live-region semantics", () => {
    render(
      <StateSurface
        mode="static"
        heading={<h2>Nothing here yet</h2>}
      />,
    );

    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("uses status semantics only when explicitly requested", () => {
    render(
      <StateSurface mode="status" body="Loading caller data…" />,
    );

    expect(screen.getByRole("status").textContent).toBe(
      "Loading caller data…",
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("uses alert semantics only when explicitly requested", () => {
    render(
      <StateSurface mode="alert" body="Caller-selected alert." />,
    );

    expect(screen.getByRole("alert").textContent).toBe(
      "Caller-selected alert.",
    );
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("introduces no navigation or route behavior", () => {
    render(
      <StateSurface
        mode="static"
        body="Safe not-found wording remains caller-owned."
      />,
    );

    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });
});

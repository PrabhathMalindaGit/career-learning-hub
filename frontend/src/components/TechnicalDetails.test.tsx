import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TechnicalDetails } from "./TechnicalDetails";

describe("TechnicalDetails", () => {
  it("keeps a safe Request ID under collapsed Technical details by default", () => {
    render(
      <TechnicalDetails
        requestId="request-technical-0001"
        className="caller-details"
      />,
    );

    const summary = screen.getByText("Technical details");
    const details = summary.closest("details") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(details.classList.contains("technical-details")).toBe(true);
    expect(details.classList.contains("caller-details")).toBe(true);
    expect(
      screen.getByText("Request ID: request-technical-0001"),
    ).not.toBeNull();
  });

  it("renders nothing when there is no Request ID", () => {
    render(<TechnicalDetails />);

    expect(screen.queryByText("Technical details")).toBeNull();
  });
});

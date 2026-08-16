import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccountSummary } from "./AccountSummary";

describe("AccountSummary", () => {
  it("keeps the complete account email accessible while allowing visual truncation", () => {
    const email = "long.account.address+career-learning-hub@example.test";

    render(
      <AccountSummary
        displayName="Synthetic Student"
        email={email}
      />,
    );

    const group = screen.getByRole("group", { name: "Signed in account" });
    expect(group).not.toBeNull();
    expect(screen.getByText("Synthetic Student")).not.toBeNull();
    const emailText = screen.getByText(email);
    expect(emailText.textContent).toBe(email);
    expect(emailText.getAttribute("title")).toBe(email);
  });

  it("uses a neutral display-name fallback without inventing an email", () => {
    render(<AccountSummary displayName="   " />);

    expect(screen.getByText("Account")).not.toBeNull();
    expect(screen.queryByText(/@/)).toBeNull();
  });
});

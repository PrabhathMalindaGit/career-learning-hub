import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { InterviewRoleSelector } from "./InterviewRoleSelector";

const financeRoles = ["Accountant", "Auditor", "Financial Analyst"];

function Harness({
  disabled = false,
  roleOptions = financeRoles,
}: {
  disabled?: boolean;
  roleOptions?: readonly string[];
}) {
  const [value, setValue] = useState("");
  return (
    <>
      <InterviewRoleSelector
        roleOptions={roleOptions}
        value={value}
        disabled={disabled}
        onChange={setValue}
      />
      <output aria-label="Selected role">{value}</output>
    </>
  );
}

describe("InterviewRoleSelector", () => {
  it("shows only the supplied area roles as direct choices", () => {
    render(<Harness />);

    for (const label of financeRoles) {
      expect(screen.getByRole("button", { name: label })).not.toBeNull();
    }
    expect(
      screen.queryByRole("button", { name: "Backend Developer" }),
    ).toBeNull();
  });

  it("filters only supplied roles and adopts one selected role", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const search = screen.getByRole("combobox", { name: "Target role" });
    await user.type(search, "aud");

    expect(screen.getByRole("option", { name: "Auditor" })).not.toBeNull();
    expect(
      screen.queryByRole("option", { name: "Backend Developer" }),
    ).toBeNull();

    await user.click(screen.getByRole("option", { name: "Auditor" }));
    expect(screen.getByLabelText("Selected role").textContent).toBe("Auditor");
    expect(
      screen.getByRole("button", { name: "Auditor" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
  });

  it("requires explicit adoption for a custom role", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const search = screen.getByRole("combobox", { name: "Target role" });
    await user.type(search, "Solutions Architect");
    expect(screen.getByLabelText("Selected role").textContent).toBe("");

    await user.click(
      screen.getByRole("button", { name: "Use “Solutions Architect”" }),
    );
    expect(screen.getByLabelText("Selected role").textContent).toBe(
      "Solutions Architect",
    );
  });

  it("uses Enter for a single area-scoped match but not custom text", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const search = screen.getByRole("combobox", { name: "Target role" });
    await user.type(search, "accountant");
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("Selected role").textContent).toBe(
      "Accountant",
    );

    await user.clear(search);
    await user.type(search, "Solutions Architect");
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("Selected role").textContent).toBe(
      "Accountant",
    );
  });

  it("keeps the custom input usable when an area has no representative roles", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness roleOptions={[]} />);

    expect(container.querySelector('[aria-label="Suggested roles"]')).toBeNull();
    expect(screen.getByText(/enter the role you want to practise for/i)).not.toBeNull();

    const search = screen.getByRole("combobox", { name: "Target role" });
    await user.type(search, "Marine Surveyor");
    await user.click(
      screen.getByRole("button", { name: "Use “Marine Surveyor”" }),
    );
    expect(screen.getByLabelText("Selected role").textContent).toBe(
      "Marine Surveyor",
    );
  });

  it("exposes combobox semantics and replaces the previous selection", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const search = screen.getByRole("combobox", { name: "Target role" });
    expect(search.getAttribute("aria-autocomplete")).toBe("list");
    expect(search.getAttribute("aria-controls")).toBe("interview-role-options");
    expect(search.getAttribute("aria-expanded")).toBe("false");

    await user.click(screen.getByRole("button", { name: "Accountant" }));
    expect(screen.getByLabelText("Selected role").textContent).toBe(
      "Accountant",
    );
    await user.click(screen.getByRole("button", { name: "Financial Analyst" }));
    expect(screen.getByLabelText("Selected role").textContent).toBe(
      "Financial Analyst",
    );
  });

  it("disables all adoption controls when disabled", () => {
    const onChange = vi.fn();
    render(
      <InterviewRoleSelector
        roleOptions={financeRoles}
        value=""
        disabled
        onChange={onChange}
      />,
    );

    expect(
      (screen.getByRole("combobox", { name: "Target role" }) as HTMLInputElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Accountant" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });
});

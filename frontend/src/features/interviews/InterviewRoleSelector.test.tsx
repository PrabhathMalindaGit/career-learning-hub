import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { InterviewRoleSelector } from "./InterviewRoleSelector";

function Harness({ disabled = false }: { disabled?: boolean }) {
  const [value, setValue] = useState("");
  return (
    <>
      <InterviewRoleSelector
        value={value}
        disabled={disabled}
        onChange={setValue}
      />
      <output aria-label="Selected role">{value}</output>
    </>
  );
}

describe("InterviewRoleSelector", () => {
  it("shows the ten approved common roles as direct choices", () => {
    render(<Harness />);

    for (const label of [
      "Software Engineer",
      "Frontend Developer",
      "Backend Developer",
      "Full-Stack Developer",
      "Mobile Developer",
      "DevOps / Cloud Engineer",
      "Data Engineer",
      "ML / AI Engineer",
      "Cybersecurity Engineer",
      "QA / Test Engineer",
    ]) {
      expect(screen.getByRole("button", { name: label })).not.toBeNull();
    }
  });

  it("filters common roles and adopts one selected role", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const search = screen.getByRole("combobox", { name: "Target role" });
    await user.type(search, "backend");

    const listbox = screen.getByRole("listbox", { name: "Matching roles" });
    expect(screen.getByRole("option", { name: "Backend Developer" })).not.toBeNull();
    expect(listbox.textContent).not.toContain("Frontend Developer");

    await user.click(screen.getByRole("option", { name: "Backend Developer" }));
    expect(screen.getByLabelText("Selected role").textContent).toBe(
      "Backend Developer",
    );
    expect(
      screen.getByRole("button", { name: "Backend Developer" }).getAttribute(
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

  it("uses Enter for a single filtered built-in match but not custom text", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const search = screen.getByRole("combobox", { name: "Target role" });
    await user.type(search, "backend");
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("Selected role").textContent).toBe(
      "Backend Developer",
    );

    await user.clear(search);
    await user.type(search, "Solutions Architect");
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("Selected role").textContent).toBe(
      "Backend Developer",
    );
  });

  it("exposes combobox semantics and replaces the previous selection", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const search = screen.getByRole("combobox", { name: "Target role" });
    expect(search.getAttribute("aria-autocomplete")).toBe("list");
    expect(search.getAttribute("aria-controls")).toBe("interview-role-options");
    expect(search.getAttribute("aria-expanded")).toBe("false");

    await user.click(screen.getByRole("button", { name: "Frontend Developer" }));
    expect(screen.getByLabelText("Selected role").textContent).toBe(
      "Frontend Developer",
    );
    await user.click(screen.getByRole("button", { name: "Data Engineer" }));
    expect(screen.getByLabelText("Selected role").textContent).toBe(
      "Data Engineer",
    );
  });

  it("disables all adoption controls when disabled", () => {
    const onChange = vi.fn();
    render(
      <InterviewRoleSelector value="" disabled onChange={onChange} />,
    );

    expect(
      (screen.getByRole("combobox", { name: "Target role" }) as HTMLInputElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Backend Developer" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });
});

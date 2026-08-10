import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ResumeGuidedSetup } from "./ResumeGuidedSetup";
import type { CreateResumeInput } from "./types";

describe("ResumeGuidedSetup", () => {
  it("submits only explicitly selected skills and never persists guidance", async () => {
    const onSubmit = vi.fn(async (_input: CreateResumeInput) => undefined);
    render(<ResumeGuidedSetup onBack={vi.fn()} onSubmit={onSubmit} />);
    const user = userEvent.setup();

    const title = screen.getByRole("textbox", { name: "Resume title" });
    const role = screen.getByRole("combobox", { name: "Target role" });
    expect(role.getAttribute("list")).toBeTruthy();
    expect(screen.getByRole("option", { name: "Entry level" })).not.toBeNull();
    expect(screen.getByText("Summary")).not.toBeNull();
    expect(screen.queryByRole("checkbox", { name: "Summary" })).toBeNull();
    const sectionList = screen.getByRole("list", {
      name: "Suggested Resume sections",
    });
    expect(sectionList.classList.contains("resume-guided-section-chips")).toBe(
      true,
    );
    expect(
      screen.getByText("Guidance only — these do not create Resume content."),
    ).not.toBeNull();
    const catalogue = screen
      .getByText("Browse all skills")
      .closest("details");
    expect(catalogue?.open).toBe(false);
    expect(
      catalogue?.contains(screen.getByRole("searchbox", { name: "Search skills" })),
    ).toBe(true);
    expect(screen.getByText("No skills selected yet.")).not.toBeNull();

    await user.type(title, "  Guided Resume  ");
    await user.type(role, "Software Engineer");
    const roleSuggestions = screen.getByRole("group", {
      name: "Suggested for Software Engineer",
    });
    expect((within(roleSuggestions).getByRole("checkbox", { name: "JavaScript" }) as HTMLInputElement).checked).toBe(false);
    expect((within(roleSuggestions).getByRole("checkbox", { name: "React" }) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole("checkbox", { name: "Use target role as Resume headline" }) as HTMLInputElement).checked).toBe(false);

    await user.click(within(roleSuggestions).getByRole("checkbox", { name: "JavaScript" }));
    await user.click(within(roleSuggestions).getByRole("checkbox", { name: "React" }));
    await user.click(screen.getByRole("button", { name: "Add selected skills" }));
    expect(screen.getByText("Selected skills")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Remove React" })).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Create guided resume" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0]?.[0];
    expect(payload?.title).toBe("Guided Resume");
    expect(payload?.content?.basics).toEqual({ fullName: "", links: [] });
    expect(payload?.content?.skills).toEqual([
      { name: "Programming Languages", keywords: ["JavaScript"] },
      { name: "Software & Web Development", keywords: ["React"] },
    ]);
    expect(payload?.content?.experience).toEqual([]);
    expect(payload?.content?.education).toEqual([]);
    expect(payload?.content?.projects).toEqual([]);
    expect(payload?.content?.certifications).toEqual([]);
    expect(payload?.content?.languages).toEqual([]);
    expect(payload?.content?.interests).toEqual([]);
    expect(JSON.stringify(payload)).not.toMatch(/entry|suggestedSections/i);
    expect(JSON.stringify(payload)).not.toContain("Docker");
  });

  it("allows custom roles and skills with explicit headline opt-in", async () => {
    const onSubmit = vi.fn(async (_input: CreateResumeInput) => undefined);
    render(<ResumeGuidedSetup onBack={vi.fn()} onSubmit={onSubmit} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Create guided resume" }));
    expect(document.activeElement).toBe(
      screen.getByRole("textbox", { name: "Resume title" }),
    );
    expect(screen.getByText("Enter a title with 1–120 characters.")).not.toBeNull();

    await user.type(screen.getByRole("textbox", { name: "Resume title" }), "Custom");
    await user.type(screen.getByRole("combobox", { name: "Target role" }), "Space Systems Generalist");
    await user.click(screen.getByRole("checkbox", { name: "Use target role as Resume headline" }));
    await user.type(screen.getByRole("textbox", { name: "Custom skill" }), "Telemetry Review");
    await user.clear(screen.getByRole("combobox", { name: "Custom skill group" }));
    await user.type(screen.getByRole("combobox", { name: "Custom skill group" }), "Custom Skills");
    expect(screen.getByText("Add a custom skill")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Add selected skills" }));
    await user.click(screen.getByRole("button", { name: "Create guided resume" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0].content?.basics.headline).toBe(
      "Space Systems Generalist",
    );
    expect(onSubmit.mock.calls[0]?.[0].content?.skills).toEqual([
      { name: "Custom Skills", keywords: ["Telemetry Review"] },
    ]);
  });

  it("keeps cross-career role guidance optional across role changes and custom input", async () => {
    const onSubmit = vi.fn(async (_input: CreateResumeInput) => undefined);
    render(<ResumeGuidedSetup onBack={vi.fn()} onSubmit={onSubmit} />);
    const user = userEvent.setup();
    const role = screen.getByRole("combobox", { name: "Target role" });

    await user.type(role, "Accountant");
    const accounting = screen.getByRole("group", {
      name: "Suggested for Accountant",
    });
    for (const skill of ["Financial Reporting", "Microsoft Excel"]) {
      expect(
        (within(accounting).getByRole("checkbox", { name: skill }) as HTMLInputElement)
          .checked,
      ).toBe(false);
    }
    expect(screen.getByText("No skills selected yet.")).not.toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.click(
      within(accounting).getByRole("checkbox", { name: "Financial Reporting" }),
    );
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Add selected skills" }));
    expect(screen.getByRole("button", { name: "Remove Financial Reporting" }))
      .not.toBeNull();

    await user.clear(role);
    await user.type(role, "Digital Marketing Executive");
    const marketing = screen.getByRole("group", {
      name: "Suggested for Digital Marketing Executive",
    });
    expect(
      (within(marketing).getByRole("checkbox", { name: "SEO" }) as HTMLInputElement)
        .checked,
    ).toBe(false);
    expect(screen.getByRole("button", { name: "Remove Financial Reporting" }))
      .not.toBeNull();

    await user.clear(role);
    await user.type(role, "Civil Engineer");
    const engineering = screen.getByRole("group", {
      name: "Suggested for Civil Engineer",
    });
    expect(
      (within(engineering).getByRole("checkbox", { name: "AutoCAD" }) as HTMLInputElement)
        .checked,
    ).toBe(false);

    await user.clear(role);
    await user.type(role, "HR Executive");
    const humanResources = screen.getByRole("group", {
      name: "Suggested for HR Executive",
    });
    expect(
      (within(humanResources).getByRole("checkbox", { name: "Recruitment" }) as HTMLInputElement)
        .checked,
    ).toBe(false);

    await user.clear(role);
    await user.type(role, "Marine Operations Specialist");
    expect(
      screen.queryByRole("group", {
        name: "Suggested for Marine Operations Specialist",
      }),
    ).toBeNull();
    expect(screen.getByText("Browse all skills")).not.toBeNull();
    expect(screen.getByText("Add a custom skill")).not.toBeNull();
    expect(
      (screen.getByRole("checkbox", {
        name: "Use target role as Resume headline",
      }) as HTMLInputElement).checked,
    ).toBe(false);

    await user.type(
      screen.getByRole("textbox", { name: "Resume title" }),
      "Cross-career Resume",
    );
    await user.click(screen.getByRole("button", { name: "Create guided resume" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0].content?.basics).toEqual({
      fullName: "",
      links: [],
    });
    expect(onSubmit.mock.calls[0]?.[0].content?.skills).toEqual([
      {
        name: "Finance & Accounting",
        keywords: ["Financial Reporting"],
      },
    ]);
  });
});

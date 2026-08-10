import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ResumeSkillPicker } from "./ResumeSkillPicker";
import type { DraftSkill } from "./types";

function Harness({
  initial = [],
  suggested = ["React", "Docker"],
  onChange = vi.fn(),
}: {
  initial?: DraftSkill[];
  suggested?: string[];
  onChange?: (value: DraftSkill[]) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <ResumeSkillPicker
      value={value}
      suggestedKeywords={suggested}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe("ResumeSkillPicker", () => {
  it("filters catalogue categories and applies only checked or custom skills", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const user = userEvent.setup();

    const disclosure = screen.getByText("Browse all skills").closest("details");
    expect(disclosure?.open).toBe(false);
    expect(
      disclosure?.contains(screen.getByRole("searchbox", { name: "Search skills" })),
    ).toBe(true);
    const roleSuggestions = screen.getByRole("group", {
      name: "Suggested for this role",
    });
    expect((within(roleSuggestions).getByRole("checkbox", { name: "React" }) as HTMLInputElement).checked).toBe(false);
    expect((within(roleSuggestions).getByRole("checkbox", { name: "Docker" }) as HTMLInputElement).checked).toBe(false);
    await user.click(screen.getByText("Browse all skills"));
    await user.type(screen.getByRole("searchbox", { name: "Search skills" }), "react");
    expect(
      screen.getByRole("group", { name: "Software & Web Development" }),
    ).not.toBeNull();
    expect(
      screen.queryByRole("group", { name: "Finance & Accounting" }),
    ).toBeNull();
    await user.clear(screen.getByRole("searchbox", { name: "Search skills" }));

    await user.click(within(roleSuggestions).getByRole("checkbox", { name: "React" }));
    await user.click(screen.getByRole("checkbox", { name: "Git" }));
    await user.type(screen.getByRole("textbox", { name: "Custom skill" }), "Observability");
    await user.clear(screen.getByRole("combobox", { name: "Custom skill group" }));
    await user.type(screen.getByRole("combobox", { name: "Custom skill group" }), "Tools");
    await user.click(screen.getByRole("button", { name: "Add selected skills" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0].map((group: DraftSkill) => ({
      name: group.name,
      keywords: group.keywords,
    }))).toEqual([
      {
        name: "Software & Web Development",
        keywords: ["React", "Git"],
      },
      { name: "Tools", keywords: ["Observability"] },
    ]);
    expect(screen.getByRole("status").textContent).toContain("3 skills applied");
    expect(screen.getByText("Selected skills")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Remove Observability" })).not.toBeNull();
  });

  it("preserves existing identity, order, spelling, and unrelated keywords", async () => {
    const onChange = vi.fn();
    const initial: DraftSkill[] = [
      {
        id: "507f1f77bcf86cd799439011",
        clientKey: "skill-existing",
        name: "My Tools",
        keywords: ["React", "Custom Existing"],
      },
    ];
    render(<Harness initial={initial} onChange={onChange} />);
    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox", { name: "Custom skill" }), "react");
    await user.clear(screen.getByRole("combobox", { name: "Custom skill group" }));
    await user.type(screen.getByRole("combobox", { name: "Custom skill group" }), "Frontend");
    await user.click(screen.getByRole("checkbox", { name: "TypeScript" }));
    await user.click(screen.getByRole("button", { name: "Add selected skills" }));

    const next = onChange.mock.calls[0]?.[0] as DraftSkill[];
    expect(next[0]).toEqual(initial[0]);
    expect(next[1]?.name).toBe("Programming Languages");
    expect(next[1]?.keywords).toEqual(["TypeScript"]);
    expect(next.flatMap((group) => group.keywords).filter((skill) => skill.toLowerCase() === "react")).toEqual(["React"]);

    await user.click(screen.getByRole("button", { name: "Remove TypeScript" }));
    expect(
      (screen.getByRole("checkbox", {
        name: "TypeScript",
      }) as HTMLInputElement).checked,
    ).toBe(false);
    await user.click(screen.getByRole("button", { name: "Add selected skills" }));
    expect(
      (onChange.mock.calls.at(-1)?.[0] as DraftSkill[]).flatMap(
        (group) => group.keywords,
      ),
    ).not.toContain("TypeScript");

    await user.click(screen.getByRole("button", { name: "Remove Custom Existing" }));
    const removed = onChange.mock.calls.at(-1)?.[0] as DraftSkill[];
    expect(removed[0]).toMatchObject({
      id: initial[0]?.id,
      clientKey: "skill-existing",
      name: "My Tools",
      keywords: ["React"],
    });
  });

  it("does not auto-add or remove skills when role suggestions change", async () => {
    const onChange = vi.fn();
    function ChangingHarness() {
      const [suggestions, setSuggestions] = useState(["React"]);
      const [value, setValue] = useState<DraftSkill[]>([]);
      return (
        <>
          <button type="button" onClick={() => setSuggestions(["Docker"])}>
            Change role
          </button>
          <ResumeSkillPicker
            value={value}
            suggestedKeywords={suggestions}
            onChange={(next) => {
              setValue(next);
              onChange(next);
            }}
          />
        </>
      );
    }
    render(<ChangingHarness />);
    const user = userEvent.setup();
    const initialSuggestions = screen.getByRole("group", {
      name: "Suggested for this role",
    });
    await user.click(within(initialSuggestions).getByRole("checkbox", { name: "React" }));
    await user.click(screen.getByRole("button", { name: "Change role" }));
    const changedSuggestions = screen.getByRole("group", {
      name: "Suggested for this role",
    });
    expect(
      (within(changedSuggestions).getByRole("checkbox", {
        name: "Docker",
      }) as HTMLInputElement).checked,
    ).toBe(false);
    await user.click(screen.getByText("Browse all skills"));
    expect((screen.getByRole("checkbox", { name: "React" }) as HTMLInputElement).checked).toBe(true);
    await user.click(screen.getByRole("button", { name: "Add selected skills" }));
    const keywords = (onChange.mock.calls[0]?.[0] as DraftSkill[]).flatMap(
      (group) => group.keywords,
    );
    expect(keywords).toEqual(["React"]);
  });

  it("uses one canonical category mapping for role suggestions, the catalogue, and a custom merge", async () => {
    const onChange = vi.fn();
    render(
      <Harness
        suggested={["JavaScript", "React", "Node.js"]}
        onChange={onChange}
      />,
    );
    const user = userEvent.setup();
    const suggestions = screen.getByRole("group", {
      name: "Suggested for this role",
    });

    await user.click(
      within(suggestions).getByRole("checkbox", { name: "JavaScript" }),
    );
    await user.click(
      within(suggestions).getByRole("checkbox", { name: "React" }),
    );
    await user.click(
      within(suggestions).getByRole("checkbox", { name: "Node.js" }),
    );
    await user.click(screen.getByText("Browse all skills"));
    expect(
      (screen.getAllByRole("checkbox", { name: "React" })[1] as HTMLInputElement)
        .checked,
    ).toBe(true);
    await user.click(screen.getByRole("checkbox", { name: "Angular" }));
    await user.click(screen.getByRole("checkbox", { name: "Express" }));
    await user.click(screen.getByRole("checkbox", { name: "MongoDB" }));
    await user.type(
      screen.getByRole("textbox", { name: "Custom skill" }),
      "GraphQL",
    );
    await user.clear(
      screen.getByRole("combobox", { name: "Custom skill group" }),
    );
    await user.type(
      screen.getByRole("combobox", { name: "Custom skill group" }),
      "Backend",
    );
    await user.click(
      screen.getByRole("button", { name: "Add selected skills" }),
    );

    expect(
      (onChange.mock.calls[0]?.[0] as DraftSkill[]).map(
        ({ name, keywords }) => ({ name, keywords }),
      ),
    ).toEqual([
      { name: "Programming Languages", keywords: ["JavaScript"] },
      {
        name: "Software & Web Development",
        keywords: ["React", "Angular", "Node.js", "Express"],
      },
      { name: "Data & Analytics", keywords: ["MongoDB"] },
      { name: "Backend", keywords: ["GraphQL"] },
    ]);
  });

  it("maps cross-career suggestions into shared canonical groups only after selection", async () => {
    const onChange = vi.fn();
    const suggested = [
      "Financial Reporting",
      "Budgeting",
      "Microsoft Excel",
      "Attention to Detail",
      "Digital Marketing",
      "SEO",
      "Canva",
      "Communication",
    ];
    render(<Harness suggested={suggested} onChange={onChange} />);
    const user = userEvent.setup();
    const suggestions = screen.getByRole("group", {
      name: "Suggested for this role",
    });

    for (const skill of suggested) {
      const checkbox = within(suggestions).getByRole("checkbox", { name: skill });
      expect((checkbox as HTMLInputElement).checked).toBe(false);
      await user.click(checkbox);
    }
    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Add selected skills" }));

    expect(
      (onChange.mock.calls[0]?.[0] as DraftSkill[]).map(
        ({ name, keywords }) => ({ name, keywords }),
      ),
    ).toEqual([
      {
        name: "Finance & Accounting",
        keywords: ["Financial Reporting", "Budgeting"],
      },
      {
        name: "Marketing & Sales",
        keywords: ["Digital Marketing", "SEO"],
      },
      { name: "Design & Creative", keywords: ["Canva"] },
      { name: "Administration & Office", keywords: ["Microsoft Excel"] },
      {
        name: "Communication & Interpersonal",
        keywords: ["Communication"],
      },
      { name: "Soft Skills", keywords: ["Attention to Detail"] },
    ]);
  });

  it("disables all mutation controls when requested", () => {
    render(
      <ResumeSkillPicker value={[]} disabled onChange={vi.fn()} />,
    );
    const picker = screen.getByRole("group", { name: "Skill picker" });
    for (const control of picker.querySelectorAll("input, button")) {
      expect(control.matches(":disabled")).toBe(true);
    }
  });
});

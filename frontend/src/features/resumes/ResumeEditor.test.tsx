import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { ResumeDraftValidationError } from "./resumeDraft";
import { ResumeEditor } from "./ResumeEditor";
import type { ResumeDraft } from "./types";

const resumeWorkspaceCss = readFileSync(
  resolve(process.cwd(), "src/features/resumes/resumeWorkspace.css"),
  "utf8",
);

const SECTION_TARGETS = [
  ["Basics", "resume-section-basics"],
  ["Links", "resume-section-links"],
  ["Experience", "resume-section-experience"],
  ["Education", "resume-section-education"],
  ["Skills", "resume-section-skills"],
  ["Projects", "resume-section-projects"],
  ["Certifications", "resume-section-certifications"],
  ["Languages", "resume-section-languages"],
  ["Interests", "resume-section-interests"],
] as const;

function emptyDraft(): ResumeDraft {
  return {
    basics: { fullName: "Synthetic Candidate", links: [] },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    interests: [],
  };
}

function renderEditor(
  draft = emptyDraft(),
  validationErrors: readonly ResumeDraftValidationError[] = [],
) {
  window.history.replaceState({}, "", "/");
  render(
    <BrowserRouter>
      <ResumeEditor
        draft={draft}
        onChange={vi.fn()}
        validationErrors={validationErrors}
      />
    </BrowserRouter>,
  );
}

function helperDraft(): ResumeDraft {
  const draft = emptyDraft();
  draft.experience.push({
    clientKey: "experience-helper",
    employer: "",
    jobTitle: "Custom Existing Role",
    startDate: "2025-01",
    endDate: "",
    isCurrent: true,
    bullets: [
      { clientKey: "bullet-empty", text: "" },
      { clientKey: "bullet-existing", text: "Existing factual bullet." },
    ],
  });
  draft.education.push({
    clientKey: "education-helper",
    institution: "",
    qualification: "Custom Qualification",
    startDate: "2020",
    endDate: "2024",
    isCurrent: false,
    details: [],
  });
  draft.skills.push({
    clientKey: "skill-helper",
    name: "Existing",
    keywords: ["Custom Skill"],
  });
  draft.certifications.push({
    clientKey: "certification-helper",
    name: "Manual Credential",
    issuedDate: "2025",
  });
  draft.languages.push({
    clientKey: "language-helper",
    name: "Custom Language",
    proficiency: "Community working level",
  });
  draft.interests.push({
    clientKey: "interest-helper",
    value: "Custom factual interest",
  });
  return draft;
}

describe("ResumeEditor section navigation", () => {
  it("links every approved section name to a real stable section target", () => {
    renderEditor();

    const navigation = screen.getByRole("navigation", {
      name: "Resume sections",
    });
    const links = SECTION_TARGETS.map(([name, targetId]) => {
      const link = screen.getByRole("link", { name });
      expect(link.getAttribute("href")?.endsWith(`#${targetId}`)).toBe(true);

      const target = document.getElementById(targetId);
      expect(target).not.toBeNull();
      expect(target?.getAttribute("aria-labelledby")).toBe(
        `${targetId}-heading`,
      );
      expect(
        screen.getByRole("heading", { level: 3, name }).id,
      ).toBe(`${targetId}-heading`);
      return link;
    });

    expect(navigation.querySelectorAll("a")).toHaveLength(9);
    expect(new Set(links.map((link) => link.getAttribute("href"))).size).toBe(
      9,
    );
    expect(
      screen.queryByRole("button", { name: /next|previous/i }),
    ).toBeNull();
    expect(resumeWorkspaceCss).toMatch(
      /\.resume-section-navigation ul\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(auto-fit,/s,
    );
    expect(resumeWorkspaceCss).not.toMatch(
      /\.resume-section-navigation\s*\{[^}]*overflow-x:\s*auto;/s,
    );
    expect(resumeWorkspaceCss).toMatch(
      /\.resume-entry-controls button\s*\{[^}]*min-height:\s*var\(--minimum-interactive-target\);/s,
    );
  });

  it("uses native keyboard-operable fragment links for direct navigation", async () => {
    renderEditor();
    const user = userEvent.setup();
    const certificationsLink = screen.getByRole("link", {
      name: "Certifications",
    });

    certificationsLink.focus();
    expect(document.activeElement).toBe(certificationsLink);
    await user.keyboard("{Enter}");

    expect(window.location.hash).toBe("#resume-section-certifications");
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Certifications" }),
      ),
    );
    expect(
      screen
        .getByRole("button", { name: "Certifications" })
        .getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("starts with Basics open and exposes keyboard-operable section disclosures", async () => {
    renderEditor();
    const user = userEvent.setup();

    expect(
      screen.getByRole("button", { name: "Basics" }).getAttribute(
        "aria-expanded",
      ),
    ).toBe("true");
    for (const [name] of SECTION_TARGETS.slice(1)) {
      const toggle = screen.getByRole("button", { name });
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
      expect(toggle.getAttribute("aria-controls")).toBe(
        `resume-section-${name.toLowerCase()}-content`,
      );
    }
    expect(screen.getByRole("textbox", { name: "Full name" })).not.toBeNull();
    expect(
      screen.queryByRole("button", { name: "Add link" }),
    ).toBeNull();

    const linksToggle = screen.getByRole("button", { name: "Links" });
    linksToggle.focus();
    await user.keyboard("{Enter}");
    expect(linksToggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("button", { name: "Add link" })).not.toBeNull();
    await user.keyboard(" ");
    expect(linksToggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("opens sections containing validation errors without changing draft content", async () => {
    const draft = emptyDraft();
    draft.skills.push({
      clientKey: "skill-1",
      name: "",
      keywords: ["TypeScript"],
    });
    renderEditor(draft, [
      {
        path: "skills.0.name",
        message: "Skill group 1 needs a name.",
      },
    ]);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Skills" }).getAttribute(
          "aria-expanded",
        ),
      ).toBe("true"),
    );
    expect(
      (screen.getByRole("textbox", {
        name: "Skill group 1 name",
      }) as HTMLInputElement).value,
    ).toBe("");
    expect(screen.getByText("Skill group 1 needs a name.")).not.toBeNull();
  });

  it("uses the established full-width form styling for project links and interests", async () => {
    const draft = emptyDraft();
    draft.projects.push({
      clientKey: "project-1",
      name: "Synthetic project",
      role: "",
      description: "",
      startDate: "",
      endDate: "",
      technologies: [],
      links: [
        {
          clientKey: "project-link-1",
          label: "Project overview",
          url: "https://example.test/project",
        },
      ],
      bullets: [],
    });
    draft.interests.push({
      clientKey: "interest-1",
      value: "Accessible interface design",
    });
    renderEditor(draft);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Projects" }));
    await user.click(screen.getByRole("button", { name: "Interests" }));

    const referenceInput = screen.getByRole("textbox", { name: "Full name" });
    const projectLinkLabel = screen.getByRole("textbox", {
      name: "Project link label",
    });
    const projectLinkUrl = screen.getByRole("textbox", {
      name: "Project link URL",
    });
    const interest = screen.getByRole("combobox", { name: "Interest 1" });

    for (const input of [
      referenceInput,
      projectLinkLabel,
      projectLinkUrl,
      interest,
    ]) {
      expect(input.closest("label")).not.toBeNull();
    }
    expect(resumeWorkspaceCss).toMatch(
      /\.resume-bullet-row label,\s*\.resume-entry-card > label \{/,
    );
    expect(resumeWorkspaceCss).toMatch(
      /\.resume-bullet-row input:not\(\[type\]\),\s*\.resume-bullet-row input\[inputmode="url"\],\s*\.resume-entry-card > label > input:not\(\[type\]\) \{/,
    );
    expect(resumeWorkspaceCss).toMatch(
      /\.resume-bullet-row input:not\(\[type\]\):focus,\s*\.resume-bullet-row input\[inputmode="url"\]:focus,\s*\.resume-entry-card > label > input:not\(\[type\]\):focus \{/,
    );
  });

  it("uses text URL controls without conflicting native type validation", () => {
    const draft = emptyDraft();
    draft.basics.links.push({
      clientKey: "basic-link-1",
      label: "Profile",
      url: "github.com/example",
    });
    draft.projects.push({
      clientKey: "project-1",
      name: "Synthetic project",
      technologies: [],
      links: [
        {
          clientKey: "project-link-1",
          label: "Project",
          url: "example.test/project",
        },
      ],
      bullets: [],
    });
    draft.certifications.push({
      clientKey: "certification-1",
      name: "Synthetic credential",
      credentialUrl: "credentials.example.test/verified",
    });
    renderEditor(draft);

    for (const input of [
      screen.getByLabelText("Link 1 URL"),
      screen.getByLabelText("Project link URL"),
      screen.getByLabelText("Credential URL"),
    ]) {
      expect(input.getAttribute("type")).toBe("text");
      expect(input.getAttribute("inputmode")).toBe("url");
      expect(input.getAttribute("autocapitalize")).toBe("none");
      expect(input.getAttribute("spellcheck")).toBe("false");
      expect((input as HTMLInputElement).validity.typeMismatch).toBe(false);
    }
  });

  it("preserves native browser spellcheck for editable resume prose", async () => {
    const draft = emptyDraft();
    draft.basics.headline = "Platform engineer";
    draft.basics.summary = "Builds reliable services for product teams.";
    draft.experience.push({
      clientKey: "experience-1",
      employer: "Synthetic Employer",
      jobTitle: "Engineer",
      isCurrent: true,
      bullets: [
        {
          clientKey: "experience-bullet-1",
          text: "Improved a synthetic delivery workflow.",
        },
      ],
    });
    draft.projects.push({
      clientKey: "project-1",
      name: "Synthetic project",
      description: "A local verification project.",
      technologies: [],
      links: [],
      bullets: [
        {
          clientKey: "project-bullet-1",
          text: "Documented synthetic results.",
        },
      ],
    });
    renderEditor(draft);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Experience" }));
    await user.click(screen.getByRole("button", { name: "Projects" }));

    for (const control of [
      screen.getByRole("textbox", { name: "Full name" }),
      screen.getByRole("textbox", { name: "Headline" }),
      screen.getByRole("textbox", { name: "Professional summary" }),
      screen.getByRole("textbox", { name: "Bullet 1" }),
      screen.getByRole("textbox", { name: "Description" }),
      screen.getByRole("textbox", { name: "Project bullet 1" }),
    ]) {
      expect(control.getAttribute("spellcheck")).not.toBe("false");
    }
  });

  it("keeps sixteen skill groups compact without changing identity or ordering", async () => {
    const draft = emptyDraft();
    draft.skills = Array.from({ length: 16 }, (_, index) => ({
      clientKey: `skill-${index + 1}`,
      name: `Skill group ${index + 1}`,
      keywords: [index === 0 ? "TypeScript" : `Keyword ${index + 1}`],
    }));
    const onChange = vi.fn();
    window.history.replaceState({}, "", "/");
    render(
      <BrowserRouter>
        <ResumeEditor draft={draft} onChange={onChange} />
      </BrowserRouter>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Skills" }));

    const rows = document.querySelectorAll(".resume-skill-editor-row");
    expect(rows).toHaveLength(16);
    expect(
      screen.getByRole("textbox", { name: "Skill group 1 name" }),
    ).not.toBeNull();
    expect(
      screen.getAllByText("Keywords, comma separated"),
    ).toHaveLength(16);
    expect(
      screen.getByRole("button", { name: "Move skill group 2 up" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Remove skill group 16" }),
    ).not.toBeNull();

    await user.click(
      screen.getByRole("button", { name: "Move skill group 2 up" }),
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        skills: expect.arrayContaining([
          expect.objectContaining({ clientKey: "skill-1" }),
          expect.objectContaining({ clientKey: "skill-2" }),
        ]),
      }),
    );
    expect(onChange.mock.calls.at(-1)?.[0].skills.slice(0, 2)).toEqual([
      expect.objectContaining({ clientKey: "skill-2" }),
      expect.objectContaining({ clientKey: "skill-1" }),
    ]);
  });

  it("adds deterministic helpers without replacing editable contracts", async () => {
    const onChange = vi.fn();
    const draft = helperDraft();
    window.history.replaceState({}, "", "/");
    render(
      <BrowserRouter>
        <ResumeEditor draft={draft} onChange={onChange} />
      </BrowserRouter>,
    );
    const user = userEvent.setup();
    for (const section of ["Experience", "Education", "Skills", "Certifications", "Languages", "Interests"]) {
      await user.click(screen.getByRole("button", { name: section }));
    }

    expect(screen.getByRole("combobox", { name: "Job title" }).getAttribute("list")).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Qualification" }).getAttribute("list")).toBeTruthy();
    expect((screen.getByRole("combobox", { name: "Proficiency" }) as HTMLInputElement).value).toBe("Community working level");
    expect(screen.getByRole("combobox", { name: "Interest 1" }).getAttribute("list")).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Certification name" }).getAttribute("list")).toBeNull();
    for (const startDate of screen.getAllByRole("textbox", { name: "Start date" })) {
      expect(startDate.getAttribute("list")).toBeNull();
    }

    await user.click(screen.getByRole("button", { name: "Start bullet 1 with Built" }));
    expect(onChange.mock.calls.at(-1)?.[0].experience[0].bullets[0].text).toBe("Built ");
    expect(onChange.mock.calls.at(-1)?.[0].experience[0].bullets[1].text).toBe("Existing factual bullet.");
    expect(screen.queryByRole("button", { name: "Start bullet 2 with Built" })).toBeNull();

    expect(screen.getByRole("textbox", { name: "Skill group 1 name" })).not.toBeNull();
    await user.click(screen.getByText("Add skills from catalogue"));
    await user.click(screen.getByRole("checkbox", { name: "TypeScript" }));
    await user.click(screen.getByRole("button", { name: "Add selected skills" }));
    expect(onChange.mock.calls.at(-1)?.[0].skills[0]).toMatchObject({
      clientKey: "skill-helper",
      name: "Existing",
      keywords: ["Custom Skill"],
    });
  });

  it("appends Achievement Builder output as one normal DraftBullet", async () => {
    const onChange = vi.fn();
    const draft = helperDraft();
    window.history.replaceState({}, "", "/");
    render(
      <BrowserRouter>
        <ResumeEditor draft={draft} onChange={onChange} />
      </BrowserRouter>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Experience" }));
    await user.click(screen.getByText("Build an achievement"));
    await user.selectOptions(screen.getByRole("combobox", { name: "Action" }), "Built");
    await user.type(screen.getByRole("textbox", { name: "What did you do?" }), "a factual dashboard");
    await user.click(screen.getByRole("button", { name: "Add achievement bullet" }));

    const bullets = onChange.mock.calls.at(-1)?.[0].experience[0].bullets;
    expect(bullets).toHaveLength(3);
    expect(bullets[2]).toMatchObject({ text: "Built a factual dashboard." });
    expect(bullets[2].clientKey).toBeTruthy();
  });

  it("keeps deterministic helper mutations disabled in read-only mode", async () => {
    const onChange = vi.fn();
    window.history.replaceState({}, "", "/");
    render(
      <BrowserRouter>
        <ResumeEditor draft={helperDraft()} onChange={onChange} disabled />
      </BrowserRouter>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Experience" }));
    expect((screen.getByRole("button", { name: "Start bullet 1 with Built" }) as HTMLButtonElement).disabled).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });
});

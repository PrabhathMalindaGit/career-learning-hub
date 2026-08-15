import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { resumeContentToDraft } from "./resumeDraft";
import { ResumePreview } from "./ResumePreview";
import type { ResumeContent, ResumeDesign } from "./types";

const id = "123e4567-e89b-42d3-a456-426614174000";
const secondId = "123e4567-e89b-42d3-a456-426614174001";
const resumeWorkspaceCss = readFileSync(
  resolve(process.cwd(), "src/features/resumes/resumeWorkspace.css"),
  "utf8",
);

function content(): ResumeContent {
  return {
    basics: {
      fullName: "Synthetic Candidate",
      email: "candidate@example.test",
      phone: "+1 555 0100",
      location: "Example City",
      headline: "Platform Engineer",
      summary: "Builds reliable systems.",
      links: [
        { id, label: "Portfolio", url: "https://example.test/work" },
        { id: secondId, label: "Unsafe", url: "javascript:alert(1)" },
      ],
    },
    experience: [
      {
        id,
        employer: "Example Org",
        jobTitle: "Engineer",
        isCurrent: true,
        bullets: [{ id, text: "Improved a synthetic service." }],
      },
    ],
    education: [
      {
        id,
        institution: "Example University",
        qualification: "BSc",
        isCurrent: false,
        details: [{ id, text: "Synthetic coursework" }],
      },
    ],
    skills: [{ id, name: "Systems", keywords: ["TypeScript"] }],
    projects: [
      {
        id,
        name: "Synthetic Project",
        technologies: ["React"],
        links: [{ id, label: "Project", url: "http://example.test" }],
        bullets: [{ id, text: "Created accessible output." }],
      },
    ],
    certifications: [
      {
        id,
        name: "Synthetic Credential",
        credentialUrl: "https://example.test/credential",
      },
    ],
    languages: [{ id, name: "English", proficiency: "Fluent" }],
    interests: ["Reading"],
  };
}

function design(
  templateId: string,
  fontFamily: string,
  colorPaletteId: string,
): ResumeDesign {
  return {
    templateId,
    colorPaletteId,
    pageSize: "A4",
    fontFamily,
    showProfilePhoto: false,
  };
}

describe("ResumePreview", () => {
  it("renders supported canonical sections and safe selectable links", () => {
    render(
      <ResumePreview
        draft={resumeContentToDraft(content())}
        label="Saved resume"
        pageSize="A4"
        printOnly
      />,
    );

    expect(screen.getByText("Synthetic Candidate")).not.toBeNull();
    expect(screen.getByText("Experience")).not.toBeNull();
    expect(screen.getByText("Education")).not.toBeNull();
    expect(screen.getByText("Projects")).not.toBeNull();
    expect(screen.getByText("Skills")).not.toBeNull();
    expect(screen.getByText("Certifications")).not.toBeNull();
    expect(screen.getByText("Languages")).not.toBeNull();
    expect(screen.getByText("Interests")).not.toBeNull();
    expect(
      screen.getByRole("link", { name: "Portfolio" }).getAttribute("href"),
    ).toBe("https://example.test/work");
    expect(
      screen.getByRole("link", { name: "Project" }).getAttribute("href"),
    ).toBe("http://example.test");
    expect(
      screen
        .getByRole("link", { name: "candidate@example.test" })
        .getAttribute("href"),
    ).toBe("mailto:candidate@example.test");
    expect(screen.queryByRole("link", { name: "Unsafe" })).toBeNull();
    expect(document.body.textContent).toContain("Unsafe");
  });

  it("marks the print-only ATS Classic surface with the selected paper size", () => {
    const { container } = render(
      <ResumePreview
        draft={resumeContentToDraft(content())}
        label="Historical saved version 2"
        pageSize="LETTER"
        printOnly
      />,
    );

    const surface = screen.getByLabelText("Historical saved version 2");
    expect(surface.getAttribute("data-page-size")).toBe("LETTER");
    expect(surface.classList.contains("resume-print-surface")).toBe(true);
    expect(
      surface.querySelector('[data-template="ats-classic"]'),
    ).not.toBeNull();
    expect(container.querySelector("style")?.textContent).toContain(
      "size: Letter",
    );
    expect(container.innerHTML).not.toContain("<script");
  });

  it.each([
    [
      "ats-classic",
      "resume-template-ats-classic",
      "Inter",
      "resume-font-inter",
      "slate",
      "resume-palette-slate",
    ],
    [
      "modern-professional",
      "resume-template-modern-professional",
      "Arial",
      "resume-font-arial",
      "forest",
      "resume-palette-forest",
    ],
    [
      "compact-technical",
      "resume-template-compact-technical",
      "Georgia",
      "resume-font-georgia",
      "navy",
      "resume-palette-navy",
    ],
  ])(
    "renders the complete canonical content through %s with registry-controlled classes",
    (
      templateId,
      templateClass,
      fontFamily,
      fontClass,
      colorPaletteId,
      paletteClass,
    ) => {
      const { container } = render(
        <ResumePreview
          draft={resumeContentToDraft(content())}
          design={design(templateId, fontFamily, colorPaletteId)}
        />,
      );
      const paper = screen.getByLabelText("Resume preview");

      expect(paper.getAttribute("data-template")).toBe(templateId);
      expect(paper.classList.contains(templateClass)).toBe(true);
      expect(paper.classList.contains(fontClass)).toBe(true);
      expect(paper.classList.contains(paletteClass)).toBe(true);
      expect(paper.textContent).toContain("Summary");
      expect(paper.textContent).toContain("Experience");
      expect(paper.textContent).toContain("Education");
      expect(paper.textContent).toContain("Skills");
      expect(paper.textContent).toContain("Projects");
      expect(paper.textContent).toContain("Certifications");
      expect(paper.textContent).toContain("Languages");
      expect(paper.textContent).toContain("Interests");
      expect(container.querySelector("img")).toBeNull();
      expect(container.querySelector("meter, progress, table, svg")).toBeNull();
    },
  );

  it("uses the safe presentation fallback for unknown values without class or style injection", () => {
    const unsafeTemplate = "unsafe-template injected";
    const unsafeFont = 'Georgia"; color: red';
    const unsafePalette = "unsafe-palette<script>";
    const { container } = render(
      <ResumePreview
        draft={resumeContentToDraft(content())}
        design={design(unsafeTemplate, unsafeFont, unsafePalette)}
      />,
    );
    const paper = screen.getByLabelText("Resume preview");

    expect(paper.getAttribute("data-template")).toBe("ats-classic");
    expect(paper.classList.contains("resume-template-ats-classic")).toBe(true);
    expect(paper.classList.contains("resume-font-inter")).toBe(true);
    expect(paper.classList.contains("resume-palette-slate")).toBe(true);
    expect(container.innerHTML).not.toContain(unsafeTemplate);
    expect(container.innerHTML).not.toContain(unsafeFont);
    expect(container.innerHTML).not.toContain(unsafePalette);
    expect(paper.getAttribute("style")).toBeNull();
  });

  it("renders missing optional sections without placeholders or content loss", () => {
    const sparse = content();
    sparse.basics.summary = undefined;
    sparse.projects = [];
    sparse.certifications = [];
    sparse.languages = [];
    sparse.interests = [];
    render(
      <ResumePreview
        draft={resumeContentToDraft(sparse)}
        design={design("compact-technical", "Arial", "forest")}
      />,
    );

    expect(screen.getByText("Synthetic Candidate")).not.toBeNull();
    expect(screen.queryByText("Summary")).toBeNull();
    expect(screen.queryByText("Projects")).toBeNull();
    expect(screen.getByText("Experience")).not.toBeNull();
    expect(screen.getByText("Education")).not.toBeNull();
    expect(screen.getByText("Skills")).not.toBeNull();
  });

  it("uses a naturally growing screen paper for long shared previews", () => {
    const longResume = content();
    longResume.experience[0].bullets = Array.from(
      { length: 24 },
      (_, index) => ({
        id: `${id.slice(0, -2)}${String(index).padStart(2, "0")}`,
        text: `Synthetic long Resume evidence bullet ${index + 1}.`,
      }),
    );
    longResume.certifications = [
      ...longResume.certifications,
      {
        id: secondId,
        name: "Last visible synthetic credential",
      },
    ];

    render(
      <ResumePreview
        draft={resumeContentToDraft(longResume)}
        design={design("ats-classic", "Inter", "slate")}
      />,
    );

    const paper = screen.getByLabelText("Resume preview");
    const lastContent = screen.getByText(
      "Last visible synthetic credential",
    );
    const screenPaperRule = resumeWorkspaceCss.match(
      /^\.resume-paper\s*\{([^}]*)\}/m,
    )?.[1];

    expect(paper.contains(lastContent)).toBe(true);
    expect(screenPaperRule).toContain("min-height: 620px;");
    expect(screenPaperRule).not.toContain("aspect-ratio:");
    expect(screenPaperRule).not.toMatch(/(^|\n)\s*height\s*:/);
    expect(screenPaperRule).toContain("overflow: visible;");
    expect(screenPaperRule).toContain("background: var(--resume-background);");
    expect(screenPaperRule).toContain("box-shadow:");
  });

  it("renders long skill groups as clean naturally wrapping Resume rows", () => {
    const resume = content();
    resume.skills = [
      {
        id,
        name: "Technical Skills",
        keywords: [
          "TypeScript",
          "JavaScript",
          "Playwright",
          "Communication",
          "Problem Solving",
          "REST APIs",
          "MongoDB",
          "Cloud Infrastructure Automation",
        ],
      },
      {
        id: secondId,
        name: "Strengths",
        keywords: ["Clear communication", "Team collaboration"],
      },
    ];
    const { container } = render(
      <ResumePreview
        draft={resumeContentToDraft(resume)}
        design={design("modern-professional", "Arial", "forest")}
      />,
    );

    const skills = container.querySelector(".resume-paper-skills");
    const skillGroupRule = resumeWorkspaceCss.match(
      /\.resume-paper-skills > div\s*\{([^}]*)\}/,
    )?.[1];
    const skillNameRule = resumeWorkspaceCss.match(
      /\.resume-paper-skills dt\s*\{([^}]*)\}/,
    )?.[1];
    const skillKeywordsRule = resumeWorkspaceCss.match(
      /\.resume-paper-skills dd\s*\{([^}]*)\}/,
    )?.[1];

    expect(skills).not.toBeNull();
    expect(skills?.querySelectorAll("dt")).toHaveLength(2);
    expect(skills?.querySelectorAll("dd")).toHaveLength(2);
    expect(skills?.textContent).toContain("Technical Skills:");
    expect(skills?.textContent).toContain("Cloud Infrastructure Automation");
    expect(skillGroupRule).toContain("display: flex;");
    expect(skillGroupRule).toContain("flex-wrap: wrap;");
    expect(skillGroupRule).toContain("min-width: 0;");
    expect(skillGroupRule).not.toContain("border-radius: 999px;");
    expect(skillGroupRule).not.toMatch(/border:\s*1px/);
    expect(skillNameRule).toContain("overflow-wrap: normal;");
    expect(skillNameRule).toContain("word-break: normal;");
    expect(skillKeywordsRule).toContain("overflow-wrap: anywhere;");
    expect(resumeWorkspaceCss).not.toMatch(
      /\.resume-paper-skills dt::after/,
    );
  });
});

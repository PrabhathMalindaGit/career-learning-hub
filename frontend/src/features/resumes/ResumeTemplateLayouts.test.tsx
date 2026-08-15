import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { resumeContentToDraft } from "./resumeDraft";
import { ResumeTemplateLayout } from "./ResumeTemplateLayouts";
import type { ResumeContent } from "./types";

const id = "123e4567-e89b-42d3-a456-426614174000";
const secondId = "123e4567-e89b-42d3-a456-426614174001";

function representativeContent(): ResumeContent {
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
      ],
    },
    experience: [
      {
        id,
        employer: "Example Org",
        jobTitle: "Engineer",
        startDate: "2024-01",
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
    skills: [{ id, name: "Systems", keywords: ["TypeScript", "MongoDB"] }],
    projects: [
      {
        id,
        name: "Synthetic Project",
        startDate: "2023-01",
        endDate: "2023-12",
        technologies: ["React"],
        links: [{ id, label: "Project", url: "https://example.test/project" }],
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

function sectionOrder(container: HTMLElement): Array<string | null> {
  return Array.from(
    container.querySelectorAll("[data-resume-section]"),
    (node) => node.getAttribute("data-resume-section"),
  );
}

describe("ResumeTemplateLayout", () => {
  it("keeps ATS Classic in the traditional canonical single-column order", () => {
    const draft = resumeContentToDraft(representativeContent());
    const { container } = render(
      <ResumeTemplateLayout
        draft={draft}
        templateId="ats-classic"
        showCandidatePhoto={false}
      />,
    );

    expect(
      container.querySelector('[data-resume-layout="ats-classic"]'),
    ).not.toBeNull();
    expect(sectionOrder(container)).toEqual([
      "summary",
      "experience",
      "education",
      "skills",
      "projects",
      "certifications",
      "languages",
      "interests",
    ]);
    expect(container.textContent).toContain("Synthetic Candidate");
    expect(container.textContent).toContain("Synthetic Project");
    expect(container.querySelector('a[href="https://example.test/work"]')).not.toBeNull();
  });

  it("renders Modern Professional as wider content plus a supporting sidebar", () => {
    const draft = resumeContentToDraft(representativeContent());
    const { container } = render(
      <ResumeTemplateLayout
        draft={draft}
        templateId="modern-professional"
        showCandidatePhoto={false}
      />,
    );

    expect(
      container.querySelector('[data-resume-layout="modern-professional"]'),
    ).not.toBeNull();
    const contentRegion = container.querySelector(
      '[data-resume-region="modern-content"]',
    );
    const sidebar = container.querySelector(
      '[data-resume-region="modern-sidebar"]',
    );
    expect(contentRegion).not.toBeNull();
    expect(sidebar).not.toBeNull();
    expect(
      contentRegion?.querySelector('[data-resume-section="summary"]'),
    ).not.toBeNull();
    expect(
      contentRegion?.querySelector('[data-resume-section="experience"]'),
    ).not.toBeNull();
    expect(
      contentRegion?.querySelector('[data-resume-section="projects"]'),
    ).not.toBeNull();
    expect(
      sidebar?.querySelector('[data-resume-section="skills"]'),
    ).not.toBeNull();
    expect(
      sidebar?.querySelector('[data-resume-section="education"]'),
    ).not.toBeNull();
    expect(
      sidebar?.querySelector('[data-resume-section="certifications"]'),
    ).not.toBeNull();
    expect(
      sidebar?.querySelector('[data-resume-section="languages"]'),
    ).not.toBeNull();
    expect(
      sidebar?.querySelector('[data-resume-section="interests"]'),
    ).not.toBeNull();
    expect(container.querySelector("main")).toBeNull();
  });

  it("renders Compact Technical in skills-first order with technical date rails", () => {
    const draft = resumeContentToDraft(representativeContent());
    const { container } = render(
      <ResumeTemplateLayout
        draft={draft}
        templateId="compact-technical"
        showCandidatePhoto={false}
      />,
    );

    expect(
      container.querySelector('[data-resume-layout="compact-technical"]'),
    ).not.toBeNull();
    expect(sectionOrder(container)).toEqual([
      "summary",
      "skills",
      "experience",
      "projects",
      "education",
      "certifications",
      "languages",
      "interests",
    ]);
    expect(
      container.querySelectorAll(".resume-preview-entry--technical-rail").length,
    ).toBeGreaterThan(0);
    expect(
      container.querySelector(".resume-preview-entry-date"),
    ).not.toBeNull();
  });

  it("does not mutate canonical draft data while switching templates", () => {
    const draft = resumeContentToDraft(representativeContent());
    const before = JSON.stringify(draft);
    const { rerender, container } = render(
      <ResumeTemplateLayout
        draft={draft}
        templateId="ats-classic"
        showCandidatePhoto={false}
      />,
    );

    rerender(
      <ResumeTemplateLayout
        draft={draft}
        templateId="modern-professional"
        showCandidatePhoto={false}
      />,
    );
    expect(container.textContent).toContain("Synthetic Credential");

    rerender(
      <ResumeTemplateLayout
        draft={draft}
        templateId="compact-technical"
        showCandidatePhoto={false}
      />,
    );
    expect(container.textContent).toContain("Systems");
    expect(container.textContent).toContain("Example University");
    expect(container.textContent).toContain("English");
    expect(container.textContent).toContain("Reading");
    expect(JSON.stringify(draft)).toBe(before);
  });

  it.each([
    "ats-classic",
    "modern-professional",
    "compact-technical",
  ] as const)("renders one shared Candidate Photo in %s", (templateId) => {
    const draft = resumeContentToDraft(representativeContent());
    const { container } = render(
      <ResumeTemplateLayout
        draft={draft}
        templateId={templateId}
        showCandidatePhoto
        candidatePhotoUrl="blob:canonical-photo"
      />,
    );

    expect(container.querySelectorAll(".resume-profile-photo")).toHaveLength(1);
    expect(
      container.querySelector(".resume-profile-photo")?.getAttribute("src"),
    ).toBe("blob:canonical-photo");
  });
});

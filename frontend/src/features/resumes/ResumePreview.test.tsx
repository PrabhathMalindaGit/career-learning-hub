import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { resumeContentToDraft } from "./resumeDraft";
import { ResumePreview } from "./ResumePreview";
import type { ResumeContent } from "./types";

const id = "123e4567-e89b-42d3-a456-426614174000";
const secondId = "123e4567-e89b-42d3-a456-426614174001";

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
});

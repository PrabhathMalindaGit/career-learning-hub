import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

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

function renderEditor(draft = emptyDraft()) {
  window.history.replaceState({}, "", "/");
  render(
    <BrowserRouter>
      <ResumeEditor draft={draft} onChange={vi.fn()} />
    </BrowserRouter>,
  );
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
        screen.getByRole("heading", {
          level: 3,
          name: "Certifications",
        }),
      ),
    );
  });

  it("uses the established full-width form styling for project links and interests", () => {
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

    const referenceInput = screen.getByRole("textbox", { name: "Full name" });
    const projectLinkLabel = screen.getByRole("textbox", {
      name: "Project link label",
    });
    const projectLinkUrl = screen.getByRole("textbox", {
      name: "Project link URL",
    });
    const interest = screen.getByRole("textbox", { name: "Interest 1" });

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
});

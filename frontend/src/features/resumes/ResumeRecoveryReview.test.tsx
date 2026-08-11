import { fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { ResumeRecoveryReview } from "./ResumeRecoveryReview";
import type { ResumeContentInput, ResumeDesign } from "./types";

const content: ResumeContentInput = {
  basics: { fullName: "Recovered Candidate", links: [] },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  interests: [],
};

const design: ResumeDesign = {
  templateId: "ats-classic",
  colorPaletteId: "slate",
  pageSize: "LETTER",
  fontFamily: "Inter",
  showProfilePhoto: false,
};
const resumeWorkspaceCss = readFileSync(
  resolve(process.cwd(), "src/features/resumes/resumeWorkspace.css"),
  "utf8",
);

describe("ResumeRecoveryReview", () => {
  it("renders stale content as a single read-only selectable review with version context", () => {
    const onDiscard = vi.fn();
    const { container } = render(
      <ResumeRecoveryReview
        content={content}
        baselineVersionNumber={3}
        currentVersionNumber={4}
        design={design}
        discardError={false}
        onDiscard={onDiscard}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Recovered unsaved draft — based on an older saved version",
      }),
    ).not.toBeNull();
    expect(screen.getByText("Recovered draft based on Version 3")).not.toBeNull();
    expect(screen.getByText("Current saved Resume: Version 4")).not.toBeNull();
    expect(screen.getByText("Recovered Candidate")).not.toBeNull();
    expect(screen.queryByLabelText("Full name")).toBeNull();
    expect(screen.queryByText(/restore anyway/i)).toBeNull();
    expect(screen.queryByText(/save new version/i)).toBeNull();
    expect(container.querySelector(".resume-recovery-review")).not.toBeNull();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Discard recovery and return to current Resume",
      }),
    );
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it("keeps the read-only review active with a restrained discard error", () => {
    render(
      <ResumeRecoveryReview
        content={content}
        baselineVersionNumber={3}
        currentVersionNumber={4}
        design={design}
        discardError
        onDiscard={() => undefined}
      />,
    );

    expect(
      screen.getByRole("alert").textContent,
    ).toContain("Local recovery could not be discarded. Please try again.");
  });

  it("keeps stale review selectable, single-column, responsive, and excluded from print", () => {
    expect(resumeWorkspaceCss).toMatch(
      /\.resume-recovery-review\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/s,
    );
    expect(resumeWorkspaceCss).toMatch(
      /\.resume-recovery-review \.resume-preview-panel\s*\{[^}]*user-select:\s*text;/s,
    );
    expect(resumeWorkspaceCss).toMatch(
      /@media \(max-width:\s*720px\)[\s\S]*\.resume-recovery-version-context/s,
    );
    expect(resumeWorkspaceCss).toMatch(
      /@media print[\s\S]*\.resume-recovery-review/s,
    );
  });
});

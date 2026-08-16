import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const workspaceSource = readFileSync(
  resolve(process.cwd(), "src/features/resumes/ResumeWorkspace.tsx"),
  "utf8",
);
const workspaceCss = readFileSync(
  resolve(process.cwd(), "src/features/resumes/resumeWorkspace.css"),
  "utf8",
);

describe("Resume assessment action UI", () => {
  it("keeps the AI-assisted assessment action visually secondary to Save", () => {
    expect(workspaceSource).toMatch(
      /className="secondary-button resume-secondary-button"[\s\S]*?Run AI-assisted assessment/,
    );
  });

  it("separates the assessment action row from the job-description form", () => {
    expect(workspaceSource).toContain(
      'className="resume-button-row resume-analysis-actions"',
    );
    expect(workspaceCss).toMatch(
      /\.resume-analysis-actions\s*\{[^}]*margin-top:\s*14px;/,
    );
  });
});

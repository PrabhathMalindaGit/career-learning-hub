import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const mainSource = readFileSync(
  resolve(process.cwd(), "src/main.tsx"),
  "utf8",
);
const assessmentActionCss = readFileSync(
  resolve(
    process.cwd(),
    "src/features/resumes/ResumeAssessmentActionUi.css",
  ),
  "utf8",
);

describe("Resume assessment action UI", () => {
  it("loads the scoped assessment action polish after the shared application styles", () => {
    const sharedStylesIndex = mainSource.indexOf('import "./styles.css";');
    const assessmentStylesIndex = mainSource.indexOf(
      'import "./features/resumes/ResumeAssessmentActionUi.css";',
    );

    expect(sharedStylesIndex).toBeGreaterThanOrEqual(0);
    expect(assessmentStylesIndex).toBeGreaterThan(sharedStylesIndex);
  });

  it("keeps the AI-assisted assessment action visually secondary to Save", () => {
    expect(assessmentActionCss).toMatch(
      /\.resume-analysis-runner \.resume-button-row \.resume-primary-button\s*\{[^}]*color:\s*#245e3c;[^}]*background:\s*#eef6f1;/,
    );
    expect(assessmentActionCss).toMatch(
      /\.resume-analysis-runner \.resume-button-row \.resume-primary-button:disabled\s*\{[^}]*background:\s*#f1f5f2;/,
    );
  });

  it("separates the assessment action row from the job-description form", () => {
    expect(assessmentActionCss).toMatch(
      /\.resume-analysis-runner \.resume-button-row\s*\{[^}]*margin-top:\s*14px;/,
    );
  });
});

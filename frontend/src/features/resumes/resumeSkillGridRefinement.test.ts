import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const refinementCss = readFileSync(
  resolve(process.cwd(), "src/features/resumes/resumeSkillGridRefinement.css"),
  "utf8",
);
const resumePreviewSource = readFileSync(
  resolve(process.cwd(), "src/features/resumes/ResumePreview.tsx"),
  "utf8",
);

describe("Resume name-only Skills grid refinement", () => {
  it("uses two columns for ATS Classic and Modern Professional", () => {
    expect(refinementCss).toMatch(
      /\.resume-template-ats-classic\s+\.resume-paper-skills,\s*\.resume-template-modern-professional\s+\.resume-paper-skills\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s,
    );
  });

  it("keeps keyword-bearing groups full-width", () => {
    expect(refinementCss).toMatch(
      /div:not\(\.resume-paper-skill--name-only\)[^{]*\{[^}]*grid-column:\s*1\s*\/\s*-1;/s,
    );
  });

  it("keeps Modern name-only skills tighter without touching Compact Technical", () => {
    expect(refinementCss).toMatch(
      /\.resume-template-modern-professional\s+\.resume-paper-skill--name-only\s+dt\s*\{[^}]*font-size:\s*0\.88em;[^}]*font-weight:\s*650;/s,
    );
    expect(refinementCss).not.toContain("resume-template-compact-technical");
  });

  it("loads the refinement after template differentiation and before print parity", () => {
    const differentiationImport = resumePreviewSource.indexOf(
      'import "./resumeTemplateDifferentiation.css";',
    );
    const refinementImport = resumePreviewSource.indexOf(
      'import "./resumeSkillGridRefinement.css";',
    );
    const parityImport = resumePreviewSource.indexOf(
      'import "./resumePrintParity.css";',
    );

    expect(differentiationImport).toBeGreaterThanOrEqual(0);
    expect(refinementImport).toBeGreaterThan(differentiationImport);
    expect(parityImport).toBeGreaterThan(refinementImport);
  });
});

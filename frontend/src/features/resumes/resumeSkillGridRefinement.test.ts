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
  it("keeps ATS Classic two-column while Modern Professional uses one sidebar column", () => {
    expect(refinementCss).toMatch(
      /\.resume-template-ats-classic\s+\.resume-paper-skills\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s,
    );
    expect(refinementCss).toMatch(
      /\.resume-template-modern-professional\s+\.resume-paper-skills\s*\{[^}]*grid-template-columns:\s*1fr;/s,
    );
  });

  it("keeps ATS keyword-bearing groups full-width", () => {
    expect(refinementCss).toMatch(
      /\.resume-template-ats-classic[^}]*div:not\(\.resume-paper-skill--name-only\)[^{]*\{[^}]*grid-column:\s*1\s*\/\s*-1;/s,
    );
  });

  it("keeps Modern name-only skills compact without touching Compact Technical", () => {
    expect(refinementCss).toMatch(
      /\.resume-template-modern-professional\s+\.resume-paper-skill--name-only\s+dt\s*\{[^}]*font-size:\s*0\.88em;[^}]*font-weight:\s*600;[^}]*line-height:\s*1\.25;/s,
    );
    expect(refinementCss).not.toContain("resume-template-compact-technical");
  });

  it("collapses only ATS to one column on narrow screens", () => {
    expect(refinementCss).toMatch(
      /@media screen and \(max-width:\s*760px\)[^{]*\{[^]*?\.resume-template-ats-classic\s+\.resume-paper-skills\s*\{[^}]*grid-template-columns:\s*1fr;/s,
    );
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

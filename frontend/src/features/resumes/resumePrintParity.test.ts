import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const printParityCss = readFileSync(
  resolve(process.cwd(), "src/features/resumes/resumePrintParity.css"),
  "utf8",
);
const resumePreviewSource = readFileSync(
  resolve(process.cwd(), "src/features/resumes/ResumePreview.tsx"),
  "utf8",
);

describe("Resume template print parity", () => {
  it("loads print parity after the shared template differentiation stylesheet", () => {
    const differentiationImport = resumePreviewSource.indexOf(
      'import "./resumeTemplateDifferentiation.css";',
    );
    const parityImport = resumePreviewSource.indexOf(
      'import "./resumePrintParity.css";',
    );

    expect(differentiationImport).toBeGreaterThanOrEqual(0);
    expect(parityImport).toBeGreaterThan(differentiationImport);
  });

  it("keeps Compact Technical skills in two columns during printing", () => {
    expect(printParityCss).toMatch(
      /\.resume-template-compact-technical\s+\.resume-paper-skills\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s,
    );
  });

  it("uses independent Modern Professional print columns", () => {
    expect(printParityCss).toMatch(
      /\.resume-template-modern-professional\s+\.resume-modern-columns\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*flex-start;[^}]*break-inside:\s*auto;/s,
    );
    expect(printParityCss).toMatch(
      /\.resume-template-modern-professional\s+\.resume-modern-content\s*\{[^}]*flex:\s*2\.08\s+1\s+0;[^}]*break-inside:\s*auto;/s,
    );
    expect(printParityCss).toMatch(
      /\.resume-template-modern-professional\s+\.resume-modern-sidebar\s*\{[^}]*flex:\s*0\.92\s+1\s+0;[^}]*break-inside:\s*auto;/s,
    );
  });

  it("does not synchronize Modern sections into print grid rows", () => {
    expect(printParityCss).not.toContain("display: contents");
    expect(printParityCss).not.toContain("grid-row:");
    expect(printParityCss).not.toContain("grid-column:");
  });

  it("contains only print-media overrides", () => {
    expect(printParityCss.trimStart()).toMatch(/^\/\*[^]*?\*\/\s*@media print\s*\{/);
    expect(printParityCss).not.toContain("resume-live-preview-viewport");
  });
});

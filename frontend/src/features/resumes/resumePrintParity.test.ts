import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const printParityCss = readFileSync(
  resolve(process.cwd(), "src/features/resumes/resumePrintParity.css"),
  "utf8",
);

describe("Resume template print parity", () => {
  it("keeps Compact Technical skills in two columns during printing", () => {
    expect(printParityCss).toMatch(
      /\.resume-template-compact-technical\s+\.resume-paper-skills\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/s,
    );
  });

  it("makes Modern Professional sections fragmentable instead of one tall body grid row", () => {
    expect(printParityCss).toMatch(
      /\.resume-template-modern-professional\s+\.resume-modern-columns\s*\{[^}]*break-inside:\s*auto;/s,
    );
    expect(printParityCss).toMatch(
      /\.resume-template-modern-professional\s+\.resume-modern-content,\s*\.resume-template-modern-professional\s+\.resume-modern-sidebar\s*\{[^}]*display:\s*contents;/s,
    );
    expect(printParityCss).toMatch(
      /\.resume-modern-content\s*>\s*\[data-resume-section\][^{]*\{[^}]*grid-column:\s*1;/s,
    );
    expect(printParityCss).toMatch(
      /\.resume-modern-sidebar\s*>\s*\[data-resume-section\][^{]*\{[^}]*grid-column:\s*2;/s,
    );
  });

  it("keeps Modern Professional section placement deterministic across print rows", () => {
    for (const [section, row] of [
      ["summary", "1"],
      ["experience", "2"],
      ["projects", "3"],
      ["skills", "1"],
      ["education", "2"],
      ["certifications", "3"],
      ["languages", "4"],
      ["interests", "5"],
    ] as const) {
      expect(printParityCss).toMatch(
        new RegExp(
          `data-resume-section=\\"${section}\\"\\][^}]*\\{[^}]*grid-row:\\s*${row};`,
          "s",
        ),
      );
    }
  });

  it("contains only print-media overrides", () => {
    expect(printParityCss.trimStart()).toMatch(/^\/\*[^]*?\*\/\s*@media print\s*\{/);
    expect(printParityCss).not.toContain("resume-live-preview-viewport");
  });
});

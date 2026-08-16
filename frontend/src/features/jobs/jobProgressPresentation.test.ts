import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("shared AI job progress presentation", () => {
  it("keeps Resume and Interview AI progress on the product green palette", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/features/jobs/jobProgressPresentation.css"),
      "utf8",
    );

    expect(css).toContain(".resume-job-status");
    expect(css).toContain(".interview-workspace .interview-job-status");
    expect(css).toContain("accent-color: var(--accent)");
    expect(css).toContain("#f4f8f5");
    expect(css).not.toContain("#6553b8");
    expect(css).not.toContain("#f7f5ff");
  });
});

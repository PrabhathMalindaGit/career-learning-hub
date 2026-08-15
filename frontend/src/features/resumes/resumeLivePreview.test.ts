import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const livePreviewCss = readFileSync(
  resolve(process.cwd(), "src/features/resumes/resumeLivePreview.css"),
  "utf8",
);

describe("Resume live preview scrolling", () => {
  it("keeps the outer preview panel fixed while the inner viewport scrolls", () => {
    expect(livePreviewCss).toMatch(
      /\.resume-editor-preview-grid\s*>\s*\.resume-preview-panel\.resume-preview-panel\s*\{[^}]*overflow:\s*hidden;/s,
    );
    expect(livePreviewCss).toMatch(
      /\.resume-live-preview-viewport\s*\{[^}]*overflow-x:\s*auto;/s,
    );
    expect(livePreviewCss).toContain("overscroll-behavior-x: contain;");
  });

  it("moves wide-screen vertical scrolling into the inner resume viewport", () => {
    expect(livePreviewCss).toContain("@media (min-width: 1280px)");
    expect(livePreviewCss).toMatch(
      /\.resume-live-preview-viewport\s*\{[^}]*min-height:\s*0;[^}]*overflow-x:\s*auto;[^}]*overflow-y:\s*auto;/s,
    );
    expect(livePreviewCss).toContain("grid-template-rows: auto minmax(0, 1fr);");
  });

  it("keeps only Compact Technical wide enough to require scrolling when needed", () => {
    expect(livePreviewCss).toMatch(
      /\.resume-paper\.resume-template-compact-technical\s*\{[^}]*min-width:\s*620px;/s,
    );
    expect(livePreviewCss).not.toMatch(/resume-template-ats-classic[^}]*min-width:/s);
    expect(livePreviewCss).not.toMatch(/resume-template-modern-professional[^}]*min-width:/s);
  });

  it("does not add print or saved-export surface overrides", () => {
    expect(livePreviewCss).not.toContain("@media print");
    expect(livePreviewCss).not.toContain("resume-print-surface");
  });
});

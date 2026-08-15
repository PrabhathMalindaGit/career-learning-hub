import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResumeMiniDocument } from "./ResumeMiniDocument";

const cases = [
  ["ats-classic", "classic-stack"],
  ["modern-professional", "modern-sidebar"],
  ["compact-technical", "technical-rail"],
] as const;

describe("ResumeMiniDocument", () => {
  it.each(cases)(
    "renders a distinct %s miniature structure",
    (templateId, layout) => {
      const { container } = render(
        <ResumeMiniDocument
          templateId={templateId}
          colorPaletteId="slate"
          fontFamily="Inter"
          context="template"
        />,
      );

      const miniature = container.querySelector(
        `[data-template-preview="${templateId}"]`,
      );
      expect(miniature).not.toBeNull();
      expect(
        miniature?.querySelector(`[data-mini-layout="${layout}"]`),
      ).not.toBeNull();
      expect(miniature?.getAttribute("aria-hidden")).toBe("true");
    },
  );

  it("keeps card-context previews decorative and template-specific", () => {
    const { container } = render(
      <ResumeMiniDocument
        templateId="modern-professional"
        colorPaletteId="forest"
        fontFamily="Georgia"
        context="card"
      />,
    );

    const miniature = container.querySelector(
      '[data-resume-card-preview="modern-professional"]',
    );
    expect(miniature).not.toBeNull();
    expect(miniature?.classList.contains("resume-font-georgia")).toBe(true);
    expect(miniature?.classList.contains("resume-palette-forest")).toBe(true);
    expect(
      miniature?.querySelector('[data-mini-layout="modern-sidebar"]'),
    ).not.toBeNull();
  });
});

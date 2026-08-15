import { describe, expect, it } from "vitest";
import {
  DEFAULT_RESUME_FONT,
  DEFAULT_RESUME_PALETTE,
  DEFAULT_RESUME_TEMPLATE,
  RESUME_FONTS,
  RESUME_PALETTES,
  RESUME_TEMPLATES,
  resolveResumeFont,
  resolveResumePalette,
  resolveResumePresentation,
  resolveResumeTemplate,
} from "./resumeTemplateRegistry";

function channel(value: string): number {
  return Number.parseInt(value, 16) / 255;
}

function luminance(hex: string): number {
  const values = [
    channel(hex.slice(1, 3)),
    channel(hex.slice(3, 5)),
    channel(hex.slice(5, 7)),
  ].map((value) =>
    value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4,
  );
  return (
    0.2126 * (values[0] ?? 0) +
    0.7152 * (values[1] ?? 0) +
    0.0722 * (values[2] ?? 0)
  );
}

function contrast(first: string, second: string): number {
  const brighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));
  return (brighter + 0.05) / (darker + 0.05);
}

describe("resumeTemplateRegistry", () => {
  it("defines the exact bounded template catalogue and ATS Classic fallback", () => {
    expect(
      RESUME_TEMPLATES.map(({ id, label, className }) => ({
        id,
        label,
        className,
      })),
    ).toEqual([
      {
        id: "ats-classic",
        label: "ATS Classic",
        className: "resume-template-ats-classic",
      },
      {
        id: "modern-professional",
        label: "Modern Professional",
        className: "resume-template-modern-professional",
      },
      {
        id: "compact-technical",
        label: "Compact Technical",
        className: "resume-template-compact-technical",
      },
    ]);
    expect(
      RESUME_TEMPLATES.map(({ id, description }) => ({ id, description })),
    ).toEqual([
      {
        id: "ats-classic",
        description:
          "Traditional single-column layout optimized for clear scanning and conservative applications.",
      },
      {
        id: "modern-professional",
        description:
          "Polished two-column presentation with a strong header and structured professional sidebar.",
      },
      {
        id: "compact-technical",
        description:
          "Dense technical layout prioritizing skills, tools, projects, and efficient use of page space.",
      },
    ]);
    expect(DEFAULT_RESUME_TEMPLATE.id).toBe("ats-classic");
    expect(DEFAULT_RESUME_TEMPLATE.safeFallback).toBe(true);
  });

  it("defines exact stored font values with bounded local/system stacks", () => {
    expect(
      RESUME_FONTS.map(({ value, label, className, stack }) => ({
        value,
        label,
        className,
        stack,
      })),
    ).toEqual([
      {
        value: "Inter",
        label: "Inter / system sans-serif",
        className: "resume-font-inter",
        stack:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      {
        value: "Arial",
        label: "Arial / sans-serif",
        className: "resume-font-arial",
        stack: "Arial, Helvetica, sans-serif",
      },
      {
        value: "Georgia",
        label: "Georgia / serif",
        className: "resume-font-georgia",
        stack: 'Georgia, "Times New Roman", serif',
      },
    ]);
    expect(DEFAULT_RESUME_FONT.value).toBe("Inter");
  });

  it("defines exact palette IDs, safe classes, and contrast-verified roles", () => {
    expect(
      RESUME_PALETTES.map(({ id, label, className }) => ({
        id,
        label,
        className,
      })),
    ).toEqual([
      {
        id: "slate",
        label: "Slate",
        className: "resume-palette-slate",
      },
      {
        id: "forest",
        label: "Forest",
        className: "resume-palette-forest",
      },
      {
        id: "navy",
        label: "Navy",
        className: "resume-palette-navy",
      },
    ]);
    expect(DEFAULT_RESUME_PALETTE.id).toBe("slate");

    for (const palette of RESUME_PALETTES) {
      expect(contrast(palette.roles.body, palette.roles.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette.roles.secondary, palette.roles.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette.roles.heading, palette.roles.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette.roles.link, palette.roles.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette.roles.rule, palette.roles.background)).toBeGreaterThanOrEqual(3);
      expect(contrast(palette.roles.focus, palette.roles.background)).toBeGreaterThanOrEqual(3);
    }
  });

  it("resolves unknown stored values to deterministic safe presentation without emitting them", () => {
    const unsafeTemplate = "template injected-class";
    const unsafeFont = 'serif"; color: red';
    const unsafePalette = "palette<script>";
    const first = resolveResumePresentation({
      templateId: unsafeTemplate,
      colorPaletteId: unsafePalette,
      fontFamily: unsafeFont,
    });
    const second = resolveResumePresentation({
      templateId: unsafeTemplate,
      colorPaletteId: unsafePalette,
      fontFamily: unsafeFont,
    });

    expect(first).toEqual(second);
    expect(first.template.option).toBe(DEFAULT_RESUME_TEMPLATE);
    expect(first.font.option).toBe(DEFAULT_RESUME_FONT);
    expect(first.palette.option).toBe(DEFAULT_RESUME_PALETTE);
    expect(first.template.usedFallback).toBe(true);
    expect(first.font.usedFallback).toBe(true);
    expect(first.palette.usedFallback).toBe(true);
    expect(JSON.stringify(first)).not.toContain(unsafeTemplate);
    expect(JSON.stringify(first)).not.toContain(unsafeFont);
    expect(JSON.stringify(first)).not.toContain(unsafePalette);
    expect(resolveResumeTemplate("ats-classic").usedFallback).toBe(false);
    expect(resolveResumeFont("Arial").usedFallback).toBe(false);
    expect(resolveResumePalette("navy").usedFallback).toBe(false);
  });

  it("keeps the registry read-only and never derives a class from arbitrary input", () => {
    expect(Object.isFrozen(RESUME_TEMPLATES)).toBe(true);
    expect(Object.isFrozen(RESUME_FONTS)).toBe(true);
    expect(Object.isFrozen(RESUME_PALETTES)).toBe(true);
    for (const option of [
      ...RESUME_TEMPLATES,
      ...RESUME_FONTS,
      ...RESUME_PALETTES,
    ]) {
      expect(Object.isFrozen(option)).toBe(true);
      expect(option.className).toMatch(
        /^resume-(?:template|font|palette)-[a-z-]+$/,
      );
    }
  });
});

export type ResumeTemplateId =
  | "ats-classic"
  | "modern-professional"
  | "compact-technical";

export type ResumeFontFamily = "Inter" | "Arial" | "Georgia";

export type ResumePaletteId = "slate" | "forest" | "navy";

export interface ResumeTemplateOption {
  readonly id: ResumeTemplateId;
  readonly label: string;
  readonly description: string;
  readonly bestFor: string;
  readonly className: string;
  readonly safeFallback?: boolean;
}

export interface ResumeFontOption {
  readonly value: ResumeFontFamily;
  readonly label: string;
  readonly className: string;
  readonly stack: string;
}

export interface ResumePaletteRoles {
  readonly background: string;
  readonly body: string;
  readonly secondary: string;
  readonly heading: string;
  readonly link: string;
  readonly rule: string;
  readonly focus: string;
}

export interface ResumePaletteOption {
  readonly id: ResumePaletteId;
  readonly label: string;
  readonly className: string;
  readonly roles: ResumePaletteRoles;
}

export interface ResumePresentationSelection {
  readonly templateId: ResumeTemplateId;
  readonly fontFamily: ResumeFontFamily;
  readonly colorPaletteId: ResumePaletteId;
}

interface ResumeOptionResolution<TOption> {
  readonly option: TOption;
  readonly usedFallback: boolean;
}

export const RESUME_TEMPLATES: readonly ResumeTemplateOption[] = Object.freeze([
  Object.freeze({
    id: "ats-classic",
    label: "ATS Classic",
    description:
      "Traditional single-column layout optimized for clear scanning and conservative applications.",
    bestFor: "ATS-heavy and traditional applications",
    className: "resume-template-ats-classic",
    safeFallback: true,
  }),
  Object.freeze({
    id: "modern-professional",
    label: "Modern Professional",
    description:
      "Polished two-column presentation with a strong header and structured professional sidebar.",
    bestFor: "General professional and business roles",
    className: "resume-template-modern-professional",
  }),
  Object.freeze({
    id: "compact-technical",
    label: "Compact Technical",
    description:
      "Dense technical layout prioritizing skills, tools, projects, and efficient use of page space.",
    bestFor: "Engineering, software, and technical roles",
    className: "resume-template-compact-technical",
  }),
]);

export const RESUME_FONTS: readonly ResumeFontOption[] = Object.freeze([
  Object.freeze({
    value: "Inter",
    label: "Inter / system sans-serif",
    className: "resume-font-inter",
    stack:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }),
  Object.freeze({
    value: "Arial",
    label: "Arial / sans-serif",
    className: "resume-font-arial",
    stack: "Arial, Helvetica, sans-serif",
  }),
  Object.freeze({
    value: "Georgia",
    label: "Georgia / serif",
    className: "resume-font-georgia",
    stack: 'Georgia, "Times New Roman", serif',
  }),
]);

export const RESUME_PALETTES: readonly ResumePaletteOption[] = Object.freeze([
  Object.freeze({
    id: "slate",
    label: "Slate",
    className: "resume-palette-slate",
    roles: Object.freeze({
      background: "#ffffff",
      body: "#1f2933",
      secondary: "#4b5563",
      heading: "#263647",
      link: "#1d4ed8",
      rule: "#64748b",
      focus: "#0b63ce",
    }),
  }),
  Object.freeze({
    id: "forest",
    label: "Forest",
    className: "resume-palette-forest",
    roles: Object.freeze({
      background: "#ffffff",
      body: "#1f2d25",
      secondary: "#42594b",
      heading: "#1f5a3a",
      link: "#1b5e3b",
      rule: "#527a60",
      focus: "#126b3a",
    }),
  }),
  Object.freeze({
    id: "navy",
    label: "Navy",
    className: "resume-palette-navy",
    roles: Object.freeze({
      background: "#ffffff",
      body: "#1f2937",
      secondary: "#475569",
      heading: "#173b63",
      link: "#174ea6",
      rule: "#526d88",
      focus: "#0b63ce",
    }),
  }),
]);

export const DEFAULT_RESUME_TEMPLATE = RESUME_TEMPLATES[0];
export const DEFAULT_RESUME_FONT = RESUME_FONTS[0];
export const DEFAULT_RESUME_PALETTE = RESUME_PALETTES[0];

export function isResumeTemplateId(value: string): value is ResumeTemplateId {
  return RESUME_TEMPLATES.some((option) => option.id === value);
}

export function isResumeFontFamily(value: string): value is ResumeFontFamily {
  return RESUME_FONTS.some((option) => option.value === value);
}

export function isResumePaletteId(value: string): value is ResumePaletteId {
  return RESUME_PALETTES.some((option) => option.id === value);
}

export function resolveResumeTemplate(
  value: string,
): ResumeOptionResolution<ResumeTemplateOption> {
  const option = RESUME_TEMPLATES.find((candidate) => candidate.id === value);
  return Object.freeze({
    option: option ?? DEFAULT_RESUME_TEMPLATE,
    usedFallback: option === undefined,
  });
}

export function resolveResumeFont(
  value: string | undefined,
): ResumeOptionResolution<ResumeFontOption> {
  const option = RESUME_FONTS.find((candidate) => candidate.value === value);
  return Object.freeze({
    option: option ?? DEFAULT_RESUME_FONT,
    usedFallback: option === undefined,
  });
}

export function resolveResumePalette(
  value: string,
): ResumeOptionResolution<ResumePaletteOption> {
  const option = RESUME_PALETTES.find((candidate) => candidate.id === value);
  return Object.freeze({
    option: option ?? DEFAULT_RESUME_PALETTE,
    usedFallback: option === undefined,
  });
}

export function resolveResumePresentation(design: {
  readonly templateId: string;
  readonly fontFamily?: string;
  readonly colorPaletteId: string;
}) {
  return Object.freeze({
    template: resolveResumeTemplate(design.templateId),
    font: resolveResumeFont(design.fontFamily),
    palette: resolveResumePalette(design.colorPaletteId),
  });
}

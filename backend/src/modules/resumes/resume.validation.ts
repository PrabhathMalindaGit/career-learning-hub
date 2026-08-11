import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AppError } from "../../shared/appError.js";
import type { ResumeContent } from "./resume.types.js";

const DOMAIN_STYLE_URL =
  /^(?=.{1,253}(?:[/:?#]|$))(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}(?::\d{1,5})?(?:[/?#][^\s]*)?$/i;
const objectIdStringSchema = z.string().regex(/^[a-f\d]{24}$/i);
const expectedCandidatePhotoAssetIdSchema = z.union([
  z.literal("none"),
  objectIdStringSchema,
]);

export function normalizeResumeUrlInput(
  value: string,
): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
  const hasSupportedScheme = /^https?:\/\//i.test(trimmed);
  if (
    (hasScheme && !hasSupportedScheme) ||
    (!hasScheme && !DOMAIN_STYLE_URL.test(trimmed))
  ) {
    return undefined;
  }

  const candidate = hasSupportedScheme ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      parsed.username ||
      parsed.password ||
      !parsed.hostname
    ) {
      return undefined;
    }
  } catch {
    return undefined;
  }

  return candidate;
}

const optionalText = (maximum: number) =>
  z.string().trim().max(maximum).optional();

const resumeUrlSchema = z
  .string()
  .trim()
  .max(2_000)
  .transform((value, context) => {
    const normalized = normalizeResumeUrlInput(value);
    if (!normalized) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A valid HTTP or HTTPS URL is required.",
      });
      return z.NEVER;
    }
    return normalized;
  });
const optionalUrl = resumeUrlSchema.optional();
const optionalId = z.string().uuid().optional();

const linkInputSchema = z.object({
  id: optionalId,
  label: z.string().trim().min(1).max(80),
  url: resumeUrlSchema,
}).strict();

const bulletInputSchema = z.object({
  id: optionalId,
  text: z.string().trim().min(1).max(2_000),
}).strict();

const experienceInputSchema = z.object({
  id: optionalId,
  employer: z.string().trim().min(1).max(200),
  jobTitle: z.string().trim().min(1).max(200),
  location: optionalText(200),
  startDate: optionalText(30),
  endDate: optionalText(30),
  isCurrent: z.boolean().default(false),
  bullets: z.array(bulletInputSchema).max(50).default([]),
}).strict();

const educationInputSchema = z.object({
  id: optionalId,
  institution: z.string().trim().min(1).max(200),
  qualification: z.string().trim().min(1).max(200),
  fieldOfStudy: optionalText(200),
  location: optionalText(200),
  startDate: optionalText(30),
  endDate: optionalText(30),
  isCurrent: z.boolean().default(false),
  details: z.array(bulletInputSchema).max(30).default([]),
}).strict();

const skillGroupInputSchema = z.object({
  id: optionalId,
  name: z.string().trim().min(1).max(120),
  keywords: z.array(z.string().trim().min(1).max(120)).max(100).default([]),
}).strict();

const projectInputSchema = z.object({
  id: optionalId,
  name: z.string().trim().min(1).max(200),
  role: optionalText(160),
  description: optionalText(2_000),
  startDate: optionalText(30),
  endDate: optionalText(30),
  technologies: z.array(z.string().trim().min(1).max(120)).max(100).default([]),
  links: z.array(linkInputSchema).max(20).default([]),
  bullets: z.array(bulletInputSchema).max(50).default([]),
}).strict();

const certificationInputSchema = z.object({
  id: optionalId,
  name: z.string().trim().min(1).max(200),
  issuer: optionalText(200),
  issuedDate: optionalText(30),
  credentialUrl: optionalUrl,
}).strict();

const languageInputSchema = z.object({
  id: optionalId,
  name: z.string().trim().min(1).max(120),
  proficiency: optionalText(80),
}).strict();

export const resumeContentInputSchema = z.object({
  basics: z.object({
    fullName: z.string().trim().max(200).default(""),
    email: z.string().trim().email().max(320).optional(),
    phone: optionalText(80),
    location: optionalText(200),
    headline: optionalText(200),
    summary: optionalText(5_000),
    links: z.array(linkInputSchema).max(20).default([]),
  }).strict(),
  experience: z.array(experienceInputSchema).max(50).default([]),
  education: z.array(educationInputSchema).max(30).default([]),
  skills: z.array(skillGroupInputSchema).max(30).default([]),
  projects: z.array(projectInputSchema).max(50).default([]),
  certifications: z.array(certificationInputSchema).max(50).default([]),
  languages: z.array(languageInputSchema).max(30).default([]),
  interests: z.array(z.string().trim().min(1).max(120)).max(50).default([]),
}).strict();

export const resumeDesignInputSchema = z.object({
  templateId: z.string().trim().min(1).max(100),
  colorPaletteId: z.string().trim().min(1).max(100),
  pageSize: z.enum(["A4", "LETTER"]),
  fontFamily: optionalText(100),
  showProfilePhoto: z.boolean(),
}).strict();

export const resumeIdParamsSchema = z.object({
  resumeId: objectIdStringSchema,
});

export const versionIdParamsSchema = resumeIdParamsSchema.extend({
  versionId: objectIdStringSchema,
});

export const createResumeBodySchema = z.object({
  title: z.string().trim().min(1).max(120),
  content: resumeContentInputSchema.optional(),
  design: resumeDesignInputSchema.optional(),
}).strict();

export const createVersionBodySchema = z.object({
  content: resumeContentInputSchema,
  changeSummary: z.string().trim().max(500).optional(),
  expectedCurrentVersionId: objectIdStringSchema,
}).strict();

export const updateDesignBodySchema = resumeDesignInputSchema.partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one design property is required.",
  });

export const candidatePhotoUploadBodySchema = z.object({
  expectedCandidatePhotoAssetId: expectedCandidatePhotoAssetIdSchema,
}).strict();

export const candidatePhotoMutationBodySchema = z.object({
  expectedCandidatePhotoAssetId: expectedCandidatePhotoAssetIdSchema,
}).strict();

export const resumeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["draft", "active", "archived"]).optional(),
});

function ensureUniqueIds(content: ResumeContent): void {
  const ids = new Set<string>();
  const add = (id: string) => {
    if (ids.has(id)) {
          throw new AppError(
            400,
            "DUPLICATE_RESUME_STABLE_ID",
            `Duplicate stable resume ID detected: ${id}`,
          );
        }
    ids.add(id);
  };

  content.basics.links.forEach((item) => add(item.id));
  content.experience.forEach((entry) => {
    add(entry.id);
    entry.bullets.forEach((bullet) => add(bullet.id));
  });
  content.education.forEach((entry) => {
    add(entry.id);
    entry.details.forEach((detail) => add(detail.id));
  });
  content.skills.forEach((entry) => add(entry.id));
  content.projects.forEach((entry) => {
    add(entry.id);
    entry.links.forEach((link) => add(link.id));
    entry.bullets.forEach((bullet) => add(bullet.id));
  });
  content.certifications.forEach((entry) => add(entry.id));
  content.languages.forEach((entry) => add(entry.id));
}

export function normalizeResumeContent(input: unknown): ResumeContent {
  const parsed = resumeContentInputSchema.parse(input);
  const createId = (id?: string) => id ?? randomUUID();

  const normalized: ResumeContent = {
    basics: {
      ...parsed.basics,
      links: parsed.basics.links.map((link) => ({ ...link, id: createId(link.id) })),
    },
    experience: parsed.experience.map((entry) => ({
      ...entry,
      id: createId(entry.id),
      bullets: entry.bullets.map((bullet) => ({ ...bullet, id: createId(bullet.id) })),
    })),
    education: parsed.education.map((entry) => ({
      ...entry,
      id: createId(entry.id),
      details: entry.details.map((detail) => ({ ...detail, id: createId(detail.id) })),
    })),
    skills: parsed.skills.map((entry) => ({ ...entry, id: createId(entry.id) })),
    projects: parsed.projects.map((entry) => ({
      ...entry,
      id: createId(entry.id),
      links: entry.links.map((link) => ({ ...link, id: createId(link.id) })),
      bullets: entry.bullets.map((bullet) => ({ ...bullet, id: createId(bullet.id) })),
    })),
    certifications: parsed.certifications.map((entry) => ({ ...entry, id: createId(entry.id) })),
    languages: parsed.languages.map((entry) => ({ ...entry, id: createId(entry.id) })),
    interests: parsed.interests,
  };

  ensureUniqueIds(normalized);
  return normalized;
}

export function createBlankResumeContent(): ResumeContent {
  return normalizeResumeContent({
    basics: { fullName: "", links: [] },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    interests: [],
  });
}

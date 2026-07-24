import { z } from "zod";

export const importPdfBodySchema = z
  .object({ title: z.string().trim().min(1).max(120) })
  .strict();

export const analyzeResumeBodySchema = z
  .object({
    versionId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    targetRole: z.string().trim().min(2).max(200),
    company: z.string().trim().max(200).optional(),
    jobDescription: z.string().trim().max(30_000).optional(),
  })
  .strict();

export const applyRewriteBodySchema = z
  .object({
    analysisId: z.string().regex(/^[a-f\d]{24}$/i),
    suggestionIds: z.array(z.string().uuid()).min(1).max(100),
    changeSummary: z.string().trim().max(500).optional(),
  })
  .strict();

export const analysisIdParamsSchema = z.object({
  analysisId: z.string().regex(/^[a-f\d]{24}$/i),
});

export const analysisResumeParamsSchema = z.object({
  resumeId: z.string().regex(/^[a-f\d]{24}$/i),
});

export const analysisListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const parsedLinkSchema = z.object({
  label: z.string().trim().min(1).max(80),
  url: z.string().trim().url().max(2_000),
}).strict();

const parsedBulletSchema = z.object({
  text: z.string().trim().min(1).max(2_000),
}).strict();

export const parsedResumeSchema = z.object({
  basics: z.object({
    fullName: z.string().trim().max(200).default(""),
    email: z.string().trim().email().max(320).optional(),
    phone: z.string().trim().max(80).optional(),
    location: z.string().trim().max(200).optional(),
    headline: z.string().trim().max(200).optional(),
    summary: z.string().trim().max(5_000).optional(),
    links: z.array(parsedLinkSchema).max(20).default([]),
  }).strict(),
  experience: z.array(z.object({
    employer: z.string().trim().min(1).max(200),
    jobTitle: z.string().trim().min(1).max(200),
    location: z.string().trim().max(200).optional(),
    startDate: z.string().trim().max(30).optional(),
    endDate: z.string().trim().max(30).optional(),
    isCurrent: z.boolean().default(false),
    bullets: z.array(parsedBulletSchema).max(50).default([]),
  }).strict()).max(50).default([]),
  education: z.array(z.object({
    institution: z.string().trim().min(1).max(200),
    qualification: z.string().trim().min(1).max(200),
    fieldOfStudy: z.string().trim().max(200).optional(),
    location: z.string().trim().max(200).optional(),
    startDate: z.string().trim().max(30).optional(),
    endDate: z.string().trim().max(30).optional(),
    isCurrent: z.boolean().default(false),
    details: z.array(parsedBulletSchema).max(30).default([]),
  }).strict()).max(30).default([]),
  skills: z.array(z.object({
    name: z.string().trim().min(1).max(120),
    keywords: z.array(z.string().trim().min(1).max(120)).max(100).default([]),
  }).strict()).max(30).default([]),
  projects: z.array(z.object({
    name: z.string().trim().min(1).max(200),
    role: z.string().trim().max(160).optional(),
    description: z.string().trim().max(2_000).optional(),
    startDate: z.string().trim().max(30).optional(),
    endDate: z.string().trim().max(30).optional(),
    technologies: z.array(z.string().trim().min(1).max(120)).max(100).default([]),
    links: z.array(parsedLinkSchema).max(20).default([]),
    bullets: z.array(parsedBulletSchema).max(50).default([]),
  }).strict()).max(50).default([]),
  certifications: z.array(z.object({
    name: z.string().trim().min(1).max(200),
    issuer: z.string().trim().max(200).optional(),
    issuedDate: z.string().trim().max(30).optional(),
    credentialUrl: z.string().trim().url().max(2_000).optional(),
  }).strict()).max(50).default([]),
  languages: z.array(z.object({
    name: z.string().trim().min(1).max(120),
    proficiency: z.string().trim().max(80).optional(),
  }).strict()).max(30).default([]),
  interests: z.array(z.string().trim().min(1).max(120)).max(50).default([]),
}).strict();

export const aiAnalysisResultSchema = z.object({
  scoreBreakdown: z.object({
    keywordMatch: z.number().int().min(0).max(25),
    clarity: z.number().int().min(0).max(25),
    evidence: z.number().int().min(0).max(25),
    formatting: z.number().int().min(0).max(25),
  }).strict(),
  issues: z.array(z.object({
    code: z.string().trim().min(1).max(120),
    severity: z.enum(["low", "medium", "high"]),
    message: z.string().trim().min(1).max(1_000),
  }).strict()).max(50).default([]),
  strengths: z.array(z.object({
    title: z.string().trim().min(1).max(200),
    detail: z.string().trim().min(1).max(1_000),
  }).strict()).max(30).default([]),
  missingKeywords: z.array(z.string().trim().min(1).max(120)).max(100).default([]),
  suggestions: z.array(z.object({
    bulletId: z.string().uuid(),
    rewrittenText: z.string().trim().min(1).max(2_000),
    rationale: z.string().trim().min(1).max(1_000),
    verificationRequired: z.boolean().default(true),
  }).strict()).max(100).default([]),
}).strict();

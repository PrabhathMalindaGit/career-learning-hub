import { randomUUID } from "node:crypto";
import { Schema } from "mongoose";
import type {
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  LanguageEntry,
  ProjectEntry,
  ResumeBullet,
  ResumeContent,
  ResumeLink,
  SkillGroup,
} from "./resume.types.js";

const stableId = {
  type: String,
  required: true,
  immutable: true,
  default: () => randomUUID(),
};

const resumeLinkSchema = new Schema<ResumeLink>(
  {
    id: stableId,
    label: { type: String, required: true, trim: true, maxlength: 80 },
    url: { type: String, required: true, trim: true, maxlength: 2_000 },
  },
  { _id: false },
);

const bulletSchema = new Schema<ResumeBullet>(
  {
    id: stableId,
    text: { type: String, required: true, trim: true, maxlength: 2_000 },
  },
  { _id: false },
);

const experienceSchema = new Schema<ExperienceEntry>(
  {
    id: stableId,
    employer: { type: String, required: true, trim: true, maxlength: 200 },
    jobTitle: { type: String, required: true, trim: true, maxlength: 200 },
    location: { type: String, trim: true, maxlength: 200 },
    startDate: { type: String, trim: true, maxlength: 30 },
    endDate: { type: String, trim: true, maxlength: 30 },
    isCurrent: { type: Boolean, default: false },
    bullets: { type: [bulletSchema], default: [] },
  },
  { _id: false },
);

const educationSchema = new Schema<EducationEntry>(
  {
    id: stableId,
    institution: { type: String, required: true, trim: true, maxlength: 200 },
    qualification: { type: String, required: true, trim: true, maxlength: 200 },
    fieldOfStudy: { type: String, trim: true, maxlength: 200 },
    location: { type: String, trim: true, maxlength: 200 },
    startDate: { type: String, trim: true, maxlength: 30 },
    endDate: { type: String, trim: true, maxlength: 30 },
    isCurrent: { type: Boolean, default: false },
    details: { type: [bulletSchema], default: [] },
  },
  { _id: false },
);

const skillGroupSchema = new Schema<SkillGroup>(
  {
    id: stableId,
    name: { type: String, required: true, trim: true, maxlength: 120 },
    keywords: {
      type: [{ type: String, trim: true, maxlength: 120 }],
      default: [],
    },
  },
  { _id: false },
);

const projectSchema = new Schema<ProjectEntry>(
  {
    id: stableId,
    name: { type: String, required: true, trim: true, maxlength: 200 },
    role: { type: String, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 2_000 },
    startDate: { type: String, trim: true, maxlength: 30 },
    endDate: { type: String, trim: true, maxlength: 30 },
    technologies: {
      type: [{ type: String, trim: true, maxlength: 120 }],
      default: [],
    },
    links: { type: [resumeLinkSchema], default: [] },
    bullets: { type: [bulletSchema], default: [] },
  },
  { _id: false },
);

const certificationSchema = new Schema<CertificationEntry>(
  {
    id: stableId,
    name: { type: String, required: true, trim: true, maxlength: 200 },
    issuer: { type: String, trim: true, maxlength: 200 },
    issuedDate: { type: String, trim: true, maxlength: 30 },
    credentialUrl: { type: String, trim: true, maxlength: 2_000 },
  },
  { _id: false },
);

const languageSchema = new Schema<LanguageEntry>(
  {
    id: stableId,
    name: { type: String, required: true, trim: true, maxlength: 120 },
    proficiency: { type: String, trim: true, maxlength: 80 },
  },
  { _id: false },
);

export const resumeContentMongooseSchema = new Schema<ResumeContent>(
  {
    basics: {
      fullName: { type: String, default: "", trim: true, maxlength: 200 },
      email: { type: String, trim: true, maxlength: 320 },
      phone: { type: String, trim: true, maxlength: 80 },
      location: { type: String, trim: true, maxlength: 200 },
      headline: { type: String, trim: true, maxlength: 200 },
      summary: { type: String, trim: true, maxlength: 5_000 },
      links: { type: [resumeLinkSchema], default: [] },
    },
    experience: { type: [experienceSchema], default: [] },
    education: { type: [educationSchema], default: [] },
    skills: { type: [skillGroupSchema], default: [] },
    projects: { type: [projectSchema], default: [] },
    certifications: { type: [certificationSchema], default: [] },
    languages: { type: [languageSchema], default: [] },
    interests: {
      type: [{ type: String, trim: true, maxlength: 120 }],
      default: [],
    },
  },
  { _id: false },
);

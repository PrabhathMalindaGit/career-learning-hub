export type ResumeSource =
  | "manual"
  | "pdf-import"
  | "ai-rewrite"
  | "duplicate";

export interface StableEntity {
  id: string;
}

export interface ResumeLink extends StableEntity {
  label: string;
  url: string;
}

export interface ResumeBullet extends StableEntity {
  text: string;
}

export interface ExperienceEntry extends StableEntity {
  employer: string;
  jobTitle: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  bullets: ResumeBullet[];
}

export interface EducationEntry extends StableEntity {
  institution: string;
  qualification: string;
  fieldOfStudy?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  details: ResumeBullet[];
}

export interface SkillGroup extends StableEntity {
  name: string;
  keywords: string[];
}

export interface ProjectEntry extends StableEntity {
  name: string;
  role?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  technologies: string[];
  links: ResumeLink[];
  bullets: ResumeBullet[];
}

export interface CertificationEntry extends StableEntity {
  name: string;
  issuer?: string;
  issuedDate?: string;
  credentialUrl?: string;
}

export interface LanguageEntry extends StableEntity {
  name: string;
  proficiency?: string;
}

export interface ResumeContent {
  basics: {
    fullName: string;
    email?: string;
    phone?: string;
    location?: string;
    headline?: string;
    summary?: string;
    links: ResumeLink[];
  };
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillGroup[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  languages: LanguageEntry[];
  interests: string[];
}

export interface ResumeDesign {
  templateId: string;
  colorPaletteId: string;
  pageSize: "A4" | "LETTER";
  fontFamily?: string;
  showProfilePhoto: boolean;
}

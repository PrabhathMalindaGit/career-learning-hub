export type ResumeStatus = "draft" | "active" | "archived";
export type ResumeSource =
  | "manual"
  | "pdf-import"
  | "ai-rewrite"
  | "duplicate";
export type JobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface StableEntity {
  id: string;
}

export interface ClientEntity {
  clientKey: string;
  id?: string;
}

export interface ResumeLink extends StableEntity {
  label: string;
  url: string;
}

export interface ResumeBullet extends StableEntity {
  text: string;
}

export interface ResumeExperience extends StableEntity {
  employer: string;
  jobTitle: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  bullets: ResumeBullet[];
}

export interface ResumeEducation extends StableEntity {
  institution: string;
  qualification: string;
  fieldOfStudy?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  details: ResumeBullet[];
}

export interface ResumeSkill extends StableEntity {
  name: string;
  keywords: string[];
}

export interface ResumeProject extends StableEntity {
  name: string;
  role?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  technologies: string[];
  links: ResumeLink[];
  bullets: ResumeBullet[];
}

export interface ResumeCertification extends StableEntity {
  name: string;
  issuer?: string;
  issuedDate?: string;
  credentialUrl?: string;
}

export interface ResumeLanguage extends StableEntity {
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
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: ResumeSkill[];
  projects: ResumeProject[];
  certifications: ResumeCertification[];
  languages: ResumeLanguage[];
  interests: string[];
}

export type ResumeContentInput = {
  basics: Omit<ResumeContent["basics"], "links"> & {
    links: Array<Omit<ResumeLink, "id"> & { id?: string }>;
  };
  experience: Array<
    Omit<ResumeExperience, "id" | "bullets"> & {
      id?: string;
      bullets: Array<Omit<ResumeBullet, "id"> & { id?: string }>;
    }
  >;
  education: Array<
    Omit<ResumeEducation, "id" | "details"> & {
      id?: string;
      details: Array<Omit<ResumeBullet, "id"> & { id?: string }>;
    }
  >;
  skills: Array<Omit<ResumeSkill, "id"> & { id?: string }>;
  projects: Array<
    Omit<ResumeProject, "id" | "links" | "bullets"> & {
      id?: string;
      links: Array<Omit<ResumeLink, "id"> & { id?: string }>;
      bullets: Array<Omit<ResumeBullet, "id"> & { id?: string }>;
    }
  >;
  certifications: Array<
    Omit<ResumeCertification, "id"> & { id?: string }
  >;
  languages: Array<Omit<ResumeLanguage, "id"> & { id?: string }>;
  interests: string[];
};

export type DraftLink = Omit<ResumeLink, "id"> & ClientEntity;
export type DraftBullet = Omit<ResumeBullet, "id"> & ClientEntity;
export type DraftExperience = Omit<
  ResumeExperience,
  "id" | "bullets"
> &
  ClientEntity & { bullets: DraftBullet[] };
export type DraftEducation = Omit<
  ResumeEducation,
  "id" | "details"
> &
  ClientEntity & { details: DraftBullet[] };
export type DraftSkill = Omit<ResumeSkill, "id"> & ClientEntity;
export type DraftProject = Omit<
  ResumeProject,
  "id" | "links" | "bullets"
> &
  ClientEntity & {
    links: DraftLink[];
    bullets: DraftBullet[];
  };
export type DraftCertification = Omit<ResumeCertification, "id"> &
  ClientEntity;
export type DraftLanguage = Omit<ResumeLanguage, "id"> & ClientEntity;

export interface ResumeDraft {
  basics: Omit<ResumeContent["basics"], "links"> & {
    links: DraftLink[];
  };
  experience: DraftExperience[];
  education: DraftEducation[];
  skills: DraftSkill[];
  projects: DraftProject[];
  certifications: DraftCertification[];
  languages: DraftLanguage[];
  interests: Array<{ clientKey: string; value: string }>;
}

export interface ResumeDesign {
  templateId: string;
  colorPaletteId: string;
  pageSize: "A4" | "LETTER";
  fontFamily?: string;
  showProfilePhoto: boolean;
}

export interface ResumeRecord {
  id: string;
  title: string;
  status: ResumeStatus;
  currentVersionId?: string;
  latestVersionNumber: number;
  design: ResumeDesign;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeVersionMetadata {
  id: string;
  versionNumber: number;
  parentVersionId?: string;
  source: ResumeSource;
  changeSummary?: string;
  createdAt: string;
}

export interface ResumeVersion extends ResumeVersionMetadata {
  resumeId: string;
  content: ResumeContent;
  updatedAt: string;
}

export interface ResumeWorkspaceData {
  resume: ResumeRecord;
  version: ResumeVersion;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ResumeListPageData {
  resumes: ResumeRecord[];
  pagination: Pagination;
}

export interface ResumeVersionPageData {
  versions: ResumeVersionMetadata[];
  pagination: Pagination;
}

export interface ResumeSuggestion {
  id: string;
  bulletId: string;
  originalText: string;
  rewrittenText: string;
  rationale: string;
  verificationRequired: boolean;
}

export interface ResumeAnalysis {
  id: string;
  resumeId: string;
  resumeVersionId: string;
  target: {
    role: string;
    company?: string;
  };
  scoreBreakdown: {
    keywordMatch: number;
    clarity: number;
    evidence: number;
    formatting: number;
  };
  totalScore: number;
  issues: Array<{
    code: string;
    severity: "low" | "medium" | "high";
    message: string;
  }>;
  strengths: Array<{
    title: string;
    detail: string;
  }>;
  missingKeywords: string[];
  suggestions: ResumeSuggestion[];
  createdAt: string;
  updatedAt: string;
}

export interface ResumeJob {
  id: string;
  type: "resume.import-pdf" | "resume.analyze";
  status: JobStatus;
  progress: number;
  attempts: number;
  maxAttempts: number;
  result?:
    | {
        kind: "import";
        resumeId: string;
        versionId: string;
        versionNumber: number;
      }
    | {
        kind: "analysis";
        analysisId: string;
        resumeId: string;
        resumeVersionId: string;
        totalScore: number;
      };
  error?: {
    code: string;
    message: string;
  };
  createdAt: string;
  updatedAt: string;
}

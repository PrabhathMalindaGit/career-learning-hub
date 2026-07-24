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
  skills: Array<{
    id: string;
    name: string;
    keywords: string[];
  }>;
  projects: ResumeProject[];
  certifications: Array<{
    id: string;
    name: string;
    issuer?: string;
    issuedDate?: string;
    credentialUrl?: string;
  }>;
  languages: Array<{
    id: string;
    name: string;
    proficiency?: string;
  }>;
  interests: string[];
}

export interface ResumeDesign {
  templateId: string;
  colorPaletteId: string;
  pageSize: "A4" | "LETTER";
  fontFamily?: string;
  showProfilePhoto: boolean;
}

export interface ResumeSuggestion {
  id: string;
  bulletId: string;
  originalText: string;
  rewrittenText: string;
  rationale: string;
  verificationRequired: boolean;
}

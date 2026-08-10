import { createDraftEntity } from "./resumeDraft";
import type {
  DraftSkill,
  ResumeContentInput,
} from "./types";

export const JOB_TITLE_SUGGESTIONS = [
  "Software Engineer",
  "Software Developer",
  "Software Engineering Intern",
  "Full-Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Mobile Developer",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "QA Engineer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Cybersecurity Analyst",
  "IT Support Specialist",
  "Systems Administrator",
  "Business Analyst",
  "Project Manager",
  "Project Coordinator",
  "Operations Manager",
  "Product Manager",
  "Accountant",
  "Accounts Assistant",
  "Financial Analyst",
  "Auditor",
  "Digital Marketing Executive",
  "Marketing Executive",
  "Sales Executive",
  "Content Writer",
  "HR Executive",
  "HR Assistant",
  "Recruiter",
  "Administrative Assistant",
  "Civil Engineer",
  "Mechanical Engineer",
  "Electrical Engineer",
  "Engineering Intern",
  "UI/UX Designer",
  "Graphic Designer",
  "Web Designer",
  "Product Designer",
  "Teacher",
  "Teaching Assistant",
  "Research Assistant",
  "Researcher",
  "Nurse",
  "Healthcare Assistant",
  "Medical Administrator",
  "Community Support Worker",
  "Customer Service Representative",
  "Customer Support Specialist",
  "Receptionist",
  "Hospitality Assistant",
  "Logistics Coordinator",
  "Supply Chain Analyst",
  "Procurement Officer",
  "Inventory Controller",
  "Graduate",
  "Intern",
  "Trainee",
] as const;

export const SKILL_CATEGORIES = [
  {
    name: "Programming Languages",
    skills: [
      "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "Swift",
      "Kotlin", "PHP", "Go",
    ],
  },
  {
    name: "Software & Web Development",
    skills: [
      "React", "Vue", "Angular", "HTML", "CSS", "Next.js", "Node.js",
      "Express", "Spring Boot", "Django", "FastAPI", "ASP.NET", "REST APIs",
      "Git", "GitHub",
    ],
  },
  {
    name: "Data & Analytics",
    skills: [
      "MongoDB", "PostgreSQL", "MySQL", "SQLite", "Redis", "SQL",
      "Data Analysis", "Data Visualization", "Power BI", "Reporting",
    ],
  },
  {
    name: "Cloud, Infrastructure & DevOps",
    skills: ["AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "CI/CD"],
  },
  {
    name: "Testing & Quality Assurance",
    skills: ["Vitest", "Jest", "Playwright", "Cypress"],
  },
  {
    name: "Business & Strategy",
    skills: [
      "Business Analysis", "Requirements Gathering", "Process Improvement",
      "Stakeholder Management", "Market Research",
    ],
  },
  {
    name: "Project & Operations Management",
    skills: [
      "Project Planning", "Project Coordination", "Operations Management",
      "Scheduling", "Risk Management", "Jira",
    ],
  },
  {
    name: "Finance & Accounting",
    skills: [
      "Financial Reporting", "Bookkeeping", "Accounts Payable", "Budgeting",
      "Forecasting", "Financial Analysis", "Bank Reconciliation",
    ],
  },
  {
    name: "Marketing & Sales",
    skills: [
      "Digital Marketing", "SEO", "Content Marketing",
      "Social Media Marketing", "Campaign Management",
    ],
  },
  {
    name: "Human Resources & Recruitment",
    skills: [
      "Recruitment", "Interviewing", "Onboarding", "Employee Relations",
      "HR Administration",
    ],
  },
  {
    name: "Engineering & Technical",
    skills: [
      "AutoCAD", "Technical Drawing", "Site Supervision",
      "Technical Documentation", "Engineering Design",
      "Preventive Maintenance", "Health & Safety",
    ],
  },
  {
    name: "Design & Creative",
    skills: [
      "Figma", "Adobe Photoshop", "Adobe Illustrator", "Canva",
      "Graphic Design", "UI Design", "UX Design",
    ],
  },
  {
    name: "Research & Analysis",
    skills: [
      "Research", "Literature Review", "Data Collection", "Report Writing",
      "Critical Analysis",
    ],
  },
  {
    name: "Administration & Office",
    skills: [
      "Microsoft Word", "Microsoft Excel", "Google Workspace",
      "Record Keeping", "Calendar Management",
    ],
  },
  {
    name: "Customer Service & Hospitality",
    skills: [
      "Customer Service", "Customer Support", "Complaint Resolution", "CRM",
      "Telephone Communication",
    ],
  },
  {
    name: "Supply Chain & Procurement",
    skills: [
      "Procurement", "Supplier Coordination", "Inventory Management",
      "Logistics", "Stock Control",
    ],
  },
  {
    name: "Communication & Interpersonal",
    skills: [
      "Communication", "Presentation Skills", "Active Listening",
      "Negotiation",
    ],
  },
  {
    name: "Leadership & Management",
    skills: ["Leadership", "Mentoring"],
  },
  {
    name: "Soft Skills",
    skills: [
      "Problem Solving", "Teamwork", "Time Management", "Adaptability",
      "Attention to Detail", "Organization", "Creativity",
    ],
  },
] as const;

export const ROLE_SKILL_SUGGESTIONS: Readonly<
  Record<string, readonly string[]>
> = {
  "software engineer": [
    "JavaScript", "TypeScript", "React", "Node.js", "REST APIs", "SQL",
    "Git", "Docker",
  ],
  "data analyst": [
    "SQL", "Data Analysis", "Data Visualization", "Microsoft Excel",
    "Power BI", "Reporting",
  ],
  "business analyst": [
    "Business Analysis", "Requirements Gathering", "Process Improvement",
    "Stakeholder Management", "Data Analysis", "Report Writing",
    "Presentation Skills",
  ],
  "project manager": [
    "Project Planning", "Project Coordination", "Risk Management",
    "Stakeholder Management", "Leadership", "Communication",
  ],
  accountant: [
    "Financial Reporting", "Bookkeeping", "Accounts Payable", "Budgeting",
    "Bank Reconciliation", "Microsoft Excel", "Attention to Detail",
  ],
  "financial analyst": [
    "Financial Analysis", "Budgeting", "Forecasting", "Data Analysis",
    "Microsoft Excel", "Reporting", "Presentation Skills",
  ],
  "digital marketing executive": [
    "Digital Marketing", "SEO", "Content Marketing", "Social Media Marketing",
    "Campaign Management", "Data Analysis", "Canva",
  ],
  "marketing executive": [
    "Digital Marketing", "Content Marketing", "Campaign Management",
    "Market Research", "Presentation Skills", "Communication",
  ],
  "hr executive": [
    "Recruitment", "Onboarding", "Employee Relations", "HR Administration",
    "Interviewing", "Communication",
  ],
  "administrative assistant": [
    "Microsoft Word", "Microsoft Excel", "Calendar Management",
    "Record Keeping", "Organization", "Communication",
  ],
  "civil engineer": [
    "AutoCAD", "Technical Drawing", "Site Supervision", "Project Planning",
    "Technical Documentation", "Health & Safety", "Problem Solving",
  ],
  "mechanical engineer": [
    "Engineering Design", "Technical Drawing", "Preventive Maintenance",
    "Technical Documentation", "Health & Safety", "Problem Solving",
  ],
  "graphic designer": [
    "Graphic Design", "Adobe Photoshop", "Adobe Illustrator", "Canva",
    "Creativity", "Attention to Detail",
  ],
  "ui/ux designer": [
    "UI Design", "UX Design", "Figma", "Research", "Critical Analysis",
    "Problem Solving",
  ],
  "research assistant": [
    "Research", "Literature Review", "Data Collection", "Report Writing",
    "Critical Analysis", "Data Analysis",
  ],
  nurse: [
    "Communication", "Teamwork", "Active Listening", "Time Management",
    "Attention to Detail",
  ],
  "customer service representative": [
    "Customer Service", "Complaint Resolution", "CRM",
    "Telephone Communication", "Active Listening", "Communication",
    "Problem Solving",
  ],
  "logistics coordinator": [
    "Logistics", "Inventory Management", "Supplier Coordination",
    "Stock Control", "Scheduling", "Microsoft Excel", "Communication",
  ],
  graduate: [
    "Communication", "Teamwork", "Problem Solving", "Time Management",
    "Adaptability",
  ],
};

export const QUALIFICATION_SUGGESTIONS = [
  "BSc", "BSc (Hons)", "BEng", "BA", "MSc", "MEng", "MBA", "Diploma",
  "Higher Diploma", "Certificate", "Other",
] as const;

export const PROFICIENCY_SUGGESTIONS = [
  "Native", "Fluent", "Professional", "Intermediate", "Basic",
] as const;

export const INTEREST_SUGGESTIONS = [
  "Open-source development", "Machine learning", "Robotics", "Photography",
  "Hiking", "Volunteering", "Reading", "Chess", "Sports", "Travel",
] as const;

export const EXPERIENCE_ACTION_STARTERS = [
  "Built", "Developed", "Implemented", "Designed", "Improved", "Automated",
  "Created", "Integrated", "Tested", "Deployed", "Optimized", "Collaborated",
] as const;

export type ExperienceLevel = "student" | "entry" | "mid" | "senior";

export const SUGGESTED_SECTIONS_BY_EXPERIENCE_LEVEL: Readonly<
  Record<ExperienceLevel, readonly string[]>
> = {
  student: [
    "Summary", "Education", "Skills", "Projects", "Experience",
    "Certifications",
  ],
  entry: [
    "Summary", "Experience", "Education", "Skills", "Projects",
    "Certifications",
  ],
  mid: [
    "Summary", "Experience", "Skills", "Projects", "Education",
    "Certifications",
  ],
  senior: [
    "Summary", "Experience", "Skills", "Projects", "Education",
    "Certifications",
  ],
};

export interface SkillSelection {
  groupName: string;
  keyword: string;
}

export interface AchievementParts {
  action: string;
  work: string;
  technology?: string;
  result?: string;
}

function boundedWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeSkillKey(value: string): string {
  return boundedWhitespace(value).toLowerCase();
}

export function suggestedSkillsForRole(role: string): readonly string[] {
  return ROLE_SKILL_SUGGESTIONS[normalizeSkillKey(role)] ?? [];
}

export function mergeSkillSelections(
  existing: readonly DraftSkill[],
  selections: readonly SkillSelection[],
): DraftSkill[] {
  const merged = existing.map((group) => ({
    ...group,
    keywords: [...group.keywords],
  }));
  const keywordKeys = new Set(
    merged.flatMap((group) => group.keywords.map(normalizeSkillKey)),
  );

  for (const selection of selections) {
    const groupName = boundedWhitespace(selection.groupName);
    const keyword = boundedWhitespace(selection.keyword);
    const keywordKey = normalizeSkillKey(keyword);
    if (!groupName || !keyword || keywordKeys.has(keywordKey)) continue;

    const groupKey = normalizeSkillKey(groupName);
    const group = merged.find(
      (candidate) => normalizeSkillKey(candidate.name) === groupKey,
    );
    if (group) {
      group.keywords.push(keyword);
    } else {
      merged.push(createDraftEntity({ name: groupName, keywords: [keyword] }));
    }
    keywordKeys.add(keywordKey);
  }

  return merged;
}

export function buildGuidedResumeContent(input: {
  targetRole: string;
  useTargetRoleAsHeadline: boolean;
  skills: readonly DraftSkill[];
}): ResumeContentInput {
  const targetRole = boundedWhitespace(input.targetRole);
  return {
    basics: {
      fullName: "",
      ...(input.useTargetRoleAsHeadline && targetRole
        ? { headline: targetRole }
        : {}),
      links: [],
    },
    experience: [],
    education: [],
    skills: input.skills.map((skill) => ({
      name: skill.name,
      keywords: [...skill.keywords],
    })),
    projects: [],
    certifications: [],
    languages: [],
    interests: [],
  };
}

export function composeAchievement(parts: AchievementParts): string {
  const action = boundedWhitespace(parts.action);
  const work = boundedWhitespace(parts.work);
  if (!action || !work) return "";

  const technology = boundedWhitespace(parts.technology ?? "");
  const result = boundedWhitespace(parts.result ?? "");
  const base = `${action} ${work}`;
  const withTechnology = technology ? `${base} using ${technology}` : base;
  const withResult = result ? `${withTechnology} — ${result}` : withTechnology;
  return /[.!?]$/.test(withResult) ? withResult : `${withResult}.`;
}

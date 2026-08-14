export type InterviewRoleFamily =
  | "software-engineer"
  | "frontend"
  | "backend"
  | "full-stack"
  | "mobile"
  | "devops-cloud"
  | "data"
  | "ml-ai"
  | "cybersecurity"
  | "qa-test";

export interface InterviewRoleGuidance {
  family: InterviewRoleFamily;
  label: string;
  focusTopics: readonly string[];
  skillGaps: readonly string[];
}

export const INTERVIEW_EXPERIENCE_LEVELS = [
  "Intern / Student",
  "Entry-level",
  "Junior",
  "Mid-level",
  "Senior",
  "Lead / Staff",
  "Manager",
] as const;

const ROLE_GUIDANCE: Record<InterviewRoleFamily, InterviewRoleGuidance> = {
  "software-engineer": {
    family: "software-engineer",
    label: "Software Engineer",
    focusTopics: [
      "Data Structures",
      "Algorithms",
      "APIs",
      "Databases",
      "Testing",
      "System Design",
      "Security",
      "Performance",
    ],
    skillGaps: [
      "Problem Solving",
      "System Design",
      "Testing Strategy",
      "Debugging",
      "Code Quality",
      "Performance",
      "Security",
      "Communication",
    ],
  },
  frontend: {
    family: "frontend",
    label: "Frontend Developer",
    focusTopics: [
      "React",
      "TypeScript",
      "State Management",
      "Accessibility",
      "Responsive Design",
      "Testing",
      "Browser APIs",
      "Frontend Architecture",
    ],
    skillGaps: [
      "State Management",
      "React Performance",
      "Accessibility",
      "Testing",
      "TypeScript",
      "Responsive Design",
      "Browser APIs",
      "Frontend Architecture",
    ],
  },
  backend: {
    family: "backend",
    label: "Backend Developer",
    focusTopics: [
      "REST APIs",
      "Authentication",
      "Databases",
      "System Design",
      "Caching",
      "Testing",
      "Performance",
      "Security",
    ],
    skillGaps: [
      "System Design",
      "Database Optimization",
      "API Security",
      "Caching Strategies",
      "Testing",
      "Observability",
      "Concurrency",
      "Performance Tuning",
    ],
  },
  "full-stack": {
    family: "full-stack",
    label: "Full-Stack Developer",
    focusTopics: [
      "Frontend Architecture",
      "REST APIs",
      "Authentication",
      "Databases",
      "State Management",
      "Testing",
      "Deployment",
      "System Design",
    ],
    skillGaps: [
      "System Design",
      "Frontend Performance",
      "API Design",
      "Database Optimization",
      "Authentication",
      "Testing Strategy",
      "Deployment",
      "Cross-layer Debugging",
    ],
  },
  mobile: {
    family: "mobile",
    label: "Mobile Developer",
    focusTopics: [
      "Mobile Architecture",
      "State Management",
      "Networking",
      "Offline Data",
      "Performance",
      "Testing",
      "Platform APIs",
      "App Lifecycle",
    ],
    skillGaps: [
      "Mobile Architecture",
      "Performance Profiling",
      "Offline Synchronization",
      "Testing",
      "Platform APIs",
      "Memory Management",
      "Networking",
      "Release Engineering",
    ],
  },
  "devops-cloud": {
    family: "devops-cloud",
    label: "DevOps / Cloud Engineer",
    focusTopics: [
      "CI/CD",
      "Containers",
      "Cloud Architecture",
      "Infrastructure as Code",
      "Observability",
      "Networking",
      "Security",
      "Reliability",
    ],
    skillGaps: [
      "Cloud Architecture",
      "Incident Response",
      "Observability",
      "Infrastructure as Code",
      "Container Security",
      "Networking",
      "Cost Awareness",
      "Reliability Engineering",
    ],
  },
  data: {
    family: "data",
    label: "Data Engineer",
    focusTopics: [
      "SQL",
      "Data Modeling",
      "ETL / ELT",
      "Data Warehousing",
      "Streaming",
      "Data Quality",
      "Python",
      "Pipeline Design",
    ],
    skillGaps: [
      "Data Modeling",
      "Query Optimization",
      "Pipeline Reliability",
      "Streaming Systems",
      "Data Quality",
      "Warehouse Design",
      "Orchestration",
      "Scalability",
    ],
  },
  "ml-ai": {
    family: "ml-ai",
    label: "ML / AI Engineer",
    focusTopics: [
      "Machine Learning",
      "Deep Learning",
      "Model Evaluation",
      "Feature Engineering",
      "LLMs",
      "MLOps",
      "Python",
      "Data Processing",
    ],
    skillGaps: [
      "Model Evaluation",
      "Feature Engineering",
      "ML System Design",
      "MLOps",
      "Data Leakage",
      "LLM Evaluation",
      "Experiment Design",
      "Production Monitoring",
    ],
  },
  cybersecurity: {
    family: "cybersecurity",
    label: "Cybersecurity Engineer",
    focusTopics: [
      "Application Security",
      "Network Security",
      "Threat Modeling",
      "Authentication",
      "Secure Coding",
      "Vulnerability Assessment",
      "Incident Response",
      "Cloud Security",
    ],
    skillGaps: [
      "Threat Modeling",
      "Secure Architecture",
      "Web Security",
      "Cloud Security",
      "Incident Response",
      "Vulnerability Analysis",
      "Identity and Access",
      "Security Testing",
    ],
  },
  "qa-test": {
    family: "qa-test",
    label: "QA / Test Engineer",
    focusTopics: [
      "Test Strategy",
      "Automation",
      "API Testing",
      "UI Testing",
      "Performance Testing",
      "Regression Testing",
      "CI Quality Gates",
      "Defect Analysis",
    ],
    skillGaps: [
      "Automation Design",
      "Test Strategy",
      "API Testing",
      "Performance Testing",
      "Flaky Test Diagnosis",
      "CI Integration",
      "Risk-based Testing",
      "Test Data Design",
    ],
  },
};

export const INTERVIEW_ROLE_OPTIONS = [
  ROLE_GUIDANCE["software-engineer"],
  ROLE_GUIDANCE.frontend,
  ROLE_GUIDANCE.backend,
  ROLE_GUIDANCE["full-stack"],
  ROLE_GUIDANCE.mobile,
  ROLE_GUIDANCE["devops-cloud"],
  ROLE_GUIDANCE.data,
  ROLE_GUIDANCE["ml-ai"],
  ROLE_GUIDANCE.cybersecurity,
  ROLE_GUIDANCE["qa-test"],
] as const;

function normalizeRole(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function includesAny(value: string, terms: readonly string[]): boolean {
  return terms.some((term) => value.includes(term));
}

export function matchInterviewRoleFamily(
  targetRole: string,
): InterviewRoleFamily {
  const normalized = normalizeRole(targetRole);

  if (includesAny(normalized, ["mern", "full stack", "full-stack"])) {
    return "full-stack";
  }
  if (includesAny(normalized, ["react native", "ios", "android", "mobile"])) {
    return "mobile";
  }
  if (
    includesAny(normalized, [
      "llm",
      "machine learning",
      "ml engineer",
      "artificial intelligence",
      "ai engineer",
    ])
  ) {
    return "ml-ai";
  }
  if (
    includesAny(normalized, [
      "devops",
      "cloud",
      "platform engineer",
      "sre",
    ])
  ) {
    return "devops-cloud";
  }
  if (includesAny(normalized, ["penetration", "cyber", "security"])) {
    return "cybersecurity";
  }
  if (includesAny(normalized, ["data engineer", "etl", "warehouse"])) {
    return "data";
  }
  if (includesAny(normalized, ["frontend", "front-end", "react developer"])) {
    return "frontend";
  }
  if (includesAny(normalized, ["backend", "back-end", "api developer"])) {
    return "backend";
  }
  if (includesAny(normalized, ["qa", "test engineer", "quality assurance"])) {
    return "qa-test";
  }

  return "software-engineer";
}

export function getInterviewRoleSuggestions(targetRole: string): {
  focusTopics: readonly string[];
  skillGaps: readonly string[];
} {
  if (!targetRole.trim()) {
    return { focusTopics: [], skillGaps: [] };
  }

  const guidance = ROLE_GUIDANCE[matchInterviewRoleFamily(targetRole)];
  return {
    focusTopics: guidance.focusTopics,
    skillGaps: guidance.skillGaps,
  };
}

export function suggestInterviewTitle(
  targetRole: string,
  experienceLevel: string,
): string {
  const cleanRole = targetRole.trim();
  const cleanLevel = experienceLevel.trim();
  if (!cleanRole || !cleanLevel) return "";
  return `${cleanLevel} ${cleanRole} Interview`;
}

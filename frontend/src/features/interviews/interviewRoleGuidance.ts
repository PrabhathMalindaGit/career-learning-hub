export type InterviewCareerAreaId =
  | "technology-it"
  | "business-management"
  | "finance-accounting"
  | "marketing-sales"
  | "human-resources"
  | "healthcare"
  | "engineering"
  | "education-training"
  | "law-legal"
  | "design-creative"
  | "operations-supply-chain"
  | "customer-service-hospitality"
  | "science-research"
  | "public-service-administration";

export const OTHER_CUSTOM_CAREER_AREA = "other-custom" as const;

export type InterviewCareerAreaSelection =
  | InterviewCareerAreaId
  | typeof OTHER_CUSTOM_CAREER_AREA
  | "";

export interface InterviewCareerGuidance {
  id: InterviewCareerAreaId;
  label: string;
  roles: readonly string[];
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

export const INTERVIEW_CAREER_AREAS: readonly InterviewCareerGuidance[] = [
  {
    id: "technology-it",
    label: "Technology & IT",
    roles: [
      "Software Engineer",
      "Frontend Developer",
      "Backend Developer",
      "Full-Stack Developer",
      "Mobile Developer",
      "DevOps / Cloud Engineer",
      "Data Engineer",
      "ML / AI Engineer",
      "Cybersecurity Engineer",
      "QA / Test Engineer",
      "Systems Administrator",
      "IT Support Specialist",
    ],
    focusTopics: [
      "Software & Systems",
      "APIs & Integration",
      "Databases & Data",
      "Cloud & Infrastructure",
      "Security",
      "Testing & Quality",
      "Performance & Reliability",
      "Data & AI",
    ],
    skillGaps: [
      "Problem Solving",
      "System Design",
      "Debugging",
      "Testing Strategy",
      "Security Awareness",
      "Performance Analysis",
      "Technical Communication",
      "Code Quality",
    ],
  },
  {
    id: "business-management",
    label: "Business & Management",
    roles: [
      "Business Analyst",
      "Project Manager",
      "Product Manager",
      "Operations Manager",
      "Management Consultant",
      "Strategy Analyst",
      "Business Development Manager",
      "General Manager",
    ],
    focusTopics: [
      "Business Strategy",
      "Project Delivery",
      "Stakeholder Management",
      "Process Improvement",
      "Decision-making",
      "Leadership",
      "Business Analysis",
      "Change Management",
    ],
    skillGaps: [
      "Strategic Thinking",
      "Prioritization",
      "Stakeholder Communication",
      "Leadership",
      "Commercial Awareness",
      "Conflict Resolution",
      "Presentation Skills",
      "Decision-making",
    ],
  },
  {
    id: "finance-accounting",
    label: "Finance & Accounting",
    roles: [
      "Accountant",
      "Auditor",
      "Financial Analyst",
      "Management Accountant",
      "Tax Associate",
      "Banking Officer",
      "Investment Analyst",
      "Risk Analyst",
    ],
    focusTopics: [
      "Financial Reporting",
      "Accounting Principles",
      "Budgeting",
      "Financial Analysis",
      "Audit & Controls",
      "Taxation",
      "Risk Management",
      "Regulatory Compliance",
    ],
    skillGaps: [
      "Financial Statement Analysis",
      "Excel / Financial Modelling",
      "Attention to Detail",
      "Risk Assessment",
      "Commercial Awareness",
      "Communication",
      "Compliance Knowledge",
      "Analytical Reasoning",
    ],
  },
  {
    id: "marketing-sales",
    label: "Marketing & Sales",
    roles: [
      "Marketing Executive",
      "Digital Marketing Specialist",
      "Brand Manager",
      "Content Marketer",
      "SEO Specialist",
      "Sales Executive",
      "Account Manager",
      "Sales Manager",
    ],
    focusTopics: [
      "Marketing Strategy",
      "Digital Marketing",
      "Brand Management",
      "Customer Segmentation",
      "Sales Process",
      "Campaign Analysis",
      "Content & Messaging",
      "Customer Relationships",
    ],
    skillGaps: [
      "Persuasive Communication",
      "Customer Discovery",
      "Campaign Measurement",
      "Negotiation",
      "Presentation Skills",
      "CRM Discipline",
      "Market Analysis",
      "Objection Handling",
    ],
  },
  {
    id: "human-resources",
    label: "Human Resources",
    roles: [
      "HR Executive",
      "Recruiter / Talent Acquisition Specialist",
      "HR Business Partner",
      "Learning & Development Specialist",
      "Compensation & Benefits Specialist",
      "Employee Relations Specialist",
      "People Operations Specialist",
      "HR Manager",
    ],
    focusTopics: [
      "Recruitment & Selection",
      "Employee Relations",
      "Performance Management",
      "Learning & Development",
      "HR Policy",
      "Workforce Planning",
      "Employee Experience",
      "Employment Compliance",
    ],
    skillGaps: [
      "Difficult Conversations",
      "Interviewing",
      "Conflict Resolution",
      "HR Analytics",
      "Policy Interpretation",
      "Stakeholder Communication",
      "Coaching",
      "Confidentiality & Judgment",
    ],
  },
  {
    id: "healthcare",
    label: "Healthcare",
    roles: [
      "Nurse",
      "Medical Officer / Doctor",
      "Pharmacist",
      "Physiotherapist",
      "Medical Laboratory Scientist",
      "Radiographer",
      "Public Health Officer",
      "Healthcare Administrator",
    ],
    focusTopics: [
      "Patient Care",
      "Clinical Communication",
      "Safety & Quality",
      "Documentation",
      "Ethics",
      "Teamwork",
      "Evidence-based Practice",
      "Service Improvement",
    ],
    skillGaps: [
      "Clinical Reasoning",
      "Patient Communication",
      "Documentation Quality",
      "Time Management",
      "Safety Awareness",
      "Team Collaboration",
      "Ethical Decision-making",
      "Handling Pressure",
    ],
  },
  {
    id: "engineering",
    label: "Engineering",
    roles: [
      "Civil Engineer",
      "Mechanical Engineer",
      "Electrical Engineer",
      "Electronics Engineer",
      "Chemical Engineer",
      "Industrial Engineer",
      "Mechatronics Engineer",
      "Environmental Engineer",
      "Biomedical Engineer",
    ],
    focusTopics: [
      "Engineering Design",
      "Technical Analysis",
      "Safety & Standards",
      "Project Delivery",
      "Testing & Validation",
      "Quality Control",
      "Sustainability",
      "Technical Documentation",
    ],
    skillGaps: [
      "Engineering Judgment",
      "Root-cause Analysis",
      "Technical Communication",
      "Safety Awareness",
      "Design Trade-offs",
      "Project Planning",
      "Quality Methods",
      "Cross-functional Collaboration",
    ],
  },
  {
    id: "education-training",
    label: "Education & Training",
    roles: [
      "Teacher",
      "Lecturer",
      "Tutor",
      "Academic Advisor",
      "Instructional Designer",
      "Curriculum Developer",
      "Training Coordinator",
      "Education Administrator",
    ],
    focusTopics: [
      "Teaching & Facilitation",
      "Lesson / Session Planning",
      "Assessment",
      "Learner Engagement",
      "Inclusive Practice",
      "Curriculum Design",
      "Feedback",
      "Education Technology",
    ],
    skillGaps: [
      "Classroom / Group Management",
      "Differentiation",
      "Assessment Design",
      "Learner Communication",
      "Feedback Skills",
      "Facilitation Confidence",
      "Inclusive Teaching",
      "Time Management",
    ],
  },
  {
    id: "law-legal",
    label: "Law & Legal Services",
    roles: [
      "Lawyer / Attorney",
      "Legal Counsel",
      "Paralegal",
      "Legal Assistant",
      "Compliance Officer",
      "Contract Specialist",
      "Legal Researcher",
      "Company Secretary",
    ],
    focusTopics: [
      "Legal Research",
      "Case / Matter Analysis",
      "Contracts",
      "Compliance",
      "Client Communication",
      "Legal Writing",
      "Risk & Ethics",
      "Negotiation",
    ],
    skillGaps: [
      "Legal Reasoning",
      "Research Efficiency",
      "Drafting",
      "Client Communication",
      "Attention to Detail",
      "Negotiation",
      "Ethical Judgment",
      "Prioritization",
    ],
  },
  {
    id: "design-creative",
    label: "Design & Creative",
    roles: [
      "Graphic Designer",
      "UI / UX Designer",
      "Product Designer",
      "Video Editor",
      "Animator / Motion Designer",
      "Photographer",
      "Copywriter",
      "Content Creator",
    ],
    focusTopics: [
      "Design Process",
      "User / Audience Needs",
      "Visual Communication",
      "Creative Direction",
      "Portfolio Decisions",
      "Feedback & Iteration",
      "Brand Consistency",
      "Production Workflow",
    ],
    skillGaps: [
      "Design Rationale",
      "Presenting Work",
      "Receiving Feedback",
      "Prioritization",
      "User Research",
      "Creative Problem Solving",
      "Production Efficiency",
      "Stakeholder Communication",
    ],
  },
  {
    id: "operations-supply-chain",
    label: "Operations & Supply Chain",
    roles: [
      "Supply Chain Analyst",
      "Procurement Officer",
      "Logistics Coordinator",
      "Inventory Planner",
      "Warehouse Manager",
      "Operations Analyst",
      "Demand Planner",
      "Quality Officer",
    ],
    focusTopics: [
      "Supply Planning",
      "Procurement",
      "Logistics",
      "Inventory Management",
      "Process Improvement",
      "Quality",
      "Supplier Management",
      "Operational Risk",
    ],
    skillGaps: [
      "Demand Planning",
      "Data Analysis",
      "Negotiation",
      "Process Mapping",
      "Risk Management",
      "Supplier Communication",
      "Inventory Control",
      "Continuous Improvement",
    ],
  },
  {
    id: "customer-service-hospitality",
    label: "Customer Service & Hospitality",
    roles: [
      "Customer Service Representative",
      "Customer Success Specialist",
      "Call Center Agent",
      "Hotel Front Office Executive",
      "Guest Relations Officer",
      "Restaurant Supervisor",
      "Travel Consultant",
      "Event Coordinator",
    ],
    focusTopics: [
      "Customer Experience",
      "Service Recovery",
      "Complaint Handling",
      "Communication",
      "Team Coordination",
      "Service Standards",
      "Upselling / Recommendations",
      "Operational Awareness",
    ],
    skillGaps: [
      "De-escalation",
      "Active Listening",
      "Handling Pressure",
      "Customer Communication",
      "Problem Resolution",
      "Service Recovery",
      "Teamwork",
      "Professionalism",
    ],
  },
  {
    id: "science-research",
    label: "Science & Research",
    roles: [
      "Research Assistant",
      "Research Scientist",
      "Laboratory Technician",
      "Biologist",
      "Chemist",
      "Physicist",
      "Environmental Scientist",
      "Clinical Research Coordinator",
    ],
    focusTopics: [
      "Research Methods",
      "Experimental Design",
      "Data Analysis",
      "Scientific Communication",
      "Literature Review",
      "Laboratory / Field Practice",
      "Research Ethics",
      "Reproducibility",
    ],
    skillGaps: [
      "Experimental Reasoning",
      "Statistical Interpretation",
      "Scientific Writing",
      "Research Presentation",
      "Data Quality",
      "Critical Evaluation",
      "Documentation",
      "Research Planning",
    ],
  },
  {
    id: "public-service-administration",
    label: "Public Service & Administration",
    roles: [
      "Administrative Officer",
      "Government Officer",
      "Policy Analyst",
      "Program Officer",
      "Community Development Officer",
      "Public Relations Officer",
      "Office Manager",
      "Executive Assistant",
    ],
    focusTopics: [
      "Public / Administrative Service",
      "Policy & Procedures",
      "Stakeholder Communication",
      "Records & Documentation",
      "Program Delivery",
      "Governance",
      "Community / Citizen Needs",
      "Process Improvement",
    ],
    skillGaps: [
      "Administrative Accuracy",
      "Policy Interpretation",
      "Written Communication",
      "Public Communication",
      "Prioritization",
      "Stakeholder Management",
      "Professional Judgment",
      "Service Orientation",
    ],
  },
];

const OTHER_CUSTOM_GUIDANCE = {
  roles: [] as readonly string[],
  focusTopics: [
    "Role Knowledge",
    "Communication",
    "Problem Solving",
    "Teamwork",
    "Customer / Stakeholder Needs",
    "Planning & Prioritization",
    "Professional Judgment",
    "Continuous Improvement",
  ] as const,
  skillGaps: [
    "Interview Communication",
    "Structured Problem Solving",
    "Confidence",
    "Prioritization",
    "Stakeholder Communication",
    "Decision-making",
    "Professional Examples",
    "Self-reflection",
  ] as const,
};

const EMPTY_GUIDANCE = {
  roles: [] as readonly string[],
  focusTopics: [] as readonly string[],
  skillGaps: [] as readonly string[],
};

export function getInterviewCareerGuidance(
  area: InterviewCareerAreaSelection,
): {
  roles: readonly string[];
  focusTopics: readonly string[];
  skillGaps: readonly string[];
} {
  if (!area) return EMPTY_GUIDANCE;
  if (area === OTHER_CUSTOM_CAREER_AREA) return OTHER_CUSTOM_GUIDANCE;
  const guidance = INTERVIEW_CAREER_AREAS.find((item) => item.id === area);
  return guidance
    ? {
        roles: guidance.roles,
        focusTopics: guidance.focusTopics,
        skillGaps: guidance.skillGaps,
      }
    : EMPTY_GUIDANCE;
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

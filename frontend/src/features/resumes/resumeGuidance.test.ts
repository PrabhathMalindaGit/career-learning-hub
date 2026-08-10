import { describe, expect, it } from "vitest";
import type { DraftSkill, ResumeDraft } from "./types";
import {
  EXPERIENCE_ACTION_STARTERS,
  INTEREST_SUGGESTIONS,
  JOB_TITLE_SUGGESTIONS,
  PROFICIENCY_SUGGESTIONS,
  QUALIFICATION_SUGGESTIONS,
  ROLE_SKILL_SUGGESTIONS,
  SKILL_CATEGORIES,
  SUGGESTED_SECTIONS_BY_EXPERIENCE_LEVEL,
  buildGuidedResumeContent,
  composeAchievement,
  mergeSkillSelections,
  normalizeSkillKey,
  suggestedSkillsForRole,
} from "./resumeGuidance";

const existingTitles = [
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
  "UI/UX Designer",
  "Product Manager",
];

const familyRepresentatives = [
  "Software Engineer",
  "Business Analyst",
  "Accountant",
  "Digital Marketing Executive",
  "HR Executive",
  "Civil Engineer",
  "Graphic Designer",
  "Teacher",
  "Nurse",
  "Customer Service Representative",
  "Logistics Coordinator",
  "Graduate",
] as const;

const categoryNames = [
  "Programming Languages",
  "Software & Web Development",
  "Data & Analytics",
  "Cloud, Infrastructure & DevOps",
  "Testing & Quality Assurance",
  "Business & Strategy",
  "Project & Operations Management",
  "Finance & Accounting",
  "Marketing & Sales",
  "Human Resources & Recruitment",
  "Engineering & Technical",
  "Design & Creative",
  "Research & Analysis",
  "Administration & Office",
  "Customer Service & Hospitality",
  "Supply Chain & Procurement",
  "Communication & Interpersonal",
  "Leadership & Management",
  "Soft Skills",
] as const;

const skillRepresentatives = [
  "JavaScript",
  "SQL",
  "Business Analysis",
  "Project Planning",
  "Financial Reporting",
  "Digital Marketing",
  "Recruitment",
  "AutoCAD",
  "Graphic Design",
  "Research",
  "Microsoft Excel",
  "Customer Service",
  "Procurement",
  "Communication",
  "Leadership",
  "Problem Solving",
] as const;

const representativeMappings = {
  "Software Engineer": [
    "JavaScript", "TypeScript", "React", "Node.js", "REST APIs", "SQL",
    "Git", "Docker",
  ],
  "Business Analyst": [
    "Business Analysis", "Requirements Gathering", "Process Improvement",
    "Stakeholder Management", "Data Analysis", "Report Writing",
    "Presentation Skills",
  ],
  Accountant: [
    "Financial Reporting", "Bookkeeping", "Accounts Payable", "Budgeting",
    "Bank Reconciliation", "Microsoft Excel", "Attention to Detail",
  ],
  "Digital Marketing Executive": [
    "Digital Marketing", "SEO", "Content Marketing", "Social Media Marketing",
    "Campaign Management", "Data Analysis", "Canva",
  ],
  "HR Executive": [
    "Recruitment", "Onboarding", "Employee Relations", "HR Administration",
    "Interviewing", "Communication",
  ],
  "Civil Engineer": [
    "AutoCAD", "Technical Drawing", "Site Supervision", "Project Planning",
    "Technical Documentation", "Health & Safety", "Problem Solving",
  ],
  "Graphic Designer": [
    "Graphic Design", "Adobe Photoshop", "Adobe Illustrator", "Canva",
    "Creativity", "Attention to Detail",
  ],
  "Research Assistant": [
    "Research", "Literature Review", "Data Collection", "Report Writing",
    "Critical Analysis", "Data Analysis",
  ],
  "Customer Service Representative": [
    "Customer Service", "Complaint Resolution", "CRM",
    "Telephone Communication", "Active Listening", "Communication",
    "Problem Solving",
  ],
  "Logistics Coordinator": [
    "Logistics", "Inventory Management", "Supplier Coordination",
    "Stock Control", "Scheduling", "Microsoft Excel", "Communication",
  ],
} as const;

function emptyDraft(): ResumeDraft {
  return {
    basics: { fullName: "", links: [] },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    interests: [],
  };
}

describe("resume guidance catalogues", () => {
  it("covers twelve career families with a bounded unique role catalogue", () => {
    expect(JOB_TITLE_SUGGESTIONS).toHaveLength(60);
    expect(JOB_TITLE_SUGGESTIONS).toEqual(
      expect.arrayContaining([...familyRepresentatives, ...existingTitles]),
    );
    expect(new Set(JOB_TITLE_SUGGESTIONS.map(normalizeSkillKey)).size).toBe(
      JOB_TITLE_SUGGESTIONS.length,
    );
  });

  it("covers broad career skills with unique non-empty canonical categories", () => {
    const skills = SKILL_CATEGORIES.flatMap((category) => category.skills);
    expect(SKILL_CATEGORIES.map((category) => category.name)).toEqual(
      categoryNames,
    );
    expect(SKILL_CATEGORIES).toHaveLength(19);
    expect(skills).toHaveLength(120);
    expect(skills).toEqual(expect.arrayContaining([...skillRepresentatives]));
    expect(new Set(SKILL_CATEGORIES.map(({ name }) => normalizeSkillKey(name))).size)
      .toBe(SKILL_CATEGORIES.length);
    expect(new Set(skills.map(normalizeSkillKey)).size).toBe(skills.length);
    expect(SKILL_CATEGORIES.every(
      ({ name, skills: categorySkills }) =>
        name.trim().length > 0 &&
        categorySkills.length > 0 &&
        categorySkills.every((skill) => skill.trim().length > 0),
    )).toBe(true);
  });

  it("provides small exact mappings across career families", () => {
    expect(Object.keys(ROLE_SKILL_SUGGESTIONS)).toHaveLength(19);
    for (const [role, expected] of Object.entries(representativeMappings)) {
      expect(suggestedSkillsForRole(role)).toEqual(expected);
    }
    const catalogueSkills = new Set(
      SKILL_CATEGORIES.flatMap(({ skills }) => skills.map(normalizeSkillKey)),
    );
    for (const suggestions of Object.values(ROLE_SKILL_SUGGESTIONS)) {
      expect(suggestions.length).toBeGreaterThanOrEqual(5);
      expect(suggestions.length).toBeLessThanOrEqual(8);
      expect(suggestions.every((skill) => catalogueSkills.has(normalizeSkillKey(skill))))
        .toBe(true);
    }
  });

  it("preserves the other bounded guidance catalogues", () => {
    expect(QUALIFICATION_SUGGESTIONS).toEqual([
      "BSc", "BSc (Hons)", "BEng", "BA", "MSc", "MEng", "MBA",
      "Diploma", "Higher Diploma", "Certificate", "Other",
    ]);
    expect(PROFICIENCY_SUGGESTIONS).toEqual([
      "Native", "Fluent", "Professional", "Intermediate", "Basic",
    ]);
    expect(INTEREST_SUGGESTIONS).toEqual([
      "Open-source development", "Machine learning", "Robotics",
      "Photography", "Hiking", "Volunteering", "Reading", "Chess",
      "Sports", "Travel",
    ]);
    expect(EXPERIENCE_ACTION_STARTERS).toEqual([
      "Built", "Developed", "Implemented", "Designed", "Improved",
      "Automated", "Created", "Integrated", "Tested", "Deployed",
      "Optimized", "Collaborated",
    ]);
  });

  it("keeps suggested sections guidance-only for every experience level", () => {
    expect(SUGGESTED_SECTIONS_BY_EXPERIENCE_LEVEL).toEqual({
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
    });
  });

  it("uses exact role matching without selecting or mutating Resume data", () => {
    const draft = emptyDraft();
    const before = structuredClone(draft);

    expect(suggestedSkillsForRole("Software Engineer")).toEqual([
      "JavaScript", "TypeScript", "React", "Node.js", "REST APIs", "SQL",
      "Git", "Docker",
    ]);
    expect(suggestedSkillsForRole("  software engineer  ")).toEqual(
      suggestedSkillsForRole("Software Engineer"),
    );
    expect(suggestedSkillsForRole("Custom Quantum Wrangler")).toEqual([]);
    expect(suggestedSkillsForRole("Senior Accountant - Construction")).toEqual(
      [],
    );
    expect(draft).toEqual(before);
    expect(draft.skills).toEqual([]);
  });
});

describe("skill guidance utilities", () => {
  it("normalizes case and bounded whitespace only for lookup keys", () => {
    expect(normalizeSkillKey("  TypeScript   API ")).toBe("typescript api");
  });

  it("merges without mutating or replacing existing group identity and order", () => {
    const existing: DraftSkill[] = [
      {
        clientKey: "skills-1",
        id: "507f1f77bcf86cd799439011",
        name: "Frontend",
        keywords: ["React"],
      },
      {
        clientKey: "skills-2",
        name: "Tools",
        keywords: ["Git"],
      },
    ];
    const before = structuredClone(existing);

    const merged = mergeSkillSelections(existing, [
      { groupName: "frontend", keyword: "react" },
      { groupName: "Frontend", keyword: "TypeScript" },
      { groupName: "Platform", keyword: "Kubernetes" },
      { groupName: "platform", keyword: "kubernetes" },
    ]);

    expect(existing).toEqual(before);
    expect(merged).toHaveLength(3);
    expect(merged[0]).toEqual({
      clientKey: "skills-1",
      id: "507f1f77bcf86cd799439011",
      name: "Frontend",
      keywords: ["React", "TypeScript"],
    });
    expect(merged[1]).toEqual(existing[1]);
    expect(merged[2]).toMatchObject({
      name: "Platform",
      keywords: ["Kubernetes"],
    });
    expect(merged[2]?.clientKey).toEqual(expect.any(String));
  });

  it("keeps custom skill and group spelling", () => {
    const merged = mergeSkillSelections([], [
      { groupName: "Research Tools", keyword: "Custom DSL" },
    ]);
    expect(merged[0]).toMatchObject({
      name: "Research Tools",
      keywords: ["Custom DSL"],
    });
  });

  it("maps technical and non-technical selections to canonical category groups", () => {
    const merged = mergeSkillSelections([], [
      { groupName: "Programming Languages", keyword: "JavaScript" },
      { groupName: "Programming Languages", keyword: "TypeScript" },
      { groupName: "Finance & Accounting", keyword: "Financial Reporting" },
      { groupName: "Finance & Accounting", keyword: "Budgeting" },
      { groupName: "Administration & Office", keyword: "Microsoft Excel" },
      { groupName: "Soft Skills", keyword: "Attention to Detail" },
      { groupName: "Marketing & Sales", keyword: "Digital Marketing" },
      { groupName: "Marketing & Sales", keyword: "SEO" },
      { groupName: "Design & Creative", keyword: "Canva" },
      { groupName: "Communication & Interpersonal", keyword: "Communication" },
      { groupName: "finance & accounting", keyword: "budgeting" },
      { groupName: "Research Tools", keyword: "Custom DSL" },
      { groupName: "Unused", keyword: "" },
    ]);

    expect(merged.map(({ name, keywords }) => ({ name, keywords }))).toEqual([
      {
        name: "Programming Languages",
        keywords: ["JavaScript", "TypeScript"],
      },
      {
        name: "Finance & Accounting",
        keywords: ["Financial Reporting", "Budgeting"],
      },
      { name: "Administration & Office", keywords: ["Microsoft Excel"] },
      { name: "Soft Skills", keywords: ["Attention to Detail"] },
      {
        name: "Marketing & Sales",
        keywords: ["Digital Marketing", "SEO"],
      },
      { name: "Design & Creative", keywords: ["Canva"] },
      {
        name: "Communication & Interpersonal",
        keywords: ["Communication"],
      },
      { name: "Research Tools", keywords: ["Custom DSL"] },
    ]);
    expect(merged.some((group) => group.keywords.length === 0)).toBe(false);
  });
});

describe("guided Resume content", () => {
  const selectedSkills: DraftSkill[] = [
    {
      clientKey: "guided-skill-1",
      name: "Frontend",
      keywords: ["React", "TypeScript"],
    },
  ];

  it("persists only explicitly selected Skills when headline opt-in is false", () => {
    expect(buildGuidedResumeContent({
      targetRole: "Software Engineer",
      useTargetRoleAsHeadline: false,
      skills: selectedSkills,
    })).toEqual({
      basics: { fullName: "", links: [] },
      experience: [],
      education: [],
      skills: [{ name: "Frontend", keywords: ["React", "TypeScript"] }],
      projects: [],
      certifications: [],
      languages: [],
      interests: [],
    });
  });

  it("copies the editable target role only through explicit headline opt-in", () => {
    expect(buildGuidedResumeContent({
      targetRole: "  Custom Platform Role  ",
      useTargetRoleAsHeadline: true,
      skills: [],
    }).basics).toEqual({
      fullName: "",
      headline: "Custom Platform Role",
      links: [],
    });
  });
});

describe("achievement composition", () => {
  it("uses the approved grammar-neutral format", () => {
    expect(composeAchievement({
      action: "  Built ",
      work: "a job tracking dashboard",
      technology: "React and Node.js",
      result: "used by 25 testers",
    })).toBe(
      "Built a job tracking dashboard using React and Node.js — used by 25 testers.",
    );
  });

  it("adds only supplied optional fragments and one terminal punctuation mark", () => {
    expect(composeAchievement({ action: "Designed", work: "the workflow" }))
      .toBe("Designed the workflow.");
    expect(composeAchievement({
      action: "Improved",
      work: "the build",
      result: "deployments became repeatable!",
    })).toBe("Improved the build — deployments became repeatable!");
  });

  it("does not infer articles, technologies, metrics, or outcomes", () => {
    expect(composeAchievement({
      action: "Built",
      work: "deployment pipeline",
      technology: "AWS",
    })).toBe("Built deployment pipeline using AWS.");
    expect(composeAchievement({ action: "", work: "a dashboard" })).toBe("");
    expect(composeAchievement({ action: "Built", work: " " })).toBe("");
  });
});

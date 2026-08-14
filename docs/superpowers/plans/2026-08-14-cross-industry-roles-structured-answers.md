# Cross-Industry Interview Roles and Structured Answers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the Create Interview wizard from technology-only guidance to fourteen cross-industry career areas and replace the one-box Behavioral, Scenario-Based, and Technical Explanation practice inputs with structured frontend fields while keeping the existing session and attempt API contracts unchanged.

**Architecture:** Keep `careerArea` as frontend-only authoring state in `InterviewCreateDialog`; extend the existing local role-guidance module into a bounded career-area catalog and make `InterviewRoleSelector` consume the currently selected area’s roles. For structured answers, add a small pure serialization module plus a focused structured-fields component, keep the draft in `InterviewSessionWorkspace`, serialize immediately before the existing attempt submission call, and preserve Saved Attempt newlines with presentation-only CSS. No backend, database, Gemini, worker, or provider changes are allowed.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, existing Interview frontend components/API contracts/CSS conventions.

## Global Constraints

- Build the smallest secure and functional solution suitable for a university project. Reuse existing code and architecture. Do not add enterprise-grade complexity unless it is necessary for correctness or security.
- Work only on `task/phase-19b3-task7r-interview-layout-refinement` / PR #13.
- Do not merge or deploy during implementation.
- `careerArea` is frontend-only and must not be added to the create-session API payload, backend schema, or persisted session model.
- Career area is required and has no default; `Other / Custom` is a utility choice, not a fifteenth canonical career area.
- Target-role search is scoped to the selected career area’s representative roles; custom roles remain explicitly adoptable.
- Changing Career area clears Target role but preserves already selected Focus topics and Skill gaps.
- Focus topics and Skill gaps remain optional and unselected by default.
- Preserve the smart-title ownership rule: system-owned titles track Experience + Target role; manually edited/cleared titles are never overwritten.
- Keep `Mid-level` as the default Experience level.
- Behavioral, Scenario-Based, and Technical Explanation structured fields are frontend-only; serialize back into the existing typed `{ type, text }` answer contract.
- At least one structured subsection must contain non-whitespace text before Save attempt is enabled.
- The exact serialized structured answer, including headings and separators, must never exceed 12,000 characters. Reject an edit that would exceed the limit; never truncate user text silently.
- Switching question/session may clear unsaved structured draft; it must never leak into another question/session.
- Preserve Multiple Choice, Short Answer, Coding, and historical Open Response behavior.
- Preserve MCQ key secrecy, deterministic MCQ scoring, Coding no-execution policy, polling/cancel/retry/idempotency, stale-route/stale-selection guards, ownership/security, and Gemini Direct architecture.
- Do not add a backend endpoint, schema field, migration, Gemini/provider call, worker/job, remote occupation taxonomy, embeddings, or editor/runtime dependency.
- Tests are written before the matching production behavior. GitHub connector execution cannot run the local Vitest/TypeScript suite; the user runs the focused GREEN gate after the implementation batch.

---

## File Structure

### New files

- `frontend/src/features/interviews/interviewStructuredAnswer.ts` — structured-question metadata, draft types, exact serialization, length/validity helpers, and limit-safe update helper.
- `frontend/src/features/interviews/interviewStructuredAnswer.test.ts` — pure serialization/length/limit tests.
- `frontend/src/features/interviews/InterviewStructuredAnswerFields.tsx` — accessible vertical structured fields with one combined counter and hard-limit rejection.
- `frontend/src/features/interviews/InterviewStructuredAnswerFields.test.tsx` — component interaction/accessibility/limit tests.
- `frontend/src/features/interviews/InterviewSessionWorkspace.structuredAnswers.test.tsx` — workspace-level serialization, question-switch reset, and Saved Attempts compatibility tests.

### Existing files to modify

- `frontend/src/features/interviews/interviewRoleGuidance.ts` — replace the technology-only role-family model with the approved fourteen career areas + `Other / Custom`, representative roles, and exact career-area Focus/Skill catalogs.
- `frontend/src/features/interviews/interviewRoleGuidance.test.ts` — prove stable career-area order, representative roles, exact guidance lookup, and generic custom fallback.
- `frontend/src/features/interviews/InterviewRoleSelector.tsx` — consume area-scoped `roleOptions` instead of importing a global technology list.
- `frontend/src/features/interviews/InterviewRoleSelector.test.tsx` — prove area-scoped search/shortcuts/custom adoption.
- `frontend/src/features/interviews/InterviewCreateDialog.tsx` — add required Career area state/control, clear Target role on area change, use career guidance, and keep `careerArea` out of the API payload.
- `frontend/src/features/interviews/InterviewCreateDialog.test.tsx` — integrated cross-industry wizard/validation/payload/title/preservation tests.
- `frontend/src/features/interviews/interviewCreateGuidance.css` — small Career-area/select and role-guidance presentation adjustments only.
- `frontend/src/features/interviews/InterviewAnswerControl.tsx` — route the three approved types to structured fields while retaining the existing controls for MCQ/Short Answer/Coding/Open Response.
- `frontend/src/features/interviews/InterviewAnswerControl.test.tsx` — update any old one-textarea assumptions.
- `frontend/src/features/interviews/InterviewAnswerControl.experience.test.tsx` — focused structured-field presentation and type-differentiation coverage.
- `frontend/src/features/interviews/interviewAnswerExperience.css` — vertical structured-field presentation and combined counter/limit messaging.
- `frontend/src/features/interviews/InterviewSessionWorkspace.tsx` — own/reset structured draft, serialize it before existing attempt submission, clear after successful save, and add pre-wrap class to Saved answer text.
- `frontend/src/features/interviews/interviewCoach.css` or the existing focused Task 7R stylesheet that owns Saved Attempt presentation — add `white-space: pre-wrap` for the Saved answer text class without changing stored data.

---

### Task 1: Cross-industry career-area guidance catalog

**Files:**
- Modify: `frontend/src/features/interviews/interviewRoleGuidance.ts`
- Modify: `frontend/src/features/interviews/interviewRoleGuidance.test.ts`

**Interfaces:**

Produce these exact public interfaces:

```ts
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

export type InterviewCareerAreaSelection =
  | InterviewCareerAreaId
  | "other-custom"
  | "";

export interface InterviewCareerGuidance {
  id: InterviewCareerAreaId;
  label: string;
  roles: readonly string[];
  focusTopics: readonly string[];
  skillGaps: readonly string[];
}

export const INTERVIEW_CAREER_AREAS: readonly InterviewCareerGuidance[];
export const OTHER_CUSTOM_CAREER_AREA = "other-custom" as const;
export const INTERVIEW_EXPERIENCE_LEVELS: readonly string[];

export function getInterviewCareerGuidance(
  area: InterviewCareerAreaSelection,
): {
  roles: readonly string[];
  focusTopics: readonly string[];
  skillGaps: readonly string[];
};

export function suggestInterviewTitle(
  targetRole: string,
  experienceLevel: string,
): string;
```

`getInterviewCareerGuidance("")` returns three empty arrays. `getInterviewCareerGuidance("other-custom")` returns no representative roles and the exact generic professional Focus/Skill catalogs below.

- [ ] **Step 1: Rewrite the helper tests first**

Tests must assert exact canonical order:

```ts
expect(INTERVIEW_CAREER_AREAS.map((area) => area.label)).toEqual([
  "Technology & IT",
  "Business & Management",
  "Finance & Accounting",
  "Marketing & Sales",
  "Human Resources",
  "Healthcare",
  "Engineering",
  "Education & Training",
  "Law & Legal Services",
  "Design & Creative",
  "Operations & Supply Chain",
  "Customer Service & Hospitality",
  "Science & Research",
  "Public Service & Administration",
]);
```

Also assert:

```ts
expect(getInterviewCareerGuidance("")).toEqual({
  roles: [],
  focusTopics: [],
  skillGaps: [],
});

expect(getInterviewCareerGuidance("other-custom").roles).toEqual([]);
expect(getInterviewCareerGuidance("technology-it").roles).toContain(
  "Software Engineer",
);
expect(getInterviewCareerGuidance("finance-accounting").roles).toContain(
  "Accountant",
);
expect(getInterviewCareerGuidance("healthcare").roles).toContain("Nurse");
expect(getInterviewCareerGuidance("education-training").roles).toContain(
  "Teacher",
);
expect(getInterviewCareerGuidance("engineering").roles).toContain(
  "Civil Engineer",
);
expect(getInterviewCareerGuidance("other-custom").focusTopics).toContain(
  "Role Knowledge",
);
expect(getInterviewCareerGuidance("other-custom").focusTopics).not.toContain(
  "Software & Systems",
);
```

Keep the existing Experience-level and smart-title assertions.

- [ ] **Step 2: Use the exact representative role lists**

Populate these exact roles:

```ts
"technology-it": [
  "Software Engineer", "Frontend Developer", "Backend Developer",
  "Full-Stack Developer", "Mobile Developer", "DevOps / Cloud Engineer",
  "Data Engineer", "ML / AI Engineer", "Cybersecurity Engineer",
  "QA / Test Engineer", "Systems Administrator", "IT Support Specialist",
]

"business-management": [
  "Business Analyst", "Project Manager", "Product Manager",
  "Operations Manager", "Management Consultant", "Strategy Analyst",
  "Business Development Manager", "General Manager",
]

"finance-accounting": [
  "Accountant", "Auditor", "Financial Analyst", "Management Accountant",
  "Tax Associate", "Banking Officer", "Investment Analyst", "Risk Analyst",
]

"marketing-sales": [
  "Marketing Executive", "Digital Marketing Specialist", "Brand Manager",
  "Content Marketer", "SEO Specialist", "Sales Executive",
  "Account Manager", "Sales Manager",
]

"human-resources": [
  "HR Executive", "Recruiter / Talent Acquisition Specialist",
  "HR Business Partner", "Learning & Development Specialist",
  "Compensation & Benefits Specialist", "Employee Relations Specialist",
  "People Operations Specialist", "HR Manager",
]

healthcare: [
  "Nurse", "Medical Officer / Doctor", "Pharmacist", "Physiotherapist",
  "Medical Laboratory Scientist", "Radiographer", "Public Health Officer",
  "Healthcare Administrator",
]

engineering: [
  "Civil Engineer", "Mechanical Engineer", "Electrical Engineer",
  "Electronics Engineer", "Chemical Engineer", "Industrial Engineer",
  "Mechatronics Engineer", "Environmental Engineer", "Biomedical Engineer",
]

"education-training": [
  "Teacher", "Lecturer", "Tutor", "Academic Advisor",
  "Instructional Designer", "Curriculum Developer", "Training Coordinator",
  "Education Administrator",
]

"law-legal": [
  "Lawyer / Attorney", "Legal Counsel", "Paralegal", "Legal Assistant",
  "Compliance Officer", "Contract Specialist", "Legal Researcher",
  "Company Secretary",
]

"design-creative": [
  "Graphic Designer", "UI / UX Designer", "Product Designer", "Video Editor",
  "Animator / Motion Designer", "Photographer", "Copywriter",
  "Content Creator",
]

"operations-supply-chain": [
  "Supply Chain Analyst", "Procurement Officer", "Logistics Coordinator",
  "Inventory Planner", "Warehouse Manager", "Operations Analyst",
  "Demand Planner", "Quality Officer",
]

"customer-service-hospitality": [
  "Customer Service Representative", "Customer Success Specialist",
  "Call Center Agent", "Hotel Front Office Executive",
  "Guest Relations Officer", "Restaurant Supervisor", "Travel Consultant",
  "Event Coordinator",
]

"science-research": [
  "Research Assistant", "Research Scientist", "Laboratory Technician",
  "Biologist", "Chemist", "Physicist", "Environmental Scientist",
  "Clinical Research Coordinator",
]

"public-service-administration": [
  "Administrative Officer", "Government Officer", "Policy Analyst",
  "Program Officer", "Community Development Officer",
  "Public Relations Officer", "Office Manager", "Executive Assistant",
]
```

- [ ] **Step 3: Use the exact approved Focus/Skill catalogs**

```ts
"technology-it": {
  focusTopics: [
    "Software & Systems", "APIs & Integration", "Databases & Data",
    "Cloud & Infrastructure", "Security", "Testing & Quality",
    "Performance & Reliability", "Data & AI",
  ],
  skillGaps: [
    "Problem Solving", "System Design", "Debugging", "Testing Strategy",
    "Security Awareness", "Performance Analysis", "Technical Communication",
    "Code Quality",
  ],
}

"business-management": {
  focusTopics: [
    "Business Strategy", "Project Delivery", "Stakeholder Management",
    "Process Improvement", "Decision-making", "Leadership",
    "Business Analysis", "Change Management",
  ],
  skillGaps: [
    "Strategic Thinking", "Prioritization", "Stakeholder Communication",
    "Leadership", "Commercial Awareness", "Conflict Resolution",
    "Presentation Skills", "Decision-making",
  ],
}

"finance-accounting": {
  focusTopics: [
    "Financial Reporting", "Accounting Principles", "Budgeting",
    "Financial Analysis", "Audit & Controls", "Taxation", "Risk Management",
    "Regulatory Compliance",
  ],
  skillGaps: [
    "Financial Statement Analysis", "Excel / Financial Modelling",
    "Attention to Detail", "Risk Assessment", "Commercial Awareness",
    "Communication", "Compliance Knowledge", "Analytical Reasoning",
  ],
}

"marketing-sales": {
  focusTopics: [
    "Marketing Strategy", "Digital Marketing", "Brand Management",
    "Customer Segmentation", "Sales Process", "Campaign Analysis",
    "Content & Messaging", "Customer Relationships",
  ],
  skillGaps: [
    "Persuasive Communication", "Customer Discovery", "Campaign Measurement",
    "Negotiation", "Presentation Skills", "CRM Discipline", "Market Analysis",
    "Objection Handling",
  ],
}

"human-resources": {
  focusTopics: [
    "Recruitment & Selection", "Employee Relations", "Performance Management",
    "Learning & Development", "HR Policy", "Workforce Planning",
    "Employee Experience", "Employment Compliance",
  ],
  skillGaps: [
    "Difficult Conversations", "Interviewing", "Conflict Resolution",
    "HR Analytics", "Policy Interpretation", "Stakeholder Communication",
    "Coaching", "Confidentiality & Judgment",
  ],
}

healthcare: {
  focusTopics: [
    "Patient Care", "Clinical Communication", "Safety & Quality",
    "Documentation", "Ethics", "Teamwork", "Evidence-based Practice",
    "Service Improvement",
  ],
  skillGaps: [
    "Clinical Reasoning", "Patient Communication", "Documentation Quality",
    "Time Management", "Safety Awareness", "Team Collaboration",
    "Ethical Decision-making", "Handling Pressure",
  ],
}

engineering: {
  focusTopics: [
    "Engineering Design", "Technical Analysis", "Safety & Standards",
    "Project Delivery", "Testing & Validation", "Quality Control",
    "Sustainability", "Technical Documentation",
  ],
  skillGaps: [
    "Engineering Judgment", "Root-cause Analysis", "Technical Communication",
    "Safety Awareness", "Design Trade-offs", "Project Planning",
    "Quality Methods", "Cross-functional Collaboration",
  ],
}

"education-training": {
  focusTopics: [
    "Teaching & Facilitation", "Lesson / Session Planning", "Assessment",
    "Learner Engagement", "Inclusive Practice", "Curriculum Design",
    "Feedback", "Education Technology",
  ],
  skillGaps: [
    "Classroom / Group Management", "Differentiation", "Assessment Design",
    "Learner Communication", "Feedback Skills", "Facilitation Confidence",
    "Inclusive Teaching", "Time Management",
  ],
}

"law-legal": {
  focusTopics: [
    "Legal Research", "Case / Matter Analysis", "Contracts", "Compliance",
    "Client Communication", "Legal Writing", "Risk & Ethics", "Negotiation",
  ],
  skillGaps: [
    "Legal Reasoning", "Research Efficiency", "Drafting",
    "Client Communication", "Attention to Detail", "Negotiation",
    "Ethical Judgment", "Prioritization",
  ],
}

"design-creative": {
  focusTopics: [
    "Design Process", "User / Audience Needs", "Visual Communication",
    "Creative Direction", "Portfolio Decisions", "Feedback & Iteration",
    "Brand Consistency", "Production Workflow",
  ],
  skillGaps: [
    "Design Rationale", "Presenting Work", "Receiving Feedback",
    "Prioritization", "User Research", "Creative Problem Solving",
    "Production Efficiency", "Stakeholder Communication",
  ],
}

"operations-supply-chain": {
  focusTopics: [
    "Supply Planning", "Procurement", "Logistics", "Inventory Management",
    "Process Improvement", "Quality", "Supplier Management",
    "Operational Risk",
  ],
  skillGaps: [
    "Demand Planning", "Data Analysis", "Negotiation", "Process Mapping",
    "Risk Management", "Supplier Communication", "Inventory Control",
    "Continuous Improvement",
  ],
}

"customer-service-hospitality": {
  focusTopics: [
    "Customer Experience", "Service Recovery", "Complaint Handling",
    "Communication", "Team Coordination", "Service Standards",
    "Upselling / Recommendations", "Operational Awareness",
  ],
  skillGaps: [
    "De-escalation", "Active Listening", "Handling Pressure",
    "Customer Communication", "Problem Resolution", "Service Recovery",
    "Teamwork", "Professionalism",
  ],
}

"science-research": {
  focusTopics: [
    "Research Methods", "Experimental Design", "Data Analysis",
    "Scientific Communication", "Literature Review", "Laboratory / Field Practice",
    "Research Ethics", "Reproducibility",
  ],
  skillGaps: [
    "Experimental Reasoning", "Statistical Interpretation", "Scientific Writing",
    "Research Presentation", "Data Quality", "Critical Evaluation",
    "Documentation", "Research Planning",
  ],
}

"public-service-administration": {
  focusTopics: [
    "Public / Administrative Service", "Policy & Procedures",
    "Stakeholder Communication", "Records & Documentation", "Program Delivery",
    "Governance", "Community / Citizen Needs", "Process Improvement",
  ],
  skillGaps: [
    "Administrative Accuracy", "Policy Interpretation", "Written Communication",
    "Public Communication", "Prioritization", "Stakeholder Management",
    "Professional Judgment", "Service Orientation",
  ],
}

"other-custom": {
  focusTopics: [
    "Role Knowledge", "Communication", "Problem Solving", "Teamwork",
    "Customer / Stakeholder Needs", "Planning & Prioritization",
    "Professional Judgment", "Continuous Improvement",
  ],
  skillGaps: [
    "Interview Communication", "Structured Problem Solving", "Confidence",
    "Prioritization", "Stakeholder Communication", "Decision-making",
    "Professional Examples", "Self-reflection",
  ],
}
```

- [ ] **Step 4: Remove the old technology-only role-family matching API**

Delete the `InterviewRoleFamily`, `INTERVIEW_ROLE_OPTIONS`, `matchInterviewRoleFamily`, and `getInterviewRoleSuggestions(targetRole)` model once all consumers have moved to area-scoped guidance. Do not keep an unused compatibility taxonomy that could reintroduce a Software Engineering fallback.

- [ ] **Step 5: Commit the guidance task**

Commit message:

```text
feat: expand interview career guidance
```

---

### Task 2: Make Target role area-scoped

**Files:**
- Modify: `frontend/src/features/interviews/InterviewRoleSelector.tsx`
- Modify: `frontend/src/features/interviews/InterviewRoleSelector.test.tsx`
- Modify: `frontend/src/features/interviews/interviewCreateGuidance.css`

**Interfaces:**

Change the selector contract to:

```ts
export interface InterviewRoleSelectorProps {
  roleOptions: readonly string[];
  value: string;
  disabled?: boolean;
  error?: string;
  onChange(next: string): void;
}
```

The component no longer imports a global role catalog.

- [ ] **Step 1: Update tests first for scoped roles**

Use a harness with:

```ts
roleOptions={["Accountant", "Auditor", "Financial Analyst"]}
```

Tests must prove:

- only supplied roles appear as visible shortcuts;
- typing `aud` filters to `Auditor`;
- a Technology role such as `Backend Developer` does not appear/search when Finance options are supplied;
- clicking `Accountant` calls `onChange("Accountant")`;
- `Solutions Architect` can still be explicitly adopted through `Use “Solutions Architect”`;
- Enter selects one unambiguous supplied match but does not silently adopt custom text;
- disabled state blocks all adoption controls.

- [ ] **Step 2: Implement scoped filtering**

Replace all `INTERVIEW_ROLE_OPTIONS` reads with `roleOptions`.

Keep the existing accessible combobox semantics:

```text
role="combobox"
aria-autocomplete="list"
aria-controls="interview-role-options"
```

Render the supplied `roleOptions` as the visible `Suggested roles` shortcuts.

- [ ] **Step 3: Handle zero representative roles cleanly**

For `Other / Custom`, `roleOptions` is empty. Do not render an empty shortcuts container; keep the search/custom input and explanatory copy such as `Enter the role you want to practise for.`

- [ ] **Step 4: Commit the selector task**

Commit message:

```text
refactor: scope interview roles by career area
```

---

### Task 3: Integrate required Career area into Create Interview

**Files:**
- Modify: `frontend/src/features/interviews/InterviewCreateDialog.tsx`
- Modify: `frontend/src/features/interviews/InterviewCreateDialog.test.tsx`
- Modify: `frontend/src/features/interviews/interviewCreateGuidance.css`

**Interfaces:**

Consume from Task 1:

```ts
INTERVIEW_CAREER_AREAS
OTHER_CUSTOM_CAREER_AREA
getInterviewCareerGuidance
InterviewCareerAreaSelection
```

- [ ] **Step 1: Update dialog tests first**

Add/replace integrated expectations for:

1. initial Career area combobox value is `""` with `Choose a career area` placeholder;
2. the fourteen canonical options appear in stable order plus `Other / Custom`;
3. Target-role shortcuts are unavailable before area selection;
4. selecting `Finance & Accounting` reveals `Accountant` and Finance Focus/Skill suggestions;
5. selecting `Healthcare` reveals `Nurse` and Healthcare guidance;
6. selecting `Other / Custom` shows no representative shortcuts and generic professional Focus/Skill suggestions;
7. changing from Finance to Healthcare clears Target role but keeps previously selected Focus/Skill values;
8. if Session title is still system-owned, area change clears the title together with Target role; if user-owned, the title is preserved;
9. Career area is required in validation summary/focus behavior;
10. successful create payload contains the selected `targetRole`, existing fields, and **does not contain `careerArea`**;
11. existing cancellation, Escape, request-ID, duplicate-submit, optional-empty topics/gaps, and pending custom-draft tests stay green.

- [ ] **Step 2: Add frontend-only Career area state**

```ts
const [careerArea, setCareerArea] =
  useState<InterviewCareerAreaSelection>("");

const careerGuidance = getInterviewCareerGuidance(careerArea);
```

`resetForm()` must restore `careerArea` to `""`.

- [ ] **Step 3: Add required validation without changing API payload**

Extend `FieldErrors` with `careerArea` and add:

```ts
if (!input.careerArea) {
  errors.careerArea = "Choose a career area.";
}
```

Map it to `interview-career-area` for validation-summary focus.

Update the clean form-level note to:

```text
Required: Session title, Career area, Target role, Experience level and Practice mode.
```

- [ ] **Step 4: Render the Career area select above Target role**

Use a native/select-style control:

```tsx
<select
  id="interview-career-area"
  className="field-control"
  required
  value={careerArea}
  aria-invalid={Boolean(fieldErrors.careerArea)}
  onChange={...}
>
  <option value="">Choose a career area</option>
  {INTERVIEW_CAREER_AREAS.map(...)}
  <option value={OTHER_CUSTOM_CAREER_AREA}>Other / Custom</option>
</select>
```

- [ ] **Step 5: Implement area change semantics exactly**

On area change:

```ts
setCareerArea(nextArea);
setTargetRole("");
if (!titleIsUserOwned) setTitle("");
```

Do **not** clear `focusTopics`, `skillGaps`, `focusDraft`, or `skillDraft`.

Clear stale Target-role/Career-area field errors when the new selection resolves them.

- [ ] **Step 6: Pass area-scoped roles and guidance**

```tsx
<InterviewRoleSelector
  roleOptions={careerGuidance.roles}
  value={targetRole}
  ...
/>
```

Use `careerGuidance.focusTopics` and `.skillGaps` for the two existing `InterviewSuggestedTagInput` controls.

Before an area is selected, hide/disable Target-role authoring or render the selector disabled with clear help text. The user must not be able to adopt a Target role before selecting a Career area.

- [ ] **Step 7: Keep Career area out of create-session transport**

The `createInterviewSession` call remains exactly the existing payload fields:

```ts
{
  title: title.trim(),
  targetRole: targetRole.trim(),
  experienceLevel: experienceLevel.trim(),
  focusTopics: nextFocusTopics.values,
  skillGaps: nextSkillGaps.values,
  ...(jobDescription.trim()
    ? { jobDescription: jobDescription.trim() }
    : {}),
  mode,
}
```

Do not add `careerArea`.

- [ ] **Step 8: Commit the Create Interview task**

Commit message:

```text
feat: guide interviews by career area
```

---

### Task 4: Pure structured-answer model and exact serialization

**Files:**
- Create: `frontend/src/features/interviews/interviewStructuredAnswer.ts`
- Create: `frontend/src/features/interviews/interviewStructuredAnswer.test.ts`

**Interfaces:**

```ts
export const STRUCTURED_ANSWER_MAX_LENGTH = 12_000;

export type StructuredInterviewQuestionType =
  | "behavioral"
  | "scenario-based"
  | "technical-explanation";

export type StructuredAnswerFieldKey =
  | "situation"
  | "task"
  | "action"
  | "result"
  | "assessment"
  | "approach"
  | "tradeOffs"
  | "decision"
  | "concept"
  | "howItWorks"
  | "example"
  | "limitations";

export type StructuredAnswerDraft = Partial<
  Record<StructuredAnswerFieldKey, string>
>;

export interface StructuredAnswerFieldDefinition {
  key: StructuredAnswerFieldKey;
  label: string;
  placeholder: string;
  heading: string;
}

export interface StructuredAnswerPresentation {
  guidance: string;
  fields: readonly StructuredAnswerFieldDefinition[];
}

export const STRUCTURED_ANSWER_PRESENTATION: Record<
  StructuredInterviewQuestionType,
  StructuredAnswerPresentation
>;

export function isStructuredInterviewQuestionType(
  type: string,
): type is StructuredInterviewQuestionType;

export function serializeStructuredAnswer(
  type: StructuredInterviewQuestionType,
  draft: StructuredAnswerDraft,
): string;

export function structuredAnswerLength(
  type: StructuredInterviewQuestionType,
  draft: StructuredAnswerDraft,
): number;

export function structuredAnswerHasContent(
  type: StructuredInterviewQuestionType,
  draft: StructuredAnswerDraft,
): boolean;

export function withStructuredAnswerEdit(
  type: StructuredInterviewQuestionType,
  draft: StructuredAnswerDraft,
  key: StructuredAnswerFieldKey,
  value: string,
): StructuredAnswerDraft | null;
```

- [ ] **Step 1: Write serialization tests first**

Behavioral exact output:

```ts
expect(
  serializeStructuredAnswer("behavioral", {
    situation: "  Context  ",
    task: "",
    action: "Did the work\nwith care",
    result: " Impact ",
  }),
).toBe(
  "Situation:\nContext\n\nAction:\nDid the work\nwith care\n\nResult:\nImpact",
);
```

Scenario exact output:

```ts
expect(
  serializeStructuredAnswer("scenario-based", {
    assessment: "Identify the risk",
    approach: "Contain it",
    tradeOffs: "Speed vs certainty",
    decision: "Act now",
  }),
).toBe(
  "Assessment:\nIdentify the risk\n\nApproach:\nContain it\n\nTrade-offs:\nSpeed vs certainty\n\nDecision:\nAct now",
);
```

Technical exact output:

```ts
expect(
  serializeStructuredAnswer("technical-explanation", {
    concept: "Caching",
    howItWorks: "Store reusable results",
    example: "HTTP cache",
    limitations: "Staleness",
  }),
).toBe(
  "Concept:\nCaching\n\nHow it works:\nStore reusable results\n\nExample:\nHTTP cache\n\nTrade-offs / limitations:\nStaleness",
);
```

Also prove empty sections are omitted, all-empty serializes to `""`, and `structuredAnswerLength()` equals `serializeStructuredAnswer(...).length` exactly.

- [ ] **Step 2: Define exact presentation metadata**

Behavioral:

```ts
{
  guidance: "Use the STAR structure to keep your example clear and evidence-based.",
  fields: [
    { key: "situation", label: "Situation", placeholder: "Describe the context…", heading: "Situation" },
    { key: "task", label: "Task", placeholder: "What were you responsible for?", heading: "Task" },
    { key: "action", label: "Action", placeholder: "What did you personally do?", heading: "Action" },
    { key: "result", label: "Result", placeholder: "What happened? What was the impact?", heading: "Result" },
  ],
}
```

Scenario-Based:

```ts
{
  guidance: "Structure your reasoning from assessment through the final decision.",
  fields: [
    { key: "assessment", label: "Assessment", placeholder: "What is happening and what matters most?", heading: "Assessment" },
    { key: "approach", label: "Approach", placeholder: "What would you do?", heading: "Approach" },
    { key: "tradeOffs", label: "Trade-offs", placeholder: "What risks, alternatives, or constraints would you consider?", heading: "Trade-offs" },
    { key: "decision", label: "Decision", placeholder: "What would you ultimately choose and why?", heading: "Decision" },
  ],
}
```

Technical Explanation:

```ts
{
  guidance: "Explain the idea as if speaking to an interviewer.",
  fields: [
    { key: "concept", label: "Concept", placeholder: "Define the concept clearly…", heading: "Concept" },
    { key: "howItWorks", label: "How it works", placeholder: "Explain the mechanism or process…", heading: "How it works" },
    { key: "example", label: "Example", placeholder: "Give a practical example…", heading: "Example" },
    { key: "limitations", label: "Trade-offs / limitations", placeholder: "Explain strengths, limitations, or alternatives…", heading: "Trade-offs / limitations" },
  ],
}
```

- [ ] **Step 3: Implement exact serializer**

For each presentation field in stable order:

```ts
const value = (draft[field.key] ?? "").trim();
if (!value) continue;
sections.push(`${field.heading}:\n${value}`);
return sections.join("\n\n");
```

Internal line breaks remain unchanged because only edge whitespace is trimmed.

- [ ] **Step 4: Implement limit-safe editing**

`withStructuredAnswerEdit()` returns the proposed draft when its exact serialized length is `<= 12_000`; otherwise it returns `null` and leaves caller state unchanged.

Tests must construct a near-limit draft and prove:

```ts
expect(withStructuredAnswerEdit(type, draft, key, tooLongValue)).toBeNull();
```

No truncation.

- [ ] **Step 5: Commit the pure model**

Commit message:

```text
feat: add structured interview answer model
```

---

### Task 5: Structured answer field component

**Files:**
- Create: `frontend/src/features/interviews/InterviewStructuredAnswerFields.tsx`
- Create: `frontend/src/features/interviews/InterviewStructuredAnswerFields.test.tsx`
- Modify: `frontend/src/features/interviews/interviewAnswerExperience.css`

**Interfaces:**

```ts
export interface InterviewStructuredAnswerFieldsProps {
  questionType: StructuredInterviewQuestionType;
  value: StructuredAnswerDraft;
  disabled?: boolean;
  error?: { message: string; requestId?: string } | null;
  onChange(next: StructuredAnswerDraft): void;
}
```

- [ ] **Step 1: Write component tests first**

For Behavioral, prove exact fields:

```text
Situation
Task
Action
Result
```

For Scenario-Based:

```text
Assessment
Approach
Trade-offs
Decision
```

For Technical Explanation:

```text
Concept
How it works
Example
Trade-offs / limitations
```

Tests must also prove:

- fields are vertically rendered textareas with associated labels;
- changing one field does not mutate another;
- the approved single guidance sentence renders;
- the displayed counter equals exact serialized length, not raw field-character sum;
- an edit that would exceed 12,000 is rejected and the prior value remains;
- a polite status message explains `Answer limit reached. Remove some text before adding more.` when an edit is rejected;
- no nested form exists.

- [ ] **Step 2: Implement controlled vertical fields**

Use `STRUCTURED_ANSWER_PRESENTATION[questionType]` to render the fields. The component owns only transient `limitReached` UI state; authoritative draft remains in `props.value`.

Each edit:

```ts
const next = withStructuredAnswerEdit(
  questionType,
  value,
  field.key,
  event.target.value,
);
if (next === null) {
  setLimitReached(true);
  return;
}
setLimitReached(false);
onChange(next);
```

- [ ] **Step 3: Connect accessibility**

Wrap fields in a group with a stable label such as `Behavioral response`, `Scenario response`, or `Technical explanation`.

Connect the combined counter and limit status to the group/inputs with `aria-describedby` as appropriate. Do not mark each subsection `required`.

- [ ] **Step 4: Add focused styling**

In `interviewAnswerExperience.css`:

- one-column grid at all widths;
- each field gets a clear label and compact textarea;
- visual separation is lighter than Coding’s code panel;
- counter aligns with existing answer counter conventions;
- no 2×2 desktop layout.

- [ ] **Step 5: Commit the component task**

Commit message:

```text
feat: add structured interview answer fields
```

---

### Task 6: Route structured types through `InterviewAnswerControl`

**Files:**
- Modify: `frontend/src/features/interviews/InterviewAnswerControl.tsx`
- Modify: `frontend/src/features/interviews/InterviewAnswerControl.test.tsx`
- Modify: `frontend/src/features/interviews/InterviewAnswerControl.experience.test.tsx`
- Modify: `frontend/src/features/interviews/interviewAnswerExperience.css`

**Interfaces:**

Extend props:

```ts
structuredValue: StructuredAnswerDraft;
onStructuredChange(next: StructuredAnswerDraft): void;
```

The existing `textValue` / `onTextChange` remain authoritative for Short Answer, Coding, and historical Open Response.

- [ ] **Step 1: Update answer-control tests first**

Preserve existing assertions for:

- MCQ A/B/C/D cards/native radios;
- Short Answer single textarea;
- Coding Starter code/copy/insert/no-execution.

Replace old Behavioral/Scenario/Technical cue-chip + one-textarea expectations with:

- `InterviewStructuredAnswerFields` section labels;
- no generic `Your behavioral answer` textarea;
- no old cue-chip-only row;
- one non-empty subsection enables Save attempt;
- all-empty structured draft keeps Save attempt disabled.

- [ ] **Step 2: Detect structured question types**

Use `isStructuredInterviewQuestionType(question.questionType)`.

Compute structured validity with:

```ts
const structuredText = isStructured
  ? serializeStructuredAnswer(question.questionType, structuredValue)
  : "";
const structuredInvalid =
  isStructured &&
  (structuredText.length < 1 || structuredText.length > STRUCTURED_ANSWER_MAX_LENGTH);
```

- [ ] **Step 3: Render structured fields instead of generic text textarea**

For Behavioral/Scenario/Technical:

```tsx
<InterviewStructuredAnswerFields
  questionType={question.questionType}
  value={structuredValue}
  disabled={disabled}
  error={error}
  onChange={onStructuredChange}
/>
```

Do not render the old cue chips or old single textarea for those types.

Keep Short Answer using the existing concise one-box presentation and Coding using the existing Starter code + code textarea.

- [ ] **Step 4: Keep Save attempt logic unified**

`submitDisabled` uses selected option for MCQ, structured validity for the three structured types, and existing `textValue` validity for all other text-answer types.

The button still invokes `onSubmit()`; no API work occurs in this component.

- [ ] **Step 5: Commit the answer-control integration**

Commit message:

```text
feat: structure interview practice responses
```

---

### Task 7: Workspace draft lifecycle and existing typed submission

**Files:**
- Modify: `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`
- Create: `frontend/src/features/interviews/InterviewSessionWorkspace.structuredAnswers.test.tsx`
- Modify: existing workspace focused tests only where new required props/selectors make them stale.

**Interfaces:**

Consume:

```ts
StructuredAnswerDraft
isStructuredInterviewQuestionType
serializeStructuredAnswer
STRUCTURED_ANSWER_MAX_LENGTH
```

- [ ] **Step 1: Write workspace integration tests first**

Use mocked Behavioral/Scenario/Technical question details and prove:

1. Behavioral fills only Situation + Action, Save attempt sends:

```ts
{
  answer: {
    type: "behavioral",
    text: "Situation:\n...\n\nAction:\n...",
  },
}
```

2. Scenario sends exact stable Assessment/Approach/Trade-offs/Decision headings.
3. Technical sends exact Concept/How it works/Example/Trade-offs / limitations headings.
4. Switching from a partially filled Behavioral question to another question clears structured fields and never leaks the first answer.
5. Route/session identity reset clears structured draft.
6. Successful save clears structured draft just like the existing `answerDraft` reset.
7. MCQ/Short Answer/Coding submission expectations remain unchanged.

- [ ] **Step 2: Add one structured draft state**

```ts
const [structuredAnswerDraft, setStructuredAnswerDraft] =
  useState<StructuredAnswerDraft>({});
```

Reset it anywhere the current code resets `answerDraft` because question/session identity changed, including:

- route/session reset;
- selectedQuestionId becomes empty;
- a new question detail load begins;
- successful attempt save.

Do not persist drafts by question ID.

- [ ] **Step 3: Serialize only at submit boundary**

Inside `submitAttempt()`:

```ts
const isStructured = isStructuredInterviewQuestionType(
  selectedQuestion.questionType,
);
const answer = isStructured
  ? serializeStructuredAnswer(
      selectedQuestion.questionType,
      structuredAnswerDraft,
    )
  : answerDraft.trim();
```

Run the same 1–12,000 character validation against that serialized string.

Keep the existing typed submission:

```ts
submission = {
  answer: {
    type: selectedQuestion.questionType,
    text: answer,
  },
};
```

No backend/API shape change.

- [ ] **Step 4: Pass controlled structured state to `InterviewAnswerControl`**

```tsx
<InterviewAnswerControl
  ...
  structuredValue={structuredAnswerDraft}
  onStructuredChange={(value) => {
    setStructuredAnswerDraft(value);
    if (answerError) setAnswerError(null);
  }}
/>
```

- [ ] **Step 5: Commit the workspace integration**

Commit message:

```text
feat: submit structured interview answers as text
```

---

### Task 8: Preserve structured newlines in Saved Attempts

**Files:**
- Modify: `frontend/src/features/interviews/InterviewSessionWorkspace.tsx`
- Modify: `frontend/src/features/interviews/interviewCoach.css` or the existing focused Interview stylesheet that already owns attempt-detail presentation.
- Test: `frontend/src/features/interviews/InterviewSessionWorkspace.structuredAnswers.test.tsx`

**Interfaces:** No data/API change. `attemptAnswerText()` remains the source of the stored answer string.

- [ ] **Step 1: Add a Saved Attempt presentation test first**

Render a selected attempt whose stored text is:

```text
Situation:
Context

Action:
Did the work
```

Assert the Saved answer element contains the exact text/newline content and carries a focused class such as:

```text
interview-attempt-answer-text
```

Also render a historical plain answer (`"A normal historical answer."`) and prove it still displays unchanged.

- [ ] **Step 2: Add presentation-only pre-wrap**

Change:

```tsx
<p>{attemptAnswerText(selectedAttempt, selectedQuestion)}</p>
```

to:

```tsx
<p className="interview-attempt-answer-text">
  {attemptAnswerText(selectedAttempt, selectedQuestion)}
</p>
```

Add:

```css
.interview-attempt-answer-text {
  white-space: pre-wrap;
}
```

Do not parse headings or stored text.

- [ ] **Step 3: Commit the Saved Attempt task**

Commit message:

```text
fix: preserve structured attempt formatting
```

---

### Task 9: Focused static regression review and verification handoff

**Files:**
- Review all files changed in Tasks 1–8.
- Update stale focused tests only when they assert behavior intentionally replaced by this approved design.

- [ ] **Step 1: Static contract review**

Confirm by diff inspection:

- no backend files changed;
- no `careerArea` appears in `createInterviewSession` transport/types;
- no new Gemini/provider/job calls exist;
- MCQ and Coding contracts are untouched;
- `InterviewRoleSelector` has no hidden global role catalog import;
- no parser attempts to reconstruct structured draft from Saved Attempts;
- structured serialization exists in one pure helper rather than duplicated string-building logic.

- [ ] **Step 2: Focused test command for user handoff**

The user will run:

```bash
npm run test --workspace @career-learning-hub/web -- \
  src/features/interviews/interviewRoleGuidance.test.ts \
  src/features/interviews/InterviewRoleSelector.test.tsx \
  src/features/interviews/InterviewCreateDialog.test.tsx \
  src/features/interviews/interviewStructuredAnswer.test.ts \
  src/features/interviews/InterviewStructuredAnswerFields.test.tsx \
  src/features/interviews/InterviewAnswerControl.test.tsx \
  src/features/interviews/InterviewAnswerControl.experience.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.structuredAnswers.test.tsx \
  src/features/interviews/InterviewSessionWorkspace.practiceExperience.test.tsx \
  src/features/interviews/InterviewQuestionTypeControls.test.tsx \
  src/features/interviews/InterviewCategorySelector.test.tsx
```

Expected: all focused files/tests PASS.

- [ ] **Step 3: Frontend typecheck and diff gate**

```bash
npm run typecheck --workspace @career-learning-hub/web
git diff --check origin/phase-19b-interview-coach-refinements...HEAD
git status --short
```

Expected:

- typecheck PASS;
- `git diff --check` no output;
- working tree clean.

- [ ] **Step 4: Browser QA after focused GREEN**

Check:

- no Career area selected initially;
- Technology role workflow;
- Finance `Accountant`;
- Healthcare `Nurse`;
- Education `Teacher`;
- Engineering `Civil Engineer`;
- custom role under a normal area;
- `Other / Custom` generic guidance;
- Focus/Skill selections survive Career-area change;
- Behavioral fields and partial answer submission;
- Scenario-Based fields;
- Technical Explanation fields;
- Saved Attempts preserve headings/newlines;
- desktop and mobile widths.

- [ ] **Step 5: Full gate after browser approval**

```bash
npm run test --workspace @career-learning-hub/api
npm run test --workspace @career-learning-hub/web
npm run build --workspace @career-learning-hub/api
npm run build --workspace @career-learning-hub/web
git diff --check origin/phase-19b-interview-coach-refinements...HEAD
git status --short
```

Do not merge until full verification, final PR review, corrected PR description, and explicit user merge approval.
